# 데이터 모델 결정 기록

## 실행 환경

- 운영 DB는 PostgreSQL이 아니라 단일 API 인스턴스의 SQLite다.
- 실제 schema는 Flyway migration이 원본이고 DBML은 관계 설명이다.
- SQLite 모든 연결에서 FK를 켠다.
- 외부 AI 호출 동안 DB 쓰기 트랜잭션이나 사용자 전체 lock을 유지하지 않는다.

## 2026-08-10 · 제품 정체성 변경

기존 `7일 평가 → 불편 없음이면 안정 루틴 승격` 모델을 `경험 기록 → 개인 패턴 → 다음 탐색 재사용` 모델로 바꿨다.

| 이전 | 변경 |
| --- | --- |
| `routine_assessment`가 불편 여부 중심 결과를 저장 | `experience_record`가 만족·아쉬움·모름, 불편 여부, 원문과 실제 사용 일치를 분리 저장 |
| `routine_assessment_schedule`이 평가를 예약 | `experience_review_schedule`이 기본 회고 due만 예약하며 결과를 의미하지 않음 |
| `stable_routine_period`가 성공 루틴을 표현 | `comparison_baseline_period`가 Rescue 변경 비교 기준만 표현 |
| 결과 한 건이 다음 추천 근거가 됨 | `personal_pattern`이 여러 experience와 반대 evidence를 연결해 탐색 근거가 됨 |
| AI 해석이 assessment를 직접 참조 | 모든 주장이 원본 experience 또는 pattern revision을 참조 |

기존 이름을 호환 alias로 유지하지 않는다. 아직 운영 migration과 데이터가 없으므로 새 의미로 첫 migration을 만든다.

## 유지한 무결성 결정

1. 모든 개인 자식 행은 `(id, user_id)` 복합 FK로 소유권을 검증한다.
2. `routine_version.status=ACTIVE`만 현재 루틴의 원본이며 사용자당 하나다.
3. 한 routine version은 한 번의 실제 사용기간이고 ACTIVE 이후 item을 수정하지 않는다.
4. 과거 루틴으로 돌아가도 새 버전으로 복사한다.
5. AI `analysis_request`와 모델 시도 `analysis_run`을 분리한다.
6. Rescue plan은 생성 당시 기준 ACTIVE가 여전히 같을 때만 적용한다.
7. 제품 검증 상태와 판매 상태를 분리한다.
8. 외부 근거는 URL identity와 시점 snapshot을 분리한다.
9. SQLite JSON은 TEXT와 `json_valid()`를 사용하고 핵심 상태는 정규화한다.
10. 모든 주요 FK 조회 인덱스와 부분 유니크 인덱스를 migration에 명시한다.

## 첫 migration에 필요한 부분 유니크

```sql
CREATE UNIQUE INDEX uq_routine_one_active
ON routine_version(user_id)
WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX uq_baseline_one_open
ON comparison_baseline_period(user_id)
WHERE ended_at IS NULL;

CREATE UNIQUE INDEX uq_rescue_one_open
ON rescue_case(user_id)
WHERE status IN ('CONVERSATION', 'ANALYZING', 'READY');

CREATE UNIQUE INDEX uq_pattern_one_current_revision
ON personal_pattern(user_id, pattern_key)
WHERE status IN ('CANDIDATE', 'ACTIVE');
```

## 아직 만들지 않는 것

- PostgreSQL, RLS와 분산 lock
- formula version과 SKU의 완전 분리
- 모든 피부 상태·사용감을 통제하는 정적 enum 사전
- 다른 사용자 cohort 기반 피부 적합 추정
- 브랜드 파일럿 전용 연구 데이터 모델
