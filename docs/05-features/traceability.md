# 요구사항 추적표

## 이 문서가 답하는 질문

이 표는 각 요구사항에 대해 네 가지를 한 번에 확인하기 위한 문서다.

1. 자세한 사용자 흐름과 완료 조건은 어느 GitHub 이슈에 있는가?
2. 프론트엔드와 백엔드가 맞춰야 할 API 작업은 무엇인가?
3. 결과를 복원하고 판단할 때 어떤 데이터가 기준인가?
4. 무엇을 통과해야 구현이 끝난 것으로 보는가?

제품 범위는 [요구사항 명세](../04-requirements.md), 기능의 구체적인 계약은 아래에 연결한 GitHub Story·Task, API 형식은 [OpenAPI](../api/openapi.yaml), 데이터 제약은 [데이터 사전](../06-data-model/data-dictionary.md)이 기준이다. 이 표는 그 내용을 복제하지 않고 연결만 관리한다.

## 읽는 법

- `operationId`는 OpenAPI에 정의된 이름이다. API가 필요하지 않은 항목은 `UI`, `도메인`, `운영`으로 실행 위치를 명시했다.
- 데이터 칸의 `—`는 새 도메인 데이터를 저장하지 않는다는 뜻이다. 테스트 결과나 배포 설정까지 억지로 ERD에 넣지 않는다.
- 검증 표기: `E2E` 사용자 흐름, `API` 계약·권한 통합 테스트, `DOMAIN` 제품 규칙 단위 테스트, `DB` 제약·마이그레이션 테스트, `AI-EVAL` 고정 입력 평가, `UI` 접근성·반응형 테스트, `OPS` 배포·운영 점검.

## 계정과 개인정보

