# SkinCause API 계약

> **웹에서 보기:** [SkinCause MVP API 문서](https://sksksksksksss.github.io/service/)

`main`의 [`openapi.yaml`](./openapi.yaml)이 바뀌면 GitHub Actions가 계약을 검증하고 정적 Redoc 문서를 다시 배포한다. 웹 문서는 사람이 읽고 검토하기 위한 화면이며, API 계약의 원본은 항상 이 저장소의 YAML이다.

## 이 문서의 역할

[`openapi.yaml`](./openapi.yaml)은 SkinCause P0·P1 웹과 서버 사이의 **API 계약 원본(SSOT)**이다. 화면별 요청을 나열하지 않고 `안정 루틴 확정`, `실험 시작`, `관찰 기록`, `실험 완료`처럼 사용자의 행동과 도메인 결과를 기준으로 나눈다.

기획 규칙은 [요구사항](../04-requirements.md)과 [기능 기준](../05-features/README.md), 저장 구조는 [데이터 모델](../06-data-model/README.md)을 따른다. 브랜드 실험·코호트·전문가 연계 같은 Pn 기능은 포함하지 않는다.

## 읽는 방법

- `x-priority`: 이번 MVP의 `P0` 또는 `P1`
- `x-github-issue`: 통합 기능명세의 해당 기능과 연결된 GitHub Story 번호
- `x-requirements`: 이 작업으로 구현하는 요구사항 ID
- `operationId`: 프론트 클라이언트와 서버 테스트에서 사용할 안정적인 작업 이름
- `components/schemas`: 요청·응답이 함께 사용하는 데이터 구조와 열거형
- `components/responses`: 모든 기능이 공유하는 오류 형식

날짜와 시각은 ISO 8601로 전달한다. 시각은 UTC 오프셋을 포함하고, 날짜만 필요한 실험 계획은 `YYYY-MM-DD`를 사용한다. 목록은 `nextCursor` 기반 커서 페이지네이션을 사용한다.

## 인증과 소유권

로그인 성공 시 30일짜리 단일 access JWT를 받는다. 프론트엔드는 이를 브라우저
`sessionStorage`에 저장하고 개인 API의 `Authorization: Bearer <token>` 헤더에 보낸다.
refresh token, 인증 cookie와 서버 인증 session은 사용하지 않는다.

로그아웃은 별도 API 호출이 아니라 프론트엔드가 `sessionStorage`의 토큰과 인증 상태를 삭제하는
동작이다. 브라우저 세션이 끝나거나 JWT가 만료된 경우에는 다시 로그인한다. 복사되거나 탈취된
JWT를 개별 폐기하는 서버 목록은 두지 않으므로 토큰을 로그·오류·분석 이벤트에 절대 남기지 않는다.

서버는 토큰에서 확인한 사용자만 신뢰하며 요청 본문의 사용자 ID를 소유권 근거로 사용하지 않는다.
모든 개인 요청에서 `app_user`의 존재와 `write_locked_at`도 확인하므로 계정 삭제가 시작되면 기존
JWT의 남은 만료 시간과 관계없이 접근을 거부한다.

다른 사용자의 UUID로 개인 리소스를 요청하면 `403`으로 존재를 알려주지 않고 `404 RESOURCE_NOT_FOUND`를 반환한다. 계정 삭제가 시작돼 쓰기가 잠긴 경우에는 `423 ACCOUNT_WRITE_LOCKED`를 반환한다.

## 중복 요청

실험 계획, 첫 사용·관찰, 실험 상태 변경, 최종 결과, 안정 루틴 확정처럼 한 번만 반영되어야 하는 쓰기는 `Idempotency-Key` 헤더가 필수다. 같은 키와 같은 요청은 최초 결과를 돌려주고, 같은 키에 다른 요청을 보내면 `409 IDEMPOTENCY_KEY_REUSED`를 반환한다.

## AI에 보내는 정보

전성분·구매 이미지와 관찰 메모는 사용자가 **그 작업의 AI 구조화를 직접 요청하고 동의한 경우에만** OpenAI로 보낸다. 해당 이미지 또는 관찰의 최소 원문과 필요한 선택값만 보내며 이메일, 사용자 ID, JWT, 무관한 프로필과 다른 실험 기록은 제외한다.

AI 요청·응답 원문은 애플리케이션 로그나 `ai_job`에 영구 저장하지 않는다. 스키마를 통과한 구조화 결과와 작업 종류·모델·프롬프트·스키마 버전·성공 여부만 남긴다. 사용자가 동의하지 않거나 처리가 실패하면 직접 입력으로 같은 흐름을 끝낼 수 있다.

## 공통 오류

오류 본문은 `ProblemDetails` 하나로 통일한다.

```json
{
  "type": "https://skincause.app/problems/active-experiment-exists",
  "title": "진행 중인 실험이 있습니다.",
  "status": 409,
  "code": "ACTIVE_EXPERIMENT_EXISTS",
  "detail": "진행 중인 실험을 먼저 완료하거나 취소해 주세요.",
  "fieldErrors": [],
  "traceId": "01J5QY8M7C"
}
```

`code`는 화면 분기와 테스트에 쓰는 안정적인 값이다. 내부 예외, SQL, 프롬프트와 AI 공급자 원문은 응답에 넣지 않는다.

## 변경 규칙

1. API를 바꾸는 PR은 `openapi.yaml`, 서버 구현, 관련 테스트를 함께 수정한다.
2. 호환되지 않는 필드 삭제·의미 변경은 기존 계약을 덮어쓰지 않고 새 API 버전에서 처리한다.
3. 열거형 추가도 클라이언트 영향이 있으므로 Story의 제품 규칙과 데이터 사전을 먼저 확인한다.
4. 추천 후보와 다음 실험 우선순위는 서버의 버전이 있는 규칙으로 결정한다. AI는 목적 구조화와 계산된 결과 설명만 맡으며, 실패하거나 사용하지 않아도 같은 순위와 고정 설명을 반환한다.
5. AI가 허용 집합 밖 제품 ID, Rescue 분류, 권한이나 실험 상태를 새로 만들거나 바꿀 수 없다.

## 로컬 검증과 문서 보기

Node.js가 설치된 환경에서 다음 명령을 사용한다.

```bash
npx --yes @redocly/cli@2.43.3 lint docs/api/openapi.yaml
npx --yes @redocly/cli@2.43.3 preview-docs docs/api/openapi.yaml
```

두 번째 명령이 출력한 로컬 주소에서 전체 API와 예시를 확인할 수 있다.

## 공개 문서 배포

배포 설정은 [`.github/workflows/api-docs.yml`](../../.github/workflows/api-docs.yml)에 있다.

- `main`의 OpenAPI 계약이나 배포 설정이 바뀌면 자동 배포한다.
- 배포 전에 Redocly 검증을 통과해야 한다.
- 정적 HTML은 Actions에서만 생성하며 저장소에는 커밋하지 않는다.
- 필요하면 Actions의 `Deploy API documentation`에서 수동으로 다시 배포할 수 있다.
