# 요구사항 추적표

| 우선순위 | 기능 | 요구사항 | 주요 API | 주요 데이터 |
| --- | --- | --- | --- | --- |
| P0 | F-01 계정 경계 | ACC, SEC | `/auth/*`, `/me` | app_user, idempotency_record |
| P0 | F-02 최소 제품 등록 | PRD-01, CAT-03 | `/products`, `/me/products` | product, product_version, user_product |
| P0 | F-03 최소 제품 의견 | OPN-01~03, OPN-06 | `/product-opinions` | analysis_request, analysis_run, user_product |
| P0 | F-04 직접 루틴 | RTN-01~04 | `/me/routines` | routine_version, routine_item, routine_assessment_schedule |
| P0 | F-05 7일 핵심 결과 | OBS-01~05, OBS-07 | `/me/routines/{routineId}/assessment` | routine_assessment_schedule, routine_assessment, stable_routine_period |
| P0 | F-06 AI Rescue | RSC-01~08, RSC-12~13 | `/rescues`, `/rescues/{id}/messages`, `/rescues/{id}/apply` | rescue_case, rescue_message, rescue_safety_event, rescue_plan, rescue_change |
| P0 | F-07 현재·안정 비교 | HIS-02 | `/me/home`, `/me/routines/compare` | routine_version, stable_routine_period |
| P0 | F-08 AI·보안 경계 | AI-01~02, AI-04, OPS, SEC | 각 P0 API | analysis_request, analysis_run, idempotency_record |
| P1 | 순환 강화 | CAT-01~05, PRD-04~06, OPN-04, RTN-05~08, OBS-06·08, RSC-09~11, HIS, NOT, AI-03·05 | 상세 명세 참조 | evidence_snapshot, ai_job, notification |
| P2 | 탐색·입력 편의 | ONB, MEM, PRD-02~03, REC, OPN-05, CAT-06 | `/recommendations`, `/receipts`, `/me/ai-memories`, `/wishlist` | ai_memory, receipt, wishlist_item |

세부 operation과 schema는 [OpenAPI](../api/openapi.yaml), 컬럼과 제약은 [데이터 모델](../06-data-model/README.md)을 기준으로 한다.
