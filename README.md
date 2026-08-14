<div align="center">

<img src="./assets/썸네일.png" alt="SKN — 당신의 피부를 연구할 준비가 되었어요" width="100%" />

# SKN

**써본 만큼, 나를 더 잘 알게 되는 스킨케어 경험 아카이브**

[프로토타입](https://skn-labs.github.io/app/prototype/) · [사용자 흐름](https://skn-labs.github.io/app/flow/) · [API](https://skn-labs.github.io/app/api/) · [작업판](https://github.com/orgs/skn-labs/projects/2)

</div>

---

SKN은 **새로운 화장품을 자주 써보는 사람**이 사용감·조합·변화·피부 반응을 제품과 루틴에 연결해 남기고, AI가 그 안에서 **반복된 취향과 패턴**을 찾아 다음 탐색에 돌려주는 개인 스킨케어 경험 아카이브다.

## 🎨 애셋 넣기 (개발 잘 몰라도 됨)

로고·아이콘·루틴 배경 같은 브랜드 애셋은 **Claude나 Codex에게 한국어로 말만 하면** 알아서 넣어준다. 파일명·경로는 몰라도 된다.

- 예) `루틴 카드 배경에 봄 이미지 넣어줘` · `로딩 화면에 로딩 애니메이션 넣어줘`
- 새 파일을 주고 `이거 애셋으로 등록해줘` 하면 저장소에 넣고 설명까지 정리해준다.

`insert-asset` 스킬이 처리하며, 어떤 애셋이 있는지는 [애셋 카탈로그](./.agents/skills/insert-asset/references/asset-catalog.md)에 있다.

## 더 읽기

| 문서 | 답하는 질문 |
| --- | --- |
| [제품 브리프](./docs/01-product-brief.md) | 왜 이 제품을 만드는가 |
| [요구사항](./docs/04-requirements/README.md) | 무엇을 반드시 지켜야 하는가 |
| [OpenAPI](./docs/api/openapi.yaml) | 프론트와 서버의 계약은 무엇인가 |
| [데이터 모델](./docs/06-data-model/README.md) | 경험과 AI 근거를 어떻게 보존하는가 |

구현자는 [AGENTS.md](./AGENTS.md)의 작업 순서와 변경 규칙을 먼저 따른다.
