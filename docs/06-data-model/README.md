# SkinCause MVP 데이터 모델

## 한눈에 보기

SkinCause의 데이터 모델은 현재 상태만 저장하면 안 된다. 사용자가 어느 안정 루틴에서 어떤 제품을 어떤 계획으로 시험했고, 언제 무엇을 관찰했는지를 나중에도 같은 방식으로 복원해야 한다.

처음 보는 사람은 다음 세 덩어리만 먼저 이해하면 된다.

- `routine_version`은 실험 전의 기준점이다.
- `experiment`는 제품 하나를 실제로 시험한 과정이고, 퀘스트·관찰·Rescue·결과가 여기에 매달린다.
- `experiment_result`는 다음 추천의 개인 근거가 된다. Beauty Archive는 이 원본들을 다시 보여주는 화면이다.

테이블을 나눈 이유도 이 흐름을 지키기 위해서다.

1. 안정 루틴과 제품 정보는 확정 후 덮어쓰지 않고 버전으로 남긴다.
2. 추천 요청, 추천 가능한 제품, 저장한 후보, 비교 결과와 실제 실험을 구분한다.
3. 실험 상태와 사용 변화는 현재값뿐 아니라 전환 시점을 남긴다.
4. Rescue와 AI 설명은 당시 입력·규칙·버전의 결과 스냅샷을 보존한다.
5. Beauty Archive는 완료 실험을 복제한 테이블이 아니라 원본 이력을 조회한 결과다.

필드의 세부 정의와 제약은 [데이터 사전](./data-dictionary.md)을 따른다.

## 범위

- 이 문서는 구현 전에 관계와 불변식을 합의하는 논리 모델이다. 컬럼 타입과 실제 DDL은 Flyway 작업에서 확정한다.
- ERD에는 P0·P1만 포함한다.
- 브랜드 실험, 코호트, 전문가 공유는 Pn이므로 테이블을 미리 만들지 않는다.
- `app_user.id`는 애플리케이션이 생성한 UUID를 사용하고 인증 정보는 최소한으로 저장한다.
- 별도 분석 이벤트 저장소를 만들지 않고 루틴·실험·관찰의 원본 기록으로 MVP 지표를 계산한다.
- access JWT 원문은 저장하지 않는다. 로그아웃과 재발급 중단에 필요한 refresh session만 해시로 저장한다.

## 핵심 관계

