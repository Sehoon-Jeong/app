# 기능명세

먼저 [통합 기능명세서](./functional-specification.md)에서 필요한 기능을 찾고 기능 ID를 눌러 상세 명세를 읽는다. 각 기능의 더 상세한 사용자 흐름과 검증 항목은 연결된 GitHub Story에서 관리한다.

## 전체 기능 보기

- [통합 기능명세서](./functional-specification.md): MVP 사용자 기능 29개의 인덱스와 기능 ID별 상세 명세
- [MVP 기능 목록](https://github.com/orgs/sksksksksksss/projects/1/views/9): 기능명, 사용자 단계, P0·P1과 한 줄 결과
- [User Story Map](../product/story-map.md): 전체 사용자 흐름과 P0·P1·Pn 경계
- [개발 칸반](https://github.com/orgs/sksksksksksss/projects/1/views/3): 상태, 담당자와 Sub-task 실행
- [요구사항 추적표](./traceability.md): 요구사항과 Story·데이터·검증의 연결

통합 기능명세서의 기능 하나는 Story 하나와 대응한다. 기능명세서는 전체 기능을 비교하는 기준이고, Story는 담당자가 구현·검증할 상세 흐름과 완료 조건이다. 제품 의미가 달라지면 둘을 같은 변경에서 함께 수정한다.

## Epic

| 제품 영역 | GitHub Epic |
| --- | --- |
| 안정 루틴과 제품 추천 | [#1 현재 루틴과 다음 제품 선택](https://github.com/sksksksksksss/service/issues/1) |
| 루틴 비교와 실험 계획 | [#2 새 제품 비교와 실험 설계](https://github.com/sksksksksksss/service/issues/2) |
| 관찰과 게임 경험 | [#3 관찰 퀘스트와 LAB 성장](https://github.com/sksksksksksss/service/issues/3) |
| 불편 대응과 개인 이력 | [#4 피부 불편 대응과 경험 아카이브](https://github.com/sksksksksksss/service/issues/4) |
| 공통 기술 기반 | [#5 MVP 서비스 기반](https://github.com/sksksksksksss/service/issues/5) |
| 검증 이후 확장 | [#6 브랜드 제품 사용 실험](https://github.com/sksksksksksss/service/issues/6), [#43 데이터 기반 제품 탐색 확장](https://github.com/sksksksksksss/service/issues/43), [#44 전문가 연계](https://github.com/sksksksksksss/service/issues/44) |

## Story 본문이 답해야 하는 것

모든 Story에는 다음 내용이 있다.

1. 사용자가 얻는 결과
2. 시작 조건
3. 처음부터 끝까지의 사용자 흐름
4. 반드시 지켜야 할 제품 규칙
5. 예외와 기능 경계
6. 검증 가능한 완료 조건
7. 관련 요구사항·데이터·문서
8. 착수 전 확인할 의존성

Story는 `무엇을 왜 만드는지`를 정의한다. OpenAPI는 요청·응답, ERD는 저장 구조, 디자인은 화면의 배치와 표현을 책임진다.

## Sub-task의 경계

P0·P1 Story와 Task는 착수 전에 네이티브 GitHub Sub-issue까지 나눈다. Sub-task에는 결과, 관련 화면·데이터·API, 예외와 확인 방법을 적는다.

`계약과 데이터`에는 식별자만 나열하지 않는다. 다음 원본을 바로 열 수 있는 링크와 사람이 이해할 수 있는 설명을 함께 적는다.

- 부모 Story 또는 Task: 이 작업이 완성해야 하는 상위 사용자 결과
- 요구사항 ID: 해당 요구사항이 적힌 추적표 위치
- API: `operationId — 사용자가 수행하는 일`과 OpenAPI 정의 위치
- 데이터: 엔터티별 데이터 사전 위치

직접 연결되는 API나 엔터티가 없다면 임의로 만들지 않고, UI·도메인·운영 작업이라는 사실과 적용할 공통 계약을 적는다. OpenAPI나 추적표의 줄이 달라지면 Sub-task 링크도 함께 갱신한다.

클래스명, 패키지 구조, 디자인 패턴, 함수 분리와 내부 구현 순서는 담당자가 결정한다. 기획은 개발자가 제품 정책을 추측하지 않게 하지만 구현 방법까지 고정하지 않는다.

## Ready 기준

다음 조건을 모두 만족해야 `Ready`로 이동한다.

- Story의 모든 필수 섹션이 작성됐다.
- P0·P1 중 하나와 부모 Epic이 연결됐다.
- 관련 요구사항, 제품 규칙, OpenAPI와 데이터 엔터티를 찾을 수 있다.
- 필요한 Sub-task와 강한 선행 의존성이 연결됐다.
- 담당자와 목표일이 정해졌다.
- 디자인에서 결정할 부분과 제품 규칙이 구분됐다.
