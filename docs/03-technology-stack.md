# SkinCause 기술 스택

## 선택 기준

기술은 아래 순서로 판단한다. 새롭거나 유명하다는 이유만으로 도입하지 않는다.

1. **3주 안에 완성할 수 있는가:** 팀이 이미 익숙한 기술과 디버깅 가능한 구조를 우선한다.
2. **하나의 기준을 유지하는가:** API, 데이터 구조와 실행 방법을 사람이든 AI든 같은 파일에서 확인할 수 있어야 한다.
3. **검증하기 쉬운가:** 자동 테스트와 재현 가능한 명령으로 결과를 확인할 수 있어야 한다.
4. **운영 부담을 줄이는가:** 인증, 데이터베이스와 배포는 관리형 서비스를 활용한다.
5. **사용자 기록을 안전하게 다루는가:** 필요한 데이터만 수집하고 민감한 자유 기록과 사진의 노출을 줄인다.
6. **나중에 바꿀 수 있는가:** 외부 서비스는 경계가 분명한 인터페이스 뒤에 둔다.

## 결정 요약

| 영역 | 선택 | 선택한 이유 |
| --- | --- | --- |
| 구조 | Spring Boot API + React SPA 모노레포 | 팀이 익숙하고 프론트·백엔드를 한 저장소에서 함께 바꾸기 쉽다. |
| 백엔드 | Java 21 LTS, Spring Boot 3.5, Gradle | 안정된 생태계를 쓰면서 최신 LTS 런타임을 사용한다. |
| 프론트엔드 | React 19, TypeScript, Vite, pnpm | 별도 SSR 없이 제품 흐름을 빠르게 구현하고 타입으로 계약 오류를 줄인다. |
| UI | Tailwind CSS 4, Radix UI | LAB 브랜딩을 직접 표현하면서 접근성 기본 동작을 재사용한다. |
| 서버 상태·폼 | TanStack Query, React Hook Form, Zod | 요청 상태와 입력 검증을 화면마다 다시 만들지 않는다. |
| 데이터 | PostgreSQL, Flyway | 관계가 많은 루틴·실험·관찰 이력을 일관되게 저장하고 변경 이력을 남긴다. |
| 인증·파일 | Supabase Auth, Storage | 이메일 인증과 전성분 사진 저장을 직접 운영하지 않는다. |
| API 계약 | OpenAPI, 생성된 TypeScript 클라이언트 | 프론트와 백엔드, AI 도구가 같은 계약을 읽는다. |
| AI | OpenAI Responses API, Structured Outputs | 이미지와 텍스트를 정해진 구조로 받고 모델 교체와 평가가 쉽다. |
| 테스트 | JUnit 5, Testcontainers, Vitest, Testing Library, Playwright | 단위·통합·핵심 사용자 흐름을 각각 알맞은 수준에서 확인한다. |
| 배포 | Vercel, Railway, Supabase, GitHub Actions | 3주 MVP에서 서버 운영보다 제품 검증에 집중한다. |
| 오류·분석 | Sentry, PostHog | 오류와 핵심 퍼널을 빠르게 찾되 민감한 원문은 보내지 않는다. |

정확한 라이브러리 버전은 lockfile과 빌드 파일을 기준으로 고정한다. 문서에는 방향을 남기고, 패치 버전까지 사람이 반복 관리하지 않는다.

## 전체 구조

```text
React Web
  ├─ Supabase Auth로 로그인
  └─ Spring Boot API 호출
           ├─ PostgreSQL: 루틴·제품·실험·관찰·아카이브
           ├─ Supabase Storage: 전성분 원본 이미지
           └─ OpenAI API: 이미지·자유 문장의 구조화와 설명
```

Spring Boot API가 비즈니스 데이터의 유일한 진입점이다. 프론트엔드가 Supabase 데이터베이스를 직접 읽는 방식과 Spring API를 섞지 않는다. 프론트는 인증 세션과 허용된 파일 업로드에만 Supabase SDK를 사용한다.

## 백엔드

### Java 21 LTS + Spring Boot 3.5

팀의 기존 숙련도를 그대로 활용한다. Spring Web, Validation, Security와 Data JPA를 사용하고, 데이터베이스 변경은 Flyway 마이그레이션으로 관리한다.

Spring Boot 4와 더 최신 Java도 사용할 수 있지만, 3주 프로젝트에서 메이저 버전 전환의 학습과 라이브러리 호환 위험을 함께 떠안을 이유가 없다. Java 21은 LTS이고 Spring Boot 3.5가 공식 지원하므로 이번 MVP에 충분하다.

