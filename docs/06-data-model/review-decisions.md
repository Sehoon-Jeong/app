# 데이터 모델 리뷰 결정

이 문서는 2026-08-05 데이터 모델 리뷰를 무엇을 받아들이고 무엇을 보류했는지 기록한다. 구현자는 원문 리뷰가 아니라 이 결정과 [데이터 모델](./README.md)을 따른다.

## 전제

- 운영 DB는 PostgreSQL이 아니라 단일 API 인스턴스가 사용하는 SQLite다.
- 실제 스키마 변경은 SQLite용 Flyway migration으로만 한다.
- DBML은 관계를 설명하는 계약이며 실제 제약의 원본이 아니다.
- 외부 AI 호출을 기다리는 동안 DB 트랜잭션이나 사용자 전체 잠금을 유지하지 않는다.

## 결정 요약

| 리뷰 항목 | 결정 | 적용 방식 |
| --- | --- | --- |
| 개인 데이터 소유권 | 채택 | 개인 자식 행에 `user_id`를 두고 `(id, user_id)` 복합 FK로 부모와 소유자를 함께 검증한다. API도 인증 사용자 범위로만 조회한다. |
| PostgreSQL RLS | 기각 | SQLite에는 RLS가 없다. 서비스 권한 검사와 복합 FK를 함께 사용한다. |
| 현재 루틴 중복 | 채택 | `routine_version.status=ACTIVE`만 권위로 사용한다. `app_user.current_routine_version_id`와 `is_current`는 제거한다. |
| 평가 예정 시점 중복 | 채택 | `routine_assessment_schedule`이 due의 원본이다. assessment와 notification은 schedule을 참조한다. |
| 루틴 정의와 사용기간 혼합 | MVP 변형 채택 | 별도 episode 테이블은 만들지 않고 `routine_version 하나 = 한 번의 실제 사용기간`으로 고정한다. 과거 루틴을 다시 써도 새 버전으로 복사한다. |
| 활성 루틴 수정 | 채택 | `DRAFT`에서만 item을 바꾼다. `ACTIVE` 이후 item과 핵심 필드는 DB trigger로 수정·삭제를 막는다. |
| AI 분석 요청과 실행 시도 | 채택 | `analysis_request`와 `analysis_run`을 분리하고 최종 채택 run을 명시한다. |
| AI worker 고아 작업 | 채택 | `ai_job`에 `available_at`, `locked_by`, `locked_until`, `heartbeat_at`을 둔다. 만료된 lease는 다시 claim할 수 있다. |
| 사용자 전체 쓰기 잠금 | 기각 | `write_locked_at`을 제거한다. plan의 기준 루틴과 적용 시점의 ACTIVE 루틴을 비교해 오래된 계획을 `STALE`로 만든다. |
| 제품 버전 상태 혼합 | 채택 | `verification_status`와 `lifecycle_status`를 분리한다. |
| 처방 버전과 SKU 분리 | MVP 보류 | `product_version`을 처방·용량·포장·시장 조건이 같은 하나의 출시판으로 정의한다. 실제 카탈로그에서 중복이 운영 문제가 될 때 formula/SKU를 분리한다. |
| 근거 URL만 저장 | 채택 | URL 정체성인 `evidence_source`와 확인 시점의 `evidence_snapshot`을 분리한다. 분석과 제품 사실은 snapshot을 참조한다. |
| 제품 사실당 근거 하나 | 채택 | `product_fact_evidence`로 다대다 근거를 허용한다. |
| 전성분 상위 목록 | 채택 | `ingredient_list`와 `ingredient_list_item`으로 원문·추출 실행·순서를 함께 보존한다. |
| 평가 enum 혼합 | 채택 | 관찰 `observed_outcome`, 실제 사용 `adherence_status`, 다음 행동 `assessment_decision`을 분리한다. |
| 신뢰도 실수 저장 | 기각 | 원본 평가에는 weight를 저장하지 않는다. 분석 시 알고리즘 버전과 함께 계산한다. |
| 안정 루틴 포인터 | 채택 | `stable_routine_period`로 승격·종료 이력을 보존하고 열린 기간은 사용자당 하나만 둔다. |
| Rescue 계획 한 건 | 채택 | case별 `version_no`를 두고 run·기준 루틴·적용 루틴을 추적한다. |
| 안전 경계 boolean | 채택 | `rescue_safety_event`를 원본으로 두고 메시지·탐지 버전·조치를 기록한다. boolean은 저장하지 않고 조회 시 파생한다. |
| PostgreSQL `jsonb` | 변형 채택 | SQLite `TEXT`에 JSON을 저장하고 `CHECK(json_valid(column))`과 `schema_version`을 함께 둔다. 적용된 핵심 상태는 정규화된 테이블에 저장한다. |
| PostgreSQL enum | 기각 | 핵심 폐쇄 상태는 SQLite `TEXT CHECK (...)`로 제한한다. DBML enum은 문서 표현일 뿐 migration에서는 CHECK로 만든다. |
| 부분 유니크·FK 인덱스 | 채택 | SQLite partial unique index와 모든 주요 FK 조회 인덱스를 Flyway migration에 명시한다. |

