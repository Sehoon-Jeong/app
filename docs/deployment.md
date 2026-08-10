# 백엔드 배포

## 공개 주소

| 용도 | URL |
| --- | --- |
| API 호스트 | <https://api.leafeep.com> |
| 헬스체크 | <https://api.leafeep.com/actuator/health> |
| API 계약 문서 | <https://skn-labs.github.io/app/api/> |
| 공개 저장소 | <https://github.com/skn-labs/app> |

## 배포 구조

- 배포 대상은 `backend/`의 Spring Boot API뿐이다. 프론트엔드는 OCI 배포에 포함하지 않는다.
- API는 OCI의 기존 ARM64 인스턴스에서 `skn-api` 컨테이너 하나로 실행한다.
- 컨테이너는 호스트 포트를 직접 공개하지 않고 기존 reverse proxy의 내부 Docker 네트워크에만 연결한다.
- TLS 종료와 외부 80/443 처리는 공유 reverse proxy가 맡는다.
- SQLite 파일과 백업은 애플리케이션 이미지 및 release 디렉터리 밖의 영속 저장소에 둔다.

## 자동 배포

`main`에 `backend/`, `deploy/oci/` 또는 백엔드 배포 workflow 변경이 푸시되면 다음 순서로 배포한다.

1. Java 17에서 백엔드 테스트를 실행한다.
2. 실행 JAR와 배포 파일로 release artifact를 만든다.
3. SSH로 OCI 인스턴스에 artifact를 전송한다.
4. 기존 SQLite가 있으면 SQLite backup API로 일관된 백업을 만들고 무결성을 검사한다.
5. commit SHA를 태그로 새 컨테이너 이미지를 만들고 API 컨테이너만 교체한다.
6. 컨테이너 내부 `/actuator/health`와 공개 HTTPS 헬스체크가 모두 성공해야 배포 성공으로 처리한다.
7. 내부 헬스체크가 실패하면 직전 컨테이너 이미지로 되돌린다.

workflow는 [deploy-backend.yml](../.github/workflows/deploy-backend.yml), 서버 배포 자산은 [`deploy/oci/`](../deploy/oci/)에 있다.

## 데이터 변경 경계

- 현재 SQLite schema 원본은 `backend/src/main/resources/schema.sql`이다.
- 운영 DB가 만들어진 뒤 `schema.sql` hash가 바뀌면 자동 배포를 중단한다.
- schema 변경은 운영 migration과 복구 검증을 먼저 추가한 뒤 배포한다.
- release 교체나 롤백 과정에서 SQLite 데이터 디렉터리를 삭제하지 않는다.

## 비밀정보

공개 저장소에는 다음 값을 저장하지 않는다.

- 인스턴스 주소와 클라우드 리소스 식별자
- SSH 사용자, 개인키, known-host 원문과 로컬 키 경로
- OpenAI API 키 및 기타 애플리케이션 자격 증명
- 서버 환경 파일의 내용과 실제 사용자 기록

SSH 배포 자격 증명은 GitHub Actions의 `production-api` 환경 Secrets에서만 관리한다. 애플리케이션 비밀값은 서버의 권한 제한된 환경 파일에서만 읽으며 workflow가 덮어쓰지 않는다.