패키지는 화면이 아니라 제품 기능을 기준으로 나눈다. 예를 들면 `routine`, `product`, `experiment`, `observation`, `rescue`, `archive`가 각각 도메인 경계가 된다. 처음부터 마이크로서비스로 분리하지 않고 하나의 애플리케이션 안에서 경계만 지킨다.

### PostgreSQL + Flyway

사용자의 루틴, 제품 순서, 실험, 관찰과 이전 결과는 서로 강하게 연결된다. 문서형 저장소보다 관계형 데이터베이스가 이 연결과 변경 이력을 다루기 쉽다.

운영 데이터베이스는 Supabase가 제공하는 PostgreSQL을 사용한다. 로컬과 테스트에서는 같은 PostgreSQL 계열을 사용해 환경 차이를 줄인다. 스키마 변경은 애플리케이션 시작 시 임의로 만들지 않고 마이그레이션 파일로 남긴다.

### 인증과 파일

초기 인증은 Supabase Auth의 이메일 OTP 또는 매직 링크를 사용한다. Spring Security가 전달받은 JWT를 검증하고, 모든 사용자 데이터는 인증 주체 ID로 구분한다.

전성분 사진은 Supabase Storage의 비공개 버킷에 저장한다. 원본은 구조화 결과를 사용자가 확인한 뒤 삭제하는 것을 기본으로 하고, 보관이 필요한 경우에만 목적과 기간을 명시한다. 공개 URL과 영구 저장을 기본값으로 두지 않는다.

## 프론트엔드

### React + TypeScript + Vite

이번 제품은 검색 유입을 위한 콘텐츠 사이트가 아니라 로그인 후 사용하는 도구다. 서버 렌더링이나 별도의 Node 서버가 필요하지 않으므로 React SPA와 Vite가 더 단순하다. Next.js를 추가하면 Spring Boot와 별도로 두 번째 서버 실행 모델을 운영해야 한다.

TypeScript는 `strict` 모드를 사용한다. 서버 응답은 OpenAPI에서 생성한 클라이언트를 통해 받고, 임의의 `any` 타입으로 계약을 우회하지 않는다.

### 상태와 입력

- TanStack Query는 서버 데이터의 요청, 캐시와 갱신을 담당한다.
- React Hook Form과 Zod는 여러 단계 입력과 화면 즉시 검증을 담당한다.
- 화면 전역 상태는 인증과 현재 실험처럼 정말 공유되는 것만 둔다. 서버 데이터를 별도 전역 저장소에 복제하지 않는다.

### UI 시스템

Tailwind CSS의 디자인 토큰과 Radix UI의 접근 가능한 기본 동작을 조합한다. 완성형 컴포넌트 라이브러리의 외형에 제품을 맞추기보다, 디자이너가 정한 LAB 색상·간격·타이포그래피를 코드 토큰으로 관리한다.

게임 경험은 별도 게임 엔진을 쓰지 않는다. 진행도, 상태 전환과 가벼운 애니메이션은 일반 웹 UI로 구현한다.

## API를 하나의 계약으로 관리한다

Spring Boot가 OpenAPI 명세를 생성하고, 프론트는 그 명세로 TypeScript 클라이언트를 생성한다. API 변경 PR에는 명세와 클라이언트 변경이 함께 들어가야 한다.

이 구조는 세 가지 문제를 줄인다.

- 프론트와 백엔드가 서로 다른 필드 이름을 가정하는 문제
- 문서만 바뀌고 실제 구현이 따라오지 않는 문제
- AI 도구가 오래된 설명을 보고 코드를 만드는 문제

비즈니스 규칙과 화면 문구는 OpenAPI에 억지로 넣지 않는다. 제품 규칙은 기능 명세, 데이터 관계는 ERD, 요청·응답 형식은 OpenAPI가 각각 책임진다.

## AI 사용 방식

기본 모델은 비용과 품질의 균형을 위해 `gpt-5.6-terra`로 시작하고 환경 변수로 교체할 수 있게 한다. 복잡한 사례는 `gpt-5.6-sol`, 대량의 단순 구조화는 `gpt-5.6-luna`와 평가한 뒤 바꾼다. 모델 이름을 도메인 코드 곳곳에 직접 쓰지 않는다.

OpenAI 연동은 `AiGateway` 같은 하나의 어댑터 뒤에 둔다. 요청마다 작업 종류, 프롬프트 버전, 모델, 결과 상태를 남겨 어떤 설정이 결과를 만들었는지 추적한다. 사용자의 숨겨진 사고 과정이나 모델의 내부 추론을 저장하지 않는다.

AI에 맡기는 일:

- 전성분 사진을 정해진 성분 구조의 초안으로 변환
- 자유 문장 관찰을 정해진 항목으로 분류
- 부족한 정보에 맞는 후속 질문 생성
- 계산된 차이와 근거를 사용자가 이해할 문장으로 설명

