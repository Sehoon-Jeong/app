package app.skn.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.openai")
public record OpenAiProperties(
        String apiKey,
        String model,
        String reasoningEffort,
        Duration connectTimeout,
        Duration readTimeout,
        int maxOutputTokens,
        boolean webSearchEnabled,
        String webSearchContextSize,
        String rateLimitFallbackModel,
        int rateLimitFallbackMaxOutputTokens
) {
    public boolean configured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
