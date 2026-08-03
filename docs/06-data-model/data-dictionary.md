# 데이터 사전

## 표기

- 모든 ID는 UUID다.
- 모든 테이블은 별도 표기가 없어도 `created_at`을 가진다.
- 수정 가능한 행은 `updated_at`, 동시 수정 가능성이 있으면 `version`을 가진다.
- 시각은 PostgreSQL `timestamptz`로 UTC 저장한다.
- `P0`, `P1`은 해당 테이블이 처음 필요한 범위다.
- 자유 문장과 JSONB는 구조화 필드를 대신하지 않고 설명·스냅샷에만 사용한다.

## 1. 사용자와 개인정보

### `app_user` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | Supabase Auth subject와 같은 UUID |
| `timezone` | NOT NULL | IANA 시간대, 기본은 가입 시 브라우저 값 |
| `write_locked_at` | NULL 허용 | 계정 삭제 중 새 쓰기 차단 |
| `created_at` | NOT NULL | 최초 프로필 생성 시각 |

이메일과 인증 정보는 애플리케이션 DB에 복제하지 않는다.

### `user_concern` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `user_id` | FK app_user, 복합 PK | 소유자 |
| `concern_code` | 복합 PK | 통제된 피부 고민 코드 |
| `recorded_at` | NOT NULL | 사용자가 선택한 시각 |

`잘 모르겠어요`는 고민 코드가 아니라 별도 입력 상태다. 구체 고민과 동시에 저장하지 않는다.

### `web_push_subscription` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 구독 식별자 |
| `user_id` | FK app_user, NOT NULL | 소유자 |
| `endpoint` | UNIQUE, 암호화 | 브라우저 push endpoint |
| `public_key`, `auth_secret` | 암호화 | Web Push 전송 정보 |
| `expires_at`, `revoked_at` | NULL 허용 | 만료·철회 상태 |

### `privacy_deletion_job` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 삭제 작업 |
| `user_id` | FK app_user, 삭제 후 NULL | 처리 중인 사용자 |
| `user_reference_hash` | NOT NULL | 재연결 불가능한 운영용 해시 |
| `status` | REQUESTED/RUNNING/COMPLETED/FAILED | 작업 상태 |
| `current_step`, `error_code` | NULL 허용 | 재시도 가능한 단계와 비민감 오류 |
| `completed_at`, `purge_at` | NULL 허용 | 완료와 작업 행 삭제 예정 시각 |

## 2. 제품·성분·기능

### `brand` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 브랜드 |
| `name`, `normalized_name` | NOT NULL | 표시명과 검색용 이름 |
| `status` | ACTIVE/MERGED/INACTIVE | 운영 상태 |

### `product` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 같은 제품의 지속 식별자 |
| `brand_id` | FK brand, NULL 허용 | 확인된 브랜드 |
| `owner_user_id` | FK app_user, NULL 허용 | NULL은 공용, 값이 있으면 개인 초안 |
| `latest_version_id` | FK product_version, NULL 허용 | 현재 표시 버전 |
| `source_type` | CATALOG/USER_DRAFT | 생성 출처 |
| `status` | ACTIVE/MERGED/ARCHIVED | 제품 정체성 상태 |

공용 제품 중복 병합은 `MERGED`와 별도 대상 참조로 처리하며 기존 실험 FK를 일괄 변경하지 않는다.

### `product_version` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 제품 정보 버전 |
| `product_id` | FK product, NOT NULL | 제품 정체성 |
| `version_no` | product_id와 UNIQUE | 증가 버전 |
| `name`, `normalized_name` | NOT NULL | 표시명과 검색명 |
| `category_code` | NOT NULL | 제품 종류 |
| `verification_status` | DRAFT/USER_CONFIRMED/OPERATOR_VERIFIED | 확인 상태 |
| `source_reference` | NULL 허용 | 출처 URL·운영 자료 식별자 |
| `confirmed_at` | NULL 허용 | 사용자·운영 확인 시각 |

