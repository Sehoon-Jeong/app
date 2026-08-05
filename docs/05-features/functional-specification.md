# 통합 기능명세서

| 기능 ID | 기능 | 사용자가 얻는 결과 | 상세 |
| --- | --- | --- | --- |
| F-01 | 계정·온보딩·AI 기억 | 얇은 개인화 맥락을 만들고 직접 통제한다. | [보기](./functional-specs/F-01-account-personalization.md) |
| F-02 | 카탈로그·내 화장품 | 정확한 제품 버전을 찾아 미사용 제품으로 보관한다. | [보기](./functional-specs/F-02-catalog-products.md) |
| F-03 | 제품 의견·추천 | 한 제품의 구매 가치나 다음 후보를 개인 맥락으로 비교한다. | [보기](./functional-specs/F-03-opinion-recommendation.md) |
| F-04 | 루틴·AI 배치 | 제품·순서·시간대·빈도를 버전으로 저장하고 AI 제안을 받는다. | [보기](./functional-specs/F-04-routine.md) |
| F-05 | 7일 결과 | 문제없었던 루틴도 개인 근거로 남긴다. | [보기](./functional-specs/F-05-seven-day-result.md) |
| F-06 | AI Rescue | 불편의 확인 순위와 다음 루틴을 대화로 정한다. | [보기](./functional-specs/F-06-rescue.md) |
| F-07 | 기록·알림 | 루틴 변화와 결과를 다시 보고 해야 할 일을 놓치지 않는다. | [보기](./functional-specs/F-07-history-notifications.md) |
| F-08 | AI 조사·비동기 작업 | 검색 근거, 검증, 실패와 재시도를 일관되게 다룬다. | [보기](./functional-specs/F-08-ai-jobs.md) |

## 공통 완료 기준

- 다른 사용자의 리소스는 같은 ID를 알아도 조회·변경할 수 없다.
- 빈 상태, 정보 부족, AI 실패, 네트워크 재시도와 중복 제출을 처리한다.
- 사용자가 저장한 사실과 AI 해석을 화면과 응답에서 구분한다.
- AI 주장은 출처 또는 개인 기록 참조를 가지며 불확실성을 숨기지 않는다.
- 변경된 요구사항 ID, OpenAPI operation, 테이블과 테스트가 PR에서 추적된다.
