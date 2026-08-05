# F-08 AI 조사·비동기 작업

## 1. 목적

모든 AI 기능이 같은 개인정보·근거·출력 검증·실패 규칙을 사용하게 한다. AI가 자연어와 검색을 담당하되 권한, 실제 제품, 비교 사실, 순위 계산과 상태 전이는 서버가 통제한다.

## 2. 역할 경계

| AI가 맡는 일 | 서버가 맡는 일 |
| --- | --- |
| 사용자 자연어에서 현재 질문에 필요한 의미 추출 | 인증과 사용자 데이터 소유권 확인 |
| 결과를 크게 바꾸는 빈 정보의 추가 질문 | 질문 가능한 상태와 최대 질문 횟수 결정 |
| 허용된 웹 출처 검색과 관련 문장 추출 | URL·출처 종류·제품 버전·신선도 검증 |
| 근거별 지지·반대·불확실 관계 제안 | 검증된 값으로 결론·후보·Rescue 순위 계산 |
| 제품 의견·추천·루틴·Rescue의 자연어 설명 | 저장 가능한 필드, 루틴 item과 상태 전이 검증 |
| 사용자가 확인할 AI 기억 후보 작성 | 사용자가 확인한 기억과 구조화 이력 저장 |

AI 응답만으로 제품·루틴·assessment·stable pointer·Rescue 적용 상태를 변경할 수 없다.

## 3. AI 작업 종류

| job type | 생성 기능 | 주요 결과 | 사용자 행동 없이 재사용 가능한가 |
| --- | --- | --- | --- |
| `RECEIPT_OCR` | 영수증 등록 | 줄별 제품 후보 | 같은 원본 hash면 가능 |
| `PRODUCT_OPINION` | 이거 사볼까 | 제품 의견 analysis | 입력 snapshot이 같으면 가능 |
| `RECOMMENDATION` | 제품 추천 | 추가 질문 또는 후보 analysis | 입력 snapshot이 같으면 가능 |
| `PRODUCT_RESEARCH` | 제품 상세 AI 질문 | 제품 근거 analysis | 질문·버전이 같으면 가능 |
| `ROUTINE_ORDER` | AI 추천 순서 | 편집안 proposal | 편집안 hash가 같으면 가능 |
| `ROUTINE_ANALYSIS` | 루틴 저장 | 루틴·제품별 설명 | routine version·catalog revision이 같으면 가능 |
| `RESCUE` | Rescue 분석 | 확인 순위와 plan | case confirmed input revision이 같으면 가능 |

## 4. 작업 생명주기

```text
QUEUED → RUNNING → SUCCEEDED
                 ↘ FAILED
```

- 사용자 쓰기와 job 생성은 먼저 DB에 커밋한다.
- worker가 job을 claim한 뒤 `RUNNING`으로 바꾸고 외부 호출을 시작한다.
- 성공은 검증된 결과 ID가 저장된 뒤에만 `SUCCEEDED`다.
- 모델 응답이 왔어도 schema·근거 검증에 실패하면 `FAILED`다.
- 재시도는 기존 job을 덮지 않고 새 job을 만들며 `retryOfJobId`를 연결한다.
- 동일 사용자·job type·input hash에 `QUEUED` 또는 `RUNNING`이 있으면 새 job을 만들지 않고 기존 ID를 반환한다.

## 5. 최소 입력 원칙

요청 builder는 기능별 allowlist로만 입력을 구성한다.

| 데이터 | 기본 | 포함 조건 |
| --- | --- | --- |
| 사용자 ID·이메일·토큰 | 금지 | 어떤 AI 요청에도 포함하지 않음 |
| 현재 질문 원문 | 포함 | 해당 대화 turn |
| 제품 버전·공식 사실 | 관련 항목만 | 질문 대상과 비교 대상 |
| 현재·안정 루틴 | 기능별 | 의견·추천·루틴·Rescue에 필요한 필드만 |
| 과거 개인 기록 | 검색된 관련 기록만 | 날짜·routine ID 대체 참조키 사용 |
| AI 기억 | 활성 항목만 | 현재 질문에 관련된 문장만 |
| 제품 메모 | 기본 제외 | 사용자의 해당 요청 동의가 있을 때만 |
| 영수증 원본 | OCR에만 | 다른 개인 맥락과 함께 보내지 않음 |

프롬프트·로그·fixture에는 실제 사용자 원문을 넣지 않는다. 운영 로그는 job ID, model, prompt version, token·latency, 오류 코드만 기록하고 프롬프트 본문은 기본 로그에서 제외한다.

## 6. 웹 검색과 근거 계약

AI 검색 요청은 허용 출처 유형을 지정한다.

1. 브랜드·제조사 공식 페이지
2. 정부·규제기관
3. 공식 성분 데이터베이스
4. 원 논문

AI는 각 주장에 다음을 반환한다.

- 주장 key와 문장
- 관계: `SUPPORT`, `OPPOSE`, `UNCERTAIN`
- 출처 URL·제목·기관·게시일·확인일
- 적용 제품 버전 또는 개인 기록 참조
- 원문 의미를 바꾸지 않은 짧은 근거 요약
- 완제품 근거인지 원료 근거인지

