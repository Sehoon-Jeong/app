# 요구사항 명세

요구사항은 SkinCause가 **반드시 지켜야 하는 사용자 결과와 시스템 의무**다. 사용자 흐름과 모든 분기는 GitHub Feature 이슈가 정의하고, 요구사항은 구현 방식과 무관하게 유지되는 조건과 이유를 정의한다.

## 읽는 순서

| 기능 | 요구사항 파일 | Feature 명세 |
| --- | --- | --- |
| 계정·개인화 | [F-01](./F-01-account.md) | [#157](https://github.com/sksksksksksss/service/issues/157) |
| 카탈로그·내 화장품 | [F-02](./F-02-products.md) | [#158](https://github.com/sksksksksksss/service/issues/158) |
| 제품 의견·추천 | [F-03](./F-03-product-decisions.md) | [#159](https://github.com/sksksksksksss/service/issues/159) |
| 루틴 | [F-04](./F-04-routine.md) | [#160](https://github.com/sksksksksksss/service/issues/160) |
| DAY 7 결과 | [F-05](./F-05-observation.md) | [#161](https://github.com/sksksksksksss/service/issues/161) |
| AI Rescue | [F-06](./F-06-rescue.md) | [#162](https://github.com/sksksksksksss/service/issues/162) |
| 홈·기록·알림 | [F-07](./F-07-home-history.md) | [#163](https://github.com/sksksksksksss/service/issues/163) |
| AI·보안·운영 | [F-08](./F-08-ai-operations.md) | [#164](https://github.com/sksksksksksss/service/issues/164) |

제품 전체 검증은 [수용 시나리오](./acceptance.md), 요구사항과 API·데이터 연결은 [추적표](./traceability.md)를 본다.

## 우선순위

| 우선순위 | 의미 | 착수 조건 |
| --- | --- | --- |
| P0 | 핵심 학습 순환과 공개 사용자 데이터 보호에 필수 | 지금 구현 |
| P1 | P0의 이해도·회수율·운영 안정성을 높임 | P0 E2E와 사용자 행동 확인 뒤 |
| P2 | 입력 편의, 탐색 확장 또는 별도 가치 | P0·P1에서 필요가 확인된 뒤 |

각 파일은 반드시 P0 → P1 → P2 순서로 작성한다. P1·P2 계약을 미리 정의할 수는 있지만 P0 완료 전에 구현하지 않는다.

## 요구사항 충족 판정

하나의 요구사항은 다음을 모두 만족해야 완료다.

1. 부모 Feature 이슈에 진입 조건·분기·실패와 수용 조건이 있다.
2. 외부 계약이 필요하면 OpenAPI operation과 오류 코드가 있다.
3. 상태를 저장하면 데이터 모델의 원본 필드와 무결성 제약이 있다.
4. 정상·권한 위반·AI 실패·빈 상태를 검증하는 테스트가 있다.

UI 배치·색·문구는 요구사항이 아니다. AI 실패 후 기록 보존, 교차 사용자 접근 차단과 불확실성 표시는 UI와 무관하게 지킨다.

## P0가 검증하는 순환

```text
최소 제품 의견 → 내 화장품 → 현재 루틴 → DAY 7 결과
→ 안정 루틴 또는 Rescue → 승인한 다음 루틴
→ 다음 제품 의견에서 과거 경험 재사용
```

처음부터 제품을 찾아주는 추천은 P2다. 외부에서 본 제품 하나를 현재 루틴과 과거 결과로 설명하는 최소 `이거 사볼까?`는 개인 기록이 다음 판단에 재사용되는지를 검증하므로 P0다.

## 제품 전체 경계

- 피부 질환·알레르기·원인·응급도·진료과를 진단하지 않는다.
- 제품 적합 확률과 효능·안전을 보장하지 않는다.
- 메이크업·헤어·향수, 잔량·소진일·유통기한을 다루지 않는다.
- 가격·판매량·광고비로 판단 순위를 바꾸지 않는다.
- 푸시·문자·이메일 알림과 매일 피부 일기·출석 게임화를 만들지 않는다.
- 과거 루틴과 AI 실행 원본을 사후 수정하지 않는다.

근거와 검증 가정은 [근거 문서](../evidence/README.md)를 따른다. DAY 7과 Rescue 순위는 의학적 기준이 아니라 모든 P0 사용자에게 동일하게 적용하는 제품 운영 규칙이다.
