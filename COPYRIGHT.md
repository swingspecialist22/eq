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
| `quiz_false.mp3` | 오답 효과음 | Freesound — Beetlemuse, "False C" — https://freesound.org/people/Beetlemuse/sounds/692847/ (길이 1.53초 일치 확인) | **CC0** |
| `quiz_true.mp3` | 정답 효과음 | Freesound — oggraphics, "Good answer harp glissando" — https://freesound.org/people/oggraphics/sounds/610703/ (원본 6.7초 중 3초 발췌 편집) | **CC0** |
| `item_collect.mp3` | 아이템 획득 | Freesound — Leszek_Szary, "3 up 1" — https://freesound.org/people/Leszek_Szary/sounds/171580/ (길이 2.18초 일치 확인) | **CC0** |
| `stage_clear.mp3` | 스테이지 클리어 | Freesound — FunWithSound, "Success Fanfare Trumpets" — https://freesound.org/people/FunWithSound/sounds/456966/ (길이 4.44초 일치 확인) | **CC0** |
| `victory.mp3` | 승리 | Freesound — JoanStar, "Victory Jingle" — https://freesound.org/people/JoanStar/sounds/844831/ (길이 4.00초 일치 확인) | **CC0** |
| `warp.mp3` | 포털 이동 | Freesound — colorsCrimsonTears, "Time Travel - Future" — https://freesound.org/people/colorsCrimsonTears/sounds/585801/ (길이 4.33초 일치 확인) | **CC0** |
| `wind.mp3` | 환경음(10초 발췌) | Freesound 풍력 터빈 실녹음 — ①Funkelfang, "Wind Turbine - Rhythmic Swoosh and Mechanical Hum" https://freesound.org/people/Funkelfang/sounds/845351/ (**CC BY 4.0**) ②nicola_ariutti, "wind_turbine" https://freesound.org/people/nicola_ariutti/sounds/648493/ (CC0) 중 발췌 편집 | CC BY 4.0 기준 준수 |
| `bgm.mp3` | 배경 음악(60초 루프) | Vrew(보이저엑스)에서 내보내기(파일 메타데이터 "vrew Audio Export"로 확인) | Vrew 콘텐츠 이용 정책 |
| `quiz_answer_npc_talk.wav` | 대화·선택 효과음 | **출품자 자체 합성 제작**(사인파 합성 프로그램으로 생성) | 자작 |

### 저작자 표시 (CC BY 4.0 준수)

> 풍력 환경음: "Wind Turbine - Rhythmic Swoosh and Mechanical Hum (Close Perspective)" by **Funkelfang** (freesound.org), licensed under **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/). 원본에서 10초 발췌·편집.

- 위 표의 길이 일치 확인 = 게임 파일을 디코딩해 실측한 재생 시간과 원본 페이지 표기 시간의 대조 결과.
- wind.mp3는 후보 원본이 2건이라 확정이 어려워, **더 엄격한 라이선스(CC BY 4.0) 기준으로 저작자 표시를 포함**함. CC0 쪽이 원본이어도 표시가 불이익이 되지 않음.
- 기존 `quiz_answer_npc_talk.mp3`(Freesound — Alexhanj, "Facebook Pop.m4a", CC0, https://freesound.org/people/Alexhanj/sounds/449861/)는 CC0로 적법하게 사용 가능했으나,
  제목이 상용 서비스명을 포함해 심사 과정에서 오해 소지가 있어 **2026-07-17 자체 제작 음원으로 교체함**.

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
