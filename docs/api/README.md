# API 계약

- 원본: [openapi.yaml](./openapi.yaml)
- 사람이 보는 문서: [GitHub Pages Redoc](https://sksksksksksss.github.io/skn-app/api/)

OpenAPI는 P0 경험 순환과 P1에서 바로 이어지는 운영 계약을 보존한다. endpoint가 있다는 이유만으로 현재 구현 범위가 되지 않는다. 우선순위와 착수 범위는 [요구사항](../04-requirements/README.md), 부모 GitHub Feature와 [구현 태스크](../03-delivery-plan.md)를 따른다.

## 공통 규칙

- 기준 URL은 `/api/v1`이다.
- 인증 API를 제외하고 Bearer access token이 필요하다.
- 한 번만 반영해야 하는 POST에는 `Idempotency-Key`를 보낸다.
- 비동기 응답은 `202`와 `jobId`를 반환하며 `GET /ai-jobs/{jobId}`로 확인한다.
- 오류는 `application/problem+json`과 안정적인 `code`를 사용한다.
- API 시각은 offset이 포함된 ISO 8601이다.
- 화면 문구는 응답의 코드와 사실을 바탕으로 프론트엔드가 표현한다. API 문구 자체를 제품 규칙으로 사용하지 않는다.