```mermaid
erDiagram
    APP_USER ||--o{ AUTH_REFRESH_SESSION : opens
    APP_USER ||--o{ USER_CONCERN : selects
    APP_USER ||--o| ROUTINE : owns
    ROUTINE ||--o{ ROUTINE_VERSION : versions
    ROUTINE_VERSION ||--o{ ROUTINE_ITEM : contains
    PRODUCT ||--o{ PRODUCT_VERSION : versions
    PRODUCT_VERSION ||--o{ ROUTINE_ITEM : used_in

    APP_USER ||--o{ RECOMMENDATION_REQUEST : requests
    ROUTINE_VERSION ||--o{ RECOMMENDATION_REQUEST : baseline
    ROUTINE_ITEM o|--o{ RECOMMENDATION_REQUEST : may_be_replaced
    FUNCTION_TYPE ||--o{ RECOMMENDATION_REQUEST : goal
    RECOMMENDATION_REQUEST ||--o{ RECOMMENDATION_POOL_ITEM : allows
    PRODUCT_VERSION ||--o{ RECOMMENDATION_POOL_ITEM : eligible
    RECOMMENDATION_REQUEST ||--o{ RECOMMENDATION_CANDIDATE : returns
    RECOMMENDATION_POOL_ITEM ||--o| RECOMMENDATION_CANDIDATE : may_be_selected
    PRODUCT_VERSION ||--o{ RECOMMENDATION_CANDIDATE : recommends

    APP_USER ||--o{ EXPERIMENT_CANDIDATE : saves
    RECOMMENDATION_CANDIDATE o|--o{ EXPERIMENT_CANDIDATE : may_source
    PRODUCT_VERSION ||--o{ EXPERIMENT_CANDIDATE : targets
    ROUTINE_VERSION ||--o{ EXPERIMENT_CANDIDATE : compares_from
    ROUTINE_ITEM o|--o{ EXPERIMENT_CANDIDATE : may_be_replaced
    FUNCTION_TYPE ||--o{ EXPERIMENT_CANDIDATE : goal
    EXPERIMENT_CANDIDATE ||--o{ CANDIDATE_COMPARISON : compares
    APP_USER ||--o{ CANDIDATE_ORDERING : requests
    ROUTINE_VERSION ||--o{ CANDIDATE_ORDERING : baseline
    CANDIDATE_ORDERING ||--|{ CANDIDATE_ORDERING_ITEM : ranks
    CANDIDATE_COMPARISON ||--o{ CANDIDATE_ORDERING_ITEM : ranked_as

    EXPERIMENT_CANDIDATE ||--o| EXPERIMENT : becomes
    CANDIDATE_COMPARISON ||--o| EXPERIMENT : selected_for
    CANDIDATE_ORDERING o|--o{ EXPERIMENT : selected_from
    EXPERIMENT o|--o{ EXPERIMENT : retrial_of
    ROUTINE_VERSION ||--o{ EXPERIMENT : baseline
    EXPERIMENT ||--o{ EXPERIMENT_TRANSITION : changes_state
    EXPERIMENT ||--o{ OBSERVATION_QUEST : schedules
    OBSERVATION_QUEST ||--o{ QUEST_SCHEDULE_CHANGE : rescheduled_by
    OBSERVATION_QUEST o|--o| OBSERVATION : answered_by
    EXPERIMENT ||--o{ OBSERVATION : records
    OBSERVATION ||--o| DISCOMFORT_DETAIL : describes
    EXPERIMENT ||--o{ EXPERIMENT_EVENT : records
    OBSERVATION o|--o{ EXPERIMENT_EVENT : may_source
    PRODUCT_VERSION o|--o{ EXPERIMENT_EVENT : may_reference

    OBSERVATION ||--o| RESCUE_CASE : triggers
    ROUTINE_VERSION ||--o{ RESCUE_CASE : baseline
    RESCUE_CASE ||--o{ RESCUE_ITEM : classifies
    PRODUCT_VERSION ||--o{ RESCUE_ITEM : references

    EXPERIMENT ||--o| EXPERIMENT_RESULT : completes_with
    EXPERIMENT_RESULT o|--o| ROUTINE_VERSION : may_promote
    EXPERIMENT ||--o| LAB_RECORD : rewards
```

## 제품 데이터와 AI 구조화

```mermaid
erDiagram
    APP_USER o|--o{ PRODUCT : may_own_draft
    BRAND o|--o{ BRAND : may_merge_into
    BRAND o|--o{ PRODUCT : identifies
    PRODUCT o|--o{ PRODUCT : may_merge_into
    PRODUCT ||--o{ PRODUCT_VERSION : versions
    PRODUCT_VERSION ||--o{ PRODUCT_IDENTIFIER : identifies
    PRODUCT_VERSION ||--o{ PRODUCT_INGREDIENT : contains
    INGREDIENT ||--o{ PRODUCT_INGREDIENT : normalizes
    INGREDIENT ||--o{ INGREDIENT_ALIAS : has
    PRODUCT_VERSION ||--o{ PRODUCT_FUNCTION : claims
    FUNCTION_TYPE ||--o{ PRODUCT_FUNCTION : categorizes

    APP_USER ||--o{ UPLOAD_ASSET : uploads
    APP_USER ||--o{ AI_JOB : requests
    UPLOAD_ASSET o|--o{ AI_JOB : processed_by
    AI_JOB ||--o{ INGREDIENT_EXTRACTION_ITEM : extracts
    AI_JOB ||--o{ PURCHASE_EXTRACTION_ITEM : extracts
    AI_JOB o|--o| RECOMMENDATION_REQUEST : may_classify_goal
    AI_JOB o|--o| RECOMMENDATION_REQUEST : may_rank
    AI_JOB o|--o| CANDIDATE_ORDERING : may_explain_order
    AI_JOB o|--o| OBSERVATION : may_structure
    AI_JOB o|--o| RESCUE_CASE : may_explain
    INGREDIENT o|--o{ INGREDIENT_EXTRACTION_ITEM : suggested_or_confirmed
    PRODUCT_VERSION o|--o{ PURCHASE_EXTRACTION_ITEM : suggested_or_confirmed
    PRODUCT o|--o{ PURCHASE_EXTRACTION_ITEM : may_create_draft
```

