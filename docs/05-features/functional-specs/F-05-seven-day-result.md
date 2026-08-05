# F-05 7일 결과

## 1. 사용자가 얻는 결과

사용자는 매일 기록하지 않고 현재 루틴을 7일 사용한 뒤 실제 사용 조건과 전반적인 결과를 한 번 남긴다. 불편이 없었던 경험도 마지막 안정 루틴과 다음 AI 판단의 개인 근거가 된다.

## 2. 7일의 의미와 계산

- 7일은 안전성·효능·의학적 판정 기간이 아니라 MVP에서 결과 회수를 위한 운영 규칙이다.
- 불편함이 생기면 사용자는 DAY 7을 기다리지 않고 언제든 Rescue를 시작한다.
- `startedLocalDate`는 루틴을 저장한 순간의 사용자 IANA 시간대 기준 날짜다.
- DAY 1은 `startedLocalDate`, DAY 7은 해당 날짜에 6일을 더한 날짜다.
- `assessmentDueAt`은 DAY 7의 00:00을 루틴 생성 당시 시간대로 계산한 뒤 UTC로 저장한다.
- 이후 계정 시간대가 바뀌어도 이미 정한 due 시각은 바꾸지 않는다.

예: `Asia/Seoul`에서 8월 5일 20:00에 저장하면 8월 5일이 DAY 1이고 8월 11일 00:00부터 결과를 요청한다.

## 3. 요청 노출 규칙

| 시점 | 홈 | 내 화장품·현재 루틴 | 앱 안 알림 |
| --- | --- | --- | --- |
| DAY 1~6 | 진행 일수와 `불편함이 생겼어요` | 현재 루틴과 DAY 표시 | 없음 |
| DAY 7 이후 미응답 | 최우선 `7일 결과 남기기` | 루틴 제품마다 동일 결과 버튼 하나 | `ASSESSMENT_DUE` 1개 |
| 연장 due 이후 미응답 | 최우선 `결과 남기기` | 연장 중 표시 | `EXTENDED_ASSESSMENT_DUE` 1개 |
| 응답 완료 | 현재 상태에 맞는 다음 가치 | 결과 표시 | 기존 알림 읽음 여부와 무관하게 완료 |

같은 assessment due에 홈·제품 버튼·알림이 여러 진입점을 제공해도 같은 대화 하나를 연다.

## 4. 7일 결과 대화

### 4.1 대상 확인

1. 대상 루틴의 버전, 사용 기간, 아침·저녁 제품·순서·빈도를 먼저 보여준다.
2. `실제로도 이 기록과 대체로 비슷하게 사용했나요?`를 묻는다.
3. 대화의 이전 메시지를 유지하고 선택지는 답변을 빠르게 하는 보조 수단으로만 쓴다.

### 4.2 분기표

| 실제 사용 일치 | 사용자 결과 | 저장 | 안정 루틴 | 다음 행동 |
| --- | --- | --- | --- | --- |
| 예 | 불편 없음 | `FINAL/NO_DISCOMFORT` | 해당 버전으로 이동 | 완료 |
| 예 | 불편함 | `FINAL/DISCOMFORT` | 변경 없음 | 같은 대화 아래 Rescue 시작 |
| 예 | 더 써봐야 함 | `FINAL/NEED_MORE_TIME` | 변경 없음 | 같은 버전의 다음 7일 round 생성 |
| 아니오 | 해당 없음 | `FINAL/UNKNOWN`, actual=false | 변경 없음 | 실제 사용대로 새 루틴 편집·저장 |
| 모르겠음·미응답 | 해당 없음 | 제출 전에는 저장 없음 | 변경 없음 | 나중에 계속 |

`불편 없음`은 루틴 묶음 전체의 사용자 관찰이다. 각 제품의 단독 적합성이나 안전을 뜻하지 않는다.

## 5. 안정 루틴 승급

다음 조건을 모두 만족할 때만 stable pointer를 이동한다.

1. assessment kind가 `FINAL`
2. `actualUseMatched=true`
3. outcome이 `NO_DISCOMFORT`
4. 대상 routine이 인증 사용자의 것
5. 같은 제출이 이전에 처리되지 않음

과거 안정 루틴을 삭제하거나 상태를 바꾸지 않는다. pointer만 가장 최근에 승급한 버전으로 이동한다. 현재 루틴이 아닌 과거 버전의 늦은 응답은 기록할 수 있지만 stable pointer를 현재보다 오래된 버전으로 되돌리기 전에 사용자의 명시적 확인을 요구한다.