추천 자격은 `OPERATOR_VERIFIED`에 한정한다. 직접 선택 비교는 `USER_CONFIRMED`도 가능하나 정보 부족을 표시한다.

### `product_identifier` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 외부 식별자 |
| `product_version_id` | FK product_version | 대상 버전 |
| `type` | BARCODE | MVP 식별자 종류 |
| `value` | type과 UNIQUE | 정확 일치 값 |
| `verification_status` | NOT NULL | 확인 상태 |

### `ingredient` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 정규화 성분 |
| `canonical_name` | UNIQUE, NOT NULL | 기준 이름 |
| `status` | VERIFIED/ARCHIVED | 운영 상태 |

### `ingredient_alias` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `ingredient_id` | FK ingredient, 복합 PK | 기준 성분 |
| `normalized_alias` | 복합 PK | 검색·OCR 매칭 이름 |
| `locale` | NOT NULL | 언어·표기 범위 |

### `product_ingredient` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `product_version_id` | FK, 복합 PK | 제품 버전 |
| `position` | 복합 PK | 표시 순서 |
| `raw_name` | NOT NULL | 라벨 원문 |
| `ingredient_id` | FK ingredient, NULL 허용 | 확인된 정규화 성분 |
| `verification_status` | DRAFT/USER_CONFIRMED/OPERATOR_VERIFIED | 항목 상태 |
| `source_type` | CATALOG/IMAGE/MANUAL | 출처 |

같은 제품 버전의 `position`은 유일하고 1부터 증가한다. 정규화하지 못한 원문도 보존할 수 있다.

### `function_type` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `code` | PK | 보습·미백·각질 등 통제 코드 |
| `display_name` | NOT NULL | 사용자 표시명 |
| `description` | NOT NULL | 제품 기능으로 해석하는 범위 |
| `active` | NOT NULL | 추천·입력 사용 여부 |

### `product_function` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `product_version_id` | FK, 복합 PK | 제품 버전 |
| `function_code` | FK function_type, 복합 PK | 확인된 기능 |
| `source_type` | CLAIM/INGREDIENT_RULE/OPERATOR | 근거 종류 |
| `source_reference` | NOT NULL | 근거 식별자 |
| `verification_status` | NOT NULL | 확인 상태 |
| `observation_note` | NULL 허용 | 운영 확인 관찰 설명 |

## 3. 이미지와 AI 작업

### `upload_asset` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 비공개 객체 메타데이터 |
| `user_id` | FK app_user, NOT NULL | 소유자 |
| `purpose` | INGREDIENT_LABEL/PURCHASE_IMAGE | 사용 목적 |
| `object_key` | UNIQUE, NOT NULL | 공개 URL이 아닌 저장 키 |
| `status` | UPLOADED/PROCESSING/DELETE_PENDING/DELETED/FAILED | 수명 상태 |
| `delete_after` | NOT NULL | 최대 업로드+7일 |
| `deleted_at` | NULL 허용 | DB·객체 삭제 완료 시각 |

### `ai_job` — P0/P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | AI 작업 |
| `user_id` | FK app_user, NOT NULL | 소유자 |
| `task_type` | NOT NULL | 기능명세에 정의한 작업 종류 |
| `input_asset_id` | FK upload_asset, NULL 허용 | 이미지 입력 |
| `model`, `prompt_version`, `schema_version` | NOT NULL | 재현 정보 |
| `status` | QUEUED/RUNNING/SUCCEEDED/FAILED/TIMED_OUT | 처리 상태 |
| `structured_output` | JSONB, NULL 허용 | 검증을 통과한 최소 출력 |
| `error_code` | NULL 허용 | 비민감 실패 코드 |
| `started_at`, `completed_at` | NULL 허용 | 지연시간 측정 |