## LAB·알림·삭제

```mermaid
erDiagram
    APP_USER ||--o| LAB_PROFILE : configures
    APP_USER ||--o{ LAB_RECORD : earns
    EXPERIMENT ||--o| LAB_RECORD : creates
    BADGE_DEFINITION ||--o{ USER_BADGE : defines
    APP_USER ||--o{ USER_BADGE : earns
    EXPERIMENT o|--o{ USER_BADGE : may_unlock
    LAB_ITEM_DEFINITION o|--o{ BADGE_DEFINITION : rewarded_by
    LAB_ITEM_DEFINITION ||--o{ USER_LAB_ITEM : defines
    APP_USER ||--o{ USER_LAB_ITEM : unlocks
    BADGE_DEFINITION o|--o{ USER_LAB_ITEM : may_unlock
    EXPERIMENT o|--o{ USER_LAB_ITEM : may_unlock
    LAB_ITEM_DEFINITION o|--o{ LAB_PROFILE : selected_character
    LAB_ITEM_DEFINITION o|--o{ LAB_PROFILE : selected_theme
    LAB_ITEM_DEFINITION ||--o{ LAB_RECORD : displays

    APP_USER ||--o{ WEB_PUSH_SUBSCRIPTION : authorizes
    OBSERVATION_QUEST ||--o{ NOTIFICATION_DELIVERY : triggers
    WEB_PUSH_SUBSCRIPTION ||--o{ NOTIFICATION_DELIVERY : receives

    APP_USER o|--o{ PRIVACY_DELETION_JOB : requests
```

## 핵심 설계 결정

### 1. 안정 루틴은 버전이다

`routine`은 사용자 루틴의 정체성이고, `routine_version`은 특정 시점의 확정된 내용이다. `routine.current_stable_version_id`가 현재 기준점을 가리킨다.

- 확정된 버전의 `routine_item`은 수정하지 않는다.
- 편집은 새 초안 버전을 만들고 사용자 확인 후 현재 포인터를 바꾼다.
- 실험은 포인터가 아니라 당시 `routine_version.id`를 직접 참조한다.
- 실험 결과로 새 안정 루틴을 만들면 `experiment_result.resulting_routine_version_id`가 새 버전을 가리킨다.

이 구조가 없으면 과거 Rescue를 열었을 때 현재 루틴으로 비교하는 오류가 생긴다.

### 2. 제품도 버전으로 참조한다

제품명·성분·기능 정보는 나중에 수정될 수 있다. 후보와 실험이 `product.id`만 참조하면 과거 판단 근거가 바뀐다.

- `product`는 동일 제품의 정체성과 소유 범위를 나타낸다.
- `product_version`은 그 시점의 이름, 종류와 확인 상태를 나타낸다.
- 루틴, 후보, 실험과 Rescue는 `product_version_id`를 참조한다.
- 공용 데이터 수정은 새 버전을 만들고 최신 포인터만 바꾼다.

사용자 초안은 `product.owner_user_id`가 있으며 운영 확인 전 다른 사용자에게 노출하거나 추천하지 않는다.

### 3. 추천·후보·실험은 다른 상태다

- `recommendation_pool_item`: 서버 규칙을 통과해 AI가 선택할 수 있는 실제 제품과 비교 사실
- `recommendation_candidate`: 허용된 제품 중 최종 반환한 순위와 근거
- `experiment_candidate`: 사용자가 보관하기로 선택한 제품과 변경 의도
- `candidate_comparison`: 안정 루틴과 후보의 계산 결과
- `candidate_ordering`: 저장 후보 여러 개를 먼저 시험할 순서로 묶은 결과
- `experiment`: 사용자가 실제로 시작한 한 번의 사용 과정