## 핵심 불변식

1. 개인 자식 행은 다른 사용자의 부모 행을 참조할 수 없다.
2. 사용자당 `ACTIVE` 루틴은 최대 하나다.
3. 한 `routine_version`은 한 번만 활성화되고 과거 버전은 다시 활성화하지 않는다.
4. `ACTIVE`, `SUPERSEDED`, `CANCELLED` 루틴의 item은 수정하거나 삭제하지 않는다.
5. 평가 due의 원본은 schedule 한 곳뿐이다.
6. 안정 루틴 승격 assessment는 같은 사용자·같은 routine이며 `MATCHED + NO_DISCOMFORT + COMPLETE`여야 한다.
7. AI 원본 출력은 run에 불변으로 남고, 검증된 proposal과 실제 적용 routine은 별도 행이다.
8. Rescue plan은 생성 당시 기준 루틴이 여전히 ACTIVE일 때만 적용한다.
9. 제품 사실·전성분·AI 외부 근거는 확인 당시 evidence snapshot을 참조한다.
10. AI가 실패해도 이미 저장된 제품·루틴·사용자 메시지는 rollback하지 않는다.

## SQLite에서 migration으로 구현할 제약

DBML이 완전히 표현하지 못하는 아래 제약은 Flyway SQL과 통합 테스트가 원본이다.

```sql
CREATE UNIQUE INDEX uq_routine_one_active
ON routine_version(user_id)
WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX uq_stable_routine_one_open
ON stable_routine_period(user_id)
WHERE ended_at IS NULL;

CREATE UNIQUE INDEX uq_rescue_one_open
ON rescue_case(user_id)
WHERE status IN ('CONVERSATION', 'ANALYZING', 'READY');

CREATE UNIQUE INDEX uq_rescue_one_applied_plan
ON rescue_plan(rescue_case_id)
WHERE status = 'APPLIED';

CREATE UNIQUE INDEX uq_ai_job_one_open_input
ON ai_job(user_id, job_type, input_hash)
WHERE status IN ('QUEUED', 'RUNNING');
```

JSON 필드는 nullable 여부에 따라 다음 형태의 CHECK를 사용한다.

```sql
CHECK (json_valid(input_snapshot_json))
CHECK (output_json IS NULL OR json_valid(output_json))
```

루틴 불변성과 안정 승격처럼 여러 행의 상태를 함께 확인해야 하는 규칙은 전용 쓰기 서비스와 SQLite trigger 양쪽에서 검증한다. 단순 CRUD repository가 직접 상태를 건너뛰어 갱신할 수 없게 한다.

## 아직 만들지 않는 것

- PostgreSQL 전환, RLS, PostgreSQL enum과 `jsonb`
- `routine_definition_version`, `routine_episode`, `product_trial`의 3단 분리
- `product_formula_version`과 `product_sku`의 분리
- 다중 API 인스턴스용 분산 lock
- 브랜드 파일럿용 별도 연구 데이터 모델

위 항목은 현재 트래픽이나 MVP 기능을 위해 필요한 것이 아니다. 실제 반복 데이터에서 현재 단위가 손실을 만들거나 단일 인스턴스 경계를 넘을 때 별도 결정 기록을 만든다.
