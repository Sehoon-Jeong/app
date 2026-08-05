# F-05 DAY 7 결과

## 1. 사용자가 얻는 결과

사용자는 매일 기록하지 않고 현재 루틴의 DAY 7에 실제 사용 조건과 전반적 결과를 한 번 남긴다. 불편이 없었던 경험도 마지막 안정 루틴과 다음 제품 의견의 개인 근거가 된다.

## 2. 우선순위 범위

| 우선순위 | 결과 | 요구사항 |
| --- | --- | --- |
| P0 | 앱 안 DAY 7 결과·사용 일치·안정 승격·Rescue·실사용 수정 | OBS-01~05, OBS-07 |
| P1 | 사용자 선택형 추가 7일과 DAY 1~6 조기 기록 | OBS-06, OBS-08 |
| P2 | 없음 | - |

P0는 앱을 열었을 때 결과 행동을 보여주지만 별도 알림함과 자동 연장은 요구하지 않는다.

## 3. P0 계약

### 3.1 DAY 7 계산과 노출

- 7일은 안전성·효능·의학적 판정 기간이 아니라 같은 운영 규칙으로 결과를 회수하기 위한 기간이다.
- 불편함이 생기면 DAY 7을 기다리지 않고 언제든 Rescue를 시작한다.
- 루틴을 저장한 사용자 시간대의 날짜가 DAY 1이고 그 날짜에 6일을 더한 날이 DAY 7이다.
- DAY 7 00:00을 UTC로 바꿔 최초 `routine_assessment_schedule.dueAt`에 저장한다.
- 나중에 계정 시간대를 바꿔도 이미 만든 due 시각은 바꾸지 않는다.
- DAY 1~6에는 진행일과 `불편함이 생겼어요`, DAY 7 미응답에는 `결과 남기기`를 홈의 주 행동으로 표시한다.

예: 서울에서 8월 5일에 루틴을 저장하면 8월 5일이 DAY 1이고 8월 11일 00:00부터 결과를 받는다.

### 3.2 결과 대화

1. 대상 루틴의 버전, 사용 기간, 아침·저녁 제품·순서·빈도를 먼저 보여준다.
2. `실제로도 이 기록과 대체로 비슷하게 사용했나요?`를 묻는다.
3. 비슷하게 썼다면 전반적으로 `불편 없음`, `불편함`, `아직 모르겠음` 중 하나를 받는다.
4. 이전 메시지를 유지하고 선택 버튼은 답변을 빠르게 하는 보조 수단으로만 쓴다.

| 실제 사용 | 결과 | assessment | 안정 루틴 | 다음 행동 |
| --- | --- | --- | --- | --- |
| 비슷함 | 불편 없음 | `MATCHED / NO_DISCOMFORT / COMPLETE` | 새 stable period | 완료 |
| 비슷함 | 불편함 | `MATCHED / DISCOMFORT / START_RESCUE` | 변경 없음 | 같은 대화 아래 Rescue |
| 비슷함 | 아직 모르겠음 | `MATCHED / UNKNOWN / RECORD_ONLY` | 변경 없음 | 결과만 보존, 자동 일정 없음 |
| 다름 | 결과를 붙이지 않음 | `MISMATCHED / UNKNOWN / UPDATE_ROUTINE` | 변경 없음 | 실제 사용대로 새 루틴 편집 |
| 모르겠음·미응답 | 제출 없음 | 없음 | 변경 없음 | 나중에 계속 |

`불편 없음`은 루틴 묶음 전체의 사용자 관찰이다. 각 제품의 단독 적합성이나 안전을 뜻하지 않는다. `아직 모르겠음`을 불편 없음으로 바꾸지 않고 P0에서 자동으로 다음 7일을 만들지도 않는다.

### 3.3 마지막 안정 루틴 승격

다음을 모두 만족할 때만 기존 열린 stable period를 종료하고 새 period를 시작한다.

