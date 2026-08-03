# 요구사항 추적표

## 목적

이 표는 요구사항이 문서에만 남거나, 구현 이슈가 제품 목적과 분리되는 것을 막는다. 한 행에는 기능명세, GitHub 이슈, 원본 데이터와 주 검증 방법이 모두 있어야 한다.

검증 표기:

- `E2E`: 배포 환경의 사용자 흐름
- `API`: 서버 통합·권한·계약 테스트
- `DOMAIN`: 일반 규칙 단위 테스트
- `DB`: 마이그레이션·제약조건 테스트
- `AI-EVAL`: 고정 입력을 이용한 모델·스키마 평가
- `UI`: 컴포넌트·접근성·반응형 테스트
- `OPS`: 배포·모니터링·삭제 작업 점검

## 계정·루틴·제품

| 요구사항 | 기능명세 | 이슈 | 원본 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| FR-AUTH-001 | 루틴·추천 §1 | #45 | app_user | E2E, API |
| FR-AUTH-002 | 루틴·추천 §1, 공통 §1 | #45, #32 | app_user와 모든 user FK | API |
| FR-AUTH-003 | 공통 §1 | #46 | privacy_deletion_job, 개인 도메인 전체 | E2E, OPS |
| FR-RTN-001 | 루틴·추천 §2 | #7 | routine, routine_version, routine_item | E2E, API |
| FR-RTN-002 | 루틴·추천 §2 | #7 | routine_version.confirmed_by_user_at | E2E, DOMAIN |
| FR-RTN-003 | 루틴·추천 §2 | #7, #32 | routine.current_stable_version_id | DB, API |
| FR-RTN-004 | 루틴·추천 §2 | #7 | routine_item | DB |
| FR-PRD-001 | 루틴·추천 §3 | #7, #9, #33 | brand, product, product_version | E2E, API |
| FR-PRD-002 | 루틴·추천 §3 | #10 | product.owner_user_id, product_version | E2E, API |
| FR-PRD-003 | 루틴·추천 §3 | #10 | upload_asset, ai_job, ingredient_extraction_item | E2E, AI-EVAL |
| FR-PRD-004 | 루틴·추천 §3 | #49 | product_identifier | E2E, API |
| FR-PRD-005 | 루틴·추천 §3 | #50 | upload_asset, ai_job, purchase_extraction_item | E2E, AI-EVAL |
| FR-PRD-006 | 루틴·추천 §3, 공통 §4 | #33 | product_version, product_ingredient, product_function | API, DB |

## 추천·비교·실험

| 요구사항 | 기능명세 | 이슈 | 원본 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| FR-REC-001 | 루틴·추천 §4 | #8 | recommendation_request | E2E, API |
| FR-REC-002 | 루틴·추천 §5 | #8 | recommendation_candidate | DOMAIN, E2E |
| FR-REC-003 | 루틴·추천 §5 | #8 | recommendation_candidate.evidence_snapshot | DOMAIN, UI |
| FR-REC-004 | 루틴·추천 §6 | #9 | experiment_candidate | E2E, API |
| FR-REC-005 | 루틴·추천 §5, Rescue·Archive §6 | #8, #26 | experiment_result, evidence_snapshot | DOMAIN, E2E |
| FR-REC-006 | 비교·계획 §4 | #16 | evidence_snapshot, ai_job | DOMAIN, AI-EVAL |
| FR-REC-007 | 루틴·추천 §5 | #8 | recommendation_request.status | E2E, UI |
| FR-CMP-001 | 비교·계획 §2 | #13 | candidate_comparison.product_diff | DOMAIN, E2E |
| FR-CMP-002 | 비교·계획 §2 | #13 | function_diff, observation_focus | DOMAIN, UI |
| FR-CMP-003 | 비교·계획 §2 | #13 | candidate_id, routine_version_id | DOMAIN, DB |
| FR-EXP-001 | 비교·계획 §3 | #14 | recommendation_candidate.rank, comparison | DOMAIN, E2E |
| FR-EXP-002 | 비교·계획 §5 | #15 | experiment.status | DB, API |
| FR-EXP-003 | 비교·계획 §5 | #15 | experiment, observation_quest | E2E, DOMAIN |
| FR-EXP-004 | 비교·계획 §5 | #15 | experiment_transition, experiment_event | DOMAIN, API |
| FR-EXP-005 | 비교·계획 §5, Rescue·Archive §8 | #28 | experiment.parent_experiment_id | E2E, DB |

## 관찰·Rescue·Archive·LAB

