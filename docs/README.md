# 문서 안내

처음 보는 사람도 아래 문서만 순서대로 읽으면 제품과 구현 범위를 알 수 있다.

| 순서 | 문서 | 내용 |
| --- | --- | --- |
| 0 | [제품 브리프](./01-product-brief.md) | 누구의 어떤 문제를 풀고 무엇을 검증하는가 |
| 1 | [요구사항](./04-requirements/README.md) | 기능별 사용자·시스템 의무와 제품 근거 |
| 2 | [협업과 구현 흐름](./02-collaboration-workflow.md) | AI 통합 초안, 영역 책임 개발과 디자인 반영 절차 |
| 3 | [구현 우선순위와 태스크](./03-delivery-plan.md) | P0·P1·P2와 실제 GitHub Task |
| 4 | [GitHub Feature](https://github.com/orgs/sksksksksksss/projects/2) | 각 흐름의 입력, 분기, 결과와 예외의 원본 |
| 5 | [OpenAPI](./api/openapi.yaml) | 프론트엔드와 서버 사이의 계약 |
| 6 | [데이터 모델](./06-data-model/README.md) | 무엇을 어떤 관계로 저장하는가 |

## 보조 문서

- [제품 규칙과 AI 경계](./product/product-rules.md)
- [결정한 질문과 답변](./product/prototype-product-definition.md)
- [근거와 가정](./evidence/README.md)
- [요구사항 추적표](./04-requirements/traceability.md)

## 문서가 충돌할 때

사용자가 실제로 보는 흐름은 [프로토타입](https://sksksksksksss.github.io/service/prototype/)을 우선한다. 제품 의미는 제품 브리프와 요구사항, 처리 규칙은 GitHub Feature 이슈, 필드는 OpenAPI, 저장 방식은 데이터 모델을 따른다. 충돌을 발견하면 Feature 이슈에 결정 기록을 남기고 관련 계약을 함께 수정한다.