추천 결과를 바로 실험으로 만들지 않는다. 사용자가 직접 찾은 제품도 추천 없이 후보와 실험이 될 수 있다.

추천에서는 서버와 AI의 책임도 데이터로 구분한다.

1. 서버가 카탈로그 자격과 루틴 비교 규칙으로 `recommendation_pool_item`을 만든다.
2. AI는 이 목록의 제품 ID 안에서만 최대 3개와 설명을 제안한다.
3. 서버가 ID, 순위와 근거 형식을 검증한 뒤 `recommendation_candidate`를 확정한다.
4. AI가 실패하거나 허용 범위를 벗어나면 서버의 고정 규칙으로 정렬한다.

`recommendation_request.ranking_source`와 `fallback_reason_code`가 어느 경로를 썼는지 남기고, 선택된 후보의 `evidence_snapshot`이 당시 서버 사실과 설명을 보존한다. 따라서 나중에도 AI가 카탈로그 밖 제품을 추천하지 않았는지 확인할 수 있다.

관찰 메모와 전성분·구매 이미지의 구조화는 사용자가 그 작업을 직접 요청했을 때만 필요한 원문을 AI에 보낸다. 이메일, 사용자 ID, 인증 정보, 무관한 프로필과 다른 실험 기록은 보내지 않는다. 요청·응답 원문은 로그나 `ai_job`에 영구 저장하지 않고 fingerprint, 모델·프롬프트·스키마 버전, 검증된 최소 출력과 상태만 남긴다.

### 4. 한 사용자당 열린 실험은 하나다

애플리케이션 검사만으로는 동시 요청에서 두 실험이 생길 수 있다. 데이터베이스의 부분 유일 제약으로 `PLANNED`, `ACTIVE`, `PAUSED` 상태의 실험을 사용자당 하나로 제한한다. 실제 제약 이름과 DDL은 Flyway 구현에서 정한다.

후보는 여러 개 저장할 수 있다. 하나의 후보는 하나의 실험으로만 시작할 수 있다. 재시험은 현재 안정 루틴에서 후보와 비교를 다시 만들고, 새 실험을 `parent_experiment_id`로 연결한다.

### 5. 상태 이력은 별도 기록한다

`experiment.status`는 빠른 현재 조회용이고, `experiment_transition`은 변경 이력의 원본이다.

- 상태 변경은 한 트랜잭션에서 현재 상태와 전환 행을 함께 저장한다.
- 허용된 전환만 서버 도메인 규칙으로 처리한다.
- 첫 사용, 중단, 재사용과 계획 이탈은 `experiment_event`에 별도로 남긴다.
- 계획의 시작·종료일은 미리보기이고 사용자가 확정한 핵심 값은 `duration_days`다. 실제 일정은 FIRST_USE 관찰 시각부터 같은 기간으로 다시 계산한다.
- 일시 보류 후 일정 이동은 `quest_schedule_change`에 변경 전·후 예정 시각을 남긴다.

### 6. 관찰과 퀘스트를 분리한다

퀘스트는 시스템이 요청한 관찰이고 관찰은 사용자가 실제로 남긴 기록이다.

- 예정 밖 변화는 퀘스트 없이 관찰할 수 있다.
- 건너뛴 퀘스트에는 관찰이 없으며 skip 상태와 이유만 남는다.
- 퀘스트 하나에는 관찰 하나만 연결할 수 있다.
- 관찰 시각과 입력 시각을 분리해 늦게 기록한 경우를 알 수 있다.

### 7. Rescue는 계산 결과 스냅샷이다

Rescue 분류는 언제든 다시 계산할 수 있지만, 사용자가 당시 본 결과를 보존해야 한다.

`rescue_case`는 기준 루틴, 정책 버전, 근거 강도와 안전 우선 여부를 저장한다. `rescue_item`은 제품별 분류와 계산에 사용한 사실을 저장한다. AI 설명은 분류를 바꾸지 않고 구조화된 설명만 덧붙인다.

### 8. Archive 테이블은 만들지 않는다

Beauty Archive는 `experiment`, `experiment_result`, `observation`, `rescue_case`, `routine_version`을 조회한 읽기 화면이다. 별도 Archive 행을 복제하면 실험 결과와 Archive가 서로 다르게 수정될 수 있다.