| 요구사항 | 기능명세 | 이슈 | 원본 데이터 | 주 검증 |
| --- | --- | --- | --- | --- |
| FR-OBS-001 | 관찰·LAB §1 | #17 | observation_quest | DOMAIN, DB |
| FR-OBS-002 | 관찰·LAB §2 | #17 | observation | E2E, API |
| FR-OBS-003 | 관찰·LAB §1~2 | #17, #22 | observation, experiment_event | E2E, API |
| FR-OBS-004 | 관찰·LAB §2 | #22 | discomfort_detail | E2E, UI |
| FR-OBS-005 | 관찰·LAB §3 | #18 | observation_quest.status | E2E, UI |
| FR-OBS-006 | 관찰·LAB §3 | #52 | web_push_subscription, notification_delivery | E2E, OPS |
| FR-RSC-001 | Rescue·Archive §1~2 | #22, #23 | rescue_case | E2E, DOMAIN |
| FR-RSC-002 | Rescue·Archive §3 | #24 | rescue_item.classification | DOMAIN |
| FR-RSC-003 | Rescue·Archive §3 | #24 | rescue_item, ai_job | E2E, AI-EVAL |
| FR-RSC-004 | Rescue·Archive §2~3 | #23, #24 | missing_information, context codes | DOMAIN, UI |
| FR-RSC-005 | Rescue·Archive §1 | #22, #24 | discomfort_detail, rescue_case.safety_priority | DOMAIN, E2E |
| FR-ARC-001 | Rescue·Archive §4 | #25 | experiment_result | E2E, DB |
| FR-ARC-002 | Rescue·Archive §4 | #25 | resulting_routine_version_id | E2E, DB |
| FR-ARC-003 | Rescue·Archive §5 | #47 | experiment과 연결 이력 | E2E, API |
| FR-ARC-004 | Rescue·Archive §6 | #26 | evidence_snapshot의 experiment 참조 | E2E, DOMAIN |
| FR-ARC-005 | Rescue·Archive §7 | #27 | 완료 실험 집계 view | DOMAIN, UI |
| FR-ARC-006 | Rescue·Archive §8 | #29 | routine_version, experiment_transition | E2E, UI |
| FR-LAB-001 | 관찰·LAB §4 | #19 | observation_quest | DOMAIN, UI |
| FR-LAB-002 | 관찰·LAB §5 | #20 | lab_record | DB, E2E |
| FR-LAB-003 | 관찰·LAB §5 | #19, #20 | lab_record, quest 상태 | DOMAIN |
| FR-LAB-004 | 관찰·LAB §5 | #21, #51 | badge_definition, user_badge, lab_profile | DOMAIN, UI |

## 비기능 요구사항

| 요구사항 | 기능명세 | 이슈 | 적용 대상 | 주 검증 |
| --- | --- | --- | --- | --- |
| NFR-SAF-001 | 공통 §3, Rescue §1·3 | #24, #34 | 사용자 문구와 AI 설명 | AI-EVAL, UI |
| NFR-SAF-002 | 공통 §3·7 | #34, #48 | AI fallback | E2E, AI-EVAL |
| NFR-SEC-001 | 공통 §1 | #32, #45 | 모든 개인 API | API |
| NFR-SEC-002 | 공통 §5 | #31, #36 | 빌드·배포 비밀값 | OPS |
| NFR-PRV-001 | 공통 §5~6 | #35, #37 | Sentry, PostHog | OPS |
| NFR-PRV-002 | 루틴·추천 §3, 공통 §5 | #10, #37 | upload_asset | OPS, DB |
| NFR-PRV-003 | 공통 §1 | #46 | privacy_deletion_job | E2E, OPS |
| NFR-AI-001 | 공통 §3 | #34, #37 | ai_job | API, OPS |
| NFR-AI-002 | 공통 §3 | #34 | AiGateway | API, AI-EVAL |
| NFR-REL-001 | 공통 §2·7 | #34, #48 | 모든 입력·AI 작업 | E2E, UI |
| NFR-PERF-001 | 공통 §8 | #36, #37 | 핵심 API | OPS |
| NFR-PERF-002 | 공통 §3 | #34, #48 | AI 작업 화면 | E2E, OPS |
| NFR-ACC-001 | 공통 §7 | #48 | 핵심 화면 | UI |
| NFR-COMP-001 | 공통 §7 | #48 | Chrome·Safari·360px | E2E, UI |
| NFR-OBS-001 | 공통 §6 | #35 | 핵심 퍼널 이벤트 | API, OPS |
| NFR-OPS-001 | 공통 §8 | #36 | main 배포 | OPS |

## 추적표 변경 규칙

- 요구사항을 추가하면 같은 PR에서 이 표의 행을 추가한다.
- Story를 분리·병합하면 연결 이슈를 바꾼다. 요구사항 ID는 의미가 바뀌지 않는 한 유지한다.
- 엔터티 이름이 바뀌면 데이터 사전과 이 표를 함께 바꾼다.
- P0·P1 행에 기능명세, 이슈, 원본 데이터 또는 검증 중 하나가 없으면 Ready로 보지 않는다.
