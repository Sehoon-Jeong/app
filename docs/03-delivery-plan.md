# 구현 우선순위와 태스크

이 문서는 제품 범위를 실제 구현 순서로 바꾼다. 우선순위는 중요도 순위가 아니라 **핵심 가설을 검증하기 위한 의존 순서**다.

## P0 · 한 번의 개인 학습 순환

P0가 증명할 것은 하나다.

```text
제품 하나를 판단한다
→ 내 화장품에 넣는다
→ 실제 루틴과 DAY 7 결과를 남긴다
→ 안정 루틴 또는 Rescue 결과가 생긴다
→ 그 경험이 다음 제품 판단에 다시 쓰인다
```

### P0 태스크

| 순서 | Task | 끝났을 때 생기는 결과 | 선행 |
| --- | --- | --- | --- |
| 1 | [#187 개인 데이터 SQLite 스키마·무결성 제약 구현](https://github.com/sksksksksksss/service/issues/187) | 교차 사용자·중복 ACTIVE·과거 루틴 수정이 DB에서 거절됨 | 없음 |
| 2 | [#166 이메일 가입·로그인·계정 삭제 구현](https://github.com/sksksksksksss/service/issues/166) | 공개 사용자의 기록이 계정별로 분리됨 | #187 |
| 3 | [#188 테스트 화장품 30~50개 큐레이션](https://github.com/sksksksksksss/service/issues/188) | 검색 가능한 테스트 제품과 직접 입력 대체 경로가 생김 | 없음 |
| 4 | [#167 제품 검색·직접 등록 구현](https://github.com/sksksksksksss/service/issues/167) | 제품이 내 화장품에 들어가고 루틴 편집으로 왕복함 | #166, #188 |
| 5 | [#171 루틴 생성·편집·버전 저장 구현](https://github.com/sksksksksksss/service/issues/171) | 실제 제품·시간대·순서·빈도와 DAY 7 일정이 저장됨 | #167, #187 |
| 6 | [#173 DAY 7 결과·안정 루틴 승격 구현](https://github.com/sksksksksksss/service/issues/173) | 불편 없음도 개인 기록이 되고 불편함은 Rescue로 감 | #171 |
| 7 | [#175 Rescue 대화·루틴 변경 확인 구현](https://github.com/sksksksksksss/service/issues/175) | 사용자의 말과 안정 대비 변경 목록이 한 대화에 남음 | #171, #173 |
| 8 | [#176 Rescue 확인 순위·다음 루틴 적용 구현](https://github.com/sksksksksksss/service/issues/176) | 승인한 Rescue plan만 독립된 새 루틴이 됨 | #175 |
| 9 | [#180 AI 출력·개인 데이터 참조 검증 구현](https://github.com/sksksksksksss/service/issues/180) | 잘못된 AI 출력과 오래된 plan이 공개·적용되지 않음 | #187, 각 AI 계약 |
| 10 | [#178 홈 주 행동·현재/안정 루틴 비교 구현](https://github.com/sksksksksksss/service/issues/178) | Rescue·DAY 7·첫 루틴 중 하나가 홈의 주 행동이 됨 | #171, #173, #175 |
| 11 | [#169 구매 전 제품 의견·내 화장품 등록 구현](https://github.com/sksksksksksss/service/issues/169) | 현재·안정 루틴과 과거 결과가 다음 제품 의견에 다시 등장함 | #167, #173, #180 |

Task #180은 한 번에 마지막에 붙이는 작업이 아니다. #169·#175·#176의 AI 출력을 구현할 때 같은 PR에서 해당 schema와 검증 규칙을 추가한다.

### P0 완료 조건

- E2E 한 바퀴에서 과거 assessment가 다음 제품 의견의 근거로 표시된다.
- AI를 끄거나 실패시켜도 제품·루틴·assessment·사용자 메시지가 남는다.
- 사용자 A의 모든 개인 ID를 사용자 B가 조회·변경·AI 참조할 수 없다.
- 미응답, 정보 부족과 AI 실패를 긍정 결과로 바꾸지 않는다.
- P1·P2 기능이 없어도 위 순환을 끝낼 수 있다.

## P1 · 핵심 순환을 더 이해하기 쉽고 운영 가능하게

P1은 P0 사용자 행동을 본 뒤 착수한다. 각 태스크의 착수 근거가 나오지 않으면 Backlog에 둔다.

| Task | 결과 | 착수 신호 |
| --- | --- | --- |
| [#172 AI 루틴 순서·제품별 설명 구현](https://github.com/sksksksksksss/service/issues/172) | 루틴 편집안의 순서를 설명하고 적용 | 순서·빈도 입력 이탈 또는 반복 수정 |
| [#174 추가 관찰·조기 결과 구현](https://github.com/sksksksksksss/service/issues/174) | 추가 7일과 DAY 7 전 기록 | 모름·조기 변경이 반복됨 |
| [#177 루틴 타임라인·제품별 사용 기록 구현](https://github.com/sksksksksksss/service/issues/177) | 타임라인과 제품별 과거 사용 조회 | 현재·안정 비교만으로 과거 탐색이 부족함 |
| [#179 AI 비동기 실행 기반 구현](https://github.com/sksksksksksss/service/issues/179) | 여러 AI 작업의 재시도·worker 복구 | 단순 executor가 지연·실패를 감당하지 못함 |
| [#186 한국 화장품 카탈로그·근거 데이터 구축](https://github.com/sksksksksksss/service/issues/186) | 실제 출시판과 재현 가능한 evidence snapshot | 큐레이션 범위 부족이 결과 품질을 막음 |
| [#189 제품 의견 후속 채팅 구현](https://github.com/sksksksksksss/service/issues/189) | 같은 근거로 질문을 이어감 | 결과 뒤 추가 질문이 반복됨 |
| [#190 DAY 7·AI 작업 앱 내 알림 구현](https://github.com/sksksksksksss/service/issues/190) | DAY 7·AI 작업을 다시 찾음 | 홈만으로 결과 회수율이 낮음 |
| [#191 제품 상세·메모·사용 기록 구현](https://github.com/sksksksksksss/service/issues/191) | 제품 하나의 정보와 과거 루틴을 관리 | 보유 제품 수가 늘어 관리 이탈이 생김 |
| [#192 반복 Rescue·외부 근거 연동 구현](https://github.com/sksksksksksss/service/issues/192) | 반복 경험과 연구를 보조 근거로 사용 | 변경점만으로 다음 행동 설명이 부족함 |

## P2 · 탐색과 입력 편의

| Task | 결과 | P0와 다른 이유 |
| --- | --- | --- |
| [#165 선택형 온보딩·AI 기억 관리 구현](https://github.com/sksksksksksss/service/issues/165) | 구조화 이력 밖의 맥락을 관리 | 핵심 순환 전에 범용 기억이 필요하지 않음 |
| [#168 영수증 OCR 제품 등록 구현](https://github.com/sksksksksksss/service/issues/168) | 여러 제품 입력을 편하게 함 | 입력 편의이지 핵심 가치가 아님 |
| [#170 자연어 제품 추천·후보 검증 구현](https://github.com/sksksksksksss/service/issues/170) | 제품을 처음부터 발견함 | 한 제품 판단과 다른 사용 시점·성공 기준임 |

## 운영 규칙

- Feature는 `[F-번호] 명사형 기능 영역`, Task는 `구현 대상 + 구현`으로 제목을 쓴다.
- 제목에 Priority, 일정 판단, 배경 설명과 완료 문장을 넣지 않는다.
- 각 Task는 하나의 Priority만 가진다. 여러 단계가 섞이면 Task를 나눈다.
- P0 Task만 `Ready`로 올린다. 선행 작업과 제품 결정이 남아 있으면 `Backlog`다.
- API 의미가 바뀌면 OpenAPI와 테스트를, 데이터 의미가 바뀌면 데이터 사전과 migration 테스트를 같은 PR에서 바꾼다.
- P1·P2는 삭제하지 않는다. `Not planned`로 숨기지 않고 Priority와 Backlog로 보존한다.