| 요구사항 | 관련 Story | 관련 operationId | 기준 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| `FR-AUTH-001` | [#45 이메일로 로그인하고 내 기록 불러오기](https://github.com/sksksksksksss/service/issues/45) | `signUp`, `login`, `getMyProfile`; 로그아웃은 프론트 `sessionStorage` 삭제 | `app_user.email`, `password_hash`, `write_locked_at`; 별도 인증 세션 없음 | E2E: 가입→새로고침→로그아웃; API: 만료 JWT·삭제 잠금 사용자 거부 |
| `FR-AUTH-002` | [#45 이메일로 로그인하고 내 기록 불러오기](https://github.com/sksksksksksss/service/issues/45); [#32 사용자별 루틴·실험 기록 저장 기반](https://github.com/sksksksksksss/service/issues/32) | `getMyProfile`, `updateMyProfile`; 개인 operation 전체 | 개인 aggregate의 `user_id`와 데이터 사전의 같은 사용자 복합 제약 | API: 다른 사용자 ID로 조회·수정 모두 거부 |
| `FR-AUTH-003` | [#46 계정과 SkinCause 기록 삭제](https://github.com/sksksksksksss/service/issues/46) | `deleteMyAccount` | `app_user.write_locked_at`; `privacy_deletion_job.status`, `current_step`, `purge_at`; 개인 객체 | E2E: 삭제 후 로그인·조회 불가; OPS: 실패 단계 재시도와 객체 삭제 |

## 안정 루틴

| 요구사항 | 관련 Story | 관련 operationId | 기준 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| `FR-RTN-001` | [#7 현재 문제없이 쓰는 제품·빈도와 기준 정보 저장](https://github.com/sksksksksksss/service/issues/7) | `getCurrentRoutine`, `saveRoutineDraft` | `routine`; `routine_version.status`; `routine_item.time_slot`, `position`, `product_version_id`, 사용 빈도 | E2E: 한 시간대 이상과 제품별 사용 빈도 저장 후 복원 |
| `FR-RTN-002` | [#7 현재 문제없이 쓰는 제품·빈도와 기준 정보 저장](https://github.com/sksksksksksss/service/issues/7) | `getCurrentRoutine`, `confirmRoutineDraft` | `routine.current_stable_version_id`; `routine_version.status`, `confirmed_at`, 사용 시작·최근 변경·현재 불편 입력 | DOMAIN: 현재 불편 NO와 사용자 확인 없이는 확정 금지; E2E: 실패 시 초안 보존 |
| `FR-RTN-003` | [#7 현재 문제없이 쓰는 제품·빈도와 기준 정보 저장](https://github.com/sksksksksksss/service/issues/7); [#32 사용자별 루틴·실험 기록 저장 기반](https://github.com/sksksksksksss/service/issues/32) | `getCurrentRoutine`, `confirmRoutineDraft`, `getRoutineVersion` | `routine_version.version_no`, `source_type`, `confirmed_at`; `routine.current_stable_version_id` | DB: 확정 버전 불변; API: 과거 실험 기준 버전 복원 |
| `FR-RTN-004` | [#7 현재 문제없이 쓰는 제품·빈도와 기준 정보 저장](https://github.com/sksksksksksss/service/issues/7) | `saveRoutineDraft`, `confirmRoutineDraft` | `routine_item`의 시간대·순서 및 시간대·제품 복합 유일 제약 | DB: 중복 순서·같은 시간대의 같은 제품 거부 |
| `FR-RTN-005` | [#7 현재 문제없이 쓰는 제품·빈도와 기준 정보 저장](https://github.com/sksksksksksss/service/issues/7) | `saveRoutineDraft`, `confirmRoutineDraft` | `routine_version.evidence_strength`, `routine_item.frequency_type`; 날짜 정밀도 | DOMAIN: 사용 시작·최근 변경·모든 빈도 3항목의 입력 수로 수준 계산; E2E: 모름·짧은 사용도 저장 허용 |

## 제품 찾기와 등록

| 요구사항 | 관련 Story | 관련 operationId | 기준 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| `FR-PRD-001` | [#154 제품명·브랜드로 카탈로그 제품 찾기](https://github.com/sksksksksksss/service/issues/154); [#106 버전이 보존되는 제품 카탈로그와 검색 제공](https://github.com/sksksksksksss/service/issues/106) | `searchProducts` | `brand.normalized_name`; `product.status`; `product_version.normalized_name`, `verification_status` | E2E: 브랜드·제품명 검색 후 원래 루틴·후보 선택 흐름으로 복귀 |
| `FR-PRD-002` | [#10 제품 직접 입력과 전성분 사진 등록](https://github.com/sksksksksksss/service/issues/10) | `createPersonalProduct`, `updatePersonalProduct` | `product.owner_user_id`, `source_type`; 개인 `product_version` | API: 소유자만 조회·수정; E2E: 직접 입력 복구 |
| `FR-PRD-003` | [#10 제품 직접 입력과 전성분 사진 등록](https://github.com/sksksksksksss/service/issues/10) | `preparePrivateUpload`, `startIngredientExtraction`, `getAiJob`, `getIngredientExtraction`, `confirmIngredientExtraction`, `deleteUploadAsset` | `upload_asset`; `ai_job`; `ingredient_extraction_item.review_status`, `confirmed_ingredient_id`; 확정 `product_ingredient` | E2E: 업로드→검토·수정→확정; AI-EVAL: 스키마 거부; OPS: 원본 삭제 |
| `FR-PRD-004` | [#49 바코드로 카탈로그 제품 찾기](https://github.com/sksksksksksss/service/issues/49) | `findProductByBarcode` | `product_identifier.type`, `value`, `verification_status`; 최신 `product_version` | E2E: 정확 일치와 미일치 직접 등록 전환; DB: 중복 모호성 자동 선택 금지 |
| `FR-PRD-005` | [#50 구매 내역 이미지에서 제품 후보 등록](https://github.com/sksksksksksss/service/issues/50) | `preparePrivateUpload`, `startPurchaseExtraction`, `getAiJob`, `getPurchaseExtraction`, `confirmPurchaseExtraction`, `deleteUploadAsset` | `upload_asset`; `ai_job`; `purchase_extraction_item.review_status`, 확정 제품·개인 초안 참조 | E2E: 선택한 항목만 등록; AI-EVAL: 주문정보 비수집; OPS: 원본 삭제 |
| `FR-PRD-006` | [#33 제품·성분·기능 데이터 기반](https://github.com/sksksksksksss/service/issues/33); [#10 제품 직접 입력과 전성분 사진 등록](https://github.com/sksksksksksss/service/issues/10) | `searchProducts`, `findProductByBarcode`, `getProductVersion`, `createPersonalProduct`, `updatePersonalProduct`, `startIngredientExtraction`, `getIngredientExtraction`, `confirmIngredientExtraction`, `startPurchaseExtraction`, `getPurchaseExtraction`, `confirmPurchaseExtraction` | `product_version.verification_status`, `source_reference`; `product_ingredient`·`product_function`의 `source_type`, `verification_status` | API: 출처·확인 상태 반환; DB: 확정 버전 수정 금지; UI: 초안과 운영 확인 구분 |

## 제품 추천과 실험 후보

| 요구사항 | 관련 Story | 관련 operationId | 기준 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| `FR-REC-001` | [#8 안정 루틴·사용 목적 기반 제품 추천](https://github.com/sksksksksksss/service/issues/8) | `getMyConcerns`, `replaceMyConcerns`, `createRecommendation` | `app_user.concern_input_state`; `user_concern`; `recommendation_request.goal_function_code`, `change_intent`, `target_routine_item_id` | API: 추가·교체 조건 검증; E2E: 목적과 기준 루틴이 요청에 반영 |
| `FR-REC-002` | [#8 안정 루틴·사용 목적 기반 제품 추천](https://github.com/sksksksksksss/service/issues/8) | `createRecommendation`, `getRecommendation` | `recommendation_pool_item`; `recommendation_candidate.product_version_id`, `rank`; 서버 정책 버전 | DOMAIN: 목적 관련성→불필요한 중복·변수→정보 확인→관련 개인 기록 순서 재현; E2E: 루틴별 결과 차이 |
| `FR-REC-003` | [#8 안정 루틴·사용 목적 기반 제품 추천](https://github.com/sksksksksksss/service/issues/8) | `createRecommendation`, `getRecommendation` | `recommendation_candidate.evidence_snapshot`, `evidence_strength` | DOMAIN: 목적·루틴 관계·관찰 이유 존재; UI: 인기만으로 된 이유 금지 |
| `FR-REC-004` | [#9 추천 제품 또는 관심 제품을 실험 후보로 저장](https://github.com/sksksksksksss/service/issues/9) | `listExperimentCandidates`, `saveExperimentCandidate`, `getExperimentCandidate`, `archiveExperimentCandidate` | `experiment_candidate.source_type`, `change_intent`, `target_routine_item_id`, `status` | E2E: 추천·검색 후보가 같은 목록에 저장되고 출처 복원 |
| `FR-REC-005` | [#8 안정 루틴·사용 목적 기반 제품 추천](https://github.com/sksksksksksss/service/issues/8); [#26 과거 실험 결과와 기록 완성도를 다음 선택에 반영](https://github.com/sksksksksksss/service/issues/26) | `createRecommendation`, `getRecommendation`, `rankExperimentCandidates`, `getPersonalEvidence` | `experiment_result`; 추천·순서의 관련 개인 실험과 기록 완성도 스냅샷 | DOMAIN: 관련성과 완성도를 함께 반영; E2E: 두 번째 추천에서 원본 실험으로 이동 |
| `FR-REC-006` | [#16 추천의 반대 근거·불확실성·부족한 정보 확인](https://github.com/sksksksksksss/service/issues/16) | `createRecommendation`, `getRecommendation`, `rankExperimentCandidates` | `recommendation_candidate.evidence_strength`, `evidence_snapshot`; `candidate_ordering_item.reason_snapshot` | DOMAIN: 지지·반대·부족 정보 동시 보존; AI-EVAL: 단정 표현 거부 |
| `FR-REC-007` | [#8 안정 루틴·사용 목적 기반 제품 추천](https://github.com/sksksksksksss/service/issues/8) | `createRecommendation`, `getRecommendation` | `recommendation_request.ranking_source`, `fallback_reason_code`; 후보 0건 | E2E: 적격 후보 없음 이유와 직접 찾기 경로; DOMAIN: 수 채우기 금지 |

## 루틴 비교와 실험 설계

| 요구사항 | 관련 Story | 관련 operationId | 기준 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| `FR-CMP-001` | [#13 새 제품의 추가·중복·교체 요소 비교](https://github.com/sksksksksksss/service/issues/13) | `compareExperimentCandidate` | `experiment_candidate.change_intent`, `target_routine_item_id`; `candidate_comparison.product_diff` | DOMAIN: 추가·유지·제거 집합과 의도 일치 |
| `FR-CMP-002` | [#13 새 제품의 추가·중복·교체 요소 비교](https://github.com/sksksksksksss/service/issues/13) | `compareExperimentCandidate` | `candidate_comparison.function_diff`, `observation_focus`, `evidence_strength` | DOMAIN: 확인 데이터만 선별; UI: 전체 성분 나열로 대체 금지 |
| `FR-CMP-003` | [#13 새 제품의 추가·중복·교체 요소 비교](https://github.com/sksksksksksss/service/issues/13) | `saveExperimentCandidate`, `getExperimentCandidate`, `compareExperimentCandidate` | `experiment_candidate.routine_version_id`; `candidate_comparison.candidate_id`, `version_no`, `invalidated_at` | DB: 후보별 독립 버전; DOMAIN: 기준 변경 시 이전 결과 무효화 |
| `FR-EXP-001` | [#14 저장한 후보의 다음 실험 우선순위 확인](https://github.com/sksksksksksss/service/issues/14) | `rankExperimentCandidates` | `candidate_ordering`; `candidate_ordering_item.rank`, `reason_snapshot` | DOMAIN: 같은 입력 스냅샷의 순서·근거 복원; E2E: 먼저/나중 이유 표시 |
| `FR-EXP-002` | [#15 한 제품씩 시험하는 사용·관찰 계획 생성](https://github.com/sksksksksksss/service/issues/15) | `createExperimentPlan`, `getCurrentExperiment` | `experiment.user_id`, `status`; 열린 상태 부분 유일 인덱스 | DB: 사용자당 열린 실험 하나; API: 충돌 응답 |
| `FR-EXP-003` | [#15 한 제품씩 시험하는 사용·관찰 계획 생성](https://github.com/sksksksksksss/service/issues/15) | `createExperimentPlan`, `getCurrentExperiment`, `getExperiment`, `updateExperimentPlan` | `experiment.duration_days`, 계획·실제 시작/종료, `time_slot`, `position`; `observation_quest`; `quest_schedule_change` | E2E: 첫 사용 전 수정; DOMAIN: 첫 사용 시 실제 일정 재계산 |
| `FR-EXP-004` | [#15 한 제품씩 시험하는 사용·관찰 계획 생성](https://github.com/sksksksksksss/service/issues/15) | `getExperiment`, `updateExperimentPlan`, `pauseExperiment`, `resumeExperiment`, `cancelExperiment` | `experiment.status`; `experiment_transition.from_status`, `to_status`, `occurred_at` | DOMAIN: 허용 전환만 성공; DB: 현재 상태와 마지막 전환 일치 |
| `FR-EXP-005` | [#28 보류 제품 재시험 계획과 일정 관리](https://github.com/sksksksksksss/service/issues/28) | `createRetrialExperiment` | `experiment.parent_experiment_id`, `retrial_stability_confirmed_at`; 새 후보·비교 | E2E: 안정 확인 후 별도 실험 생성; DB: 원본 덮어쓰기·순환 참조 금지 |

## 관찰 퀘스트

| 요구사항 | 관련 Story | 관련 operationId | 기준 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| `FR-OBS-001` | [#17 필수 관찰과 실제 사용·다른 제품 변경 기록](https://github.com/sksksksksksss/service/issues/17) | `createExperimentPlan`, `updateExperimentPlan`, `resumeExperiment`, `listExperimentQuests`, `answerObservationQuest` | `observation_quest.type`, `due_at`, `required`, `status`; `quest_schedule_change` | DOMAIN: 네 기본 시점과 기간·첫 사용·재개에 따른 재계산 |
| `FR-OBS-002` | [#17 필수 관찰과 실제 사용·다른 제품 변경 기록](https://github.com/sksksksksksss/service/issues/17) | `answerObservationQuest`, `updateObservation` | `observation.condition`, `memo`, `observed_at`, `recorded_at`, `quest_id` | E2E: 선택·메모 저장 후 수정·복원; API: 미래 관찰 거부 |
| `FR-OBS-003` | [#17 필수 관찰과 실제 사용·다른 제품 변경 기록](https://github.com/sksksksksksss/service/issues/17); [#22 피부 불편과 평소와 달랐던 변화 기록](https://github.com/sksksksksksss/service/issues/22) | `createAdHocObservation`, `createExperimentEvent` | `observation.kind`; `experiment_event.type`, `occurred_at`, `product_version_id` | E2E: 예정 밖 변화·중단·재사용 기록; DOMAIN: 종류별 필수값 검증 |
| `FR-OBS-004` | [#22 피부 불편과 평소와 달랐던 변화 기록](https://github.com/sksksksksksss/service/issues/22) | `answerObservationQuest`, `createAdHocObservation`, `updateObservation` | `discomfort_detail.severity`, 불편·영역·생활 변화 코드, `help_needed`, `spreading_or_worsening` | E2E: 불편 선택 때만 추가 질문; DOMAIN: 배타 코드 검증 |
| `FR-OBS-005` | [#18 앱 안에서 관찰 시점 확인](https://github.com/sksksksksksss/service/issues/18) | `updateMyProfile`, `listMyObservationQuests`, `listExperimentQuests`, `skipObservationQuest` | `app_user.timezone`; `observation_quest.due_at`, `status`, `resolved_at` | E2E: 오늘·놓침 구분과 완료 후 제거; DOMAIN: 사용자 시간대 계산 |
| `FR-OBS-006` | [#52 브라우저 알림으로 관찰 시점 안내](https://github.com/sksksksksksss/service/issues/52) | `saveBrowserNotificationSubscription`, `getBrowserNotificationSubscription`, `revokeBrowserNotificationSubscription` | `web_push_subscription`; `notification_delivery.status`, `scheduled_at`, `type` | E2E: 허용·거부·철회; OPS: 만료 구독과 해결된 퀘스트 전송 억제 |
| `FR-OBS-007` | [#17 필수 관찰과 실제 사용·다른 제품 변경 기록](https://github.com/sksksksksksss/service/issues/17); [#22 피부 불편과 평소와 달랐던 변화 기록](https://github.com/sksksksksksss/service/issues/22) | `answerObservationQuest`, `createAdHocObservation`, `updateObservation` | `observation.used_as_planned`, `uses_since_last_check`, `other_product_change_state`; 계획 밖 제품 변경 사건 | E2E: 첫·중간·종료에 실제 사용과 다른 제품 변경 기록; DOMAIN: 변경 시 근거 완성도 하향 |
| `FR-OBS-008` | [#17 필수 관찰과 실제 사용·다른 제품 변경 기록](https://github.com/sksksksksksss/service/issues/17); [#47 완료·취소 실험과 후속 관찰을 Archive에서 확인](https://github.com/sksksksksksss/service/issues/47) | `createAdHocObservation`, `getArchivedExperiment` | `observation.kind = FOLLOW_UP`; 완료 실험 참조 | E2E: 완료 후 불편 기록과 Rescue 연결; DOMAIN: 완료 상태·원본 결과 불변 |

## Rescue와 안전 행동

| 요구사항 | 관련 Story | 관련 operationId | 기준 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| `FR-RSC-001` | [#22 피부 불편과 평소와 달랐던 변화 기록](https://github.com/sksksksksksss/service/issues/22); [#23 마지막 안정 루틴 이후 변경 제품 확인](https://github.com/sksksksksksss/service/issues/23) | `answerObservationQuest`, `createAdHocObservation`, `updateObservation`, `createExperimentEvent`, `getRescueCase` | `rescue_case.trigger_observation_id`, `baseline_routine_version_id`; 실험·계획 밖 변경 이력 | E2E: 불편 기록으로 Rescue 생성; DOMAIN: 기준 버전 이후 변경 복원 |
| `FR-RSC-002` | [#24 변경 사실과 확인 범위 안내](https://github.com/sksksksksksss/service/issues/24) | `getRescueCase` | `rescue_item.classification`, `change_source`, `evidence_snapshot`; `rescue_case.policy_version` | DOMAIN: 최근 변경·함께 변경·기록상 변경 없음·정보 부족 분류 재현; AI가 분류 변경 불가 |
| `FR-RSC-003` | [#24 변경 사실과 확인 범위 안내](https://github.com/sksksksksksss/service/issues/24) | `getRescueCase` | `rescue_item.evidence_snapshot`, `check_order_options`; `rescue_case.explanation_ai_job_id` | E2E: 확인 가능한 사실과 사용자가 고를 확인 순서 표시; AI-EVAL: 원인·중단·유지 확정 문장 거부 |
| `FR-RSC-004` | [#23 마지막 안정 루틴 이후 변경 제품 확인](https://github.com/sksksksksksss/service/issues/23); [#24 변경 사실과 확인 범위 안내](https://github.com/sksksksksksss/service/issues/24) | `createExperimentEvent`, `getRescueCase` | `rescue_case.context_snapshot`, `missing_information`, `evidence_strength`; `experiment_event` | DOMAIN: 동시 변경·생활 변화·누락에 따른 근거 수준 하향; UI: 사실과 부족 정보 분리 |
| `FR-RSC-005` | [#22 피부 불편과 평소와 달랐던 변화 기록](https://github.com/sksksksksksss/service/issues/22); [#24 변경 사실과 확인 범위 안내](https://github.com/sksksksksksss/service/issues/24) | `createAdHocObservation`, `getRescueCase` | `discomfort_detail.severity`, `help_needed`, `spreading_or_worsening`; `rescue_case.safety_priority` | DOMAIN: 안전 우선 조건; E2E: 일반 제품 행동 제안 없이 중단·전문가 확인을 먼저 표시하고 동의 후 변경 이력만 제공 |

## 실험 결과와 Beauty Archive

| 요구사항 | 관련 Story | 관련 operationId | 기준 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| `FR-ARC-001` | [#25 세 결과 저장과 안정 루틴 선택적 갱신](https://github.com/sksksksksksss/service/issues/25) | `completeExperiment` | `experiment_result.discomfort_outcome`, `goal_outcome`, `next_use_decision`, `baseline_routine_use_state`, `record_completeness`, `completed_at` | DOMAIN: 계획 대비 기간·관찰·횟수·다른 변경으로 기록 수준 재현; E2E: 세 결과와 Rescue 후 기존 루틴 사용 상태 확정 |
| `FR-ARC-002` | [#25 세 결과 저장과 안정 루틴 선택적 갱신](https://github.com/sksksksksksss/service/issues/25) | `completeExperiment` | `experiment_result.next_use_decision`, `resulting_routine_version_id`; `routine.current_stable_version_id` | E2E: `PROMOTE_TO_STABLE` 명시 선택 때만 승격; DB: 결과와 새 확정 버전 원자 저장 |
| `FR-ARC-003` | [#47 완료·취소 실험과 후속 관찰을 Archive에서 확인](https://github.com/sksksksksksss/service/issues/47); [#28 보류 제품 재시험 계획과 일정 관리](https://github.com/sksksksksksss/service/issues/28) | `cancelExperiment`, `createRetrialExperiment`, `listArchivedExperiments`, `getArchivedExperiment` | `experiment`과 결과·전환·기준 루틴·제품의 연결 이력; 별도 Archive 복제 없음 | E2E: 완료 결과(보류 포함)·취소 이력과 당시 상세 복원, 현재 PAUSED 제외 |
| `FR-ARC-004` | [#26 과거 실험 결과와 기록 완성도를 다음 선택에 반영](https://github.com/sksksksksksss/service/issues/26) | `compareExperimentCandidate`, `getArchivedExperiment`, `getPersonalEvidence` | 비교·추천·순서 근거 스냅샷의 과거 `experiment_result` 참조 | E2E: 반영 이유에서 원본 실험 이동; DOMAIN: 관련 기록만 선택 |
| `FR-ARC-005` | [#27 누적 기록에서 개인 반복 관찰 확인](https://github.com/sksksksksksss/service/issues/27) | `getPersonalEvidence`, `listRepeatedObservations` | 완료 `experiment_result`의 불편·목적 방향, 기록 완성도와 제품 버전 요소 집계; 반대 사례 | DOMAIN: 같은 요소·방향 2회 미만 반복 관찰 표시 금지; UI: 횟수·반례·완성도와 비인과 문구 표시 |
| `FR-ARC-006` | [#29 제품 사용 이력과 안정 루틴 변화 시각화](https://github.com/sksksksksksss/service/issues/29) | `getUsageTimeline` | `routine_version`, `routine_item`; `experiment_transition`, `experiment_result` | E2E: 시간순 변화에서 원본 실험·결과 이동 |

## LAB 게임 경험

| 요구사항 | 관련 Story | 관련 operationId | 기준 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| `FR-LAB-001` | [#19 실험 완료와 관찰 완성도·진행 보상](https://github.com/sksksksksksss/service/issues/19) | `getCurrentExperiment`, `getExperiment`, `listExperimentQuests`, `answerObservationQuest`, `skipObservationQuest`, `getMyLab` | `observation_quest.required`, `status`; 최종 결과 존재 여부 | DOMAIN: 관찰 완성도와 실험 완료를 별도 계산; UI: 완료·건너뜀·남은 수와 결과 확정 여부 표시 |
| `FR-LAB-002` | [#20 실험 완료 기록을 연구실에 추가](https://github.com/sksksksksksss/service/issues/20) | `completeExperiment`, `getMyLab` | `lab_record.experiment_id`, `earned_at`, `display_asset_code`; `experiment_result` | DB: 완료 실험당 연구 기록 하나; E2E: 원본 실험 이동 |
| `FR-LAB-003` | [#19 실험 완료와 관찰 완성도·진행 보상](https://github.com/sksksksksksss/service/issues/19); [#20 실험 완료 기록을 연구실에 추가](https://github.com/sksksksksksss/service/issues/20) | `completeExperiment`, `getMyLab`, `listLabRewards` | 필수 `observation_quest`, `experiment_result`, `lab_record`; 로그인 보상 데이터 없음 | DOMAIN: 유효 관찰·완료만 반영; E2E: 접속만으로 변화 없음 |
| `FR-LAB-004` | [#21 조건 달성으로 배지와 연구실 장식 해금](https://github.com/sksksksksksss/service/issues/21); [#51 캐릭터와 연구실 테마 선택](https://github.com/sksksksksksss/service/issues/51) | `getLabProfile`, `updateLabProfile`, `listLabRewards` | `badge_definition`; `user_badge.evidence_snapshot`; `lab_item_definition`; `user_lab_item`; `lab_profile` | DOMAIN: 버전 있는 조건과 중복 없는 해금; UI: 잠금·획득 근거 표시 |

## 비기능 요구사항

| 요구사항 | 관련 Story | 적용 계약 | 기준 데이터·설정 | 주 검증 |
| --- | --- | --- | --- | --- |
| `NFR-SAF-001` | [#24 변경 사실과 확인 범위 안내](https://github.com/sksksksksksss/service/issues/24); [#34 공통 API·오류 처리·데이터 규칙](https://github.com/sksksksksksss/service/issues/34) | `createRecommendation`, `rankExperimentCandidates`, `createAdHocObservation`, `getRescueCase` | 금지 표현 정책; 추천·순서·Rescue의 검증된 근거 스냅샷 | AI-EVAL: 진단·적합 보장·제품 행동 확정 표현 거부; UI: 안전 문구 우선순위 |
| `NFR-SAF-002` | [#34 공통 API·오류 처리·데이터 규칙](https://github.com/sksksksksksss/service/issues/34); [#48 핵심 흐름의 접근성·빈 상태·오류 복구](https://github.com/sksksksksksss/service/issues/48) | `createRecommendation`, `getRescueCase` | `recommendation_request.ranking_source`, `fallback_reason_code`; `ai_job.status`, `error_code`; 고정 규칙 결과 | DOMAIN: AI 실패 fallback; E2E: 재시도·고정 결과 경로 |
| `NFR-SEC-001` | [#32 사용자별 루틴·실험 기록 저장 기반](https://github.com/sksksksksksss/service/issues/32); [#45 이메일로 로그인하고 내 기록 불러오기](https://github.com/sksksksksksss/service/issues/45) | API 공통: `bearerAuth`가 적용된 개인 operation 전체 | `app_user.write_locked_at`; 개인 aggregate의 `user_id`; 데이터 사전의 같은 사용자 제약 | API: 미인증·만료 JWT·삭제 잠금·교차 사용자 요청 거부 |
| `NFR-SEC-002` | [#31 Spring Boot·React 모노레포 구성](https://github.com/sksksksksksss/service/issues/31); [#36 테스트·CI/CD·실서비스 배포](https://github.com/sksksksksksss/service/issues/36) | 운영 전용: 빌드·배포·AI/OCI 연동 | 서버 환경 변수와 GitHub·OCI 비밀 저장소; 클라이언트 공개 설정 분리 | OPS: 저장소·번들·로그 비밀 문자열 검사와 키 권한 점검 |
| `NFR-PRV-001` | [#34 공통 API·오류 처리·데이터 규칙](https://github.com/sksksksksksss/service/issues/34); [#37 운영 로그·모니터링·데이터 관리](https://github.com/sksksksksksss/service/issues/37) | `startIngredientExtraction`, `startPurchaseExtraction`, `answerObservationQuest`, `createAdHocObservation`, `createRecommendation` | `ai_job.input_fingerprint`, 검증된 최소 `structured_output`; 공급자 payload 구성·애플리케이션 로그 | API: 작업별 목적·범위 확인과 AI 미사용 경로; OPS: 식별자·원문 로그 부재; AI-EVAL: 최소 payload |
| `NFR-PRV-002` | [#10 제품 직접 입력과 전성분 사진 등록](https://github.com/sksksksksksss/service/issues/10); [#50 구매 내역 이미지에서 제품 후보 등록](https://github.com/sksksksksksss/service/issues/50); [#37 운영 로그·모니터링·데이터 관리](https://github.com/sksksksksksss/service/issues/37) | `preparePrivateUpload`, `deleteUploadAsset`, `confirmIngredientExtraction`, `confirmPurchaseExtraction` | `upload_asset.status`, `delete_after`, `delete_requested_at`, `deleted_at`; 비공개 OCI 객체 | OPS: 확정 즉시 삭제와 7일 만료 작업; API: 타 사용자 파일 접근 거부 |
| `NFR-PRV-003` | [#46 계정과 SkinCause 기록 삭제](https://github.com/sksksksksksss/service/issues/46) | `deleteMyAccount` | `privacy_deletion_job`; 개인 도메인·객체 삭제 순서; 공급자 백업 보존 설정 | E2E: 삭제 후 접근 불가; OPS: 운영 데이터 즉시 삭제와 백업 최대 30일 확인 |
| `NFR-AI-001` | [#34 공통 API·오류 처리·데이터 규칙](https://github.com/sksksksksksss/service/issues/34); [#37 운영 로그·모니터링·데이터 관리](https://github.com/sksksksksksss/service/issues/37) | `startIngredientExtraction`, `startPurchaseExtraction`, `getAiJob`; AI 작업 공통 추적 규칙 | `ai_job.task_type`, `model`, `prompt_version`, `schema_version`, `status`, 시각 필드; 원문·숨겨진 추론 없음 | API: 작업 메타데이터 조회; OPS: 금지 원문 부재·성공/실패 추적 |
| `NFR-AI-002` | [#34 공통 API·오류 처리·데이터 규칙](https://github.com/sksksksksksss/service/issues/34) | `startIngredientExtraction`, `getAiJob`, `getIngredientExtraction`, `confirmIngredientExtraction`, `startPurchaseExtraction`, `getPurchaseExtraction`, `createRecommendation`, `rankExperimentCandidates` | `ai_job.structured_output`, `status`, `schema_version`; 각 도메인의 허용 ID·코드와 서버 계산 결과 | AI-EVAL: JSON Schema·허용 참조 위반 저장 거부, AI 출력으로 순위·분류·상태 변경 불가 |
| `NFR-REL-001` | [#34 공통 API·오류 처리·데이터 규칙](https://github.com/sksksksksksss/service/issues/34); [#48 핵심 흐름의 접근성·빈 상태·오류 복구](https://github.com/sksksksksksss/service/issues/48) | `saveRoutineDraft`, `findProductByBarcode`, `createPersonalProduct`, `updatePersonalProduct`, `preparePrivateUpload`, `startIngredientExtraction`, `getAiJob`, `startPurchaseExtraction` | 저장 중인 도메인 초안; `ai_job.status`, `error_code`; 멱등 키 | E2E: 네트워크·AI 실패 후 입력 복구, 재시도와 직접 입력 전환 |
| `NFR-PERF-001` | [#36 테스트·CI/CD·실서비스 배포](https://github.com/sksksksksksss/service/issues/36); [#37 운영 로그·모니터링·데이터 관리](https://github.com/sksksksksksss/service/issues/37) | API 공통: AI 대기 시간을 제외한 핵심 operation | MVP 기준 시드 데이터와 부하 점검 설정; 도메인 저장 없음 | OPS: 동시 사용자 20명에서 핵심 API p95 2초 이하 회귀 점검 |
| `NFR-PERF-002` | [#34 공통 API·오류 처리·데이터 규칙](https://github.com/sksksksksksss/service/issues/34); [#48 핵심 흐름의 접근성·빈 상태·오류 복구](https://github.com/sksksksksksss/service/issues/48) | `startIngredientExtraction`, `startPurchaseExtraction`, `getAiJob`; 다른 비동기 AI 작업 동일 규칙 | `ai_job.status`, `requested_at`, `started_at`, `completed_at`, `error_code` | E2E: 즉시 진행 표시와 30초 후 취소·재시도·직접 입력; OPS: 지연시간 점검 |
| `NFR-ACC-001` | [#48 핵심 흐름의 접근성·빈 상태·오류 복구](https://github.com/sksksksksksss/service/issues/48) | UI 전용: 핵심 사용자 흐름 | 접근 가능한 이름·포커스 순서·명암 디자인 토큰; 도메인 저장 없음 | UI: 키보드 E2E, 자동 접근성 검사와 WCAG AA 명암 점검 |
| `NFR-COMP-001` | [#48 핵심 흐름의 접근성·빈 상태·오류 복구](https://github.com/sksksksksksss/service/issues/48) | UI·배포 전용: 핵심 사용자 흐름 | 브라우저·viewport 테스트 행렬; 도메인 저장 없음 | E2E: 최신 두 주요 Chrome·Safari와 360px 화면 핵심 흐름 |
| `NFR-OBS-001` | [#35 핵심 MVP 지표 계산](https://github.com/sksksksksksss/service/issues/35) | 도메인·운영 전용: 저장된 사실에서 지표 계산 | `routine_version`; `recommendation_request`; `experiment`·전환; `observation_quest`·관찰; `rescue_case`; `experiment_result` | DOMAIN: 지표 정의별 기준 행 집계; OPS: 시드 흐름의 시작·관찰·완료·재시작 수치 대조 |
| `NFR-OPS-001` | [#36 테스트·CI/CD·실서비스 배포](https://github.com/sksksksksksss/service/issues/36) | 운영 전용: `main` 검사·배포·rollback | GitHub Actions, Vercel, OCI 배포 버전과 이전 정상 artifact; 도메인 저장 없음 | OPS: 합의 검사 후 실제 URL smoke test와 이전 버전 복구 리허설 |

## 변경과 Ready 규칙

1. 요구사항을 추가·삭제하거나 우선순위를 바꾸면 같은 변경에서 이 표와 요구사항 명세를 함께 수정한다.
2. GitHub Story·Task를 분리하거나 합치면 링크를 고치고, OpenAPI의 `x-requirements`와 `x-github-issue`도 함께 확인한다.
3. API의 입력·출력·오류가 바뀌면 OpenAPI를 먼저 고치고, 저장 규칙이 바뀌면 데이터 사전과 ERD를 함께 고친다.
4. 한 행에 기능명세, 실행 계약, 기준 데이터·설정, 검증 방법 중 설명 없이 빈 항목이 있으면 개발 준비가 끝난 것으로 보지 않는다.
5. Sub-task는 이 계약을 구현 가능한 작업으로 나누되 클래스·패키지·내부 함수 구조를 미리 고정하지 않는다.