필요하면 읽기 성능을 위한 SQL view 또는 materialized view를 만들 수 있지만 원본 데이터는 위 테이블이다.

### 9. 개인 패턴은 원인이 아니다

P1 개인 패턴은 완료 실험을 집계한 SQL view로 계산한다. 최소 두 사례, 전체 관련 사례 수와 반대 사례를 함께 반환한다.

추천 결과에 사용한 패턴은 `recommendation_candidate.evidence_snapshot`에 당시 수치와 참조 실험 ID를 저장한다. 이후 기록이 늘어나도 과거 추천 설명이 몰래 바뀌지 않는다.

### 10. LAB 보상은 중복될 수 없다

`lab_record.experiment_id`에 유일 제약을 둔다. 실험 결과를 다시 제출하거나 네트워크 재시도가 발생해도 한 실험은 연구실에 한 번만 추가된다. 일회성 배지는 `user_id + badge_code` 유일 제약으로 한 번만 해금한다.

캐릭터·테마·장식은 `lab_item_definition`에 정의하고 실제 해금은 `user_lab_item`에 남긴다. `lab_profile`의 선택값은 기본 제공 항목이거나 사용자가 해금한 항목일 때만 바꿀 수 있다. 화면에서 잠금 표시를 숨기는 것만으로 적용 권한이 생기지 않는다.

### 11. JWT와 로그인 상태는 분리한다

- access JWT는 짧게 사용하고 원문을 데이터베이스에 저장하지 않는다.
- 재로그인 없이 인증을 이어가는 상태만 `auth_refresh_session`으로 관리한다.
- refresh token도 원문이 아니라 해시만 저장하고 로그아웃 시 해당 session을 폐기한다.
- access JWT에는 사용자 ID와 session ID를 넣는다. 모든 개인 API는 서명뿐 아니라 session 유효성, `app_user`의 존재와 삭제 잠금도 확인한다.

access JWT는 15분 동안 사용하고 브라우저 메모리에 둔다. refresh token은 7일 동안 유효한
`HttpOnly`·`Secure` cookie로 전달하고 사용할 때마다 교체한다. 서버는 refresh token 원문 대신
해시만 저장하며, cookie 인증 엔드포인트는 허용한 프론트엔드 Origin만 받는다.

## 소유권 경로

개인 데이터는 모두 `app_user`까지 한 방향으로 추적할 수 있다.

| 데이터 | 사용자까지의 경로 |
| --- | --- |
| 루틴 | routine_version → routine → app_user |
| 추천 | recommendation_candidate → recommendation_request → app_user |
| 후보·비교·순서 | comparison/order item → candidate 또는 ordering → app_user |
| 실험·관찰·Rescue·결과 | child → experiment → app_user |
| 이미지·AI 작업 | upload_asset 또는 ai_job → app_user |
| LAB | lab_record/user_badge/user_lab_item → app_user |
| 알림 | delivery → subscription과 quest → 같은 app_user |

사용자 ID를 함께 가진 교차 참조는 양쪽 소유자가 같아야 한다. 예를 들어 실험의 후보·비교·기준 루틴, 알림의 구독·퀘스트가 서로 다른 사용자일 수 없다. 구현 스키마에서는 복합 FK 또는 같은 소유자를 검사하는 제약으로 막고, 권한 테스트도 함께 둔다.

## 트랜잭션 경계

다음 작업은 일부만 성공하면 데이터 의미가 깨지므로 하나의 데이터베이스 트랜잭션으로 처리한다.

| 작업 | 함께 성공해야 하는 변경 |
| --- | --- |
| 추천 준비 | 추천 요청 + 서버가 허용한 후보군 저장 |
| 추천 확정 | 검증된 추천 후보 + AI 채택 또는 규칙 fallback 경로 저장 |
| 안정 루틴 확정 | 새 버전 확정 + 현재 안정 버전 포인터 변경 |
| 실험 계획 확정 | 실험 생성 + 초기 상태 이력 + 필수 퀘스트 초안 생성 |
| 첫 사용 | 관찰 시각으로 실제 시작·종료 재계산 + ACTIVE 전환 + 첫 사용 이벤트 + 퀘스트 일정 이력·관찰 저장 |
| 불편 관찰 | 관찰·상세 저장 + Rescue case/item 생성 + 필요 시 PAUSED 전환 |
| 실험 완료 | 결과 저장 + COMPLETED 전환 + LAB record 생성 |
| 안정 루틴 반영 | 새 루틴 버전·항목 생성 + 결과 연결 + 현재 포인터 변경 |

