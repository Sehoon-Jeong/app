# SkinCause MVP 데이터 모델

이 폴더는 P0·P1 데이터 구조의 기준을 관리한다.

## 문서

| 문서 | 용도 |
| --- | --- |
| [**dbdiagram.io ERD**](https://dbdiagram.io/d/6a70c370829f06bdc872fcae) | 브라우저에서 테이블 관계를 확인한다. |
| [`schema.dbml`](./schema.dbml) | ERD 구조 원본. dbdiagram.io에 그대로 붙여 넣는다. |
| [데이터 사전](./data-dictionary.md) | 필드 의미, 허용값과 DBML만으로 표현하기 어려운 불변조건 |

## 기준

- 관계·컬럼·타입·PK·FK·인덱스는 `schema.dbml`을 기준으로 한다.
- 필드의 제품 의미와 교차 테이블 규칙은 데이터 사전을 기준으로 한다.
- 실제 DDL은 구현할 때 Flyway로 만들며 DBML과 함께 변경한다.
- Pn인 브랜드 실험, 코호트, 전문가 공유는 포함하지 않는다.

## ERD 업데이트

1. 저장소의 `schema.dbml`을 먼저 수정한다.
2. 같은 내용을 dbdiagram.io 다이어그램에 붙여 넣는다.
3. 다이어그램을 저장하고 관계가 정상적으로 표시되는지 확인한다.