### `ingredient_extraction_item` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 추출 행 |
| `ai_job_id` | FK ai_job | 원본 작업 |
| `position`, `raw_text` | NOT NULL | 이미지의 순서와 원문 |
| `suggested_ingredient_id` | FK ingredient, NULL 허용 | 정규화 후보 |
| `review_status` | PENDING/ACCEPTED/CORRECTED/REJECTED | 사용자 확인 상태 |
| `confirmed_ingredient_id` | FK ingredient, NULL 허용 | 최종 선택 |

### `purchase_extraction_item` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 구매 이미지 제품 후보 |
| `ai_job_id` | FK ai_job | 원본 작업 |
| `raw_brand`, `raw_product_name` | NULL 허용 | 필요한 최소 원문 |
| `suggested_product_version_id` | FK product_version, NULL 허용 | 카탈로그 후보 |
| `review_status` | PENDING/ACCEPTED/CORRECTED/REJECTED | 사용자 확인 |

금액, 주문번호와 주소 필드는 만들지 않는다.

## 4. 안정 루틴

### `routine` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 사용자 루틴 정체성 |
| `user_id` | FK app_user, UNIQUE | MVP에서는 사용자당 하나 |
| `name` | NOT NULL | 기본 `현재 루틴` |
| `current_stable_version_id` | FK routine_version, NULL 허용 | 현재 기준점 |

### `routine_version` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 루틴 버전 |
| `routine_id` | FK routine, NOT NULL | 소속 루틴 |
| `version_no` | routine_id와 UNIQUE | 증가 번호 |
| `status` | DRAFT/CONFIRMED | 확정 여부 |
| `confirmed_by_user_at` | NULL 허용 | 사용자의 안정 확인 시각 |
| `source_type` | INITIAL/MANUAL_UPDATE/EXPERIMENT_RESULT | 생성 이유 |

`CONFIRMED` 후 항목을 수정하지 않는다. 현재 여부는 status가 아니라 `routine.current_stable_version_id`로 판단한다.

### `routine_item` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 루틴 제품 행 |
| `routine_version_id` | FK, NOT NULL | 루틴 버전 |
| `time_slot` | AM/PM | 사용 시간대 |
| `position` | NOT NULL | 시간대 안의 순서 |
| `product_version_id` | FK product_version | 당시 제품 정보 |

유일 제약:

- `routine_version_id + time_slot + position`
- `routine_version_id + time_slot + product_version_id`

## 5. 추천·후보·비교

### `recommendation_request` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 추천 요청 |
| `user_id` | FK app_user | 소유자 |
| `routine_version_id` | FK routine_version | 기준 안정 루틴 |
| `goal_function_code` | FK function_type | 우선 목적 |
| `change_intent` | ADD/REPLACE | 변경 의도 |
| `target_routine_item_id` | FK routine_item, NULL 허용 | 교체 대상 |
| `preference_snapshot` | JSONB | 확인된 선택 조건만 보존 |
| `policy_version` | NOT NULL | 추천 일반 규칙 버전 |
| `status` | RUNNING/COMPLETED/FAILED | 처리 상태 |

REPLACE이면 target은 필수이며 같은 routine version의 item이어야 한다.

### `recommendation_candidate` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 추천 결과 후보 |
| `request_id` | FK recommendation_request | 요청 |
| `product_version_id` | FK product_version | 실제 제품 |
| `rank` | request_id와 UNIQUE | 1부터 최대 3 |
| `evidence_strength` | SUFFICIENT/LIMITED/INSUFFICIENT | 정보 재현 수준 |
| `evidence_snapshot` | JSONB, NOT NULL | 지지·반대·부족 정보와 참조 실험 ID |

`request_id + product_version_id`도 유일하다.

### `experiment_candidate` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 사용자가 저장한 후보 |
| `user_id` | FK app_user | 소유자 |
| `routine_version_id` | FK routine_version | 후보 저장 당시 기준 |
| `product_version_id` | FK product_version | 대상 제품 |
| `recommendation_candidate_id` | FK, NULL 허용 | 추천 출처 |
| `source_type` | RECOMMENDATION/SEARCH/DIRECT | 유입 경로 |
| `goal_function_code` | FK function_type | 목적 |
| `change_intent` | ADD/REPLACE | 변경 방식 |
| `target_routine_item_id` | FK routine_item, NULL 허용 | 교체 대상 |
| `status` | SAVED/STALE/STARTED/ARCHIVED | 후보 상태 |

