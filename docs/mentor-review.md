# 기술 멘토링 안내

## 프로젝트 소개

SkinCause는 현재 잘 쓰는 스킨케어 루틴을 기준으로 다음에 시험할 제품을 추천하고, 한 제품씩 사용한 결과를 다음 추천에 활용하는 AI 스킨케어 실험 서비스다.

해커톤에서는 3주 안에 매력적인 사용자 경험을 실제 URL로 보여주는 것이 목표다. 이 문서는 그 제품을 무리 없이 구현하기 위해 데이터·API·AI 경계와 기술 선택에 대한 검토를 받기 위한 안내다.

## 권장 검토 순서

처음부터 모든 문서를 읽을 필요는 없다.

1. [MVP 제품 소개](./02-mvp-definition.md)
2. [User Story Map](./product/story-map.md)
3. [핵심 사용자 흐름](./product/user-flows.md)
4. [제품 규칙과 AI 책임](./product/product-rules.md)
5. [요구사항 명세](./04-requirements.md)
6. [GitHub Story 기능명세](./05-features/README.md)
7. [ERD와 데이터 사전](./06-data-model/README.md)
8. [OpenAPI 계약](./api/README.md)
9. [기술 스택과 선택 이유](./03-technology-stack.md)

## 이번에 검토받고 싶은 결정

- 안정 루틴과 제품 정보를 덮어쓰지 않고 버전으로 남기는 구조가 과도하거나 빠진 부분은 없는가?
- 추천 후보·비교안·실험·관찰·Rescue·결과의 데이터 경계가 실제 구현에 적절한가?
- 한 사용자당 열린 실험을 하나로 제한하는 제약과 상태 전이가 안전하게 구현 가능한가?
- OpenAPI의 도메인 단위 endpoint, idempotency와 오류 규칙이 3주 MVP에 적절한가?
- 이메일·비밀번호와 JWT 인증, OCI Object Storage의 비공개 이미지·삭제 흐름에 빠진 보안 문제가 있는가?
- AI가 추천 설명·구조화를 맡고 서버가 실제 후보·권한·상태·Rescue 분류를 통제하는 경계가 적절한가?
- AI 실패 시 규칙 기반 결과나 직접 입력으로 완료하는 방식이 핵심 흐름을 충분히 보호하는가?
- React·Spring Boot 모노레포와 Vercel·OCI 배포 구성이 팀 규모와 일정에 맞는가?

## 이번 검토의 경계

엔터프라이즈 규모의 확장성이나 완성된 브랜드 플랫폼을 설계하려는 것이 아니다. P0·P1 사용자 흐름이 실제로 연결되고, 개발자 네 명이 병렬로 구현해도 데이터와 API가 충돌하지 않을 정도의 기준선을 만드는 것이 목적이다.

아직 검증하지 않은 코호트 추천, 브랜드 실험, 전문가 연계와 커머스는 Pn으로 분리했으며 이번 API와 ERD에 포함하지 않는다.

## 피드백을 남기는 곳

전체 방향에 대한 의견은 [GitHub Discussions](https://github.com/sksksksksksss/service/discussions)에, 특정 기능의 의견은 연결된 GitHub Story에 남긴다. 기술 결정을 바꾸는 피드백은 관련 Story·OpenAPI·ERD를 같은 변경에서 함께 수정한다.
