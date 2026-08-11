package app.skn;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CoreFlowIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;

    @Test
    void unauthenticatedPersonalDataIsRejected() throws Exception {
        mvc.perform(get("/api/v1/home"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REQUIRED"));
    }

    @Test
    void demoShowsConnectedExperience() throws Exception {
        MockHttpSession session = demoSession();
        mvc.perform(get("/api/v1/home").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("코덕님"))
                .andExpect(jsonPath("$.currentExperience.status").value("ACTIVE"))
                .andExpect(jsonPath("$.patterns[0].evidence").isArray());
    }

    @Test
    void productCatalogUsesStableCursorPages() throws Exception {
        MockHttpSession session = demoSession();
        String firstBody = mvc.perform(get("/api/v1/products").session(session).param("limit", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.hasMore").value(true))
                .andExpect(jsonPath("$.nextCursor").isString())
                .andReturn().getResponse().getContentAsString();
        JsonNode first = json.readTree(firstBody);

        String secondBody = mvc.perform(get("/api/v1/products").session(session)
                        .param("limit", "3")
                        .param("cursor", first.path("nextCursor").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(3))
                .andReturn().getResponse().getContentAsString();
        JsonNode second = json.readTree(secondBody);

        var firstIds = new java.util.ArrayList<Long>();
        var secondIds = new java.util.ArrayList<Long>();
        first.path("items").forEach(item -> firstIds.add(item.path("id").asLong()));
        second.path("items").forEach(item -> secondIds.add(item.path("id").asLong()));
        assertThat(firstIds).doesNotContainAnyElementsOf(secondIds);
        mvc.perform(get("/api/v1/products").session(session).param("cursor", "broken"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("INVALID_PRODUCT_CURSOR"));
    }

    @Test
    void everyCatalogProductHasAProductGuideAndLegacyFactsAreNotExposed() throws Exception {
        Integer productCount = jdbc.queryForObject("SELECT COUNT(*) FROM product", Integer.class);
        Integer guideCount = jdbc.queryForObject("SELECT COUNT(*) FROM product_catalog_content", Integer.class);
        assertThat(guideCount).isEqualTo(productCount);

        mvc.perform(get("/api/v1/products/2").session(demoSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.guide.summary").value("판테놀을 중심으로 편안한 사용감을 내세운 세럼 제품이에요."))
                .andExpect(jsonPath("$.guide.routineStep").value("토너 다음 단계"))
                .andExpect(jsonPath("$.guide.usageTiming").isArray())
                .andExpect(jsonPath("$.guide.usageInstructions.length()").value(2))
                .andExpect(jsonPath("$.guide.highlights.length()").value(3))
                .andExpect(jsonPath("$.guide.highlights[0].title").value("제형"))
                .andExpect(jsonPath("$.guide.highlights[0].detail").value("젤 세럼 타입이에요."))
                .andExpect(jsonPath("$.guide.usageTips").doesNotExist())
                .andExpect(jsonPath("$.guide.observationPoints").doesNotExist())
                .andExpect(jsonPath("$.guide.origin").value("EDITORIAL"))
                .andExpect(jsonPath("$.verified").value(false))
                .andExpect(jsonPath("$.facts").isEmpty());

        Integer oldEditorialCopy = jdbc.queryForObject("""
                SELECT COUNT(*) FROM product_catalog_content
                 WHERE origin = 'EDITORIAL'
                   AND (summary LIKE '%기록%' OR summary LIKE '%비교%' OR summary LIKE '%느낌%')
                """, Integer.class);
        assertThat(oldEditorialCopy).isZero();
    }

    @Test
    void productionFrontendOriginCanUseQuickLogin() throws Exception {
        mvc.perform(post("/api/v1/auth/quick-login/test01")
                        .header(HttpHeaders.ORIGIN, "https://skn-labs.vercel.app")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "https://skn-labs.vercel.app"
                ))
                .andExpect(jsonPath("$.username").value("test01"));
    }

    @Test
    void legacyAiGeneratedGuideIsReplacedBeforeNewGenerationRuns() {
        jdbc.update("""
                UPDATE product_catalog_content
                   SET summary = '느낌을 기록하고 다른 제품과 비교해보세요.',
                       usage_tips_json = '["사용 뒤 느낌을 기록해요."]',
                       observation_points_json = '[{"title":"관찰","detail":"변화를 기록해요."}]',
                       origin = 'AI_GENERATED'
                 WHERE product_id = 6
                """);

        new ResourceDatabasePopulator(new ClassPathResource("schema.sql")).execute(dataSource);

        var guide = jdbc.queryForMap("""
                SELECT summary, usage_tips_json, observation_points_json, origin
                  FROM product_catalog_content
                 WHERE product_id = 6
                """);
        assertThat(guide.get("summary")).isEqualTo("아침과 저녁에 사용하는 젤 클렌저 제품이에요.");
        assertThat(guide.get("usage_tips_json").toString()).doesNotContain("기록", "비교", "느낌");
        assertThat(guide.get("observation_points_json").toString()).doesNotContain("기록", "비교", "느낌");
        assertThat(guide.get("origin")).isEqualTo("EDITORIAL");
    }

    @Test
    void onlySourceBackedFactsAreReturnedAsFactObjects() throws Exception {
        jdbc.update("""
                INSERT OR IGNORE INTO product_source_fact(
                    product_id, fact_type, fact_text, source_label, source_url, checked_at
                ) VALUES (11, 'DIRECTIONS', '공식 페이지에 아침과 저녁 사용으로 안내되어 있어요.',
                          '브랜드 공식 페이지', 'https://example.com/products/11', '2026-08-11T00:00:00Z')
                """);

        mvc.perform(get("/api/v1/products/11").session(demoSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.facts.length()").value(1))
                .andExpect(jsonPath("$.facts[0].type").value("DIRECTIONS"))
                .andExpect(jsonPath("$.facts[0].text").isNotEmpty())
                .andExpect(jsonPath("$.facts[0].sourceLabel").value("브랜드 공식 페이지"))
                .andExpect(jsonPath("$.facts[0].sourceUrl").value("https://example.com/products/11"))
                .andExpect(jsonPath("$.facts[0].checkedAt").value("2026-08-11T00:00:00Z"))
                .andExpect(jsonPath("$.verified").value(true));
    }

    @Test
    void newAccountIsEmptyAndCannotReadDemoProducts() throws Exception {
        MockHttpSession session = signUpSession("empty_user");
        mvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(false));
        mvc.perform(get("/api/v1/home").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productCount").value(0))
                .andExpect(jsonPath("$.recordCount").value(0));
        mvc.perform(get("/api/v1/me/products/1").session(session))
                .andExpect(status().isNotFound());
    }

    @Test
    void onboardingSavesSelectedProductsStartsExperienceAndDoesNotRepeat() throws Exception {
        MockHttpSession session = signUpSession("onboarding_user");
        String request = """
                {"productIds":[1,2],"entryChoice":"PRODUCT","focusProductId":1,
                 "clientRequestId":"test-onboarding-product"}
                """;

        mvc.perform(post("/api/v1/auth/onboarding").session(session)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.onboardingCompleted").value(true))
                .andExpect(jsonPath("$.experience.status").value("ACTIVE"))
                .andExpect(jsonPath("$.experience.product.product.id").value(1));
        mvc.perform(get("/api/v1/me/products").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(post("/api/v1/auth/onboarding").session(session)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.experience.status").value("ACTIVE"));
        mvc.perform(get("/api/v1/me/products").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void conversationsArePrivateToTheirOwner() throws Exception {
        MockHttpSession demo = demoSession();
        String body = mvc.perform(post("/api/v1/ai/conversations").session(demo)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"mode":"GENERAL","initialPrompt":"내 기록을 요약해줘","clientRequestId":"test-private-conversation"}
                                """))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long conversationId = json.readTree(body).path("id").asLong();
        MockHttpSession other = signUpSession("private_user");
        mvc.perform(get("/api/v1/ai/conversations/{id}", conversationId).session(other))
                .andExpect(status().isNotFound());
    }

    @Test
    void usernameAndPasswordCanBeUsedToSignUpAndLogIn() throws Exception {
        MockHttpSession signUp = signUpSession("login_user");
        mvc.perform(post("/api/v1/auth/logout").session(signUp)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNoContent());

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"login_user\",\"password\":\"passw0rd!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("login_user"))
                .andExpect(jsonPath("$.demo").value(false));

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"login_user\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void quickLoginListsTwentySeedsAndNewSignupsThenStartsTheirSession() throws Exception {
        mvc.perform(get("/api/v1/auth/quick-accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("test01"))
                .andExpect(jsonPath("$[19].username").value("test20"));

        mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"panel_user\",\"password\":\"passw0rd!\"}"))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/auth/quick-accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.username == 'panel_user')]").exists());

        MockHttpSession quickSession = (MockHttpSession) mvc.perform(post("/api/v1/auth/quick-login/test01")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("test01"))
                .andReturn().getRequest().getSession(false);
        mvc.perform(get("/api/v1/home").session(quickSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productCount").value(0))
                .andExpect(jsonPath("$.recordCount").value(0));
    }

    @Test
    void regularUserCannotResetDemoData() throws Exception {
        MockHttpSession session = signUpSession("reset_user");
        mvc.perform(post("/api/v1/demo/reset?scenario=default").session(session)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("DEMO_ONLY"));
    }

    @Test
    void accountDeletionRemovesCredentialsAndPersonalData() throws Exception {
        MockHttpSession session = signUpSession("delete_user");
        addProduct(session, 1);
        mvc.perform(delete("/api/v1/auth/me").session(session))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"delete_user\",\"password\":\"passw0rd!\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void productExperienceCanBeStartedRecordedAndCompleted() throws Exception {
        MockHttpSession session = signUpSession("flow_user");
        String ownedBody = mvc.perform(post("/api/v1/me/products").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":1}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long userProductId = json.readTree(ownedBody).path("id").asLong();

        String sessionBody = mvc.perform(post("/api/v1/me/experiences").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userProductId":%d,"mode":"PRODUCT","dayPart":"EVENING","clientRequestId":"test-start-flow"}
                                """.formatted(userProductId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn().getResponse().getContentAsString();
        long experienceId = json.readTree(sessionBody).path("id").asLong();

        mvc.perform(post("/api/v1/me/experiences/{id}/records", experienceId).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sentiment":"LIKED","note":"가볍고 산뜻했어요","tags":["가벼움"],"discomfort":"NOT_REPORTED","clientRequestId":"test-record-flow"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.record.note").value("가볍고 산뜻했어요"));

        mvc.perform(post("/api/v1/me/experiences/{id}/complete", experienceId).session(session)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/me/experiences/{id}/records", experienceId).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sentiment":"LIKED","note":"닫힌 뒤 기록","tags":[],"discomfort":"NOT_REPORTED","clientRequestId":"test-record-after-close"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EXPERIENCE_CLOSED"));
        mvc.perform(get("/api/v1/home").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.primaryAction").value("START_EXPERIENCE"));
    }

    @Test
    void everyAssistantTurnContainsDynamicSuggestionsEvenWhenAiFallsBack() throws Exception {
        MockHttpSession session = signUpSession("chat_user");
        String body = mvc.perform(post("/api/v1/ai/conversations").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"mode":"GENERAL","initialPrompt":"내 최근 기록을 알려줘","clientRequestId":"test-chat-create"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.messages[1].role").value("ASSISTANT"))
                .andExpect(jsonPath("$.messages[1].suggestedReplies").isArray())
                .andExpect(jsonPath("$.quickReplies").isArray())
                .andReturn().getResponse().getContentAsString();
        JsonNode response = json.readTree(body);
        assertThat(response.path("quickReplies").size()).isBetween(1, 3);
    }

    @Test
    void generalDiscomfortPromptStartsInRescueMode() throws Exception {
        MockHttpSession session = demoSession();
        mvc.perform(post("/api/v1/ai/conversations").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"mode":"GENERAL","initialPrompt":"새 제품을 썼더니 피부가 따갑고 붉어졌어","clientRequestId":"test-auto-rescue-create"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mode").value("RESCUE"))
                .andExpect(jsonPath("$.messages[1].content").value(org.hamcrest.Matchers.containsString("심하거나 빠르게 악화")))
                .andExpect(jsonPath("$.quickReplies[0]").value("심하거나 빠르게 악화되진 않아요"));
    }

    @Test
    void discomfortMessageTurnsAnExistingAiConversationIntoRescue() throws Exception {
        MockHttpSession session = demoSession();
        String created = mvc.perform(post("/api/v1/ai/conversations").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"mode":"GENERAL","initialPrompt":"내 최근 기록을 요약해줘","clientRequestId":"test-auto-rescue-thread"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mode").value("GENERAL"))
                .andReturn().getResponse().getContentAsString();
        long conversationId = json.readTree(created).path("id").asLong();

        mvc.perform(post("/api/v1/ai/conversations/{id}/messages", conversationId).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"text":"지금 피부가 화끈거리고 따가워","clientRequestId":"test-auto-rescue-message"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("RESCUE"))
                .andExpect(jsonPath("$.messages[3].content").value(org.hamcrest.Matchers.containsString("심하거나 빠르게 악화")));
    }

    @Test
    void recommendationConversationUsesItsOwnCatalogBoundedMode() throws Exception {
        MockHttpSession session = demoSession();
        mvc.perform(post("/api/v1/ai/conversations").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"mode":"RECOMMEND","initialPrompt":"내 기록으로 다음 제품 후보를 보여줘","clientRequestId":"test-recommend-create"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mode").value("RECOMMEND"))
                .andExpect(jsonPath("$.messages[1].suggestedReplies").isArray());
    }

    @Test
    void rescueDoesNotCreateAPlanUntilRecordedChangesAreConfirmed() throws Exception {
        MockHttpSession session = demoSession();
        String created = mvc.perform(post("/api/v1/ai/conversations").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"mode":"RESCUE","experienceId":3,"initialPrompt":"따갑고 답답했어","clientRequestId":"test-rescue-confirm-start"}
                                """))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long conversationId = json.readTree(created).path("id").asLong();
        mvc.perform(post("/api/v1/ai/conversations/{id}/messages", conversationId).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"심하거나 빠르게 악화되진 않아요\",\"clientRequestId\":\"test-rescue-confirm-safe\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/ai/conversations/{id}/messages", conversationId).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"클렌저도 따로 바꿨어\",\"clientRequestId\":\"test-rescue-correction\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rescuePlan").doesNotExist());
        mvc.perform(post("/api/v1/ai/conversations/{id}/messages", conversationId).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"저장된 변경만으로 계속할게요\",\"clientRequestId\":\"test-rescue-confirm-changes\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rescuePlan.status").value("PROPOSED"));
    }

    @Test
    void dueRoutineReviewCompletesExperienceAndBecomesComparisonBaseline() throws Exception {
        MockHttpSession session = signUpSession("review_user");
        String ownedBody = mvc.perform(post("/api/v1/me/products").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":1}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long userProductId = json.readTree(ownedBody).path("id").asLong();

        String experienceBody = mvc.perform(post("/api/v1/me/experiences").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userProductId":%d,"mode":"ROUTINE","dayPart":"EVENING","clientRequestId":"test-due-routine"}
                                """.formatted(userProductId)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        JsonNode experience = json.readTree(experienceBody);
        long experienceId = experience.path("id").asLong();
        long routineId = experience.path("routineId").asLong();
        jdbc.update("UPDATE experience_session SET review_due_at = datetime('now', '-1 day') WHERE id = ?", experienceId);

        mvc.perform(post("/api/v1/me/experiences/{id}/records", experienceId).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sentiment":"LIKED","note":"일주일 동안 편하게 썼어요","tags":["편안함"],"discomfort":"NOT_REPORTED","clientRequestId":"test-due-record"}
                                """))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/home").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentExperience").doesNotExist())
                .andExpect(jsonPath("$.primaryAction").value("START_EXPERIENCE"));
        mvc.perform(get("/api/v1/me/routines/baseline").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(routineId));
        mvc.perform(get("/api/v1/products/1").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personalRecordCount").value(1));
    }

    @Test
    void repeatedTaggedExperiencesCreateAPersonalPatternForANewUser() throws Exception {
        MockHttpSession session = signUpSession("pattern_user");
        String ownedBody = mvc.perform(post("/api/v1/me/products").session(session)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"productId\":1}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long userProductId = json.readTree(ownedBody).path("id").asLong();
        String experienceBody = mvc.perform(post("/api/v1/me/experiences").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userProductId":%d,"mode":"PRODUCT","dayPart":"EVENING","clientRequestId":"test-pattern-session"}
                                """.formatted(userProductId)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long experienceId = json.readTree(experienceBody).path("id").asLong();

        mvc.perform(post("/api/v1/me/experiences/{id}/records", experienceId).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sentiment":"LIKED","note":"첫 사용","tags":["가벼움"],"discomfort":"NOT_REPORTED","clientRequestId":"test-pattern-record-1"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.linkedPatternId").doesNotExist());
        mvc.perform(post("/api/v1/me/experiences/{id}/records", experienceId).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sentiment":"LIKED","note":"두 번째 사용","tags":["가벼움"],"discomfort":"NOT_REPORTED","clientRequestId":"test-pattern-record-2"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.linkedPatternId").isNumber());

        mvc.perform(get("/api/v1/me/patterns").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].supportingCount").value(2))
                .andExpect(jsonPath("$[0].title").value("가벼움을 좋게 느낀 경험이 반복됐어요"));
    }

    @Test
    void routineStoresTimeSlotFrequencyAndOrderPerProduct() throws Exception {
        MockHttpSession session = signUpSession("routine_user");
        long first = addProduct(session, 1);
        long second = addProduct(session, 6);

        mvc.perform(put("/api/v1/me/routines/current").session(session)
                        .header("Idempotency-Key", "test-routine-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"내 스킨케어 루틴",
                                  "items":[
                                    {"userProductId":%d,"timeSlot":"BOTH","frequency":"매일"},
                                    {"userProductId":%d,"timeSlot":"EVENING","frequency":"주 2~3회"}
                                  ]
                                }
                                """.formatted(first, second)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.routine.items[0].timeSlot").value("BOTH"))
                .andExpect(jsonPath("$.routine.items[0].frequency").value("매일"))
                .andExpect(jsonPath("$.routine.items[1].timeSlot").value("EVENING"))
                .andExpect(jsonPath("$.routine.items[1].frequency").value("주 2~3회"));
    }

    private MockHttpSession demoSession() throws Exception {
        return (MockHttpSession) mvc.perform(post("/api/v1/auth/demo")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk()).andReturn().getRequest().getSession();
    }

    private MockHttpSession signUpSession(String username) throws Exception {
        return (MockHttpSession) mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","password":"passw0rd!"}
                                """.formatted(username)))
                .andExpect(status().isCreated()).andReturn().getRequest().getSession();
    }

    private long addProduct(MockHttpSession session, long productId) throws Exception {
        String body = mvc.perform(post("/api/v1/me/products").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + productId + "}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).path("id").asLong();
    }
}