미완료 후보 중 `user + routine version + product version + change intent + target` 조합은 유일하다.

### `candidate_comparison` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 비교 결과 |
| `candidate_id` | FK experiment_candidate | 비교한 후보 |
| `version_no` | candidate_id와 UNIQUE | 재계산 이력 번호 |
| `policy_version` | NOT NULL | 비교 규칙 버전 |
| `evidence_strength` | NOT NULL | 정보 수준 |
| `product_diff` | JSONB, NOT NULL | 추가·제거·유지 제품 ID 스냅샷 |
| `function_diff` | JSONB, NOT NULL | 추가·중복·제거 기능 코드 |
| `observation_focus` | JSONB, NOT NULL | 근거가 있는 관찰 항목 |
| `invalidated_at` | NULL 허용 | 기준 루틴·제품 버전 변경으로 무효화 |

JSONB 안의 제품과 기능 값은 서버가 계산한 ID·코드만 허용하고 자유 생성 텍스트는 설명과 분리한다. 비교 결과는 수정하지 않으며 정책 또는 입력이 바뀌면 새 version을 만든다. 실제 실험은 사용자가 선택한 comparison을 직접 참조한다.

## 6. 실험과 퀘스트

### `experiment` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 한 번의 실제 사용 실험 |
| `user_id` | FK app_user | 소유자 |
| `candidate_id` | FK experiment_candidate | 시작한 후보 |
| `comparison_id` | FK candidate_comparison | 시작 당시 확정한 비교 결과 |
| `baseline_routine_version_id` | FK routine_version | 고정 기준점 |
| `parent_experiment_id` | FK experiment, NULL 허용 | 재시험 원본 |
| `status` | PLANNED/ACTIVE/PAUSED/COMPLETED/CANCELLED | 현재 상태 |
| `planned_start_date`, `planned_end_date` | NOT NULL | 사용자 계획 |
| `actual_started_at`, `completed_at` | NULL 허용 | 실제 기간 |
| `time_slot`, `position` | NOT NULL | 실제 적용 위치 |
| `idempotency_key` | user_id와 UNIQUE | 중복 계획 방지 |

부분 유일 인덱스로 사용자당 열린 실험 하나를 강제한다.

### `experiment_transition` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 상태 변경 이력 |
| `experiment_id` | FK experiment | 실험 |
| `from_status` | NULL 허용 | 최초 생성은 NULL |
| `to_status` | NOT NULL | 새 상태 |
| `reason_code` | NULL 허용 | 보류·취소 이유 |
| `occurred_at` | NOT NULL | 전환 시각 |

### `experiment_event` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 사용 사실 이벤트 |
| `experiment_id` | FK experiment | 실험 |
| `type` | FIRST_USE/PRODUCT_STOPPED/PRODUCT_RESTARTED/PLAN_DEVIATION/UNPLANNED_PRODUCT_CHANGE | 사건 종류 |
| `product_version_id` | FK, NULL 허용 | 관련 제품 |
| `occurred_at`, `recorded_at` | NOT NULL | 실제·입력 시각 |
| `details` | JSONB | 종류별 검증된 최소 정보 |

### `observation_quest` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 관찰 요청 |
| `experiment_id` | FK experiment | 실험 |
| `type` | FIRST_USE/EARLY_CHECK/MID_CHECK/FINAL_CHECK | 예정 퀘스트 종류 |
| `required` | NOT NULL | 진행도 포함 여부 |
| `due_at` | NULL 허용 | FIRST_USE는 시작 전 미확정 가능 |
| `previous_due_at` | NULL 허용 | 보류 후 이동 전 시각 |
| `status` | SCHEDULED/COMPLETED/SKIPPED/CANCELLED | 상태 |
| `skip_reason_code` | NULL 허용 | 건너뜀 이유 |