서버는 도메인·URL 정책, 필수 메타데이터와 제품 버전 연결을 검사한다. 원료 근거를 완제품 효과로 표현한 주장은 거절한다. 블로그·리뷰·커뮤니티 출처는 저장하지 않는다.

## 7. 출력 envelope와 검증 순서

모든 analysis 결과는 공통 envelope를 가진다.

| 필드 | 규칙 |
| --- | --- |
| `schemaVersion` | 기능별 서버 지원 버전과 정확히 일치 |
| `analysisType` | job type과 일치 |
| `inputRevision` | job의 input snapshot revision과 일치 |
| `claims[]` | claim key가 유일하고 evidence 참조 필요 |
| `uncertainties[]` | 없는 정보를 `없음`으로 단정하지 않음 |
| `proposal` | 기능별 허용 schema. 시스템 상태 변경 명령 금지 |
| `userExplanation` | 검증된 결론·순서와 일치하는 설명 |

검증 순서:

1. JSON 파싱과 schema version
2. 인증 사용자와 입력 snapshot 일치
3. 실제 productVersion·myProduct·routine·record 존재와 소유권
4. 출처와 claim 연결
5. 금지 표현과 의료 경계
6. 기능별 수치 범위·item 보존·후보 gate
7. 서버 결론·순위 재계산
8. 설명이 계산 결과를 뒤집지 않는지 확인

하나라도 실패하면 검증되지 않은 결과를 사용자에게 공개하지 않는다.

## 8. 오류 코드와 사용자 대체 경로

| error code | 의미 | retryable | 사용자 경로 |
| --- | --- | --- | --- |
| `AI_PROVIDER_TIMEOUT` | 공급자 timeout | 예 | 같은 입력 재시도 |
| `AI_PROVIDER_RATE_LIMIT` | 공급자 제한 | 예 | 잠시 후 재시도 |
| `AI_OUTPUT_INVALID` | JSON/schema 위반 | 예 | 자동 1회 후 수동 재시도 |
| `AI_EVIDENCE_REJECTED` | 모든 핵심 근거 검증 실패 | 조건부 | 정보 부족 결과 또는 재조사 |
| `AI_REFERENCE_INVALID` | 존재하지 않는 제품·개인 기록 | 예 | 결과 폐기 후 재시도 |
| `AI_SAFETY_BOUNDARY` | Rescue 안전 경계 | 아니오 | 제품 분석 중단·고정 안내 |
| `INPUT_STALE` | 기준 루틴·편집안 revision 변경 | 아니오 | 최신 입력으로 새 작업 |
| `OBJECT_STORAGE_FAILED` | 영수증 원본 저장·읽기 실패 | 예 | 업로드 재시도·제품 검색 |

AI가 실패해도 이미 저장한 내 화장품, 루틴, assessment, Rescue 사용자 메시지를 rollback하지 않는다.

## 9. 재시도·멱등성

- 쓰기 API는 `Idempotency-Key`를 사용자·operation 범위로 저장한다.
- 같은 key·같은 body는 최초 status와 resource ID를 반환한다.
- 같은 key·다른 body는 `409 IDEMPOTENCY_KEY_REUSED`다.
- `inputHash`는 정규화된 기능 입력과 prompt version으로 만든다. 비밀값·시각처럼 결과와 무관한 값은 제외한다.
- 자동 재시도는 provider timeout·rate limit·invalid JSON에 최대 1회다.
- 사용자가 누른 재시도는 새 job으로 남기며 성공한 동일 입력 결과가 있으면 이를 재사용할 수 있다.

## 10. 완료·운영 기록

모든 job은 다음을 남긴다.

- 사용자 소유권
- job type, status, input hash
- model, prompt version, schema version
- 생성·시작·완료 시각
- retry 연결
- 성공 analysis ID 또는 안정적인 error code

원문 prompt와 전체 응답을 장기 저장할지는 별도 개인정보 결정 전까지 `analysis`의 필요한 input/output snapshot만 최소 저장한다.

## 11. 수용 시나리오

1. **Given** 루틴 저장이 커밋됨, **When** AI provider가 timeout이면, **Then** 루틴·7일은 남고 job만 FAILED가 된다.
2. **Given** AI가 존재하지 않는 productVersion ID를 반환, **When** 검증하면, **Then** 결과는 공개되지 않고 `AI_REFERENCE_INVALID`가 기록된다.
3. **Given** 같은 입력으로 두 번 추천 요청, **When** 첫 job이 진행 중이면, **Then** 두 요청은 같은 열린 job ID를 받는다.
4. **Given** 사용자가 메모 포함을 허용하지 않음, **When** 제품 의견 prompt를 만들면, **Then** 해당 메모가 input snapshot과 공급자 요청에 없다.
5. **Given** 원료 연구 하나, **When** AI가 완제품 효과로 표현하면, **Then** claim은 거절되고 정보 부족으로 처리된다.

연결 요구사항: AI-01~05, SEC-01~02, OPS-01~03
