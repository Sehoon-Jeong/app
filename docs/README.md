# 문서 안내

처음 보는 사람도 아래 다섯 문서만 순서대로 읽으면 제품과 구현 범위를 알 수 있다.

| 순서 | 문서 | 내용 |
| --- | --- | --- |
| 0 | [제품 설명](./01-product-brief.md) | 왜 만들며 무엇을 검증하는가 |
| 1 | [요구사항](./04-requirements.md) | 사용자가 할 수 있어야 하는 일과 제품 근거 |
| 2 | [기능 명세](./05-features/functional-specification.md) | 각 흐름의 입력, 분기, 결과와 예외 |
| 3 | [OpenAPI](./api/openapi.yaml) | 프론트엔드와 서버 사이의 계약 |
| 4 | [데이터 모델](./06-data-model/README.md) | 무엇을 어떤 관계로 저장하는가 |

## 보조 문서

- [제품 규칙과 AI 경계](./product/product-rules.md)
- [결정한 질문과 답변](./product/prototype-product-definition.md)
- [근거와 가정](./evidence/README.md)
- [요구사항 추적표](./05-features/traceability.md)

## 문서가 충돌할 때

사용자가 실제로 보는 흐름은 [프로토타입](https://sksksksksksss.github.io/service/prototype/)을 우선한다. 제품 의미는 제품 설명과 요구사항, 처리 규칙은 기능 명세, 필드는 OpenAPI, 저장 방식은 데이터 모델을 따른다. 충돌을 발견하면 한 문서만 고치지 말고 관련 문서를 같은 PR에서 함께 수정한다.
