# 백엔드 배포

## 공개 주소

| 용도 | URL |
| --- | --- |
| API 호스트 | <http://api.leafeep.com> |
| 헬스체크 | <http://api.leafeep.com/actuator/health> |
| API 계약 문서 | <https://skn-labs.github.io/app/api/> |
| 공개 저장소 | <https://github.com/skn-labs/app> |

## 배포 구조

- 배포 대상은 `backend/`의 Spring Boot API뿐이다. 프론트엔드는 OCI 배포에 포함하지 않는다.
- API는 OCI의 기존 ARM64 인스턴스에서 `skn-api` 컨테이너 하나로 실행한다.
- 컨테이너는 호스트 포트를 직접 공개하지 않고 기존 reverse proxy의 내부 Docker 네트워크에만 연결한다.
- 외부 HTTP 요청은 공유 reverse proxy가 API 컨테이너로 전달한다.
- SQLite 파일과 백업은 애플리케이션 이미지 및 release 디렉터리 밖의 영속 저장소에 둔다.

## 프론트엔드 연결

- 운영 프론트엔드는 <https://skn-labs.vercel.app>에서 제공한다.
- 브라우저는 환경과 관계없이 같은 출처의 상대 경로 `/api/...`만 호출한다.
- Vercel에서는 [`frontend/vercel.json`](../frontend/vercel.json)이 `/api/*`를 API 서버로 프록시한다. 따라서 세션 쿠키를 교차 출처 쿠키로 만들지 않는다.
- 현재 Vercel과 API 서버 사이의 upstream은 HTTP다. 브라우저와 Vercel 사이는 HTTPS지만 upstream 구간은 암호화되지 않으므로 임시 운영 구성으로 취급한다.
- 로컬에서는 Vite 개발 서버가 `/api/*`를 기본적으로 `http://localhost:8080`에 프록시한다. 필요할 때만 로컬 환경 변수 `VITE_API_PROXY`로 대상을 바꾼다.
- Vercel의 나머지 경로는 `index.html`로 rewrite하여 React Router의 직접 진입과 새로고침을 지원한다.

## 자동 배포

`main`에 `backend/`, `deploy/oci/` 또는 백엔드 배포 workflow 변경이 푸시되면 다음 순서로 배포한다.

1. Java 17에서 백엔드 테스트를 실행한다.
2. 실행 JAR와 배포 파일로 release artifact를 만든다.
3. SSH로 OCI 인스턴스에 artifact를 전송한다.
4. 기존 SQLite가 있으면 SQLite backup API로 일관된 백업을 만들고 무결성을 검사한다.
5. 아직 적용하지 않은 `deploy/oci/migrations/*.sql`을 이름순으로 한 번씩 실행하고 적용 이력을 남긴다.
6. 저장소의 정적 제품 2,654개와 제품별 안내 2,654개를 기존 사용자 데이터를 건드리지 않고 upsert한다.
7. commit SHA를 태그로 새 컨테이너 이미지를 만들고 API 컨테이너만 교체한다.
8. 컨테이너 내부 `/actuator/health`와 공개 HTTP 헬스체크가 모두 성공해야 배포 성공으로 처리한다.
9. 내부 헬스체크가 실패하면 직전 컨테이너 이미지로 되돌린다.

workflow는 [deploy-backend.yml](../.github/workflows/deploy-backend.yml), 서버 배포 자산은 [`deploy/oci/`](../deploy/oci/)에 있다.

## 해커톤 빠른 로그인

- 운영 데모는 `TEST_HARNESS_ENABLED=true`로 실행해 데스크톱 빠른 로그인 패널을 제공한다.
- 계정은 `test01`부터 `test20`까지이며 `schema.sql`이 멱등적으로 보장한다.
- 빠른 로그인 API는 테스트 하네스가 켜진 경우에만 응답한다.
- 일반 로그인과 사용자별 데이터 소유권 검사는 빠른 로그인 이후에도 동일하게 적용된다.
- 공개 데모를 종료할 때는 Compose의 값을 `false`로 바꾸고 API 컨테이너만 재생성한다.

## 데이터 변경 경계

- 현재 SQLite schema 원본은 `backend/src/main/resources/schema.sql`이다.
- 운영 DB가 만들어진 뒤 `schema.sql` hash가 바뀌면 자동 배포를 중단한다.
- schema 변경은 같은 배포에 멱등적인 운영 migration을 추가해야 한다. 배포기는 새 migration이 준비한 schema hash를 기록해 실패 후 동일 release 재시도도 허용한다.
- release 교체나 롤백 과정에서 SQLite 데이터 디렉터리를 삭제하지 않는다.

## 비밀정보

공개 저장소에는 다음 값을 저장하지 않는다.

- 인스턴스 주소와 클라우드 리소스 식별자
- SSH 사용자, 개인키, known-host 원문과 로컬 키 경로
- OpenAI API 키 및 기타 애플리케이션 자격 증명
- 서버 환경 파일의 내용과 실제 사용자 기록

SSH 배포 자격 증명은 GitHub Actions의 `production-api` 환경 Secrets에서만 관리한다. 애플리케이션 비밀값은 서버의 권한 제한된 환경 파일에서만 읽으며 workflow가 덮어쓰지 않는다.
