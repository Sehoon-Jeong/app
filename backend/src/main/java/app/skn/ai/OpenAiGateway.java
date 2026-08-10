package app.skn.ai;

import app.skn.config.OpenAiProperties;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class OpenAiGateway {
    private static final Logger log = LoggerFactory.getLogger(OpenAiGateway.class);
    private static final Pattern EVIDENCE_REF = Pattern.compile("(?<![A-Z0-9-])(PT|P|R|E)-\\d+");

    private final OpenAiProperties properties;
    private final RestClient client;
    private final ObjectMapper objectMapper;

    public OpenAiGateway(OpenAiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.connectTimeout());
        factory.setReadTimeout(properties.readTimeout());
        this.client = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public AiResult answer(String mode, String instructions, String context, String userMessage) {
        if (!properties.configured()) {
            return fallback(mode);
        }
        String input = """
                [서버가 확인한 맥락]
                %s

                [사용자 메시지]
                %s
                """.formatted(context, userMessage);
        Map<String, Object> schema = Map.of(
                "type", "object",
                "properties", Map.of(
                        "answer", Map.of("type", "string", "maxLength", 1800),
                        "suggestedReplies", Map.of(
                                "type", "array",
                                "minItems", 1,
                                "maxItems", 3,
                                "items", Map.of("type", "string", "maxLength", 80)
                        ),
                        "evidenceRefs", Map.of(
                                "type", "array",
                                "maxItems", 8,
                                "items", Map.of("type", "string", "maxLength", 64)
                        )
                ),
                "required", List.of("answer", "suggestedReplies", "evidenceRefs"),
                "additionalProperties", false
        );
        Map<String, Object> request = Map.of(
                "model", properties.model(),
                "instructions", instructions,
                "input", input,
                "reasoning", Map.of("effort", properties.reasoningEffort()),
                "text", Map.of("format", Map.of(
                        "type", "json_schema",
                        "name", "skn_chat_response",
                        "strict", true,
                        "schema", schema
                )),
                "max_output_tokens", properties.maxOutputTokens(),
                "store", false
        );

        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                String body = client.post()
                        .uri("/responses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey())
                        .body(request)
                        .retrieve()
                        .body(String.class);
                String output = extractOutputText(body);
                if (output == null || output.isBlank()) throw new IllegalStateException("OpenAI 응답에 텍스트가 없습니다.");
                JsonNode structured = objectMapper.readTree(output);
                String answer = structured.path("answer").asText().trim();
                if (answer.isBlank()) throw new IllegalStateException("OpenAI 구조화 응답의 답변이 비어 있습니다.");
                return new AiResult(
                        answer,
                        "READY",
                        stringArray(structured.path("suggestedReplies"), 3, 80),
                        validatedEvidenceRefs(structured.path("evidenceRefs"), context)
                );
            } catch (RestClientResponseException error) {
                boolean retryable = error.getStatusCode().value() == 429 || error.getStatusCode().is5xxServerError();
                log.warn("OpenAI request failed: status={}, attempt={}", error.getStatusCode().value(), attempt);
                if (!retryable || attempt == 2) break;
            } catch (ResourceAccessException error) {
                log.warn("OpenAI request timed out: attempt={}", attempt);
                if (attempt == 2) break;
            } catch (Exception error) {
                log.warn("OpenAI response could not be parsed: type={}", error.getClass().getSimpleName());
                break;
            }
        }
        return fallback(mode);
    }

    private String extractOutputText(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        for (JsonNode output : root.path("output")) {
            if (!"message".equals(output.path("type").asText())) continue;
            for (JsonNode content : output.path("content")) {
                if ("output_text".equals(content.path("type").asText())) return content.path("text").asText();
            }
        }
        return null;
    }

    private List<String> stringArray(JsonNode node, int limit, int maxLength) {
        List<String> values = new ArrayList<>();
        if (!node.isArray()) return values;
        for (JsonNode item : node) {
            String value = item.asText().trim();
            if (!value.isBlank() && value.length() <= maxLength && !values.contains(value)) values.add(value);
            if (values.size() == limit) break;
        }
        return values;
    }

    private List<String> validatedEvidenceRefs(JsonNode node, String context) {
        Set<String> allowed = new LinkedHashSet<>();
        Matcher matcher = EVIDENCE_REF.matcher(context);
        while (matcher.find()) allowed.add(matcher.group());
        return stringArray(node, 8, 64).stream().filter(allowed::contains).toList();
    }

    private AiResult fallback(String mode) {
        List<String> suggestions = switch (mode) {
            case "PRODUCT" -> List.of("현재 루틴과 겹치는 점은?", "비슷한 내 기록 보여줘", "정보가 부족한 건 뭐야?");
            case "RECOMMEND" -> List.of("1번 후보를 더 자세히 볼래", "세 후보의 차이를 비교해줘", "내 기록이 부족한 부분은 뭐야?");
            case "PATTERN" -> List.of("반대 기록도 보여줘", "이 패턴은 얼마나 반복됐어?", "다음 탐색에 어떻게 써?");
            case "RESCUE" -> List.of("기록된 변경점만 보여줘", "나중에 다시 이어갈게");
            default -> List.of("내 최근 기록 보여줘", "다시 시도해줘");
        };
        return new AiResult(
                "AI 연결이 잠시 원활하지 않아요. 입력과 기록은 그대로 저장했습니다. 잠시 후 같은 대화에서 다시 시도할 수 있어요.",
                "FALLBACK",
                suggestions,
                List.of()
        );
    }

    public record AiResult(String text, String status, List<String> suggestedReplies, List<String> evidenceRefs) {}
}
