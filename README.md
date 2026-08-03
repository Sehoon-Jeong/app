# SkinCause

> 현재 잘 쓰는 스킨케어 루틴을 기준으로 다음에 시험할 제품을 추천하고, 한 제품씩 사용한 결과를 다음 추천에 다시 활용하는 AI 스킨케어 실험 서비스

## 해결하려는 문제

신제품을 여러 개 비슷한 시기에 바꾸면 피부가 불편해졌을 때 무엇이 달라졌는지 구분하기 어렵다. 사용자는 원인과 관계없을 수 있는 기존 제품까지 모두 중단하고, 시간이 지나면 같은 시행착오를 반복한다.

SkinCause는 피부를 진단하거나 범인을 지목하지 않는다. 현재 안정 루틴을 기준으로 변수를 줄여 시험하고, 문제가 생겨도 잘 쓰던 루틴까지 함께 포기하지 않도록 돕는다.

## 사용자가 겪는 흐름

```text
안정 루틴 등록
→ 실제 제품 후보 추천
→ 루틴 차이와 실험 순서 확인
→ 한 제품씩 사용하고 필요한 시점에 관찰
→ 정상 완료 또는 Rescue
→ 결과를 Beauty Archive에 저장
→ 다음 제품 추천에 개인 경험 반영
```

추천은 “잘 맞는 제품”이라는 보장이 아니라 **현재 루틴에서 다음에 시험할 실제 제품 후보**다. AI는 허용된 제품 안에서 추천 순위와 설명을 제안하고, 기록과 이미지를 구조화하며, 근거·반대 근거·불확실성을 설명한다. 권한, 상태 전이, 루틴 차이와 Rescue 분류는 일반 코드가 결정한다.

## 처음 보는 사람의 읽는 순서

1. [제품 소개](./docs/01-product-brief.md)
2. [MVP 정의](./docs/02-mvp-definition.md)
3. [User Story Map](./docs/product/story-map.md)
4. [핵심 사용자 흐름](./docs/product/user-flows.md)
5. [제품 규칙과 AI 경계](./docs/product/product-rules.md)

구현을 시작할 때는 [전체 문서 안내](./docs/README.md), [GitHub Project](https://github.com/orgs/sksksksksksss/projects/1)와 담당 Story를 함께 확인한다.

## 이번 MVP

- 기간: 3주
- 범위: GitHub Project의 P0와 P1
- 결과: 실제 URL에서 첫 실험과 다음 추천까지 이어지는 제품
- 제외: 피부질환 진단, 원인 확정, 코호트 추천, 브랜드 도구, 전문가 상담과 커머스

[통합 기능명세서](./docs/05-features/functional-specification.md)는 MVP 기능 전체의 조건·처리·결과를 설명하고, GitHub Story는 기능별 상세 흐름과 완료 조건을 관리한다. API 계약의 원본은 [`openapi.yaml`](./docs/api/openapi.yaml), 저장 구조의 원본은 [ERD와 데이터 사전](./docs/06-data-model/README.md)이다.
