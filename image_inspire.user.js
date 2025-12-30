// ==UserScript==
// @name         *image_inspire_user 대본 생성
// @namespace    http://tampermonkey.net/
// @version      2.0.2
// @description  동기부여 숏폼 대본 + 이미지 프롬프트 자동 생성 (완전 자동).
// @author       Atobro.
// @match        https://claude.ai/project/019acacd-561c-73cb-a931-99d770d0a0f4
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/create_image_motive.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/create_image_motive.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🎯 Create Motivation 대본 생성기 시작');

    // 전역 변수
    let isRunning = false;
    let currentStep = 0;
    let allResponses = [];
    const MAX_STEPS = 7;

    // ============================================
    // 7단계 프롬프트 정의ㄴ
    // ============================================
    const STEP_PROMPTS = [
        {
            name: "터지는 기승전결 패턴 학습",
            prompt: `1단계: 터지는 숏폼 기승전결 패턴 학습

당신은 숏폼 콘텐츠 전문가입니다. 아래의 검증된 기승전결 패턴들을 학습하세요.

📚 동기부여 콘텐츠에 최적화된 기승전결 패턴:

【패턴 A: 불가능 도전형】
- 기: 도저히 성공 못할 것 같은 미션/상황 제시
- 승: 이상하거나 독특한 방식으로 도전 시작
- 전: 점점 극한에 몰리는 상황, 실패 위기
- 결: 극적인 성공 또는 실패를 통한 교훈
- 특징: 몰입 + 감정 + 도전정신

【패턴 B: 바닥에서 역전형】
- 기: 완전한 실패/바닥 상황 노출
- 승: 계속되는 실수, 주변의 비판과 우려
- 전: 포기하고 싶은 절망적 순간
- 결: 예상을 뛰어넘는 극적 반전, 숨겨진 실력 발휘
- 특징: 초기 실패 + 인내 + 반전의 카타르시스

【패턴 C: 평범한 영웅형】
- 기: 위기 상황 또는 남들이 외면하는 문제
- 승: 평범한 사람이 자발적으로 나섬
- 전: 극한 상황에서도 끝까지 버티는 의지
- 결: 성공적 해결, 영웅으로 인정받음
- 특징: 희생정신 + 휴먼 감동

【패턴 D: 숨겨진 진실형】
- 기: 누구나 아는 평범한 상식/믿음 제시
- 승: "하지만 진실은..." 반전 암시
- 전: 충격적인 데이터/사례로 기존 믿음 파괴
- 결: 새로운 인사이트, 행동 변화 유도
- 특징: 인식전환 + 교육 + 자극

【패턴 E: 1% vs 99%형】
- 기: "99%가 모르는", "상위 1%만 아는" 후킹
- 승: 일반인의 잘못된 접근 방식 지적
- 전: 성공한 사람들의 차별화된 방법 공개
- 결: 구체적 실천법 또는 마인드셋 제시
- 특징: 희소성 + 엘리트 심리 자극

📌 동기부여 콘텐츠 핵심 원칙:
1. 첫 3초 후킹이 생명 (충격/질문/반전)
2. 감정 롤러코스터 필수 (좌절→희망→감동)
3. 구체적 숫자/사례가 신뢰도 상승
4. 마지막은 행동 유도 또는 여운

이해했으면 '패턴 학습 완료'라고 짧게 답변하세요.`
        },
        {
            name: "동기부여 콘텐츠 특성 학습",
            prompt: `2단계: 동기부여 숏폼 콘텐츠 특성 학습

📊 동기부여 콘텐츠 성공 공식:

【타겟 분석】
- 주 시청층: 20-40대 (자기계발에 관심 있는 직장인/학생)
- 시청 상황: 출퇴근길, 잠들기 전, 무기력할 때
- 원하는 것: 짧은 시간에 동기부여, 실천 가능한 인사이트

【터지는 주제 카테고리】
1. 성공 스토리: 유명인의 알려지지 않은 실패담, 역전 스토리
2. 마인드셋: 생각의 전환, 관점 변화
3. 습관/루틴: 아침 루틴, 생산성, 시간 관리
4. 돈/커리어: 부자들의 습관, 성공한 사람들의 공통점
5. 인간관계: 거절하는 법, 자존감, 경계 설정
6. 멘탈 관리: 불안 극복, 자신감, 회복탄력성

【후킹 공식 (첫 문장)】
- 충격형: "이 한 가지 습관이 당신의 인생을 망치고 있습니다"
- 질문형: "왜 열심히 해도 성공 못할까요?"
- 숫자형: "상위 1%가 절대 말 안 하는 비밀"
- 반전형: "성공한 사람들은 절대 이렇게 안 합니다"
- 공감형: "아침에 일어나기 싫은 당신에게"

【금지 사항】
❌ 뻔한 명언 나열 ("포기하지 마세요")
❌ 추상적인 조언 ("긍정적으로 생각하세요")
❌ 설교 톤 ("~해야 합니다")
❌ 근거 없는 주장
❌ 너무 긴 문장

【필수 요소】
✅ 구체적 사례/숫자
✅ 감정 이입 가능한 상황
✅ 반전 또는 깨달음 포인트
✅ 실천 가능한 테이크어웨이

이해했으면 '특성 학습 완료'라고 짧게 답변하세요.`
        },
        {
            name: "주제 자동 선택",
            prompt: `3단계: 오늘의 주제 자동 선택

지금까지 학습한 패턴과 특성을 바탕으로, 터질 가능성이 높은 동기부여 주제를 선택하세요.

📌 주제 선택 기준:
1. 보편적 공감대 (많은 사람이 겪는 고민)
2. 신선한 관점 (뻔하지 않은 접근)
3. 감정 자극 (분노/공감/희망/충격 중 하나)
4. 실용성 (바로 적용 가능)

📌 주제 풀 (이 중에서 랜덤 선택하거나 조합):

【성공/실패 스토리】
- 실패를 딛고 일어선 사람들의 공통점
- 늦게 시작해서 성공한 사람들
- 모두가 반대했지만 성공한 결정
- 성공 직전에 포기한 사람들의 특징

【마인드셋/심리】
- 자존감 낮은 사람들의 무의식적 습관
- 성공하는 사람들의 아침 첫 생각
- 불안을 없애는 의외의 방법
- 거절을 잘하는 사람들의 비밀

【습관/생산성】
- 상위 1%의 시간 사용법
- 하루 5분으로 인생 바꾸는 습관
- 미루는 습관을 고치는 심리 트릭
- 번아웃 직전 사람들의 공통 신호

【돈/커리어】
- 부자들이 절대 안 하는 한 가지
- 연봉 협상에서 99%가 하는 실수
- 30대에 후회하는 20대 결정들
- 회사에서 인정받는 사람들의 특징

【인간관계】
- 좋은 사람인 척하다 망하는 이유
- 진짜 친구를 구별하는 방법
- 관계에서 손해 보는 사람들의 패턴
- 혼자 있는 시간이 중요한 이유

🎯 지금 바로 위 주제 중 하나를 선택하고, 아래 형식으로 출력하세요:

---
【선택한 주제】: (주제명)
【선택 이유】: (왜 이 주제가 터질 가능성이 높은지 2-3문장)
【적용할 기승전결 패턴】: (패턴 A~E 중 선택)
【타겟 감정】: (분노/공감/희망/충격 중 선택)
【예상 후킹 방향】: (첫 문장 방향성)
---`
        },
        {
            name: "기승전결 구조 설계 + 초안",
            prompt: `4단계: 기승전결 구조 설계 및 초안 작성

선택한 주제와 패턴을 바탕으로 대본의 뼈대를 설계하세요.

📐 구조 설계 템플릿:

【기 (0-8초) - 후킹】
목표: 스크롤 멈추게 하기
- 충격적 사실 또는 질문
- 시청자의 고민/욕구 자극
- "이 영상 끝까지 보면 ~" 암시

【승 (8-20초) - 문제 심화】
목표: "맞아, 나도 그래" 공감 유도
- 구체적 상황/사례 제시
- 일반적인 (잘못된) 접근 방식 언급
- 왜 대부분 실패하는지 설명

【전 (20-40초) - 반전/해결】
목표: 핵심 인사이트 전달
- "하지만 진짜는..." 반전 포인트
- 성공한 사람들의 차별화된 방법
- 구체적 데이터/연구/사례로 뒷받침

【결 (40-50초) - 마무리】
목표: 행동 유도 + 여운
- 핵심 메시지 한 줄 정리
- 실천 가능한 첫 걸음 제시
- CTA (좋아요/댓글 유도)

---

📝 아래 형식으로 초안을 작성하세요:

【기승전결 구조표】
| 구분 | 시간 | 핵심 내용 | 감정 유도 |
|------|------|----------|----------|
| 기 | 0-8초 | (내용) | (감정) |
| 승 | 8-20초 | (내용) | (감정) |
| 전 | 20-40초 | (내용) | (감정) |
| 결 | 40-50초 | (내용) | (감정) |

【초안 대본】
(여기에 전체 대본 초안 작성)

【후킹 포인트】: (첫 문장)
【와우 포인트】: (가장 임팩트 있는 부분)
【CTA】: (마지막 행동 유도)`
        },
        {
            name: "대본 고도화 + 3개 버전",
            prompt: `5단계: 대본 고도화 및 3개 버전 생성

초안을 바탕으로 퀄리티를 높이고, 관점이 다른 3개 버전을 만드세요.

📌 고도화 체크리스트:
✅ 첫 문장이 충분히 강렬한가?
✅ 문장이 자연스럽게 이어지는가?
✅ 구체적 숫자/사례가 있는가?
✅ 감정 롤러코스터가 있는가?
✅ 뻔한 표현은 없는가?
✅ 실천 가능한 내용인가?

📌 말투 규칙:
- "했습니다 / 했는데요 / 했었죠 / ~고 / ~어서" 다양하게
- "~은데", "래요~", "때문에~" 늘어지는 어미 지양
- 쉼표(,) 마침표(.) 사용 금지
- 자연스럽게 흐르는 구어체

📌 3개 버전 차별화:
버전 1: 【스토리형】 - 특정 인물/사례 중심
버전 2: 【데이터형】 - 연구/통계 중심
버전 3: 【공감형】 - 시청자 직접 호소

---

각 버전을 아래 형식으로 작성하세요:

## 버전 1: 스토리형
【후킹 포인트】:
【와우 포인트】:
【완성 대본】:
\`\`\`
(대본 내용 - 줄바꿈 포함)
\`\`\`
【글자수】: (공백 제외)

## 버전 2: 데이터형
(동일 형식)

## 버전 3: 공감형
(동일 형식)

---
⚠️ 각 대본은 공백 제외 400-550자 (1.2배속 35-45초)
⚠️ 모든 버전의 핵심 메시지는 동일하되, 전달 방식만 다르게`
        },
        {
            name: "최종 대본 선택 + 검증",
            prompt: `6단계: 최종 대본 선택 및 검증

3개 버전 중 가장 터질 가능성이 높은 대본을 선택하고 최종 검증하세요.

📌 선택 기준:
1. 첫 3초 후킹력 (스크롤 멈춤)
2. 시청 지속력 (끝까지 볼 이유)
3. 공유 가능성 (남에게 보여주고 싶은가)
4. 댓글 유도력 (의견 남기고 싶은가)

📌 최종 검증 체크리스트:
□ 유튜브/틱톡 가이드라인 위반 없는가?
□ 허위 정보/과장된 통계 없는가?
□ 특정 집단 비하 없는가?
□ 글자수 400-550자 범위인가?
□ CTA가 자연스러운가?

📌 CTA 예시 (동기부여용):
- "이 영상이 도움됐다면 좋아요 꾹"
- "당신의 생각은 어떤가요? 댓글로 알려주세요"
- "오늘부터 시작할 사람만 좋아요"
- "이미 실천 중인 사람 손들어"

---

아래 형식으로 출력하세요:

## 🏆 최종 선택: 버전 X

【선택 이유】:
(다른 버전과 비교해서 왜 이 버전이 더 나은지)

【수정 사항】:
(최종 다듬기 - 있다면)

【검증 결과】:
- 가이드라인: ✅/❌
- 팩트체크: ✅/❌
- 글자수: XXX자

【최종 대본】:
\`\`\`
(최종 대본 - 줄바꿈 포함, 기호 없이)
\`\`\``
        },
        {
            name: "최종 출력 (대본 + 이미지 프롬프트)",
            prompt: `7단계: 최종 출력

🚨 CRITICAL: 아래 형식을 **정확히** 따라야 합니다!

⛔ 절대 금지:
- "Let me create..." 같은 메타 설명
- "I need to..." 같은 과정 설명
- 마커 밖에 어떠한 텍스트도 금지
- 한국어 컨셉 설명 금지

✅ 필수:
- 마커 안에만 내용 작성
- 이미지 프롬프트는 **영어**
- 각 프롬프트는 **번호로 시작** (1. 2. 3. ...)
- 10-15개 프롬프트 (넉넉하게)
- **PROMPTS + SCENES 둘 다 출력**

---

📌 이미지 프롬프트 작성 규칙:
- 완전한 영어 문장
- 9:16 명시
- 시네마틱/감성적 스타일
- 사람 얼굴 피하거나 뒷모습/실루엣
- 각 프롬프트 50-180단어

📌 장면 구성 (대본 내용 기반):
1-2장: 기 - 후킹 장면
3-4장: 승 - 문제 시각화
5-7장: 전 - 반전/돌파
8-10장: 결 - 희망/성취

---

🎯 출력 형식 (3개 마커 모두 출력):

---SCRIPT_START---
요즘 뭐 하나 제대로 되는 게 없죠
열심히 하는데 결과가 안 나오고
노력해도 달라지는 게 없고
이러다 진짜 안 되는 거 아닌가 싶죠
근데 알아요?
지금 이 순간이 제일 힘든 거예요
로켓이 지구를 벗어날 때
가장 많은 연료를 쓰는 것처럼
지금 당신도 저항이 제일 센 구간을 지나는 중이에요
포기하고 싶죠
근데 금 캐는 사람들 있잖아요
딱 3피트만 더 팠으면 금맥이었는데
거기서 포기한 사람이 제일 많대요
지금 조금만 더 버텨보세요
오늘 하루만 포기하지 마세요
내일은 몰라도 오늘만큼은요
(... 6단계 최종 대본 전체 ...)
---SCRIPT_END---

---PROMPTS_START---
1. Exhausted person staring at laptop screen in dimly lit room, overwhelmed and stressed expression, dark moody atmosphere, cinematic lighting, shallow depth of field, 9:16 vertical composition
2. Multiple crumpled rejection letters scattered on wooden desk, single desk lamp illuminating papers, despair concept, dramatic shadows, 9:16 aspect ratio
3. Back view of person exercising alone in empty gym, no results feeling, melancholic mood, muted colors, cinematic framing, 9:16
4. Close-up of brain illustration with dark clouds and negative thoughts visualization, mental struggle concept, abstract artistic style, 9:16
5. Dramatic shot of rocket breaking through Earth's atmosphere, intense fire and smoke, resistance visualization, epic scale, cinematic lighting, 9:16
6. Underground gold mine tunnel with pickaxe, just 3 feet before gold vein metaphor, dim lighting, perseverance concept, vertical composition, 9:16
7. Small crack of golden light appearing in darkness, breakthrough moment, hope emerging, dramatic lighting contrast, 9:16 cinematic
8. Beautiful sunrise breaking through storm clouds, rays of light piercing darkness, new hope and beginning concept, epic sky, 9:16
9. Silhouette of person taking one determined step forward on mountain path, perseverance visualization, inspiring mood, golden hour lighting, 9:16
10. Back view of person reaching towards bright goal just ahead, almost there concept, silhouette against light, inspirational composition, 9:16
11. Hands holding small flickering candle in darkness, not giving up today concept, intimate close-up, emotional mood, 9:16
12. Person's shadow stretching towards distant mountain peak, journey visualization, determination, cinematic landscape, 9:16
13. Close-up of determined eyes with reflection of light, inner strength concept, emotional portrait, dramatic lighting, 9:16
14. Silhouette standing at edge of cliff facing sunrise, overcoming fear, inspirational mood, epic landscape, 9:16
15. Victory pose silhouette on mountain summit at golden hour, achievement and success, cityscape far below, cinematic composition, 9:16
---PROMPTS_END---

---SCENES_START---
1. lines: 1-2 | image: 1
2. lines: 3-4 | image: 2
3. lines: 5-6 | image: 3
4. lines: 7-8 | image: 4
5. lines: 9-10 | image: 5
6. lines: 11-12 | image: 6
7. lines: 13-14 | image: 7
8. lines: 15-16 | image: 8
---SCENES_END---

⚠️ SCENES 설명:
- lines: 대본 줄 번호 (1부터 시작)
- image: PROMPTS의 이미지 번호
- 모든 대본 줄이 빠짐없이 커버되어야 함
- 대본 줄 수에 맞게 조정할 것`
        }
    ];

    // ============================================
    // UI 스타일
    // ============================================
    GM_addStyle(`
        #script-automation-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 420px;
            background: linear-gradient(135deg, #FF6B9D 0%, #FFA06B 100%);
            color: white;
            padding: 25px;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        #script-automation-panel h3 {
            margin: 0 0 15px 0;
            font-size: 19px;
            text-align: center;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            font-weight: 600;
        }

        .category-badge {
            background: rgba(255,255,255,0.3);
            padding: 6px 18px;
            border-radius: 20px;
            font-size: 11px;
            display: inline-block;
            margin-bottom: 15px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .step-counter {
            text-align: center;
            font-size: 20px;
            font-weight: 600;
            margin: 15px 0;
            padding: 14px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }

        .step-name {
            font-size: 12px;
            opacity: 0.85;
            margin-top: 6px;
            font-weight: 400;
        }

        #generate-btn, #stop-btn {
            width: 100%;
            padding: 16px;
            font-size: 15px;
            font-weight: 600;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            margin-bottom: 10px;
            transition: all 0.3s ease;
        }

        #generate-btn {
            background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
            color: white;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        }

        #generate-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(16, 185, 129, 0.5);
        }

        #generate-btn:disabled {
            background: #999;
            cursor: not-allowed;
            opacity: 0.5;
            box-shadow: none;
        }

        #stop-btn {
            background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%);
            color: white;
            display: none;
        }

        #download-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 10px;
            transition: all 0.3s ease;
        }

        #download-btn:disabled {
            background: #999;
            cursor: not-allowed;
            opacity: 0.5;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            margin: 12px 0;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10B981, #34D399);
            transition: width 0.5s ease;
            width: 0%;
        }

        #automation-status {
            background: rgba(0,0,0,0.15);
            padding: 12px;
            border-radius: 10px;
            margin-top: 12px;
            font-size: 12px;
            max-height: 160px;
            overflow-y: auto;
        }

        .status-line {
            margin: 4px 0;
            padding: 6px 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 6px;
            font-size: 11px;
            line-height: 1.4;
        }

        .status-line.success {
            background: rgba(16, 185, 129, 0.3);
        }

        .status-line.error {
            background: rgba(255, 107, 107, 0.25);
        }

        .info-box {
            background: rgba(255,255,255,0.15);
            padding: 16px;
            border-radius: 10px;
            margin-bottom: 15px;
            font-size: 12px;
            line-height: 1.6;
        }

        .info-box label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 13px;
        }

        .info-box textarea {
            width: 100% !important;
            height: 110px !important;
            padding: 10px !important;
            border-radius: 8px !important;
            border: none !important;
            font-size: 12px !important;
            resize: vertical !important;
            background: white !important;
            color: #333 !important;
            line-height: 1.5 !important;
            font-family: 'Segoe UI', system-ui, sans-serif !important;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.1) !important;
        }

        .info-box textarea::placeholder {
            color: #999 !important;
            opacity: 0.8 !important;
        }

        .info-box small {
            display: block;
            margin-top: 6px;
            opacity: 0.75;
            font-size: 10px;
        }

        .info-box ul {
            margin: 8px 0 0 18px;
            padding: 0;
            font-size: 11px;
        }

        .info-box ul li {
            margin: 4px 0;
        }

        .info-box strong {
            display: block;
            margin-bottom: 6px;
            font-size: 12px;
        }
    `);

    // ============================================
    // 유틸리티 함수
    // ============================================
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function addStatus(message, type = 'normal') {
        const status = document.getElementById('automation-status');
        if (!status) return;

        const line = document.createElement('div');
        line.className = `status-line ${type}`;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        status.insertBefore(line, status.firstChild);

        while (status.children.length > 15) {
            status.removeChild(status.lastChild);
        }
        console.log(message);
    }

    function updateStepDisplay() {
        const stepCount = document.getElementById('step-count');
        const stepName = document.getElementById('step-name');
        const progressFill = document.getElementById('progress-fill');

        if (stepCount) {
            stepCount.textContent = `${currentStep} / ${MAX_STEPS}`;
        }
        if (stepName && currentStep > 0 && currentStep <= MAX_STEPS) {
            stepName.textContent = STEP_PROMPTS[currentStep - 1].name;
        }
        if (progressFill) {
            progressFill.style.width = `${(currentStep / MAX_STEPS) * 100}%`;
        }
    }

    function isClaudeResponding() {
        const stopButton = document.querySelector('button[aria-label="Stop response"]') ||
                          document.querySelector('button[aria-label="응답 중단"]');
        return stopButton !== null;
    }

    async function waitForResponseComplete(maxWait = 1800000) { // 🔥 30분으로 늘림 (긴 프롬프트 대비)
        const startTime = Date.now();

        addStatus('⏳ Claude 응답 대기 중...');
        let responseStarted = false;

        for (let i = 0; i < 40; i++) { // 🔥 10초 → 20초로 늘림
            if (isClaudeResponding()) {
                responseStarted = true;
                addStatus('✍️ Claude 응답 중...');
                break;
            }
            await sleep(500);
        }

        if (!responseStarted) {
            addStatus('✅ 응답 완료 (즉시)');
            await sleep(2000); // 🔥 1초 → 2초로 늘림
            return true;
        }

        // 2단계: 응답 완료 대기 (버튼 사라질 때까지)
        let checkCount = 0;

        while (isClaudeResponding()) {
            const elapsed = Date.now() - startTime;

            // 🔥 타임아웃 체크
            if (elapsed > maxWait) {
                addStatus(`⚠️ 응답 타임아웃 (${maxWait/60000}분 초과)`, 'error');
                throw new Error('응답 타임아웃');
            }

            // 🔥 30초마다 진행 상황 로그
            checkCount++;
            if (checkCount % 30 === 0) {
                const elapsedMin = Math.floor(elapsed / 60000);
                const elapsedSec = Math.floor((elapsed % 60000) / 1000);
                addStatus(`   ⏳ 응답 대기 중... (${elapsedMin}분 ${elapsedSec}초 경과)`);
            }

            await sleep(1000);
        }

        addStatus('✅ Claude 응답 완료!', 'success');
        await sleep(2000); // 🔥 2초 (안정화)
        return true;
    }

    // ============================================
    // 프롬프트 입력 함수
    // ============================================
    async function inputPrompt(promptText, maxRetries = 5) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                addStatus(`[${attempt}/${maxRetries}] 메시지 전송 시도...`);

                const inputField = document.querySelector('div.ProseMirror[contenteditable="true"]') ||
                                  document.querySelector('div[contenteditable="true"]');

                if (!inputField) {
                    throw new Error('입력 필드를 찾을 수 없습니다');
                }

                inputField.focus();
                inputField.click();
                await sleep(200);

                inputField.innerHTML = '';

                const lines = promptText.split('\n');
                lines.forEach((line, index) => {
                    if (line.trim()) {
                        const p = document.createElement('p');
                        p.textContent = line;
                        inputField.appendChild(p);
                    } else if (index < lines.length - 1) {
                        inputField.appendChild(document.createElement('br'));
                    }
                });

                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(500);

                let sendButton = document.querySelector('button[aria-label="Send message"]') ||
                                document.querySelector('button[aria-label="메시지 보내기"]');

                if (!sendButton) {
                    const buttons = document.querySelectorAll('button');
                    sendButton = Array.from(buttons).find(btn => {
                        const svg = btn.querySelector('svg');
                        if (!svg) return false;
                        const path = svg.querySelector('path');
                        if (!path) return false;
                        const d = path.getAttribute('d');
                        return d && d.includes('M208.49,120.49');
                    });
                }

                if (!sendButton || sendButton.disabled) {
                    throw new Error('전송 버튼 없음/비활성화');
                }

                sendButton.click();
                addStatus(`✅ 메시지 전송 성공!`, 'success');

                await waitForResponseComplete();
                return true;

            } catch (error) {
                addStatus(`⚠️ 실패: ${error.message}`, 'error');

                if (attempt < maxRetries) {
                    const waitTime = attempt * 2;
                    addStatus(`   ${waitTime}초 후 재시도...`);
                    await sleep(waitTime * 1000);
                } else {
                    throw error;
                }
            }
        }
        return false;
    }

    // ============================================
    // 응답 수집 함수 (마커 기반 추출)
    // ============================================
    function collectResponse() {
        try {
            const responses = document.querySelectorAll('div[class*="font-claude-response"][class*="leading-"]');
            console.log(`🔍 font-claude-response 개수: ${responses.length}`);

            // ============================================
            // 🔥 7단계(마지막)에서만 마커 기반 추출
            // ============================================
            if (currentStep === MAX_STEPS) {
                // 모든 응답에서 마커 찾기 (역순)
                for (let i = responses.length - 1; i >= 0; i--) {
                    const responseText = responses[i].innerText.trim();

                    // 대본 마커 확인
                    const scriptStart = '---SCRIPT_START---';
                    const scriptEnd = '---SCRIPT_END---';
                    const promptsStart = '---PROMPTS_START---';
                    const promptsEnd = '---PROMPTS_END---';
                    const scenesStart = '---SCENES_START---';
                    const scenesEnd = '---SCENES_END---';

                    if (responseText.includes(scriptStart) && responseText.includes(scriptEnd)) {
                        console.log(`🔍 응답 #${i}에서 마커 발견`);

                        // 대본 추출
                        const scriptStartIdx = responseText.indexOf(scriptStart) + scriptStart.length;
                        const scriptEndIdx = responseText.indexOf(scriptEnd);
                        const cleanScript = responseText.substring(scriptStartIdx, scriptEndIdx).trim();

                        // 이미지 프롬프트 추출 (기존 로직 유지)
                        let imagePrompts = [];
                        if (responseText.includes(promptsStart) && responseText.includes(promptsEnd)) {
                            const promptsStartIdx = responseText.indexOf(promptsStart) + promptsStart.length;
                            const promptsEndIdx = responseText.indexOf(promptsEnd);
                            const promptsText = responseText.substring(promptsStartIdx, promptsEndIdx).trim();

                            // 번호 패턴으로 분리 (1. 2. 3. ...)
                            imagePrompts = promptsText.split(/\n?\d+\.\s*/)
                                .map(line => line.trim())
                                .filter(line => line.length > 10);

                            // 🔥 번호 패턴 실패 시 줄바꿈으로 분리 (백업)
                            if (imagePrompts.length < 5) {
                                console.log('⚠️ 번호 패턴 실패, 줄바꿈으로 재시도');
                                imagePrompts = promptsText.split('\n')
                                    .map(line => line.trim())
                                    .filter(line => line.length > 20);
                            }
                        }

                        // 🔥 scenes 매핑 추출 (새로 추가)
                        let scenes = [];
                        if (responseText.includes(scenesStart) && responseText.includes(scenesEnd)) {
                            const scenesStartIdx = responseText.indexOf(scenesStart) + scenesStart.length;
                            const scenesEndIdx = responseText.indexOf(scenesEnd);
                            const scenesText = responseText.substring(scenesStartIdx, scenesEndIdx).trim();

                            // 각 줄 파싱: "1. lines: 1-2 | image: 1"
                            const sceneLines = scenesText.split('\n').filter(line => line.trim().length > 5);
                            
                            for (const line of sceneLines) {
                                // 형식: "1. lines: 1-2 | image: 1"
                                const match = line.match(/^\d+\.\s*lines:\s*(\d+)-(\d+)\s*\|\s*image:\s*(\d+)/i);
                                
                                if (match) {
                                    const startLine = parseInt(match[1]);
                                    const endLine = parseInt(match[2]);
                                    const imageIdx = parseInt(match[3]) - 1; // 0-based index
                                    
                                    // lines 배열 생성 (1-3 → [1, 2, 3])
                                    const lines = [];
                                    for (let l = startLine; l <= endLine; l++) {
                                        lines.push(l);
                                    }
                                    
                                    scenes.push({
                                        lines: lines,
                                        image_index: imageIdx
                                    });
                                }
                            }
                            
                            console.log(`   - scenes 매핑: ${scenes.length}개`);
                        }

                        console.log('✅ 마커 기반 추출 성공!');
                        console.log('   - 대본:', cleanScript.length, '글자');
                        console.log('   - 이미지 프롬프트:', imagePrompts.length, '개');
                        console.log('   - scenes 매핑:', scenes.length, '개');

                        // 🔥 대본 저장
                        localStorage.setItem('FINAL_SCRIPT', cleanScript);
                        window.FINAL_SCRIPT_FOR_PYTHON = cleanScript;

                        // 🔥 이미지 프롬프트 저장 (기존 유지)
                        if (imagePrompts.length > 0) {
                            const promptsJson = JSON.stringify(imagePrompts);
                            localStorage.setItem('IMAGE_PROMPTS', promptsJson);
                            window.IMAGE_PROMPTS = imagePrompts;

                            // 🔥 MOTIVATION_SCRIPT_JSON에 image_prompts + scenes 저장
                            const motivationData = {
                                image_prompts: imagePrompts,
                                scenes: scenes.length > 0 ? scenes : null
                            };
                            localStorage.setItem('MOTIVATION_SCRIPT_JSON', JSON.stringify(motivationData));
                            window.MOTIVATION_SCRIPT_JSON = motivationData;
                        }

                        // 🔥 scenes 별도 저장
                        if (scenes.length > 0) {
                            localStorage.setItem('SCENES_MAPPING', JSON.stringify(scenes));
                            window.SCENES_MAPPING = scenes;
                            console.log('   ✅ scenes 매핑 저장 완료');
                        }

                        return cleanScript;
                    }
                }

                console.warn('⚠️ 7단계인데 마커 못 찾음');
            }

            // ============================================
            // 마지막 단계 아니면 그냥 응답 수집 (저장 안 함)
            // ============================================
            if (responses.length > 0) {
                const lastResponse = responses[responses.length - 1];
                const markdownDiv = lastResponse.querySelector('[class*="standard-markdown"]') ||
                                   lastResponse.querySelector('[class*="progressive-markdown"]');

                let fallbackText = '';
                if (markdownDiv) {
                    fallbackText = markdownDiv.innerText.trim();
                } else {
                    fallbackText = lastResponse.innerText.trim();
                }

                console.log(`📝 ${currentStep}단계 응답 수집: ${fallbackText.length}글자 (저장 안 함)`);
                return fallbackText;
            }

            return '';
        } catch (error) {
            console.error('❌ collectResponse 오류:', error);
            return '';
        }
    }

    // ============================================
    // UI 생성
    // ============================================
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'script-automation-panel';
        panel.innerHTML = `
            <h3>🎯 Create: 동기부여 대본 생성</h3>
            <div style="text-align: center;">
                <span class="category-badge">MOTIVATION</span>
            </div>

            <div class="info-box">
                <label>💡 주제/키워드 (선택사항)</label>
                <textarea id="user-input"
                          placeholder="예시 1: 성공하는 사람들의 아침 습관
예시 2: 부자들이 절대 안 하는 3가지
예시 3: 랜덤으로 터질만한 주제 선택해서 진행

※ Python에서 자동 입력됩니다
※ 비워두면 Claude가 자동 선택"></textarea>
                <small>Python에서 자동 입력됩니다</small>
            </div>

            <div class="step-counter">
                단계: <span id="step-count">0 / 7</span>
                <div class="step-name" id="step-name">대기 중</div>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>

            <button id="start-btn">🚀 대본 생성 시작</button>
            <button id="stop-btn">⏹ 중지</button>
            <button id="download-btn" disabled>✅ 작업 완료</button>

            <div id="automation-status"></div>
        `;
        document.body.appendChild(panel);

        document.getElementById('start-btn').addEventListener('click', startGeneration);
        document.getElementById('stop-btn').addEventListener('click', stopGeneration);
    }

    // ============================================
    // 메인 자동화 함수
    // ============================================
    async function startGeneration() {
        // Python에서 입력된 프롬프트/키워드 가져오기
        const userPrompt = document.getElementById('user-input')?.value?.trim() || '';

        isRunning = true;
        currentStep = 0;
        allResponses = [];

        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('stop-btn').style.display = 'block';
        document.getElementById('download-btn').disabled = true;

        const promptField = document.getElementById('user-input');
        if (promptField) {
            promptField.disabled = true;
        }

        addStatus('🚀 동기부여 대본 생성 시작!', 'success');

        if (userPrompt) {
            addStatus(`📌 지정 주제: ${userPrompt.substring(0, 30)}...`);
        } else {
            addStatus('📌 자동 주제 선택 모드');
        }

        // 백그라운드 방지
        function keepAlive() {
            if (isRunning) requestAnimationFrame(keepAlive);
        }
        keepAlive();

        while (isRunning && currentStep < MAX_STEPS) {
            const step = STEP_PROMPTS[currentStep];
            currentStep++;
            updateStepDisplay();

            addStatus(`📝 ${currentStep}단계: ${step.name}`);

            let retryCount = 0;
            const maxRetries = 3;
            let stepSuccess = false;

            while (retryCount < maxRetries && !stepSuccess) {
                try {
                    if (retryCount > 0) {
                        addStatus(`🔄 재시도 ${retryCount}/${maxRetries}`, 'error');
                        await sleep(3000 * retryCount);
                    }

                    let promptToSend = step.prompt;

                    // 3단계이고 사용자 프롬프트가 있으면 주제 지정
                    if (currentStep === 3 && userPrompt) {
                        promptToSend = `3단계: 사용자 지정 주제로 진행

📌 사용자가 선택한 주제: "${userPrompt}"

위 주제로 동기부여 콘텐츠를 제작합니다.

아래 형식으로 출력하세요:

---
【선택한 주제】: ${userPrompt}
【선택 이유】: 사용자 지정 주제
【적용할 기승전결 패턴】: (패턴 A~E 중 이 주제에 가장 적합한 것 선택)
【타겟 감정】: (분노/공감/희망/충격 중 선택)
【예상 후킹 방향】: (첫 문장 방향성)
---`;
                    }

                    const success = await inputPrompt(promptToSend);

                    if (!success) {
                        throw new Error('프롬프트 입력 실패');
                    }

                    await sleep(2000);

                    // Continue 버튼 처리
                    let continueCount = 0;
                    while (continueCount < 2) {
                        const hasContinue = await handleContinue();
                        if (hasContinue) {
                            continueCount++;
                            await waitForResponseComplete();
                        } else {
                            break;
                        }
                    }

                    // 🔥 응답 수집 및 에러 체크
                    const response = collectResponse();

                    allResponses.push({
                        step: `${currentStep}. ${step.name}`,
                        response: response
                    });

                    stepSuccess = true;
                    addStatus(`✅ ${step.name} 완료`, 'success');

                } catch (error) {
                    retryCount++;
                    addStatus(`⚠️ 오류: ${error.message}`, 'error');

                    if (retryCount >= maxRetries) {
                        addStatus(`❌ ${step.name} 실패 (최대 재시도 초과)`, 'error');
                        localStorage.setItem('AUTOMATION_STATUS', 'FAILED');
                        localStorage.setItem('AUTOMATION_ERROR', `${step.name}: ${error.message}`);
                        stopGeneration();
                        return;
                    }
                }
            }

            await sleep(3000);
        }

        stopGeneration();
    }

    async function handleContinue() {
        await sleep(2000);
        const continueBtn = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent.includes('Continue') || btn.textContent.includes('계속')
        );

        if (continueBtn) {
            continueBtn.click();
            addStatus('✅ Continue 버튼 클릭됨');
            return true;
        }
        return false;
    }

    function stopGeneration() {
        isRunning = false;
        document.getElementById('start-btn').style.display = 'block';
        document.getElementById('stop-btn').style.display = 'none';

        if (currentStep >= MAX_STEPS) {
            addStatus('🎉 대본 생성 완료!', 'success');
            addStatus('📋 JSON이 localStorage에 저장됨', 'success');

            // 🔥 완료 버튼 활성화 (Python이 감지)
            document.getElementById('download-btn').disabled = false;

            // 결과 확인용
            const savedJson = localStorage.getItem('MOTIVATION_SCRIPT_JSON');
            if (savedJson) {
                console.log('=== 생성된 JSON ===');
                console.log(JSON.parse(savedJson));
            }
        } else {
            addStatus('⏹ 생성 중단됨');
        }
    }

    // ============================================
    // 초기화 (짜깁기 스크립트 기반)
    // ============================================
    function init() {
        console.log('🎯 Create Motivation 스크립트 초기화 시작...');
        console.log('📍 현재 URL:', window.location.href);

        if (!document.body) {
            console.error('❌ document.body가 없습니다!');
            setTimeout(init, 1000);
            return;
        }

        const existingPanel = document.getElementById('script-automation-panel');
        if (existingPanel) {
            console.log('🗑️ 기존 패널 제거');
            existingPanel.remove();
        }

        try {
            createPanel();
            console.log('✅ 패널 생성 시도 완료');

            const panel = document.getElementById('script-automation-panel');
            if (panel) {
                console.log('✅ 패널이 DOM에 추가됨');
                addStatus('✅ 동기부여 대본 생성기 준비 완료');
                addStatus('🚀 버튼을 눌러 시작하세요');
            } else {
                console.error('❌ 패널 생성 실패!');
            }
        } catch (error) {
            console.error('❌ 초기화 오류:', error);
        }
    }

    // ESC 키로 패널 숨기기/보이기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('script-automation-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        }
    });

    // 페이지 로드 대기 (짜깁기 스크립트 방식)
    function waitForPageLoad() {
        const body = document.body;
        const main = document.querySelector('main');
        const readyState = document.readyState;

        console.log('🔍 로딩 상태:', {
            hasBody: !!body,
            hasMain: !!main,
            readyState: readyState
        });

        if (body && main && (readyState === 'interactive' || readyState === 'complete')) {
            console.log('✅ 페이지 로드 완료 - 초기화 시작');
            setTimeout(() => {
                console.log('🎬 init() 실행');
                init();

                setTimeout(() => {
                    const panel = document.getElementById('script-automation-panel');
                    console.log('📦 패널 생성 확인:', !!panel);
                    if (panel) {
                        console.log('✅ UI 정상 표시됨');
                    } else {
                        console.error('❌ UI 생성 실패 - 재시도');
                        init();
                    }
                }, 500);
            }, 2000);
        } else {
            console.log('⏳ 페이지 로딩 대기 중...');
            setTimeout(waitForPageLoad, 500);
        }
    }

    // 시작
    waitForPageLoad();

})();

// ============================================================
// Claude 팝업 차단
// ============================================================
(function() {
    'use strict';
    
    function killPopup() {
        document.querySelectorAll('[role="dialog"], [role="alertdialog"]').forEach(dialog => {
            const text = dialog.textContent || '';
            if (text.includes('Claude를 계속') || text.includes('Continue using') || 
                text.includes('사용하시겠어요') || text.includes('usage') || text.includes('상위 플랜')) {
                console.log('🔥 팝업 제거');
                dialog.remove();
            }
        });
        
        document.querySelectorAll('[class*="backdrop"], [class*="overlay"], [class*="modal"]').forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex) || 0;
            
            if (zIndex > 999 && style.position === 'fixed') {
                console.log('🔥 오버레이 제거');
                el.remove();
            }
        });
        
        document.body.style.overflow = '';
        document.querySelectorAll('[inert]').forEach(el => el.removeAttribute('inert'));
    }
    
    const observer = new MutationObserver(killPopup);
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(killPopup, 2000);
    
    console.log('✅ 팝업 차단 활성화');
})();