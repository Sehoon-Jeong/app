# 근거와 가정

제품 전략의 외부 사실과 우리가 검증해야 할 제품 가정을 분리한다.

## 외부 근거

| 근거 | 제품에 반영한 내용 |
| --- | --- |
| [FDA: 화장품 반응이 생겼을 때](https://www.fda.gov/cosmetics/resources-consumers-cosmetics/what-should-i-do-if-i-have-reaction-side-effect-cosmetic-product) | 화장품 사용 뒤 생긴 문제는 의료 전문가와 상담하거나 신고할 수 있다. 앱이 진단이나 원인 확정을 대신하지 않는다. |
| [FDA: 화장품을 안전하게 사용하기](https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely) | 라벨과 사용법을 확인하고 이상 반응이 있으면 사용을 중단하고 전문가에게 문의하는 일반 안전 경계를 둔다. |
| [AAD: 새 스킨케어 제품 테스트](https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products) | 반응의 정확한 원인을 알아내기 어려울 수 있다. SkinCause는 제품을 범인으로 확정하지 않고 변경 범위를 좁힌다. |
| [AAD: 스킨케어 제품 바르는 순서](https://www.aad.org/public/everyday-care/skin-care-basics/care/apply-skin-care-certain-order) | 루틴 순서를 제안할 때 일반 원칙과 제품별 공식 사용법을 함께 확인한다. |
| [EU CosIng](https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-ingredient-database_en) | 성분 DB 등재는 승인이나 완제품 안전·효능 보장이 아니다. 성분 정보와 완제품 판단을 분리한다. |

## 제품 가정

아래는 외부 연구로 확정된 사실이 아니라 MVP에서 검증할 가정이다.

| ID | 가정 | 확인할 행동 |
| --- | --- | --- |
| H-01 | 사용자는 일반 리뷰보다 자신의 루틴과 보유 제품을 연결한 구매 의견을 더 유용하게 느낀다. | 의견 열람 후 찜·등록·후속 질문 비율과 인터뷰 |
| H-02 | 매일 기록은 하지 않아도 루틴 시작 7일 뒤 한 번의 결과 질문에는 답한다. | 7일 결과 도래 대비 완료율 |
| H-03 | 불편 없음 기록도 다음 제품 선택에서 신뢰를 높인다. | 개인 기록이 재사용된 의견의 이해도·선택률 |
| H-04 | 불편 시 변경 목록과 다음 루틴을 함께 받으면 단순 성분 경고보다 행동하기 쉽다. | Rescue 완료와 새 루틴 적용률 |
| H-05 | 자연어 AI 기억을 직접 보고 고칠 수 있으면 enum 설문보다 개인 맥락을 더 잘 축적한다. | 기억 수정·삭제, 추가 질문 수, 사용자 인터뷰 |

## 해석하면 안 되는 것

- 7일 완료율을 피부 안전이나 효능으로 해석하지 않는다.
- 안정 루틴을 의학적으로 안전한 루틴이라고 부르지 않는다.
- Rescue 순위를 원인 확률로 해석하지 않는다.
- 추천 선택률을 제품 적합성으로 해석하지 않는다.
