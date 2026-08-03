# SkinCause MVP 기능명세서

이 문서는 SkinCause MVP의 **사용자 기능 28개**를 한곳에서 확인하는 기능명세서다. 기능 하나는 GitHub Story 하나와 대응한다.

- `P0`: 핵심 실험 흐름을 성립시키는 필수 기능
- `P1`: 같은 MVP에서 완성도와 사용 편의를 높이는 기능
- 기능 ID는 바꾸지 않는다. 기능의 상세 결정이 달라지면 이 문서와 연결된 Story를 함께 수정한다.
- 화면 배치와 시각 표현은 디자인이, 요청·응답은 OpenAPI가, 저장 구조는 데이터 사전이 책임진다.

## 전체 기능

| 기능 ID | 사용자 단계 | 우선순위 | 기능 | 사용자가 얻는 결과 | Story |
| --- | --- | --- | --- | --- | --- |
| [FN-AUTH-01](./functional-specs/FN-AUTH-01.md) | 시작·계정 | P0 | 이메일 회원가입·로그인 | 재접속해도 자신의 루틴과 진행 중인 실험을 이어간다 | [#45](https://github.com/sksksksksksss/service/issues/45) |
| [FN-AUTH-02](./functional-specs/FN-AUTH-02.md) | 시작·계정 | P0 | 계정과 기록 삭제 | 삭제 범위를 확인하고 개인 기록과 접근 권한을 제거한다 | [#46](https://github.com/sksksksksksss/service/issues/46) |
| [FN-RTN-01](./functional-specs/FN-RTN-01.md) | Lab Setup | P0 | 안정 루틴 저장 | 현재 문제없이 쓰는 제품 조합을 이후 실험의 기준으로 남긴다 | [#7](https://github.com/sksksksksksss/service/issues/7) |
| [FN-REC-01](./functional-specs/FN-REC-01.md) | 제품 선택 | P0 | 개인화 제품 추천 | 안정 루틴과 목적을 기준으로 다음 실험 후보를 최대 3개 받는다 | [#8](https://github.com/sksksksksksss/service/issues/8) |
| [FN-CAN-01](./functional-specs/FN-CAN-01.md) | 제품 선택 | P0 | 실험 후보 저장 | 추천 제품과 직접 찾은 제품을 같은 후보 목록에서 관리한다 | [#9](https://github.com/sksksksksksss/service/issues/9) |
| [FN-PRD-01](./functional-specs/FN-PRD-01.md) | 제품 선택 | P1 | 제품 직접·사진 등록 | 카탈로그에 없는 제품과 확인한 전성분을 개인 제품으로 등록한다 | [#10](https://github.com/sksksksksksss/service/issues/10) |
| [FN-PRD-02](./functional-specs/FN-PRD-02.md) | 제품 선택 | P1 | 바코드 제품 찾기 | 바코드와 정확히 일치하는 카탈로그 제품을 찾는다 | [#49](https://github.com/sksksksksksss/service/issues/49) |
| [FN-PRD-03](./functional-specs/FN-PRD-03.md) | 제품 선택 | P1 | 구매 내역 이미지 등록 | 이미지에서 필요한 제품만 확인해 후보로 등록한다 | [#50](https://github.com/sksksksksksss/service/issues/50) |
| [FN-CMP-01](./functional-specs/FN-CMP-01.md) | Experiment Preview | P0 | 안정 루틴과 후보 비교 | 추가·중복·교체되는 제품과 기능을 확인한다 | [#13](https://github.com/sksksksksksss/service/issues/13) |
| [FN-ORD-01](./functional-specs/FN-ORD-01.md) | Experiment Preview | P0 | 실험 순서 제안 | 여러 후보 중 먼저 시험할 제품과 이유를 확인한다 | [#14](https://github.com/sksksksksksss/service/issues/14) |
| [FN-EVD-01](./functional-specs/FN-EVD-01.md) | Experiment Preview | P1 | 근거와 불확실성 확인 | 추천의 지지·반대 근거와 부족한 정보를 함께 본다 | [#16](https://github.com/sksksksksksss/service/issues/16) |
| [FN-PLN-01](./functional-specs/FN-PLN-01.md) | Experiment Preview | P0 | 실험 계획 생성 | 한 제품의 사용 위치·기간·관찰 시점을 정하고 시작한다 | [#15](https://github.com/sksksksksksss/service/issues/15) |
| [FN-OBS-01](./functional-specs/FN-OBS-01.md) | Observation Quest | P0 | 필수 관찰 퀘스트 | 첫 사용부터 종료까지 필요한 시점에만 짧게 기록한다 | [#17](https://github.com/sksksksksksss/service/issues/17) |
| [FN-OBS-02](./functional-specs/FN-OBS-02.md) | Observation Quest | P0 | 인앱 관찰 일정 | 오늘 해야 할 관찰과 놓친 관찰을 앱에서 확인한다 | [#18](https://github.com/sksksksksksss/service/issues/18) |
| [FN-OBS-03](./functional-specs/FN-OBS-03.md) | Observation Quest | P1 | 브라우저 알림 | 동의한 사용자에게 민감 정보 없는 관찰 알림을 보낸다 | [#52](https://github.com/sksksksksksss/service/issues/52) |
| [FN-LAB-01](./functional-specs/FN-LAB-01.md) | LAB 성장 | P0 | 실험 진행도와 관찰 보상 | 완료한 필수 관찰과 남은 행동을 LAB에서 확인한다 | [#19](https://github.com/sksksksksksss/service/issues/19) |
| [FN-LAB-02](./functional-specs/FN-LAB-02.md) | LAB 성장 | P0 | 완료 연구 기록 | 결과 방향과 무관하게 완료한 실험을 연구실에 쌓는다 | [#20](https://github.com/sksksksksksss/service/issues/20) |
| [FN-LAB-03](./functional-specs/FN-LAB-03.md) | LAB 성장 | P1 | 배지·장식 해금 | 실제 관찰과 실험 완료로 보상을 해금한다 | [#21](https://github.com/sksksksksksss/service/issues/21) |
| [FN-LAB-04](./functional-specs/FN-LAB-04.md) | LAB 성장 | P1 | 캐릭터·테마 선택 | 해금한 캐릭터와 연구실 테마를 선택해 유지한다 | [#51](https://github.com/sksksksksksss/service/issues/51) |
| [FN-RSC-01](./functional-specs/FN-RSC-01.md) | Rescue | P0 | 피부 불편 기록 | 불편과 크게 달랐던 일을 기록하고 안전 안내로 이동한다 | [#22](https://github.com/sksksksksksss/service/issues/22) |
| [FN-RSC-02](./functional-specs/FN-RSC-02.md) | Rescue | P0 | 안정 루틴 이후 변경 복원 | 마지막 안정 루틴 이후 실제로 달라진 제품을 확인한다 | [#23](https://github.com/sksksksksksss/service/issues/23) |
| [FN-RSC-03](./functional-specs/FN-RSC-03.md) | Rescue | P0 | 확인 범위와 다음 행동 | 제품별 확인 범위와 중단·유지·재시험 행동을 확인한다 | [#24](https://github.com/sksksksksksss/service/issues/24) |
| [FN-ARC-01](./functional-specs/FN-ARC-01.md) | Beauty Archive | P0 | 결과 저장·루틴 갱신 | 최종 결과를 남기고 원할 때만 안정 루틴을 갱신한다 | [#25](https://github.com/sksksksksksss/service/issues/25) |
| [FN-ARC-02](./functional-specs/FN-ARC-02.md) | Beauty Archive | P0 | 완료 실험 조회 | 당시 루틴·관찰·Rescue·결과를 다시 확인한다 | [#47](https://github.com/sksksksksksss/service/issues/47) |
| [FN-PER-01](./functional-specs/FN-PER-01.md) | Beauty Archive | P0 | 과거 경험 재사용 | 과거 성공·실패 경험을 다음 추천과 계획에 반영한다 | [#26](https://github.com/sksksksksksss/service/issues/26) |
| [FN-PER-02](./functional-specs/FN-PER-02.md) | Beauty Archive | P1 | 개인 반복 패턴 | 반복 경험과 반대 사례를 횟수·원본과 함께 확인한다 | [#27](https://github.com/sksksksksksss/service/issues/27) |
| [FN-RET-01](./functional-specs/FN-RET-01.md) | Beauty Archive | P1 | 보류 제품 재시험 | 현재 안정 상태를 확인하고 이전 기록에 연결된 새 실험을 만든다 | [#28](https://github.com/sksksksksksss/service/issues/28) |
| [FN-ARC-03](./functional-specs/FN-ARC-03.md) | Beauty Archive | P1 | 루틴·사용 이력 시각화 | 루틴과 제품 사용의 변화를 시간순으로 되짚는다 | [#29](https://github.com/sksksksksksss/service/issues/29) |

## 읽는 방법

1. 위 표에서 사용자 단계와 P0·P1을 기준으로 필요한 기능을 찾는다.
2. 기능 ID를 눌러 시작 조건·입력·처리·결과·규칙·예외·완료 기준을 읽는다.
3. 더 상세한 사용자 흐름과 검증 항목은 기능 파일에 연결된 GitHub Story에서 확인한다.
4. 구현할 때는 Story 아래의 Sub-task와 OpenAPI·데이터 사전을 함께 확인한다.

## 문서 역할

- 이 파일은 MVP 기능 전체를 비교하고 찾는 인덱스다.
- functional-specs/FN-*.md는 기능 ID별 상세 기능명세다.
- GitHub Story는 담당자가 구현·검증할 상세 사용자 흐름과 완료 조건이다.
- [MVP 기능 목록](https://github.com/orgs/sksksksksksss/projects/1/views/9)은 우선순위와 진행 대상을 훑는 Project View다.
- 제품 의미가 달라지면 인덱스, 기능 ID 파일과 Story를 같은 변경에서 함께 수정한다.
