# SkinCause User Story Map

## 이 지도의 목적

SkinCause의 사용자 여정을 왼쪽에서 오른쪽으로 읽고, 이번 MVP가 어디까지인지 한눈에 확인한다.

```text
안정 루틴 → 제품 추천 → 비교·계획 → 관찰·LAB → Rescue → 완료·Archive → 다음 추천
```

- **활동(Backbone):** 사용자가 목적을 이루기 위해 거치는 일곱 단계
- **Epic:** 서로 밀접한 활동과 기능을 묶는 제품 영역
- **Story:** 사용자가 시작해서 결과를 얻는 한 단위. 기능명세의 원본
- **Task·Sub-task:** Story를 구현하기 위한 기술·디자인 작업. 사용자 기능의 범위를 대신하지 않음

## Epic과 활동의 관계

| Epic | 담당하는 활동 |
| --- | --- |
| [#1 현재 루틴과 다음 제품 선택](https://github.com/sksksksksksss/service/issues/1) | 안정 루틴, 제품 추천 |
| [#2 새 제품 비교와 실험 설계](https://github.com/sksksksksksss/service/issues/2) | 비교·계획 |
| [#3 관찰 퀘스트와 LAB 성장](https://github.com/sksksksksksss/service/issues/3) | 관찰·LAB |
| [#4 피부 불편 대응과 경험 아카이브](https://github.com/sksksksksksss/service/issues/4) | Rescue, 완료·Archive, 다음 추천 |
| [#5 MVP 서비스 기반](https://github.com/sksksksksksss/service/issues/5) | 로그인·데이터·API·배포 등 모든 활동의 공통 기반 |

Epic은 일정 우선순위가 아니다. P0·P1·Pn은 각 Story의 출시 시점을 나타내고, Epic은 관련된 Story를 찾기 위한 경계다.

## Story Map

가로는 사용자의 진행 순서이고 세로는 출시 순서다. `P0 + P1`이 이번 3주 MVP의 release slice다.

| Release slice | 1. 안정 루틴 | 2. 제품 추천 | 3. 비교·계획 | 4. 관찰·LAB | 5. Rescue | 6. 완료·Archive | 7. 다음 추천 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0 — 핵심 실험 한 바퀴 | [#45 로그인·기록 불러오기](https://github.com/sksksksksksss/service/issues/45), [#7 안정 루틴 저장](https://github.com/sksksksksksss/service/issues/7) | [#8 목적 기반 제품 추천](https://github.com/sksksksksksss/service/issues/8), [#9 실험 후보 저장](https://github.com/sksksksksksss/service/issues/9) | [#13 추가·중복·교체 비교](https://github.com/sksksksksksss/service/issues/13), [#14 먼저 시험할 제품](https://github.com/sksksksksksss/service/issues/14), [#15 사용·관찰 계획](https://github.com/sksksksksksss/service/issues/15) | [#17 관찰 퀘스트](https://github.com/sksksksksksss/service/issues/17), [#18 관찰 시점 확인](https://github.com/sksksksksksss/service/issues/18), [#19 진행도·보상](https://github.com/sksksksksksss/service/issues/19), [#20 완료 연구 기록](https://github.com/sksksksksksss/service/issues/20) | [#22 불편·생활 변화 기록](https://github.com/sksksksksksss/service/issues/22), [#23 변경 제품 확인](https://github.com/sksksksksksss/service/issues/23), [#24 분류·다음 행동](https://github.com/sksksksksksss/service/issues/24) | [#25 결과·루틴 갱신](https://github.com/sksksksksksss/service/issues/25), [#47 Beauty Archive](https://github.com/sksksksksksss/service/issues/47) | [#26 과거 결과 재사용](https://github.com/sksksksksksss/service/issues/26) |
| P1 — 입력·설명·브랜딩 완성 | — | [#10 직접 입력·전성분 사진](https://github.com/sksksksksksss/service/issues/10), [#49 바코드 찾기](https://github.com/sksksksksksss/service/issues/49), [#50 구매 이미지 등록](https://github.com/sksksksksksss/service/issues/50) | [#16 반대 근거·불확실성](https://github.com/sksksksksksss/service/issues/16) | [#21 배지·연구실 장식](https://github.com/sksksksksksss/service/issues/21), [#51 캐릭터·테마](https://github.com/sksksksksksss/service/issues/51), [#52 브라우저 알림](https://github.com/sksksksksksss/service/issues/52) | [#28 보류 제품 재시험](https://github.com/sksksksksksss/service/issues/28) | [#27 개인 패턴](https://github.com/sksksksksksss/service/issues/27), [#29 이력 시각화](https://github.com/sksksksksksss/service/issues/29) | — |
| Pn — 검증 이후 | — | — | — | — | — | [#30 전문가 공유 보고서](https://github.com/sksksksksksss/service/issues/30) | [#11 코호트 참고 추천](https://github.com/sksksksksksss/service/issues/11), [#12 확장 카탈로그](https://github.com/sksksksksksss/service/issues/12) |

P0만 연결해도 실험 한 바퀴가 성립해야 한다. P1은 별도 흐름을 만들지 않고 입력 부담, 설명력, 재시험과 LAB 브랜딩을 보완한다. Pn은 이번 MVP의 출시 범위가 아니다.

## Pn의 별도 사업 흐름

브랜드 실험은 개인 사용자의 backbone을 확장해 쓰지만 브랜드 담당자의 별도 여정을 가진다.

- [#38 후원 사실과 데이터 범위 확인 후 브랜드 실험 참여](https://github.com/sksksksksksss/service/issues/38)
- [#39 후원 실험과 개인 실험의 화면·데이터 분리](https://github.com/sksksksksksss/service/issues/39)
- [#40 브랜드 제품 실험 설계와 참여자 모집](https://github.com/sksksksksksss/service/issues/40)
- [#41 브랜드 실험 진행률과 중도 이탈 관리](https://github.com/sksksksksksss/service/issues/41)
- [#42 익명·집계 기반 AI 분석과 브랜드 결과 보고서](https://github.com/sksksksksksss/service/issues/42)

시작 전에는 사용자 동의·코호트 기준, 제품 데이터 공급·갱신, 전문가 보고서 공유·철회·보존 정책과 브랜드의 실제 지불 의향을 먼저 검증한다.

Pn의 묶음은 [#43 데이터 기반 제품 탐색 확장](https://github.com/sksksksksksss/service/issues/43), [#44 전문가 연계](https://github.com/sksksksksksss/service/issues/44), [#6 브랜드 제품 사용 실험](https://github.com/sksksksksksss/service/issues/6)에서 관리한다.

## 공통 기반

아래 항목은 사용자가 독립적으로 시작하는 Story가 아니라 모든 출시 Story가 의존하는 Task다.

- [#31 Spring Boot·React 모노레포 구성](https://github.com/sksksksksksss/service/issues/31)
- [#32 사용자별 루틴·실험 기록 저장 기반](https://github.com/sksksksksksss/service/issues/32)
- [#33 제품·성분·기능 데이터 기반](https://github.com/sksksksksksss/service/issues/33)
- [#34 공통 API·오류 처리·데이터 규칙](https://github.com/sksksksksksss/service/issues/34)
- [#35 핵심 MVP 지표 계산](https://github.com/sksksksksksss/service/issues/35)
- [#36 테스트·CI/CD·실서비스 배포](https://github.com/sksksksksksss/service/issues/36)
- [#37 운영 로그·모니터링·데이터 관리](https://github.com/sksksksksksss/service/issues/37)
- [#48 핵심 흐름의 접근성·빈 상태·오류 복구](https://github.com/sksksksksksss/service/issues/48)
- [#46 계정과 SkinCause 기록 삭제](https://github.com/sksksksksksss/service/issues/46)

## MVP release slice

```text
3주 MVP = P0 전체 + P1 전체
Pn = 검증 전에는 개발하지 않음
```

출시 완료는 티켓 수가 아니라 다음 연결로 판단한다.

1. 처음 가입한 사용자가 안정 루틴을 확정한다.
2. 실제 제품 후보를 추천받거나 직접 찾는다.
3. 안정 루틴과의 차이를 보고 한 제품 실험을 시작한다.
4. 필요한 관찰과 최종 결과를 남긴다.
5. 불편이 있으면 마지막 안정 루틴을 기준으로 다음 행동을 확인한다.
6. 완료 기록이 Archive와 LAB에 남는다.
7. 첫 결과가 두 번째 추천이나 실험 계획의 근거로 표시된다.

각 Story의 시작 조건, 규칙과 완료 조건은 해당 GitHub 이슈 본문이 책임진다.