`experiment_id + type`은 기본 필수 퀘스트에 대해 유일하다.

### `observation` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 실제 관찰 |
| `experiment_id` | FK experiment | 실험 |
| `quest_id` | FK observation_quest, UNIQUE, NULL 허용 | 예정 퀘스트 응답 |
| `kind` | QUEST/CHANGE/STOP/RESTART | 입력 계기 |
| `condition` | NO_CHANGE/COMFORTABLE_OR_BETTER/DISCOMFORT/UNSURE/NOT_USED | 사용자 선택 |
| `used_as_planned` | NULL 허용 | 계획 준수 여부 |
| `memo` | NULL 허용 | 사용자 짧은 기록 |
| `observed_at`, `recorded_at` | NOT NULL | 실제 관찰·입력 시각 |

### `discomfort_detail` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `observation_id` | PK, FK observation | DISCOMFORT 관찰 |
| `severity` | MILD/MODERATE/SEVERE | 사용자 체감 정도 |
| `first_noticed_at` | NULL 허용 | 처음 인지 시점 |
| `help_needed` | NOT NULL | 전문가 도움 필요 선택 |
| `spreading_or_worsening` | NOT NULL | 넓어짐·악화 선택 |
| `type_codes`, `area_codes`, `context_change_codes` | 배열/JSONB, 검증 | 통제된 복수 선택 코드 |
| `other_context` | NULL 허용 | 선택적 기타 설명 |

복수 선택 코드는 애플리케이션 코드셋으로 검증한다. 향후 독립 검색 요구가 생기면 연결 테이블로 분리한다.

## 7. Rescue와 결과

### `rescue_case` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 한 번의 Rescue 계산 |
| `experiment_id` | FK experiment | 대상 실험 |
| `trigger_observation_id` | FK observation, UNIQUE | 시작 관찰 |
| `baseline_routine_version_id` | FK routine_version | 비교 기준 |
| `policy_version` | NOT NULL | 분류 규칙 버전 |
| `evidence_strength` | SUFFICIENT/LIMITED/INSUFFICIENT | 기록 재현 수준 |
| `safety_priority` | NOT NULL | 안전 안내 우선 여부 |
| `missing_information` | JSONB | 분류에 부족한 항목 코드 |
| `explanation_ai_job_id` | FK ai_job, NULL 허용 | 설명 작업 |

### `rescue_item` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 제품별 Rescue 결과 |
| `rescue_case_id` | FK rescue_case | Rescue |
| `product_version_id` | FK product_version | 제품 |
| `classification` | CHECK_FIRST/HOLD/KEEP_CANDIDATE/UNDETERMINED | 분류 |
| `change_source` | EXPERIMENT/UNPLANNED/STABLE/UNKNOWN | 변경 출처 |
| `evidence_snapshot` | JSONB, NOT NULL | 시점과 규칙 사실 |

`rescue_case_id + product_version_id`는 유일하다.

### `experiment_result` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 최종 결과 |
| `experiment_id` | FK experiment, UNIQUE | 완료 실험 |
| `outcome` | TOLERATED/DISCOMFORT/HOLD/INCONCLUSIVE | 사용자 선택 |
| `summary` | NULL 허용 | 사용자 최종 메모 |
| `promote_to_stable` | NOT NULL | 루틴 반영 동의 |
| `resulting_routine_version_id` | FK routine_version, NULL 허용 | 생성된 새 안정 루틴 |
| `completed_at` | NOT NULL | 결과 확정 시각 |
| `idempotency_key` | UNIQUE | 중복 결과 방지 |

`promote_to_stable`은 outcome이 TOLERATED일 때만 true이며 true이면 resulting version이 필수다.

Beauty Archive는 이 테이블과 관련 이력을 조회하는 view다.

## 8. LAB와 알림