## 6. `더 써봐야 함` 연장

- 루틴 버전은 바꾸지 않는다.
- 응답한 round를 저장하고 `nextDueAt`을 응답한 현지 날짜에 6일을 더한 날짜의 00:00으로 계산한다.
- 같은 routine에 assessment round가 순서대로 쌓인다.
- 다음 round에서도 세 결과를 동일하게 묻는다.
- 연장 횟수는 MVP에서 최대 2회다. 두 번째 연장 후에도 모르겠다면 `결론 없음`으로 남기고 자동 질문을 더 만들지 않는다. 사용자가 수동으로 결과를 남기거나 루틴을 바꿀 수 있다.

## 7. 실제 사용이 달랐을 때

1. 저장된 루틴을 복사한 편집안을 연다.
2. 사용자가 실제로 쓴 제품·순서·빈도를 고친다.
3. 새 버전을 저장하면 새 DAY 1이 시작된다.
4. 기존 버전에는 `UNKNOWN`, `actualUseMatched=false`를 남긴다.
5. 기존 버전의 결과를 제품·새 루틴의 긍정·부정 근거로 쓰지 않는다. `기록과 실제 사용 불일치` 사실만 참고한다.

## 8. DAY 1~6 조기 변경

현재 루틴 편집을 시작할 때 한 번만 바텀시트를 보여준다.

| 선택 | 저장 | 편집 진입 |
| --- | --- | --- |
| 지금까지 결과 남기기 | `EARLY` + `NO_DISCOMFORT`, `DISCOMFORT`, `UNKNOWN` | 계속 |
| 기록 없이 바꾸기 | 없음 | 계속 |
| 닫기 | 없음 | 편집 취소 |

조기 결과의 `confidenceWeight`는 final보다 낮은 고정값을 사용한다. MVP 기본값은 `EARLY=0.35`, `FINAL=1.0`이다. 조기 불편은 자동으로 Rescue를 시작하지 않으며 사용자가 `불편함 자세히 보기`를 선택하면 시작한다. 조기 결과로 안정 루틴을 승급하지 않는다.

## 9. 중복·충돌·예외 계약

| 상황 | 결과 |
| --- | --- |
| due 전 FINAL 제출 | `409 ASSESSMENT_NOT_DUE`; Rescue는 별도로 언제든 가능 |
| 같은 round 중복 제출 | 같은 멱등 키 결과 재사용, 다른 값이면 `409 ASSESSMENT_ALREADY_SUBMITTED` |
| current가 바뀐 뒤 예전 루틴 제출 | 과거 결과임을 표시하고 저장, 새 current 일정은 건드리지 않음 |
| actual=false인데 NO_DISCOMFORT 제출 | `422 OUTCOME_NOT_ALLOWED` |
| NEED_MORE_TIME에 연장 한도 초과 | `422 EXTENSION_LIMIT_REACHED` |
| 알림을 읽고 결과 미제출 | 미응답 유지, 어떤 결과도 추정하지 않음 |
| 다른 사용자 routine ID | 존재하지 않는 것과 같은 404 |

## 10. 상태·API·데이터 변화

| 행동 | API | 데이터 변화 |
| --- | --- | --- |
| 질문 상태 조회 | `GET /me/routines/{routineId}/assessment` | 없음 |
| final·early 제출 | `POST /me/routines/{routineId}/assessment` | assessment, stable pointer 또는 next due |
| 불편함 제출 | 위 API 후 `POST /rescues` | assessment 후 rescue 연결 |
| 실제 사용 수정 | `POST /me/routines` | 새 routine version과 due |

## 11. 수용 시나리오

1. **Given** 8월 5일 서울에서 만든 루틴, **When** 일정이 생성되면, **Then** 8월 11일 00:00 서울 시각이 due다.
2. **Given** 기록과 비슷하게 7일 쓴 current, **When** 불편 없음으로 제출하면, **Then** 해당 버전이 stable pointer가 되고 assessment는 한 번만 저장된다.
3. **Given** 실제 사용이 달랐음, **When** 답하면, **Then** 해당 버전은 안정으로 승급되지 않고 새 루틴 편집으로 간다.
4. **Given** NEED_MORE_TIME 첫 round, **When** 제출하면, **Then** 같은 routine ID에 다음 round due가 생긴다.
5. **Given** 알림을 읽고 답하지 않은 사용자, **When** 개인 근거를 조회하면, **Then** 불편 없음 기록이 생성되지 않는다.

연결 요구사항: OBS-01~08, RTN-03, HIS-01, NOT-01
