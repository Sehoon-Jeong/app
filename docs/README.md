# SkinCause 문서 안내

이 저장소가 제품·기술·일정의 기준점이다. Notion이나 메신저에는 원본을 복사하지 않고 이곳의 링크를 공유한다.

멘토링을 위해 처음 방문했다면 [기술 멘토링 안내](./mentor-review.md)부터 읽는다.
AI와 구현 작업을 시작할 때는 루트의 [작업 안내](../AGENTS.md)에서 읽는 순서와 변경 원칙을 먼저 확인한다.

## 제품을 이해할 때

| 순서 | 문서 | 답하는 질문 |
| --- | --- | --- |
| 1 | [제품 소개](./01-product-brief.md) | 누구의 어떤 문제를 해결하는가? |
| 2 | [MVP 정의](./02-mvp-definition.md) | 3주 동안 무엇을 검증하는가? |
| 3 | [User Story Map](./product/story-map.md) | 전체 기능과 P0·P1·Pn의 경계는 무엇인가? |
| 4 | [핵심 사용자 흐름](./product/user-flows.md) | 정상 완료·불편 발생·다음 추천이 어떻게 이어지는가? |
| 5 | [제품 규칙](./product/product-rules.md) | 추천·실험·Rescue·AI가 지켜야 할 규칙은 무엇인가? |

## 구현을 준비할 때

| 기준 | 원본 | 역할 |
| --- | --- | --- |
| 요구사항 | [요구사항 명세](./04-requirements.md) | 제품이 반드시 만족해야 할 조건과 요구사항 ID |
| 기능명세 | [GitHub 기능명세 View](https://github.com/orgs/sksksksksksss/projects/1/views/9) | MVP 기능의 단계·한 줄 결과·P0/P1을 훑고 Story 상세로 이동 |
| API | [OpenAPI](./api/README.md) | 인증, endpoint, 요청·응답과 오류 계약 |
| 데이터 | [ERD와 데이터 사전](./06-data-model/README.md) | 엔터티 관계, 상태, 소유권과 제약 |
| 기술 | [기술 스택](./03-technology-stack.md) | 무엇으로 만들며 왜 선택했는가? |
| 작업 | [GitHub Project](https://github.com/orgs/sksksksksksss/projects/1) | Priority, 담당자, 상태, 일정과 Sub-task |
| 협업 | [협업 방식](./07-collaboration-guide.md) | Story를 어떻게 시작하고 완료하는가? |
| 일정 | [3주 Roadmap](./08-project-roadmap.md) | 무엇을 언제 연결하는가? |

## 원본이 충돌할 때

| 질문 | 우선하는 원본 |
| --- | --- |
| 왜 만드는가, 무엇을 하지 않는가? | 제품 소개·MVP 정의 |
| 사용자가 무엇을 할 수 있어야 하는가? | GitHub Story와 요구사항 |
| 공통 제품 규칙은 무엇인가? | 제품 규칙 |
| API 필드와 오류 코드는 무엇인가? | OpenAPI |
| 무엇을 어떻게 저장하는가? | ERD·데이터 사전 |
| 이번 주 누가 무엇을 하는가? | GitHub Project |

구현 중 결정이 바뀌면 코드만 고치지 않는다. 영향을 받는 Story, OpenAPI, 데이터 모델과 요구사항을 같은 PR에서 함께 수정한다.