1. 현재 ACTIVE 루틴의 `SCHEDULED_REVIEW`
2. `MATCHED / NO_DISCOMFORT / COMPLETE`
3. schedule, assessment와 routine이 같은 사용자 소유
4. 같은 schedule이 아직 처리되지 않음

과거 안정 이력은 삭제하지 않는다. 과거 버전의 늦은 응답은 기록할 수 있지만 새 stable period를 만들지 않는다. 과거 구성을 다시 쓰려면 복사한 새 루틴으로 시작한다.

### 3.4 실제 사용이 달랐을 때

1. 저장된 루틴을 복사한 편집안을 연다.
2. 사용자가 실제 제품·시간대·순서·빈도를 고친다.
3. 저장하면 독립된 새 ACTIVE와 새 DAY 1을 만든다.
4. 기존 버전에는 불일치 assessment만 남긴다.
5. 이 결과는 제품이나 새 루틴의 긍정·부정 근거로 쓰지 않는다.

### 3.5 P0 중복·충돌

| 상황 | 결과 |
| --- | --- |
| due 전 scheduled 결과 제출 | `409 ASSESSMENT_NOT_DUE`; Rescue는 가능 |
| 같은 schedule 같은 요청 | 최초 결과 재사용 |
| 같은 schedule 다른 결과 | `409 ASSESSMENT_ALREADY_SUBMITTED` |
| current 변경 뒤 과거 결과 | 과거 결과로 저장, 새 current 일정은 건드리지 않음 |
| 잘못된 조합 | `422 ASSESSMENT_COMBINATION_INVALID` |
| 다른 사용자 routine | 존재하지 않는 것과 같은 404 |

### 3.6 P0 API·수용 시나리오

| 행동 | API | 데이터 |
| --- | --- | --- |
| 상태 조회 | `GET /me/routines/{routineId}/assessment` | schedule read |
| 결과 제출 | `POST /me/routines/{routineId}/assessment` | assessment, schedule 완료, 선택 시 stable period |
| 불편함 연결 | 결과 제출 후 `POST /rescues` | assessment와 새 Rescue |
| 실사용 수정 | `POST /me/routines` | 새 routine version과 schedule |

1. **Given** 서울 8월 5일 시작, **When** schedule 생성, **Then** 8월 11일 00:00 서울 시각이 due다.
2. **Given** 비슷하게 쓴 현재 루틴, **When** 불편 없음, **Then** assessment와 새 stable period가 한 번 생긴다.
3. **Given** 실제 사용이 다름, **When** 제출, **Then** 안정 승격 없이 새 루틴 편집으로 간다.
4. **Given** 아직 모르겠음, **When** 제출, **Then** UNKNOWN 기록만 남고 안정 루틴·Rescue·다음 schedule은 생기지 않는다.
5. **Given** 결과를 읽기만 함, **When** 제출하지 않음, **Then** 어떤 outcome도 생성되지 않는다.

## 4. P1 계약 · 추가 관찰과 조기 결과

### 4.1 추가 7일

P1에서는 `아직 모르겠음` 결과 뒤 사용자가 `7일 더 보기`를 명시적으로 선택하면 같은 루틴에 다음 `SCHEDULED` 행을 만든다. routine version은 바꾸지 않으며 연장은 최대 두 번이다. 연장 한도 뒤에도 모르면 결론 없음으로 남기고 자동 일정을 더 만들지 않는다.

### 4.2 DAY 1~6 조기 결과

DAY 1~6에 루틴 저장을 시작할 때 선택형 바텀시트를 한 번 보여준다.

| 선택 | 저장 | 편집 |
| --- | --- | --- |
| 지금까지 결과 남기기 | `EARLY_CHECK / RECORD_ONLY` | 계속 |
| 기록 없이 바꾸기 | 없음 | 계속 |
| 닫기 | 없음 | 취소 |

조기 결과는 안정 루틴을 승격하거나 자동 Rescue를 시작하지 않는다. 숫자 신뢰도를 저장하지 않고 kind, 실제 사용 일치와 경과를 이후 알고리즘이 해석한다.

연결 요구사항: OBS-01~08, RTN-03, HIS-01, NOT-01
