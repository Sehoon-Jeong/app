# 데이터 모델 결정 기록

## 2026-08-10 · 해커톤 구현 범위

- DB는 단일 Spring Boot 인스턴스가 쓰는 SQLite 파일 하나다.
- 실제 DDL의 원본은 [`schema.sql`](../../backend/src/main/resources/schema.sql)이다.
- 지금은 운영 사용자 데이터가 없으므로 Flyway를 두지 않는다. 운영 배포와 기존 DB 승격이 필요해질 때 도입한다.
- 모든 연결은 FK를 켜고, AI 호출 동안 쓰기 트랜잭션을 유지하지 않는다.

## 제품 모델

이전의 `7일 심사 → 안정 루틴 승격`을 `사용 경험 → 반복 패턴 → 다음 탐색 재사용`으로 바꿨다.

| 결정 | 이유 |
| --- | --- |
| `routine`은 실제 조합을 바꿀 때마다 새 행으로 만든다. | 과거 경험의 사용 조건을 덮지 않는다. |
| `experience_session`은 제품 하나 또는 루틴을 써보는 기간이다. | 루틴 입력 없이 남긴 짧은 제품 경험도 보존한다. |
| 만족도와 피부 불편을 `experience_record`의 별도 필드로 둔다. | 불편이 없어도 아쉬울 수 있고, 반대도 가능하다. |
| 7일은 `review_due_at`일 뿐 안전·효능 판정 기준이 아니다. | 기억을 한 번 회수하는 UX 시점으로만 쓴다. |
| 비교 기준 루틴은 `comparison_baseline`으로 별도 연결한다. | Rescue의 변경 비교에만 쓰고 성공 루틴으로 과장하지 않는다. |
| 패턴은 `personal_pattern`과 지지·반대 `pattern_evidence`로 표현한다. | 한 번의 경험을 피부 타입이나 영구 취향으로 만들지 않는다. |
| 제품·패턴·Rescue는 공통 `conversation`과 메시지 계약을 쓴다. | 화면마다 다른 챗봇과 상태 모델을 만들지 않는다. |
| Rescue 적용은 기존 루틴을 수정하지 않고 새 루틴과 새 경험을 만든다. | 제안 전후와 반복 Rescue 이력을 분리한다. |

## AI 데이터 경계

- 사용자 메시지를 먼저 저장한 뒤 AI를 호출한다.
- AI에는 정확한 제품 식별정보, 현재·비교 기준 루틴, 질문과 관련된 사용 결과 원문·평가·태그만 전달한다. 제품·성분 외부 사실은 OpenAI Responses API의 `web_search`로 그때 확인한다.
- 모든 제품에는 `product_catalog_content` 가이드가 있지만, 가이드는 출처 확인 사실이 아니다. 제품별 카탈로그 설명·특징·category·등록 제형을 바탕으로 제품 정체와 일반 사용법을 설명한다.
- `product.facts_json`, `description`은 출처가 없으므로 제품별 AI 가이드 입력으로만 사용한다. Product API의 확인된 `facts`, 추천·Rescue 근거와 source-backed fact로는 승격하지 않는다.
- SQL fallback 가이드는 `EDITORIAL`, 별도 생성 파이프라인 성공 결과만 `AI_GENERATED`로 저장한다.
- 기존 DB의 구 계약 가이드가 기록·비교·느낌을 유도하는 문구를 포함하면 과거 origin과 관계없이 `EDITORIAL` fallback으로 교체한다. 새 계약의 AI 재생성을 기다리는 동안 구 화면을 노출하지 않기 위한 호환 규칙이다.
- AI 답변의 `evidenceRefs`는 서버 맥락에 실제로 포함된 ID만 저장한다.
- AI 답변의 외부 근거는 OpenAI가 반환한 `url_citation`의 HTTPS URL만 `conversation_message_source`에 P1~P4 등급과 함께 저장한다.
- AI 답변은 다음 추천 입력 1~3개를 함께 저장한다.
- AI가 실패하면 사용자 메시지와 기존 기록은 남고 fallback 답변을 추가한다.

## 현재 무결성

1. 개인 조회와 쓰기는 세션의 `user_id`를 항상 조건으로 사용한다.
2. 사용자별 현재 루틴, 활성 경험, 열린 비교 기준은 부분 유니크 인덱스로 하나만 허용한다.
3. 루틴 항목의 위치와 제품은 한 루틴 안에서 중복될 수 없다.
4. 경험·메시지 생성은 `client_request_id`로 중복 제출을 막는다.
5. Rescue 적용 시 제안이 만들어진 기준 루틴과 현재 루틴을 다시 비교한다.
6. 일반 계정은 데모 초기화 API를 호출할 수 없다.

## 운영 배포 전에 추가할 것

- Flyway와 기존 SQLite 승격 테스트
- 개인 자식 행의 소유권을 복합 FK로 한 번 더 보장
- AI request/run, 토큰, 프롬프트 버전 감사 이력
- 카탈로그 출처 snapshot과 제품 리뉴얼 버전
- 패턴 수정·숨김·재생성 revision
