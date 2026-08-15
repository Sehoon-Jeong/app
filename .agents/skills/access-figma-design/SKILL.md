---
name: access-figma-design
description: macOS 키체인의 개인 Figma 토큰으로 SKN 디자인 파일의 페이지, 섹션, 프레임, 텍스트와 노드 구조를 조회한다. 사용자가 Figma 시안·화면·노드·섹션의 위치나 구현 근거를 묻거나, Figma 링크를 주며 디자인을 확인·비교·구현하라고 요청할 때 사용한다.
---

# SKN Figma 디자인 접근

SKN 디자인을 Figma REST API로 읽고 구현에 필요한 구조와 값을 확인한다. 기본 파일 키는 `0vA4tVGkiS1Us0Tvf7rNDF`이다.

## 인증

1. `security find-generic-password -a "$(id -un)" -s "codex.figma.personal-access-token" >/dev/null`로 키체인 항목의 존재만 확인한다.
2. 토큰이 필요한 명령은 `scripts/with_figma_token.sh <command> [args...]`로 실행한다.
3. 토큰을 출력하거나 명령 인자, 파일, 로그, 응답, 커밋에 넣지 않는다.
4. 키체인 항목이 없으면 작업을 중단하고 Mac에 토큰 등록이 필요하다고 알린다. 토큰 값을 채팅으로 다시 요구하지 않는다.

## 조회 절차

1. 사용자가 준 Figma URL에서 파일 키와 `node-id`를 확인한다. URL의 `245-3870`은 API 노드 ID `245:3870`으로 바꾼다.
2. 전체 파일 구조가 필요하면 스킬 디렉터리에서 다음처럼 조회한다.

   ```bash
   scripts/with_figma_token.sh \
     python3 scripts/figma_api.py GET \
     '/v1/files/0vA4tVGkiS1Us0Tvf7rNDF?depth=8'
   ```

3. 특정 노드는 응답 크기를 줄이기 위해 nodes API를 우선 사용한다.

   ```bash
   scripts/with_figma_token.sh \
     python3 scripts/figma_api.py GET \
     '/v1/files/0vA4tVGkiS1Us0Tvf7rNDF/nodes?ids=245%3A3870&depth=4'
   ```

4. 필요한 노드 이름, 텍스트, 상위 경로, `absoluteBoundingBox`와 구현에 필요한 스타일만 추출한다. 대량 JSON을 저장소에 남기지 않는다.
5. 이미지가 필요하면 Figma images API로 임시 URL을 얻되 결과 파일은 사용자가 요청한 위치에만 저장한다.

## 디자인 스냅샷과 증분 비교

사용자가 현재 디자인 보존이나 이후 변경분 비교를 요청하면 `scripts/capture_snapshot.py`를 사용한다. 기본 대상은 상세 디자인의 `AI 제품탐색`과 `내 화장품(My LAB)`이다.

```bash
scripts/with_figma_token.sh \
  python3 scripts/capture_snapshot.py
```

- 결과는 `snapshots/<KST 시각>/` 아래에 생성한다.
- `snapshot.json`은 노드 ID, 계층, 텍스트, 위치·크기와 구현에 필요한 시각 속성만 정규화해 보존한다. 토큰과 Figma 임시 이미지 URL은 저장하지 않는다.
- `renders/`에는 각 섹션 바로 아래 모바일 프레임의 PNG 렌더를 저장한다. 이 이미지는 구현 비교용이지 제품 UI 애셋이 아니다.
- 앞선 스냅샷이 있으면 `diff-from-previous.md`에 추가·삭제된 노드와 변경된 속성 경로를 기록한다. 다음 구현 작업은 이 파일과 변경 노드만 먼저 확인한다.
- `manifest.json`의 파일 hash로 스냅샷 파일 무결성을 확인한다.
- 원본 Figma 응답 전체를 저장소에 저장하지 않는다.

## 주요 노드

- `0:1`: `Page 1`
- `245:3870`: 상세 디자인의 `AI 제품탐색` 섹션
- `245:3890`: 상세 디자인의 `내 화장품(My LAB)` 섹션
- `173:850`: 초기안의 `AI 제품탐색` 섹션
- `173:924`: 초기안의 `내 화장품/My LAB` 빈 섹션

노드가 이동하거나 이름이 바뀌었을 수 있으므로 API 결과를 현재 기준으로 삼는다. 상세 디자인의 두 섹션은 공통 프레임의 자식이 아니라 `Page 1` 바로 아래의 별도 `SECTION`이다.

## 변경 안전성

- 디자인 확인과 구현 요청에는 읽기 API만 사용한다.
- 코멘트 작성·수정·삭제처럼 Figma 상태를 바꾸는 작업은 사용자가 명시적으로 요청한 대상에만 수행한다.
- `scripts/figma_api.py`에는 `api.figma.com`의 상대 `/v1/` 경로만 전달한다.
- 권한 오류가 나면 토큰 권한과 파일 공유 상태를 설명하고 토큰 값을 노출하지 않는다.