### `lab_profile` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `user_id` | PK, FK app_user | 사용자 연구실 |
| `selected_character_code` | NULL 허용 | 선택 캐릭터 |
| `selected_theme_code` | NULL 허용 | 선택 테마 |

완료 실험 수는 저장하지 않고 lab_record count로 계산한다.

### `lab_record` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 완료 연구 기록 |
| `user_id` | FK app_user | 소유자 |
| `experiment_id` | FK experiment, UNIQUE | 완료 실험 |
| `display_asset_code` | NOT NULL | 선반에 표시할 연구 샘플 |
| `earned_at` | NOT NULL | 획득 시각 |

실험 outcome에 따라 획득 여부를 차별하지 않는다. COMPLETED 결과가 있어야 생성한다.

### `badge_definition` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `code` | PK | 배지 코드 |
| `name`, `description` | NOT NULL | 표시 내용 |
| `rule_code`, `rule_version` | NOT NULL | 해금 규칙 |
| `active` | NOT NULL | 현재 제공 여부 |

### `user_badge` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `user_id` | FK app_user, 복합 PK | 소유자 |
| `badge_code` | FK badge_definition, 복합 PK | 배지 |
| `source_experiment_id` | FK experiment, NULL 허용 | 획득 근거 |
| `earned_at` | NOT NULL | 획득 시각 |

### `notification_delivery` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 알림 전송 |
| `quest_id` | FK observation_quest | 대상 퀘스트 |
| `subscription_id` | FK web_push_subscription | 수신 구독 |
| `type` | DUE/OVERDUE | 퀘스트당 종류별 한 번 |
| `status` | PENDING/SENT/FAILED/SUPPRESSED | 전송 상태 |
| `scheduled_at`, `sent_at` | NULL 허용 | 예약·전송 시각 |
| `error_code` | NULL 허용 | 비민감 실패 코드 |

`quest_id + subscription_id + type`은 유일하다.

## 9. 주요 FK 삭제 정책

| 부모 | 자식 | 정책 | 이유 |
| --- | --- | --- | --- |
| app_user | 개인 도메인 전체 | 계정 삭제 작업에서 명시적 순서 삭제 | 외부 파일·인증과 함께 성공 여부를 추적해야 함 |
| routine | routine_version/item | CASCADE | 사용자 루틴 단위 삭제 |
| product | product_version | RESTRICT | 과거 실험 참조 보존, 계정 삭제 시 개인 제품은 참조부터 삭제 |
| experiment | quest/observation/rescue/result/lab_record | CASCADE | 계정 삭제 외에는 실험을 물리 삭제하지 않음 |
| routine_version | experiment | RESTRICT | 과거 기준점 보존 |
| product_version | routine/candidate/experiment/rescue | RESTRICT | 과거 제품 정보 보존 |
| upload_asset | ai_job | SET NULL 또는 작업 삭제 | 이미지 삭제 후 구조화 도메인 데이터는 유지 가능 |

일반 UI의 `삭제`는 계정 삭제를 제외하면 Archive 보존 정책에 따라 취소·보관 상태로 처리한다. 물리 삭제가 필요한 기능은 별도 요구사항 없이는 추가하지 않는다.

## 10. 필수 인덱스

- `product_version(normalized_name)`과 `brand(normalized_name)` 검색 인덱스
- `experiment(user_id, status, created_at desc)`
- 열린 실험 부분 유일 인덱스
- `observation_quest(experiment_id, due_at, status)`
- `observation(experiment_id, observed_at)`
- `experiment_result(experiment_id)` 유일 인덱스
- `recommendation_request(user_id, created_at desc)`
- `experiment_candidate(user_id, status, created_at desc)`
- `upload_asset(status, delete_after)` 삭제 작업 인덱스
- `ai_job(status, created_at)` 작업 회수 인덱스
- `notification_delivery(status, scheduled_at)` 전송 작업 인덱스

실제 쿼리 계획을 확인하기 전 중복 인덱스를 추가하지 않는다.
