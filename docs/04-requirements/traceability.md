# 요구사항 추적표

| 우선순위 | Feature | 요구사항 | 주요 API | 주요 데이터 |
| --- | --- | --- | --- | --- |
| P0 | [#157 계정·데이터 경계](https://github.com/sksksksksksss/skn-app/issues/157) | ACC, SEC | `/auth/*`, `/me` | app_user, idempotency_record |
| P0 | [#158 카탈로그·내 화장품](https://github.com/sksksksksksss/skn-app/issues/158) | PRD-01~03, CAT-01 | `/products`, `/me/products` | product, product_version, user_product |
| P0 | [#159 AI 제품 탐색](https://github.com/sksksksksksss/skn-app/issues/159) | EXP-01~06 | `/explorations`, `/ai-conversations` | analysis_request, conversation, analysis_evidence |
| P0 | [#160 루틴·사용 맥락](https://github.com/sksksksksksss/skn-app/issues/160) | RTN-01~05 | `/me/routines` | routine_version, routine_item, experience_review_schedule |
| P0 | [#161 경험 기록·회고](https://github.com/sksksksksksss/skn-app/issues/161) | REC-01~08 | `/me/experiences` | experience_record, experience_observation, comparison_baseline_period |
| P0 | [#162 AI Rescue](https://github.com/sksksksksksss/skn-app/issues/162) | RSC-01~08 | `/rescues`, `/rescues/{id}/messages`, `/rescues/{id}/apply` | rescue_case, rescue_message, rescue_plan, rescue_change |
| P0 | [#163 홈·기록·패턴](https://github.com/sksksksksksss/skn-app/issues/163) | HOME, HIS, PAT | `/me/home`, `/me/experiences`, `/me/patterns` | experience_record, personal_pattern, pattern_evidence |
| P0 | [#164 AI·보안·운영](https://github.com/sksksksksksss/skn-app/issues/164) | AI, OPS, SEC | 모든 P0 API | analysis_request, analysis_run, idempotency_record |
| P1 | 경험 순환 강화 | CAT-02~03, PRD-04, EXP-07, RTN-06~07, REC-09, RSC-09~10, HIS-02, PAT-05, AI-05~06 | Feature 참조 | evidence_snapshot, ai_job, notification |
| P2 | 입력·구매 편의 | ONB, MEM, PRD-05, CAT-04, EXP-08 | `/receipts`, `/wishlist` | ai_memory, receipt, wishlist_item |

세부 operation과 schema는 [OpenAPI](../api/openapi.yaml), 컬럼과 제약은 [데이터 모델](../06-data-model/README.md)을 따른다.