외부 AI·알림 호출을 데이터베이스 트랜잭션 안에서 기다리지 않는다. 작업 행을 먼저 저장하고 비동기로 처리하며 재시도해도 같은 결과가 중복 생성되지 않게 한다.

## 삭제와 보존

### 사용자 계정 삭제

1. 사용자 쓰기를 잠그고 `privacy_deletion_job`을 만든다.
2. refresh session을 폐기해 새 access JWT 발급을 막는다.
3. 비공개 업로드 객체와 알림 구독을 삭제한다.
4. 사용자 소유 도메인 데이터와 개인 제품 초안을 외래키 순서에 따라 삭제한다.
5. `app_user`를 삭제한다. 기존 access JWT도 사용자 확인 단계에서 거부된다.
6. 삭제 작업에는 사용자에게서 파생하지 않은 작업 식별자, 상태와 완료 시각만 최대 30일 보존한다.

공용 제품 데이터와 집계된 비식별 분석 수치는 남을 수 있지만 개인과 다시 연결할 수 없어야 한다.

### 이미지

- 객체는 항상 비공개 버킷에 둔다.
- 구조화 결과를 사용자가 확정하면 즉시 삭제 예약한다.
- 확정하지 않아도 `delete_after = uploaded_at + 7일`을 넘기지 않는다.
- 데이터베이스 행과 객체 삭제가 모두 성공해야 `DELETED`로 표시한다.
- 객체 키나 짧은 업로드 URL을 애플리케이션 로그와 AI 작업 결과에 남기지 않는다.

### 운영 데이터

- 실험·루틴 기록은 사용자가 삭제하기 전까지 개인 Archive를 위해 보존한다.
- 애플리케이션 로그에는 민감 원문을 남기지 않으며 운영 보존 기간은 30일을 기본으로 한다.
- AI 구조화 출력은 사용자가 확정한 도메인 데이터로 전환한 뒤 최소 정보만 남긴다.

## 동시성과 무결성

- 수정 가능한 집계·상태 행에는 낙관적 잠금 `version`을 둔다.
- 안정 루틴 버전 번호는 `routine_id + version_no`로 유일하다.
- 시간대 안의 제품 순서와 제품 중복은 유일 제약으로 막고 1부터 이어지는 순서는 확정 트랜잭션에서 검증한다.
- 실험 상태 전환은 현재 상태 조건부 update로 경쟁 요청을 막는다.
- 실험 완료, 안정 루틴 승격과 보상 생성은 idempotency key를 사용한다.
- 모든 개인 FK 조회는 소유자 연결을 확인한다. UUID가 노출되어도 다른 사용자 데이터가 반환되지 않아야 한다.

## 데이터 모델 완료 기준

- 요구사항의 모든 저장·이력·삭제 동작이 특정 엔터티와 연결된다.
- 과거 실험을 열어 당시 루틴·제품·추천 근거를 그대로 복원할 수 있다.
- 두 개의 열린 실험, 중복 퀘스트 응답과 중복 LAB 보상을 DB가 막는다.
- 사용자 A의 모든 개인 엔터티에 사용자 A 소유 경로가 존재한다.
- 계정 삭제 순서와 외래키 정책이 서로 충돌하지 않는다.
- Pn 기능을 위한 사용되지 않는 테이블이 없다.

## 구현 전에 남은 결정

논리 구조를 바꾸지는 않지만 다음 값은 아직 확정하지 않았다.

- 초기 카탈로그의 피부 고민·제품 기능·관찰 코드 목록과 운영 책임자

이 값을 Flyway나 AI가 임의로 정하지 않는다. 제품·API 결정이 확정되면 관련 Story와 이 문서를 함께 갱신한다.
