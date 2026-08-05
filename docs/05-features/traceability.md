# 요구사항 추적표

| 기능 | 요구사항 | 주요 API | 주요 데이터 |
| --- | --- | --- | --- |
| F-01 계정·개인화 | ACC, ONB, MEM | `/auth/*`, `/me`, `/me/ai-memories` | user, ai_memory |
| F-02 카탈로그·내 화장품 | CAT, PRD | `/products`, `/receipts`, `/me/products` | product, product_version, user_product, receipt |
| F-03 제품 의견·추천 | OPN, REC | `/product-opinions`, `/recommendations`, `/conversations`, `/wishlist` | analysis, conversation, wishlist_item |
| F-04 루틴·AI 배치 | RTN | `/me/routines`, `/routine-order-proposals` | routine_version, routine_item, analysis, ai_job |
| F-05 7일 결과 | OBS | `/me/routines/{routineId}/assessment` | routine_assessment round, stable_routine_pointer, notification |
| F-06 AI Rescue | RSC | `/rescues`, `/rescues/{id}/messages`, `/rescues/{id}/apply` | rescue_case, rescue_message, rescue_plan |
| F-07 기록·홈·알림 | HIS, NOT | `/me/home`, `/me/routines/history`, `/me/routines/compare`, `/notifications` | routine_version, routine_assessment, notification |
| F-08 AI 작업 | AI, SEC, OPS | `/ai-jobs/{id}`, 각 비동기 생성 API | ai_job, analysis, evidence_source |

세부 operation과 schema는 [OpenAPI](../api/openapi.yaml), 컬럼과 제약은 [데이터 모델](../06-data-model/README.md)을 기준으로 한다.
