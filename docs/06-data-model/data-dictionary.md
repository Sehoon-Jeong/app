# 데이터 사전

이 문서는 필드의 제품 의미, 허용값과 교차 테이블 불변조건만 정의한다. 컬럼 타입·PK·FK·인덱스와 시각 ERD의 원본은 [`schema.dbml`](./schema.dbml)이다.

설명보다 구현 규칙을 우선한다. 같은 내용이 충돌하면 구조는 DBML, 의미와 불변조건은 이 문서를 기준으로 함께 수정한다.

## 목차

| 영역 | 포함 내용 |
| --- | --- |
| [표기와 공통 규칙](#표기) | 공통 타입, 시각, FK와 JSONB 원칙 |
| [1. 사용자와 개인정보](#1-사용자와-개인정보) | `app_user`, 인증 세션, 피부 고민, 알림 구독, 계정 삭제 작업 |
| [2. 제품·성분·기능](#2-제품성분기능) | 브랜드, 제품 버전, 바코드, 성분과 제품 기능 |
| [3. 이미지와 AI 작업](#3-이미지와-ai-작업) | 비공개 업로드, AI 작업, 성분·구매 내역 추출 결과 |
| [4. 안정 루틴](#4-안정-루틴) | 루틴, 불변 루틴 버전과 아침·저녁 제품 순서 |
| [5. 추천·후보·비교](#5-추천후보비교) | 추천 요청·후보, 실험 후보, 루틴 비교와 시험 순서 |
| [6. 실험과 퀘스트](#6-실험과-퀘스트) | 실험 상태, 변경 이력, 관찰 일정·기록과 불편 상세 |
| [7. Rescue와 결과](#7-rescue와-결과) | Rescue 복원·분류와 사용자가 확정한 최종 결과 |
| [8. LAB와 알림](#8-lab와-알림) | 연구실 기록, 배지·장식·프로필과 알림 전송 이력 |
| [9. 주요 FK 삭제 정책](#9-주요-fk-삭제-정책) | aggregate별 삭제 방식, 계정 삭제 순서와 사용자 경계 |
| [10. 필수 인덱스](#10-필수-인덱스) | 검색·조회·고유 제약에 필요한 최소 인덱스 |

## 표기

- 모든 ID는 UUID다.
- 공통 `created_at`과 변경 가능한 행의 `updated_at`은 DBML에 명시한다.
- 시각은 PostgreSQL `timestamptz`로 UTC 저장한다.
- `P0`, `P1`은 해당 테이블이 처음 필요한 범위다.
- 자유 문장과 JSONB는 구조화 필드를 대신하지 않고 설명·스냅샷에만 사용한다.
- FK는 별도 표기가 없으면 부모가 존재하는 동안 삭제를 제한한다. 계정 삭제와 aggregate 하위 데이터 삭제 정책은 9절에서 따로 정한다.
- DBML이 표현하지 못하는 CHECK·부분 인덱스·동일 사용자 제약은 Flyway에서 구현한다.

## 1. 사용자와 개인정보

### `app_user` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 애플리케이션이 생성한 사용자 UUID |
| `email` | UNIQUE, NOT NULL | 로그인 이메일, 정규화 후 저장 |
| `password_hash` | NOT NULL | 단방향 해시된 비밀번호 |
| `timezone` | NOT NULL | IANA 시간대, 기본은 가입 시 브라우저 값 |
| `concern_input_state` | UNSET/UNKNOWN/SPECIFIED | 피부 고민 입력 상태 |
| `write_locked_at` | NULL 허용 | 계정 삭제 중 새 쓰기 차단 |
| `created_at` | NOT NULL | 최초 프로필 생성 시각 |

비밀번호 원문과 JWT는 저장하지 않는다. 이메일은 로그인과 계정 관리에만 사용한다. `SPECIFIED`이면 `user_concern`이 하나 이상 있어야 하고, `UNKNOWN`이면 고민 행이 없어야 한다. 두 변경은 한 트랜잭션에서 처리한다.

### `auth_refresh_session` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 로그인 유지 세션 |
| `user_id` | FK app_user, NOT NULL | 소유자 |
| `token_hash` | UNIQUE, NOT NULL | 현재 refresh token의 단방향 해시 |
| `expires_at` | NOT NULL | 재발급 가능 만료 시각 |
| `last_rotated_at` | NULL 허용 | refresh token을 마지막 교체한 시각 |
| `revoked_at` | NULL 허용 | 로그아웃·삭제·이상 사용으로 폐기한 시각 |

access JWT와 refresh token 원문은 저장하지 않는다. access JWT의 session ID가 이 행을 가리키며, 개인 API는 폐기·만료 session을 거부한다. access JWT는 15분, refresh token은 7일 동안 사용한다. refresh token은 `HttpOnly`·`Secure` cookie로 전달하고 재발급 시 해시와 cookie를 함께 교체해 동시 재사용을 막는다.

### `user_concern` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `user_id` | FK app_user, 복합 PK | 소유자 |
| `concern_code` | 복합 PK | 통제된 피부 고민 코드 |
| `recorded_at` | NOT NULL | 사용자가 선택한 시각 |

`잘 모르겠어요`는 고민 코드가 아니라 `app_user.concern_input_state = UNKNOWN`으로 저장한다. 구체 고민과 동시에 저장하지 않는다.

### `web_push_subscription` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 구독 식별자 |
| `user_id` | FK app_user, NOT NULL | 소유자 |
| `endpoint_hash` | UNIQUE, NOT NULL | 중복 구독 확인용 비가역 해시 |
| `endpoint_ciphertext` | NOT NULL, 암호화 | 브라우저 push endpoint |
| `public_key_ciphertext`, `auth_secret_ciphertext` | NOT NULL, 암호화 | Web Push 전송 정보 |
| `expires_at`, `revoked_at` | NULL 허용 | 만료·철회 상태 |

암호문 자체를 유일성 비교에 사용하지 않는다. endpoint·키·secret은 애플리케이션 로그에 남기지 않는다.

### `privacy_deletion_job` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 삭제 작업 |
| `user_id` | FK app_user, UNIQUE, 삭제 후 NULL | 처리 중인 사용자 |
| `operation_reference` | UNIQUE, NOT NULL | 사용자 정보에서 파생하지 않은 임의 작업 식별자 |
| `status` | REQUESTED/RUNNING/COMPLETED/FAILED | 작업 상태 |
| `current_step`, `error_code` | NULL 허용 | 재시도 가능한 단계와 비민감 오류 |
| `completed_at`, `purge_at` | NULL 허용 | 완료와 작업 행 삭제 예정 시각 |

사용자당 미완료 삭제 작업은 하나만 존재한다. 완료 행은 `completed_at + 30일` 이내에 제거하며 이메일·사용자 ID에서 만든 해시는 보존하지 않는다.

## 2. 제품·성분·기능

### `brand` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 브랜드 |
| `name`, `normalized_name` | NOT NULL | 표시명과 검색용 이름 |
| `merged_into_brand_id` | self FK brand, NULL 허용 | 중복 병합 대상 브랜드 |
| `status` | ACTIVE/MERGED/INACTIVE | 운영 상태 |

MERGED일 때만 병합 대상이 필수이며 자기 자신과 병합 순환은 허용하지 않는다. 제품이 참조한 과거 brand ID는 일괄 변경하지 않는다.

### `product` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 같은 제품의 지속 식별자 |
| `brand_id` | FK brand, NULL 허용 | 확인된 브랜드 |
| `owner_user_id` | FK app_user, NULL 허용 | NULL은 공용, 값이 있으면 개인 초안 |
| `latest_version_id` | FK product_version, NULL 허용 | 현재 표시 버전 |
| `merged_into_product_id` | self FK product, NULL 허용 | 중복 병합 대상 정체성 |
| `source_type` | CATALOG/USER_DRAFT | 생성 출처 |
| `status` | ACTIVE/MERGED/ARCHIVED | 제품 정체성 상태 |

`CATALOG`이면 owner는 NULL이고 `USER_DRAFT`이면 owner가 필수다. `MERGED`일 때만 병합 대상이 필수이며 자기 자신이나 병합 순환을 가리킬 수 없다. 기존 실험 FK는 일괄 변경하지 않는다.

`latest_version_id`는 같은 product에 속한 version만 가리킬 수 있다. 공용 제품을 새 버전으로 갱신해도 과거 version은 삭제하지 않는다.

### `product_version` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 제품 정보 버전 |
| `product_id` | FK product, NOT NULL | 제품 정체성 |
| `version_no` | product_id와 UNIQUE | 증가 버전 |
| `name`, `normalized_name` | NOT NULL | 표시명과 검색명 |
| `brand_display_name` | NOT NULL | 해당 버전에서 확인한 브랜드 표시명 |
| `category_code` | NOT NULL | 제품 종류 |
| `verification_status` | DRAFT/USER_CONFIRMED/OPERATOR_VERIFIED | 확인 상태 |
| `source_reference` | NULL 허용 | 출처 URL·운영 자료 식별자 |
| `confirmed_at` | NULL 허용 | 사용자·운영 확인 시각 |

추천 자격은 `OPERATOR_VERIFIED`에 한정한다. 직접 선택 비교는 `USER_CONFIRMED`도 가능하나 정보 부족을 표시한다.

verification status가 DRAFT이면 confirmed_at은 NULL이고 나머지 상태이면 확인 시각이 필수다.

USER_CONFIRMED 또는 OPERATOR_VERIFIED version과 연결 성분·기능은 수정하지 않는다. 정보 수정은 product_version과 자식 행을 새 version으로 만든 뒤 product.latest_version_id를 옮긴다.

### `product_identifier` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 외부 식별자 |
| `product_version_id` | FK product_version, NOT NULL | 대상 버전 |
| `type` | BARCODE | MVP 식별자 종류 |
| `value` | NOT NULL | 정확 일치 값 |
| `verification_status` | DRAFT/USER_CONFIRMED/OPERATOR_VERIFIED | 확인 상태 |

`product_version_id + type + value`는 유일하다. 정확 검색은 각 ACTIVE product의 `latest_version_id`에서 확인된 식별자만 대상으로 한다. 같은 값이 둘 이상의 ACTIVE product에 나오면 데이터 오류로 보고 자동 선택하지 않는다. 동일 바코드를 유지한 과거 version도 보존해야 하므로 `type + value`를 전역 유일로 만들지 않는다.

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
| `locale` | 복합 PK | 언어·표기 범위 |
| `normalized_alias` | 복합 PK | 검색·OCR 매칭 이름 |

`locale + normalized_alias` 조회는 여러 성분 후보를 반환할 수 있다. 후보가 둘 이상이면 자동 정규화하지 않고 사용자·운영 확인 대상으로 남긴다.

### `product_ingredient` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `product_version_id` | FK product_version, 복합 PK | 제품 버전 |
| `position` | 복합 PK | 표시 순서 |
| `raw_name` | NOT NULL | 라벨 원문 |
| `ingredient_id` | FK ingredient, NULL 허용 | 확인된 정규화 성분 |
| `verification_status` | DRAFT/USER_CONFIRMED/OPERATOR_VERIFIED | 항목 상태 |
| `source_type` | CATALOG/IMAGE/MANUAL | 출처 |

같은 제품 버전의 `position`은 유일하고 1부터 증가한다. 정규화하지 못한 원문도 보존할 수 있다.

`position > 0` CHECK를 두고, 사용자가 확정한 제품 버전에서는 1부터 빈틈없이 이어지는지 확정 트랜잭션에서 검증한다.

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
| `product_version_id` | FK product_version, 복합 PK | 제품 버전 |
| `function_code` | FK function_type, 복합 PK | 확인된 기능 |
| `source_type` | CLAIM/INGREDIENT_RULE/OPERATOR | 근거 종류 |
| `source_reference` | NOT NULL | 근거 식별자 |
| `verification_status` | DRAFT/USER_CONFIRMED/OPERATOR_VERIFIED | 확인 상태 |
| `observation_note` | NULL 허용 | 운영 확인 관찰 설명 |

## 3. 이미지와 AI 작업

### `upload_asset` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 비공개 객체 메타데이터 |
| `user_id` | FK app_user, NOT NULL | 소유자 |
| `purpose` | INGREDIENT_LABEL/PURCHASE_IMAGE | 사용 목적 |
| `object_key` | UNIQUE, NOT NULL | 공개 URL이 아닌 저장 키 |
| `content_type`, `byte_size` | NOT NULL, 검증 | 허용 형식과 크기 |
| `status` | UPLOADED/PROCESSING/DELETE_PENDING/DELETED/FAILED | 수명 상태 |
| `delete_after` | NOT NULL | 최대 업로드+7일 |
| `delete_requested_at` | NULL 허용 | 사용자 확인·계정 삭제로 삭제를 요청한 시각 |
| `deletion_error_code` | NULL 허용 | 객체 삭제 재시도용 비민감 오류 |
| `deleted_at` | NULL 허용 | DB·객체 삭제 완료 시각 |

`delete_after <= created_at + 7일`을 강제한다. 구조화 결과를 확정하면 `delete_requested_at`을 기록하고 즉시 `DELETE_PENDING`으로 전환한다. 객체와 데이터베이스 상태가 모두 정리된 뒤에만 `DELETED`가 된다.

### `ai_job` — P0/P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | AI 작업 |
| `user_id` | FK app_user, NOT NULL | 소유자 |
| `task_type` | NOT NULL | 기능명세에 정의한 작업 종류 |
| `invocation_source` | USER_REQUEST/SERVICE_ASSIST | 사용자가 요청한 구조화인지 서비스 설명 작업인지 |
| `input_asset_id` | FK upload_asset, NULL 허용 | 이미지 입력 |
| `model`, `prompt_version`, `schema_version` | NOT NULL | 재현 정보 |
| `status` | QUEUED/RUNNING/SUCCEEDED/FAILED/TIMED_OUT | 처리 상태 |
| `input_fingerprint` | NOT NULL | 원문을 보존하지 않는 입력 변경 확인용 해시 |
| `structured_output` | JSONB, NULL 허용 | 검증을 통과한 최소 출력 |
| `error_code` | NULL 허용 | 비민감 실패 코드 |
| `requested_at` | NOT NULL | 작업을 등록한 시각 |
| `started_at`, `completed_at` | NULL 허용 | 지연시간 측정 |

허용 작업은 `INGREDIENT_EXTRACTION`, `PURCHASE_ITEM_EXTRACTION`, `GOAL_CLASSIFICATION`, `OBSERVATION_STRUCTURING`, `RECOMMENDATION_RANKING`, `EXPLANATION`이다. `SUCCEEDED`는 JSON Schema와 서버 규칙을 모두 통과했다는 뜻이다. 공급자 응답 원문, 숨겨진 추론, 이미지 URL과 사용자 메모 원문은 이 테이블에 보존하지 않는다.

이미지 추출과 관찰 메모 구조화는 사용자가 해당 작업을 직접 요청한 `USER_REQUEST`일 때만 호출한다. 이미지 추출 작업은 같은 사용자의 upload asset이 필수이고 나머지 작업은 input asset을 두지 않는다. provider payload에는 이메일, 사용자 ID, 인증 정보, 무관한 프로필이나 다른 실험 기록을 넣지 않는다. RUNNING이면 started_at, 종료 상태이면 completed_at이 필수이며 SUCCEEDED일 때만 검증된 structured output을 저장한다.

목적 구조화·추천 순위·후보 순서 설명·관찰 구조화·Rescue 설명은 각각 사용하는 도메인 행에서 최종 채택 작업을 참조한다. 실패한 재시도 작업도 사용자의 `ai_job` 이력에는 남지만 도메인 결과를 바꾸지 않는다.

### `ingredient_extraction_item` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 추출 행 |
| `ai_job_id` | FK ai_job | 원본 작업 |
| `position`, `raw_text` | NOT NULL | 이미지의 순서와 원문 |
| `suggested_ingredient_id` | FK ingredient, NULL 허용 | 정규화 후보 |
| `review_status` | PENDING/ACCEPTED/CORRECTED/REJECTED | 사용자 확인 상태 |
| `confirmed_ingredient_id` | FK ingredient, NULL 허용 | 최종 선택 |

`ai_job_id + position`은 유일하고 `position > 0`이다. 확정 성분은 `ACCEPTED` 또는 `CORRECTED`일 때만 존재한다.

ai job은 같은 사용자의 성공한 INGREDIENT_EXTRACTION 작업이어야 한다.

### `purchase_extraction_item` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 구매 이미지 제품 후보 |
| `ai_job_id` | FK ai_job | 원본 작업 |
| `raw_brand`, `raw_product_name` | NULL 허용 | 필요한 최소 원문 |
| `suggested_product_version_id` | FK product_version, NULL 허용 | 카탈로그 후보 |
| `review_status` | PENDING/ACCEPTED/CORRECTED/REJECTED | 사용자 확인 |
| `confirmed_product_version_id` | FK product_version, NULL 허용 | 사용자가 확정한 카탈로그 제품 |
| `created_draft_product_id` | FK product, NULL 허용 | 직접 수정해 만든 개인 제품 초안 |

금액, 주문번호와 주소 필드는 만들지 않는다.

확정 시 카탈로그 제품 또는 개인 제품 초안 중 하나만 연결할 수 있다. 개인 초안은 ai_job 사용자 소유여야 한다. `ai_job_id + id`로 항목을 추적하며 원본 이미지 좌표는 제품 행을 구분하는 최소 범위로만 `structured_output`에 남기고 이미지 삭제 뒤 재식별 가능한 원문은 보존하지 않는다.

ai job은 같은 사용자의 성공한 PURCHASE_ITEM_EXTRACTION 작업이어야 한다.

## 4. 안정 루틴

### `routine` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 사용자 루틴 정체성 |
| `user_id` | FK app_user, UNIQUE | MVP에서는 사용자당 하나 |
| `name` | NOT NULL | 기본 `현재 루틴` |
| `current_stable_version_id` | FK routine_version, NULL 허용 | 현재 기준점 |

`current_stable_version_id`는 같은 `routine.id`에 속하고 `CONFIRMED`인 버전만 가리킬 수 있다. 새 사용자는 루틴이 없을 수 있지만 MVP에서는 한 사용자에게 루틴이 최대 하나다.

PLANNED/ACTIVE/PAUSED 실험이 있으면 일반 편집으로 현재 안정 버전 포인터를 바꿀 수 없다. 실험 완료에서 사용자가 승격에 동의한 경우만 완료 트랜잭션 안에서 바꾼다.

### `routine_version` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 루틴 버전 |
| `routine_id` | FK routine, NOT NULL | 소속 루틴 |
| `version_no` | routine_id와 UNIQUE | 증가 번호 |
| `status` | DRAFT/CONFIRMED | 확정 여부 |
| `confirmed_at` | NULL 허용 | 사용자가 안정 상태를 확인한 시각 |
| `source_type` | INITIAL/MANUAL_UPDATE/EXPERIMENT_RESULT | 생성 이유 |

`CONFIRMED` 후 항목을 수정하지 않는다. 현재 여부는 status가 아니라 `routine.current_stable_version_id`로 판단한다.

`confirmed_at`은 CONFIRMED에서 필수이고 DRAFT에서는 NULL이다. `source_type = EXPERIMENT_RESULT`인 버전은 정확히 하나의 `experiment_result.resulting_routine_version_id`에서 생성 근거를 찾을 수 있어야 한다.

### `routine_item` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 루틴 제품 행 |
| `routine_version_id` | FK routine_version, NOT NULL | 루틴 버전 |
| `time_slot` | AM/PM | 사용 시간대 |
| `position` | NOT NULL | 시간대 안의 순서 |
| `product_version_id` | FK product_version | 당시 제품 정보 |

유일 제약:

- `routine_version_id + time_slot + position`
- `routine_version_id + time_slot + product_version_id`

`position > 0`이며 확정 시 각 시간대의 순서가 1부터 빈틈없이 이어져야 한다. 루틴에 들어가는 개인 제품은 해당 루틴 사용자 소유의 초안이어야 한다.

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
| `goal_classification_ai_job_id` | UNIQUE, FK ai_job, NULL 허용 | 자유 입력 목적을 구조화한 작업 |
| `ranking_ai_job_id` | UNIQUE, FK ai_job, NULL 허용 | 순위 생성에서 채택하거나 fallback 직전 시도한 AI 작업 |
| `ranking_source` | AI_VALIDATED/RULE_FALLBACK/NO_ELIGIBLE_CANDIDATE, 완료 전 NULL | 최종 후보를 정한 경로 |
| `fallback_reason_code` | NULL 허용 | AI 실패·검증 거부 시 비민감 사유 |

REPLACE이면 target은 필수이며 같은 routine version의 item이어야 한다. ADD이면 target은 NULL이다. `ranking_source = AI_VALIDATED`이면 성공한 `RECOMMENDATION_RANKING` 작업이 필수이고, `RULE_FALLBACK`이면 fallback 사유가 필수다. fallback 직전 AI 시도가 있었다면 실패·시간 초과·검증 거부 작업을 연결하고, AI를 호출하지 않은 fallback이면 NULL일 수 있다. 적격 pool이 비어 있으면 `NO_ELIGIBLE_CANDIDATE`로 완료하고 ranking 작업과 후보를 만들지 않는다. goal 작업이 있으면 성공한 `GOAL_CLASSIFICATION`이고 사용자 확인 후의 `goal_function_code`를 저장한다.

preference snapshot에는 요청 당시의 concern input state와 사용자가 확인한 고민 코드, 제품 종류·시간대 같은 선택 조건만 넣는다. 자유 입력 원문이나 이메일은 넣지 않는다.

### `recommendation_pool_item` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `request_id` | FK recommendation_request, 복합 PK | 추천 요청 |
| `product_version_id` | FK product_version, 복합 PK | 서버가 허용한 실제 제품 |
| `eligibility_policy_version` | NOT NULL | 후보 자격 규칙 버전 |
| `comparison_facts` | JSONB, NOT NULL | 목적 연결·기능 중복·개인 결과·정보 수준의 구조화 사실 |
| `eligible_at` | NOT NULL | 후보군을 확정한 시각 |

서버가 자격을 확인한 ACTIVE 공용 product의 OPERATOR_VERIFIED 최신 version만 저장한다. AI에는 이 테이블의 product version ID와 구조화 사실만 전달한다. 자유 문장 효능, 개인 초안이나 카탈로그 밖 제품은 후보군에 들어갈 수 없다.

### `recommendation_candidate` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 추천 결과 후보 |
| `request_id` | FK recommendation_request | 요청 |
| `product_version_id` | FK product_version | 허용 후보군에 있던 실제 제품 |
| `rank` | request_id와 UNIQUE | 1부터 최대 3 |
| `evidence_strength` | SUFFICIENT/LIMITED/INSUFFICIENT | 정보 재현 수준 |
| `evidence_snapshot` | JSONB, NOT NULL | 지지·반대·부족 정보와 참조 실험 ID |

`request_id + product_version_id`도 유일하며 같은 조합의 `recommendation_pool_item`을 복합 FK로 참조한다. `rank`는 1~3 CHECK를 둔다. evidence에는 서버 비교 사실, 반영한 개인 실험 ID, AI 설명 채택 여부와 fallback 여부만 허용한다. 이 스냅샷은 이후 기록·모델·정책이 바뀌어도 수정하지 않는다.

### `experiment_candidate` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 사용자가 저장한 후보 |
| `user_id` | FK app_user | 소유자 |
| `routine_version_id` | FK routine_version | 후보 저장 당시 기준 |
| `product_version_id` | FK product_version | 대상 제품 |
| `recommendation_candidate_id` | FK recommendation_candidate, NULL 허용 | 추천 출처 |
| `source_type` | RECOMMENDATION/SEARCH/DIRECT | 유입 경로 |
| `goal_function_code` | FK function_type | 목적 |
| `change_intent` | ADD/REPLACE | 변경 방식 |
| `target_routine_item_id` | FK routine_item, NULL 허용 | 교체 대상 |
| `status` | SAVED/STALE/STARTED/ARCHIVED | 후보 상태 |

미완료 후보 중 `user + routine version + product version + change intent + target` 조합은 NULL을 같은 값으로 취급해 유일하다. source가 RECOMMENDATION이면 추천 후보가 필수이고 제품·요청 사용자와 저장 후보가 일치해야 한다. SEARCH/DIRECT이면 추천 후보는 NULL이다. REPLACE이면 같은 routine version의 target이 필수이고 ADD이면 target은 NULL이다.

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
| `invalidation_reason_code` | NULL 허용 | 무효화 이유 |

JSONB 안의 제품과 기능 값은 서버가 계산한 ID·코드만 허용하고 자유 생성 텍스트는 설명과 분리한다. 비교 결과는 수정하지 않으며 정책 또는 입력이 바뀌면 새 version을 만든다. 실제 실험은 사용자가 선택한 comparison을 직접 참조한다.

### `candidate_ordering` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 저장 후보들의 한 번의 시험 순서 계산 |
| `user_id` | FK app_user, NOT NULL | 소유자 |
| `routine_version_id` | FK routine_version, NOT NULL | 공통 비교 기준 |
| `policy_version` | NOT NULL | 순서 규칙 버전 |
| `evidence_strength` | SUFFICIENT/LIMITED/INSUFFICIENT | 전체 순서 재현 수준 |
| `explanation_ai_job_id` | UNIQUE, FK ai_job, NULL 허용 | 순서 차이를 설명한 AI 작업 |
| `created_at` | NOT NULL | 계산 시각 |

### `candidate_ordering_item` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `ordering_id` | FK candidate_ordering, 복합 PK | 순서 묶음 |
| `comparison_id` | FK candidate_comparison, 복합 PK | 같은 안정 루틴의 최신 비교 결과 |
| `rank` | ordering_id와 UNIQUE | 먼저 시험할 순서, 1부터 시작 |
| `reason_snapshot` | JSONB, NOT NULL | 목적·개인 이력·변수 수·정보 수준의 구조화 근거 |

같은 ordering 안에서 comparison과 rank는 각각 유일하다. 포함된 comparison은 ordering의 사용자와 안정 루틴에 속해야 하고 무효화되지 않은 버전이어야 한다. 항목 수만큼 rank가 1부터 빈틈없이 이어지는지 생성 트랜잭션에서 검증한다.

설명 작업이 있으면 성공한 EXPLANATION 작업이며 순서와 reason snapshot을 바꿀 수 없다. 실패하면 같은 reason snapshot의 고정 문구를 사용한다.

## 6. 실험과 퀘스트

### `experiment` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 한 번의 실제 사용 실험 |
| `user_id` | FK app_user | 소유자 |
| `candidate_id` | FK experiment_candidate | 시작한 후보 |
| `comparison_id` | FK candidate_comparison | 시작 당시 확정한 비교 결과 |
| `ordering_id` | FK candidate_ordering, NULL 허용 | 먼저 시험할 순서에서 선택한 경우의 묶음 |
| `baseline_routine_version_id` | FK routine_version | 고정 기준점 |
| `parent_experiment_id` | FK experiment, NULL 허용 | 재시험 원본 |
| `status` | PLANNED/ACTIVE/PAUSED/COMPLETED/CANCELLED | 현재 상태 |
| `duration_days` | 7~28, 기본 14 | 사용자가 선택한 실험 기간 |
| `planned_start_date`, `planned_end_date` | NOT NULL | 계획 시 보여준 시작·종료 미리보기 |
| `planned_at` | NOT NULL | 계획을 확정한 시각 |
| `actual_started_at`, `expected_end_at` | NULL 허용 | 첫 사용을 기준으로 계산한 실제 일정 |
| `completed_at` | NULL 허용 | 완료·취소로 닫힌 시각 |
| `time_slot` | AM/PM | 실제 적용 시간대 |
| `position` | NOT NULL, 0보다 큼 | 실제 적용 순서 |
| `retrial_stability_confirmed_at` | NULL 허용 | 재시험 전 사용자가 현재 안정 상태를 확인한 시각 |
| `idempotency_key` | user_id와 UNIQUE | 중복 계획 방지 |

부분 유일 인덱스로 사용자당 열린 실험 하나를 강제한다. `candidate_id`와 `comparison_id`는 각각 유일해 같은 후보·비교를 두 실험이 재사용할 수 없다. 후보, 비교, 기준 루틴과 parent는 모두 같은 사용자에 속해야 하고 comparison의 candidate·routine도 실험과 일치해야 한다. ordering이 있으면 `ordering_id + comparison_id`가 실제 ordering item을 복합 참조한다.

parent가 있으면 자신이나 후손을 가리킬 수 없고, 원본 결과는 HOLD 또는 INCONCLUSIVE여야 하며 `retrial_stability_confirmed_at`이 필수다. 재시험은 현재 안정 루틴에서 만든 새 후보·비교를 사용한다.

duration은 7~28일이고 계획 종료 미리보기는 계획 시작과 duration으로 계산한다. 첫 사용 전에는 duration을 바꿀 수 있지만 첫 사용 후에는 제품·기준 루틴과 함께 고정한다.

FIRST_USE 관찰의 observed_at을 actual_started_at으로 사용하고 `expected_end_at = actual_started_at + duration_days`로 다시 계산한다. 계획 종료일이 이미 지났어도 같은 규칙을 적용한다. 후속 퀘스트 due_at은 이 실제 일정으로 바꾸고 `quest_schedule_change`에 계획 미리보기와 실제 일정의 변경 전·후를 남긴다. completed_at은 COMPLETED 또는 CANCELLED의 마지막 전환 시각과 일치해야 한다.

### `experiment_transition` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 상태 변경 이력 |
| `experiment_id` | FK experiment | 실험 |
| `transition_no` | experiment_id와 UNIQUE | 1부터 증가하는 전환 순서 |
| `from_status` | NULL 허용 | 최초 생성은 NULL |
| `to_status` | NOT NULL | 새 상태 |
| `reason_code` | NULL 허용 | 보류·취소 이유 |
| `occurred_at` | NOT NULL | 전환 시각 |
| `idempotency_key` | experiment_id와 UNIQUE | 중복 전환 방지 |

첫 행은 `from_status = NULL`, `to_status = PLANNED`다. 이후 행의 from은 직전 to와 같아야 하며 요구사항의 상태 다이어그램에 있는 전환만 허용한다. `PAUSED → ACTIVE`는 마지막 보류 사유가 피부 불편이 아닐 때만 허용한다. 불편으로 보류한 실험은 결과를 확정한 뒤 별도 재시험으로 연결한다. 현재 `experiment.status`와 마지막 to는 같은 트랜잭션에서 일치시킨다.

### `experiment_event` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 사용 사실 이벤트 |
| `experiment_id` | FK experiment | 실험 |
| `type` | FIRST_USE/PRODUCT_STOPPED/PRODUCT_RESTARTED/PLAN_DEVIATION/UNPLANNED_PRODUCT_CHANGE | 사건 종류 |
| `product_version_id` | FK product_version, NULL 허용 | 관련 제품 |
| `source_observation_id` | FK observation, NULL 허용 | 관찰 입력에서 함께 생성된 사건 |
| `occurred_at`, `recorded_at` | NOT NULL | 실제·입력 시각 |
| `details` | JSONB | 종류별 검증된 최소 정보 |
| `idempotency_key` | experiment_id와 UNIQUE | 중복 사건 방지 |

제품 사건은 product version이 필수이고 해당 사용자에게 보이는 제품이어야 한다. 관찰에서 생성된 사건은 같은 experiment의 observation만 연결할 수 있다. 실제 시각은 미래일 수 없고 입력 시각과 구분한다.

### `observation_quest` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 관찰 요청 |
| `experiment_id` | FK experiment | 실험 |
| `type` | FIRST_USE/EARLY_CHECK/MID_CHECK/FINAL_CHECK | 예정 퀘스트 종류 |
| `required` | NOT NULL | 진행도 포함 여부 |
| `due_at` | NOT NULL | 계획 시 미리보기, 첫 사용 후 실제 일정의 예정 시각 |
| `status` | SCHEDULED/COMPLETED/SKIPPED/CANCELLED | 상태 |
| `skip_reason_code` | NULL 허용 | 건너뜀 이유 |
| `resolved_at` | NULL 허용 | 완료·건너뜀·취소로 예정 상태를 벗어난 시각 |

`experiment_id + type`은 기본 필수 퀘스트에 대해 유일하다. `SCHEDULED`이면 resolved와 skip reason은 NULL이고, `SKIPPED`이면 둘 다 필수다. `COMPLETED` 퀘스트에는 정확히 하나의 observation이 있어야 한다.

### `quest_schedule_change` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 미완료 퀘스트 예정 시각 변경 |
| `quest_id` | FK observation_quest, NOT NULL | 변경한 퀘스트 |
| `change_no` | quest_id와 UNIQUE | 1부터 증가하는 변경 순서 |
| `from_due_at`, `to_due_at` | NOT NULL | 변경 전·후 예정 시각 |
| `reason_code` | FIRST_USE_RECALC/PLAN_EDIT/PAUSE_RESUME/TIMEZONE_BEFORE_START | 변경 이유 |
| `changed_at` | NOT NULL | 변경을 적용한 시각 |

계획 확정 시 네 퀘스트에는 planned preview를 기준으로 due_at을 둔다. 실제 첫 사용에서는 완료된 FIRST_USE를 제외한 후속 퀘스트를 actual start와 duration으로 다시 계산하고 `FIRST_USE_RECALC` 이력을 남긴다. 완료·건너뜀·취소된 퀘스트는 이동하지 않는다. 여러 번 보류·재개하더라도 모든 이전 예정 시각을 이 테이블에서 복원한다.

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
| `structuring_ai_job_id` | UNIQUE, FK ai_job, NULL 허용 | 메모에서 확인 질문을 만든 작업 |
| `observed_at`, `recorded_at` | NOT NULL | 실제 관찰·입력 시각 |

`observed_at <= recorded_at`이고 미래 관찰을 저장하지 않는다. QUEST kind이면 quest가 필수이며 같은 experiment에 속해야 한다. quest가 없는 예정 밖 관찰은 CHANGE/STOP/RESTART만 허용한다. condition이 DISCOMFORT이면 `discomfort_detail`이 필수이고, 다른 condition에는 detail을 만들지 않는다. structuring 작업이 있으면 같은 사용자의 성공한 `OBSERVATION_STRUCTURING` 작업이어야 하며 사용자가 확인하지 않은 출력은 관찰 사실로 저장하지 않는다.

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

severity, help_needed와 spreading_or_worsening은 불편 기록 완료 시 필수다. `context_change_codes`는 불편 관찰에서만 받으며 `없음`·`잘 모르겠음`은 다른 생활 변화 코드와 동시에 저장하지 않는다.

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
| `context_snapshot` | JSONB, NOT NULL | 당시 불편·생활 변화·동시 변경 코드와 참조 이벤트 ID |
| `missing_information` | JSONB | 분류에 부족한 항목 코드 |
| `explanation_ai_job_id` | UNIQUE, FK ai_job, NULL 허용 | 설명 작업 |

trigger observation은 같은 experiment의 DISCOMFORT 관찰이어야 한다. baseline은 experiment의 기준 루틴과 같아야 한다. AI 작업은 성공한 EXPLANATION 작업만 연결할 수 있고, 없어도 분류와 고정 설명은 유효하다.

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

`evidence_snapshot`에는 변경 시점, stable/experiment/unplanned 출처, 적용한 규칙 코드와 반대 사실을 저장한다. AI 출력은 classification과 제품 식별자를 변경할 수 없다.

### `experiment_result` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 최종 결과 |
| `experiment_id` | FK experiment, UNIQUE | 완료 실험 |
| `outcome` | TOLERATED/DISCOMFORT/HOLD/INCONCLUSIVE | 사용자 선택 |
| `summary` | NULL 허용 | 사용자 최종 메모 |
| `promote_to_stable` | NOT NULL | 루틴 반영 동의 |
| `resulting_routine_version_id` | UNIQUE, FK routine_version, NULL 허용 | 생성된 새 안정 루틴 |
| `completed_at` | NOT NULL | 결과 확정 시각 |
| `idempotency_key` | UNIQUE | 중복 결과 방지 |

`promote_to_stable`은 outcome이 TOLERATED일 때만 true이며 true이면 resulting version이 필수다.

반대로 promote가 false이면 resulting version은 NULL이어야 한다. resulting version은 같은 사용자의 routine에 속하고 `CONFIRMED`, `source_type = EXPERIMENT_RESULT`여야 하며 다른 결과가 재사용할 수 없다. 결과, COMPLETED 전환, 선택적 루틴 승격과 LAB record는 idempotency key를 공유하는 하나의 완료 작업으로 처리한다.

Beauty Archive는 이 테이블과 관련 이력을 조회하는 view다.

## 8. LAB와 알림

### `lab_profile` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `user_id` | PK, FK app_user | 사용자 연구실 |
| `selected_character_code` | FK lab_item_definition, NULL 허용 | 선택 캐릭터 |
| `selected_theme_code` | FK lab_item_definition, NULL 허용 | 선택 테마 |

선택 코드는 해당 type의 `lab_item_definition`을 참조한다. 기본 제공 항목이 아니면 같은 사용자의 `user_lab_item` 해금 기록이 있어야 한다. 완료 실험 수는 저장하지 않고 lab_record count로 계산한다.

### `lab_record` — P0

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 완료 연구 기록 |
| `user_id` | FK app_user | 소유자 |
| `experiment_id` | FK experiment, UNIQUE | 완료 실험 |
| `display_asset_code` | FK lab_item_definition, NOT NULL | 선반에 표시할 RESEARCH_SAMPLE |
| `earned_at` | NOT NULL | 획득 시각 |

실험 outcome에 따라 획득 여부를 차별하지 않는다. COMPLETED 결과가 있어야 생성한다.

user와 experiment 소유자는 같아야 하고 experiment에 정확히 하나의 결과가 있어야 한다. display asset은 RESEARCH_SAMPLE type만 허용한다.

### `badge_definition` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `code` | 복합 PK | 배지 코드 |
| `rule_version` | 복합 PK | 해금 규칙 버전 |
| `name`, `description` | NOT NULL | 표시 내용 |
| `rule_code` | NOT NULL | 해금 규칙 |
| `reward_item_code` | FK lab_item_definition, NULL 허용 | 함께 해금할 장식 |
| `active` | NOT NULL | 현재 제공 여부 |

### `user_badge` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `user_id` | FK app_user, 복합 PK | 소유자 |
| `badge_code` | 복합 PK, 복합 FK badge_definition | 배지 |
| `rule_version` | 복합 FK badge_definition, NOT NULL | 획득 당시 규칙 버전 |
| `source_experiment_id` | FK experiment, NULL 허용 | 획득 근거 |
| `evidence_snapshot` | JSONB, NOT NULL | 충족한 퀘스트·Rescue·실험 ID와 계산 사실 |
| `earned_at` | NOT NULL | 획득 시각 |

PK는 `user_id + badge_code`이므로 규칙 버전이 바뀌어도 일회성 배지를 다시 주지 않는다. source experiment가 있으면 같은 사용자 소유여야 한다.

### `lab_item_definition` — P0/P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `code` | PK | 캐릭터·테마·장식·연구 샘플 코드 |
| `type` | CHARACTER/THEME/DECORATION/RESEARCH_SAMPLE | 항목 종류 |
| `name`, `asset_reference` | NOT NULL | 표시명과 정적 자산 식별자 |
| `default_available` | NOT NULL | 해금 없이 선택 가능한지 |
| `active` | NOT NULL | 현재 선택·표시 가능 여부 |

P0는 완료 실험을 보여줄 RESEARCH_SAMPLE만 정의한다. CHARACTER, THEME과 DECORATION은 P1에서 추가한다.

### `user_lab_item` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `user_id` | FK app_user, 복합 PK | 소유자 |
| `item_code` | FK lab_item_definition, 복합 PK | 해금한 캐릭터·테마·장식 |
| `source_badge_code` | 복합 FK badge_definition, NULL 허용 | 해금 근거 배지 코드 |
| `source_experiment_id` | FK experiment, NULL 허용 | 직접 실험 조건으로 해금한 경우 |
| `rule_version` | NOT NULL | 해금 규칙 버전 |
| `evidence_snapshot` | JSONB, NOT NULL | 획득 조건을 재현하는 구조화 근거 |
| `earned_at` | NOT NULL | 해금 시각 |

source badge가 있으면 `source_badge_code + rule_version`으로 정의 버전을 참조한다. badge 또는 source experiment 중 적어도 하나는 있어야 하며 source experiment는 같은 사용자 소유다. RESEARCH_SAMPLE은 실험별 `lab_record`로 관리하므로 `user_lab_item`에 중복 저장하지 않는다. 나머지 항목은 사용자와 코드 조합당 한 번만 해금한다.

### `notification_delivery` — P1

| 필드 | 제약 | 의미 |
| --- | --- | --- |
| `id` | PK | 알림 전송 |
| `quest_id` | FK observation_quest | 대상 퀘스트 |
| `subscription_id` | FK web_push_subscription | 수신 구독 |
| `type` | DUE/OVERDUE | 퀘스트당 종류별 한 번 |
| `status` | PENDING/SENT/FAILED/SUPPRESSED | 전송 상태 |
| `scheduled_at` | NOT NULL | 예약 시각 |
| `sent_at` | NULL 허용 | 실제 전송 시각 |
| `error_code` | NULL 허용 | 비민감 실패 코드 |

`quest_id + subscription_id + type`은 유일하다.

quest의 experiment 사용자와 subscription 사용자는 같아야 한다. 완료·건너뜀·취소된 퀘스트, 보류·취소 실험과 철회·만료 구독은 전송 전에 SUPPRESSED로 바꾼다. 알림 본문과 제품·피부 정보는 저장하지 않는다.

## 9. 주요 FK 삭제 정책

| 부모 | 자식 | 정책 | 이유 |
| --- | --- | --- | --- |
| app_user | 개인 도메인 전체 | 계정 삭제 작업에서 명시적 순서 삭제 | 외부 파일·인증과 함께 성공 여부를 추적해야 함 |
| app_user | auth_refresh_session | CASCADE | 계정이 없으면 재발급 세션도 유효하지 않음 |
| app_user | privacy_deletion_job | SET NULL | 삭제 완료 상태만 제한 기간 보존 |
| routine | routine_version/item | CASCADE | 계정 삭제 시 사용자 루틴 단위 정리 |
| product | product_version | RESTRICT | 과거 실험 참조 보존, 계정 삭제 시 개인 제품은 참조부터 삭제 |
| recommendation_request | pool/candidate | CASCADE | 요청 단위 추천 provenance를 함께 정리 |
| experiment_candidate | comparison/experiment | RESTRICT | 시작한 후보와 비교 근거 보존 |
| experiment | transition/event/quest/observation/rescue/result/lab_record | CASCADE | 계정 삭제 외에는 실험을 물리 삭제하지 않음 |
| observation_quest | schedule_change/notification_delivery | CASCADE | 퀘스트 수명과 함께 정리 |
| web_push_subscription | notification_delivery | CASCADE | 구독 삭제 시 민감 endpoint와 전송 이력 연결 제거 |
| routine_version | experiment | RESTRICT | 과거 기준점 보존 |
| product_version | routine/candidate/experiment/rescue | RESTRICT | 과거 제품 정보 보존 |
| upload_asset | ai_job | SET NULL | 객체 삭제 후 검증된 구조화 도메인 데이터는 유지 가능 |
| ai_job | recommendation/rescue provenance | RESTRICT | 사용한 모델·프롬프트·fallback 경로 보존 |
| badge/lab item definition | 사용자 획득 기록 | RESTRICT | 과거 획득 이유와 표시 자산 보존 |

일반 UI의 `삭제`는 계정 삭제를 제외하면 Archive 보존 정책에 따라 취소·보관 상태로 처리한다. 물리 삭제가 필요한 기능은 별도 요구사항 없이는 추가하지 않는다.

### 계정 삭제 순서

1. app_user를 쓰기 잠금하고 refresh session을 폐기한다.
2. OCI 객체를 삭제하고 push subscription을 제거한다.
3. notification/LAB/Rescue/observation/experiment부터 루틴·추천 방향으로 개인 aggregate를 삭제한다.
4. AI 작업과 개인 제품 초안을 참조 역순으로 삭제한다.
5. user concern과 app_user를 삭제하고 deletion job의 user_id를 NULL로 바꾼다.

공용 brand·product·ingredient·function 정의는 삭제하지 않는다. 삭제 작업은 같은 단계부터 재시도 가능해야 하며 app_user가 사라진 뒤 기존 access JWT의 subject도 모든 개인 API에서 거부한다.

### 같은 사용자 제약

다음 참조는 FK 존재만으로 충분하지 않고 양쪽 사용자도 같아야 한다.

- recommendation request의 routine·target item·AI job
- experiment candidate의 routine·target item·recommendation source·개인 product
- ordering item의 ordering·comparison
- experiment의 candidate·comparison·baseline·parent
- event·quest·observation·Rescue의 experiment 연결
- lab record·badge·item의 user·source experiment
- notification delivery의 quest 사용자·subscription 사용자

구현에서는 aggregate root의 `user_id`를 포함한 복합 FK 또는 동등한 데이터베이스 제약으로 막는다. 애플리케이션 권한 검사만으로 소유권 무결성을 대신하지 않는다.

## 10. 필수 인덱스

- `product_version(normalized_name)`과 `brand(normalized_name)` 검색 인덱스
- `product_identifier(type, value)` 정확 검색 인덱스
- `auth_refresh_session(user_id, revoked_at, expires_at)` 유효 세션 인덱스
- `experiment(user_id, status, created_at desc)`
- 열린 실험 부분 유일 인덱스
- `observation_quest(experiment_id, due_at, status)`
- `quest_schedule_change(quest_id, change_no)` 유일 인덱스
- `observation(experiment_id, observed_at)`
- `experiment_result(experiment_id)` 유일 인덱스
- `recommendation_request(user_id, created_at desc)`
- `recommendation_pool_item(request_id, product_version_id)` PK 인덱스
- `experiment_candidate(user_id, status, created_at desc)`
- `candidate_ordering(user_id, created_at desc)`
- `upload_asset(status, delete_after)` 삭제 작업 인덱스
- `ai_job(status, requested_at)` 작업 회수 인덱스
- `notification_delivery(status, scheduled_at)` 전송 작업 인덱스

실제 쿼리 계획을 확인하기 전 중복 인덱스를 추가하지 않는다.
