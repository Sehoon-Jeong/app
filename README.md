# SkinCause

새 화장품을 계속 시도하는 사람이 자신의 경험을 다음 선택에 다시 쓰게 만드는 서비스다.

사용자는 제품을 사기 전에 지금 살 이유를 묻고, 산 제품을 자신의 화장품과 루틴에 넣는다. 새 루틴은 7일 뒤 한 번 확인한다. 불편이 없으면 안정 루틴이 되고, 불편이 있으면 AI Rescue가 최근 변경을 살펴보고 다음 루틴을 제안한다. 이 기록은 다음 제품 의견과 추천의 개인 근거가 된다.

## 바로 보기

- [프로토타입](https://sksksksksksss.github.io/service/prototype/)
- [사용자 흐름 도면](https://sksksksksksss.github.io/service/flow/)
- [제품 문서](./docs/README.md)
- [요구사항](./docs/04-requirements.md)
- [기능 명세](./docs/05-features/functional-specification.md)
- [API 문서](https://sksksksksksss.github.io/service/api/)
- [데이터 모델](./docs/06-data-model/README.md)
- [GitHub Project](https://github.com/orgs/sksksksksksss/projects/2)

## 제품 경계

- 대상은 국내에서 판매되는 스킨케어·클렌징·선케어 제품이다.
- 제품 의견과 추천은 구매 가치와 비교 근거를 설명한다. 피부 적합성과 효과를 보장하지 않는다.
- Rescue는 기록을 바탕으로 확인 범위를 줄이고 다음 루틴을 제안한다. 의학적 진단이나 원인 확정은 하지 않는다.
- AI는 자연어 맥락과 외부 근거를 다룬다. 제품 정체성, 사용자 소유권, 루틴 버전과 상태 전이는 서버가 검증한다.

## 개발을 시작할 때

[AGENTS.md](./AGENTS.md)의 읽는 순서와 작업 원칙을 따른다. 제품을 바꾸면 요구사항, 기능 명세, OpenAPI와 데이터 모델을 같은 변경에서 함께 고친다.
