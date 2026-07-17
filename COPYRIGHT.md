# 에너지 퀘스트 — 저작권 확보 증빙 자료

> 제20회 디지털교육연구대회(교육용 SW·AI분과) 제출용.
> 본 소프트웨어에 포함된 모든 자산(이미지·폰트·오디오·코드)의 출처와 이용 권한을 아래와 같이 명시한다.

## 1. 요약

| 자산 유형 | 수량 | 출처 | 이용 근거 |
|---|---|---|---|
| 이미지(캐릭터·배경) | 40여 점 | 생성형 AI(ChatGPT, OpenAI)로 출품자가 직접 생성 | OpenAI 이용약관 — 생성물(Output)에 대한 권리는 이용자에게 귀속 |
| 폰트 | 3종 | Google Fonts 웹폰트 | SIL Open Font License 1.1 (자유 이용) |
| 오디오(BGM·효과음) | 9점 | Freesound.org(CC0) · Vrew 내보내기 · 자체 합성 | CC0(퍼블릭 도메인) / 자체 제작 |
| 소스 코드 | 전체 | 출품자 자체 개발(생성형 AI 협업) | 자작(외부 라이브러리·프레임워크 미사용) |

## 2. 이미지 (생성형 AI 생성)

- **생성 도구**: ChatGPT (OpenAI) 이미지 생성 기능
- **생성 주체**: 출품자(교사) 본인 계정으로 직접 생성 — 학생의 생성형 AI 이용 없음(연령 제한 약관 위반 없음)
- **권리 근거**: OpenAI 이용약관(Terms of Use)은 서비스가 생성한 결과물(Output)에 대한 OpenAI의 권리·소유권을 이용자에게 양도함을 명시
- **대상 파일** (`assets/` 전체):
  - 주인공 4인 × 3방향(정면/뒤/옆) 치비 일러스트: `char_haetsal*`, `char_nari*`, `char_nuri*`, `char_saebyeok*` (12점)
  - NPC 캐릭터 23점: `npc_*.png`
  - 보스·컷신: `blackheart.jpg`, `boss_blackheart.jpg`, 배경 `bg_stage1.png`, `clear_bg.jpg`, `cutscene_bg.jpg`
- 게임 내 그 외 그래픽(타일·이펙트·UI)은 전부 **코드(Canvas API)로 절차 생성** — 외부 이미지 아님

## 3. 폰트 (SIL Open Font License 1.1)

| 폰트 | 저작자 | 사용처 | 라이선스 |
|---|---|---|---|
| Do Hyeon | 우아한형제들(Woowa Brothers) | 게임 전 화면 | SIL OFL 1.1 |
| Noto Sans KR | Google | 교사용 취합·오답 노트 본문 | SIL OFL 1.1 |
| Press Start 2P | CodeMan38 | 보스전 픽셀 숫자·라벨 | SIL OFL 1.1 |

- Google Fonts 웹폰트 링크 방식으로 사용(폰트 파일 재배포 없음). OFL은 상업적 이용 포함 자유 이용 허용.

## 4. 오디오

| 파일 | 용도 | 출처 | 라이선스 |
|---|---|---|---|
| `quiz_false.mp3` | 오답 효과음 | Freesound.org — Beetlemuse 작 "Wrong! No!" (2023, 파일 메타데이터로 확인) | CC (원본 페이지 확인 후 확정) |
| `quiz_true.mp3` | 정답 효과음 | Freesound.org (추정) | 확인 예정 |
| `item_collect.mp3` | 아이템 획득 | Freesound.org (추정) | 확인 예정 |
| `stage_clear.mp3` | 스테이지 클리어 | Freesound.org (추정) | 확인 예정 |
| `victory.mp3` | 승리 | Freesound.org (추정) | 확인 예정 |
| `warp.mp3` | 포털 이동 | Freesound.org (추정) | 확인 예정 |
| `wind.mp3` | 환경음 | Freesound.org (추정) | 확인 예정 |
| `bgm.mp3` | 배경 음악 | Vrew(보이저엑스)에서 내보내기(파일 메타데이터 "vrew Audio Export"로 확인) | Vrew 콘텐츠 이용 정책 확인 예정 |
| `quiz_answer_npc_talk.wav` | 대화·선택 효과음 | **출품자 자체 합성 제작**(사인파 합성 프로그램 작성) | 자작 |

- Freesound.org 음원은 대부분 CC0(출처 표기 불요)이나 CC-BY(출처 표기 필요) 음원도 있으므로,
  **다운로드 계정의 기록에서 각 음원의 원본 페이지 URL과 라이선스를 확인해 최종본에 확정 기재한다.**
- 기존 `quiz_answer_npc_talk.mp3`는 메타데이터에서 상용 서비스(Facebook) 알림음으로 확인되어
  **2026-07-17 자체 제작 음원으로 교체·삭제함** (저작권 위험 제거).

## 5. 소스 코드

- HTML/CSS/JavaScript **순수 자체 개발** — 외부 라이브러리·프레임워크·엔진 미사용 (jQuery, Unity, RPG Maker 등 일절 없음)
- 개발 과정에서 **생성형 AI(Anthropic Claude)를 코딩 도구로 활용**하였으며, 산출 코드는 출품자가 검토·수정·통합함
- 서비스워커·Canvas 렌더링·오디오 엔진 등 전 모듈 자작

## 6. 학생 개인정보 관련

- 게임은 **서버 없이 동작**하며 학생 데이터를 외부로 전송하지 않음
- 학습 결과는 학생 기기 안(localStorage)에만 기록되고, 학생이 직접 CSV 파일로 저장해 교사에게 제출하는 방식
- 후기(설문)는 선택 사항이며 익명으로 수집(이름·학교 미수집)

---
*최종 업데이트: 2026-07-17*