일반 코드가 맡는 일:

- 제품과 루틴의 변경 시점 비교
- 기능 중복과 명시적인 규칙 계산
- 실험·퀘스트 상태 전환과 일정
- 권한, 데이터 저장과 삭제
- 안전 문구와 전문가 확인이 필요한 조건

AI 응답은 Structured Outputs의 JSON Schema로 제한하고, 서버에서 다시 검증한다. 이미지 인식 결과는 확정값이 아니라 사용자가 수정할 수 있는 초안으로 보여준다. 같은 고정 사례를 반복 실행해 스키마 준수율, 누락과 위험한 단정 표현을 비교하는 평가 세트를 유지한다.

## 저장소 구조

```text
service/
├── apps/
│   ├── api/                 # Spring Boot 애플리케이션
│   └── web/                 # React 애플리케이션
├── packages/
│   └── api-client/          # OpenAPI에서 생성한 TypeScript 클라이언트
├── contracts/
│   └── openapi.yaml         # 프론트·백엔드 API 계약
├── docs/                    # 제품·기술·협업 기준
├── infra/                   # 로컬 실행과 배포 설정
├── .github/workflows/       # 검사와 배포 자동화
├── .env.example             # 필요한 환경 변수 이름과 설명
└── Makefile                 # 사람이든 AI든 사용하는 공통 명령
```

Gradle Wrapper, pnpm lockfile, Java·Node 버전 파일을 커밋한다. 루트에서는 최소한 `make setup`, `make dev`, `make test`, `make check`로 같은 작업을 실행할 수 있게 한다. 세부 도구를 몰라도 검증 방법이 하나로 보이는 것이 AI-native 하네스의 핵심이다.

## 테스트와 배포

- 백엔드 도메인 규칙은 JUnit 5로 테스트한다.
- 데이터베이스가 필요한 통합 테스트는 Testcontainers의 실제 PostgreSQL을 사용한다.
- 프론트 컴포넌트와 상태는 Vitest와 Testing Library로 테스트한다.
- 회원가입부터 실험 완료까지 핵심 경로는 Playwright로 확인한다.
- 일반 테스트에서는 실제 OpenAI API를 호출하지 않는다. 고정 응답과 별도 평가 작업을 사용한다.
- Pull Request와 `main`에서 GitHub Actions가 포맷, 타입, 테스트와 빌드를 실행한다.
- 웹은 Vercel, API 컨테이너는 Railway, 데이터와 인증은 Supabase에 배포한다.

Sentry에는 오류와 필요한 기술 정보만 전송한다. PostHog에는 단계 완료 같은 가명 이벤트만 보내며 피부 관찰 원문, 전성분 사진과 AI 입력 전체를 분석 도구에 보내지 않는다.

## 지금 도입하지 않는 것

- 마이크로서비스와 Kubernetes
- Kafka 같은 메시지 브로커
- 사용 근거가 없는 Redis 캐시
- 벡터 데이터베이스와 RAG
- GraphQL
- 이벤트 소싱과 복잡한 CQRS
- 네이티브 모바일 앱
- 자체 인증·파일 저장 시스템

실제 병목이나 기능 요구가 생기면 도입한다. “나중에 필요할 수 있다”는 이유만으로 3주 MVP에 운영 대상을 늘리지 않는다.

## 선택을 다시 검토하는 조건

- 팀이 Spring Boot 3.5와 호환되지 않는 필수 라이브러리를 발견한 경우
- Vercel·Railway·Supabase의 비용, 지역 또는 제한이 실제 사용자 검증을 막는 경우
- AI 평가에서 기본 모델이 품질 또는 비용 목표를 반복해서 넘는 경우
- 개인정보 보관 정책상 외부 분석·저장 도구를 사용할 수 없는 경우
- SPA만으로 필요한 접근성, 공유 또는 검색 요구를 만족할 수 없는 경우

조건이 발생하면 먼저 문서에 선택지와 영향을 남기고 PM이 결정한다.

## 참고한 공식 문서

- [Spring Boot 3.5 시스템 요구사항](https://docs.spring.io/spring-boot/3.5/system-requirements.html)
- [Java 지원 로드맵](https://www.oracle.com/java/technologies/java-se-support-roadmap.html)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [Vite 시작하기](https://vite.dev/guide/)
- [Node.js 릴리스](https://nodejs.org/en/about/previous-releases)
- [Supabase Auth 아키텍처](https://supabase.com/docs/guides/auth/architecture)
- [OpenAI 모델](https://developers.openai.com/api/docs/models)
- [OpenAI Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
