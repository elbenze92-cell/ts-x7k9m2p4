// ==UserScript==
// @name         *senior guide 대본 생성
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  시니어 건강 정보 롱폼 대본 + 미드저니 프롬프트 자동 생성 (1시간 분량)
// @author       Atobro
// @match        https://claude.ai/project/019ad8ff-9135-73af-a695-9b82a73468cc
// @updateURL    https://raw.githubusercontent.com/elbenze92-cell/ts-x7k9m2p4/main/senior_guide.user.js
// @downloadURL  https://raw.githubusercontent.com/elbenze92-cell/ts-x7k9m2p4/main/senior_guide.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('💊 Senior Health Care 대본 생성기 시작');

    // 전역 변수
    let isRunning = false;
    let currentStep = 0;
    let allResponses = [];
    const MAX_STEPS = 12;

    // ============================================
    // 12단계 프롬프트 정의
    // ============================================
    const STEP_PROMPTS = [
        {
            name: "지침서 학습",
            prompt: `📌 시니어 건강 콘텐츠 제작 지침서를 학습합니다.

이 작업은 65세 이상 시니어를 대상으로 하는 건강 정보 콘텐츠입니다.
의료법을 준수하며 정확한 정보 전달에 중점을 둡니다.

핵심 원칙:
- 검증된 의학 정보만 사용.
- 개인 경험담 + 전문가 조언 형식
- 복잡한 의학 용어는 쉽게 풀어서 설명
- 희망적이지만 과장하지 않는 톤
- 55-65분 분량 (15,000-20,000자)

필수 포함사항:
✅ 증상의 구체적 사례
✅ 일상에서 실천 가능한 예방법
✅ 병원 방문이 필요한 시점
✅ 검증된 치료법과 관리법
✅ 희망적 사례와 격려

의료법 준수사항:
⚠️ 특정 약물명이나 용량 언급 금지
⚠️ 진단이나 치료 보장 표현 금지
⚠️ "~하면 낫는다" 같은 단정적 표현 금지
⚠️ 병원 치료를 대체한다는 표현 금지
⚠️ 모든 내용에 "개인차가 있음" 명시

이해했으면 '이해 완료'라고 짧게 답변해주세요.`
        },
        {
            name: "건강 주제 분석",
            prompt: `건강 관련 주제를 분석합니다.

위 주제에서:
1. 시니어가 겪는 실제 증상과 불편함
2. 잘못 알려진 상식과 올바른 정보
3. 일상에서 실천 가능한 관리법
4. 전문의 상담이 필요한 경우

시니어 관점에서 분석 결과를 정리해주세요.`
        },
        {
            name: "사례 구성",
            prompt: `건강 정보를 전달할 사례와 구조를 설정합니다.

📋 콘텐츠 구성:

【주 화자 설정】
- 건강 문제를 극복한 70대 어르신
- 구체적인 증상 경험
- 치료 과정과 회복 스토리
- 현재 건강 관리법

【전문가 인용】
- 관련 분야 전문의 조언
- 최신 연구 결과
- 검증된 치료 가이드라인

【실제 사례들】
- 사례 1: 초기 증상 무시로 악화된 경우
- 사례 2: 조기 발견으로 호전된 경우
- 사례 3: 꾸준한 관리로 개선된 경우

【정보 전달 구조】
1. 증상 인지
2. 원인 이해
3. 검사와 진단
4. 치료와 관리
5. 일상 실천법

구체적으로 작성해주세요.`
        },
        {
            name: "콘텐츠 구조화",
            prompt: `5부 구조로 건강 콘텐츠를 구성합니다.

💊 정보 전달 곡선:
호기심 유발(20) → 증상 공감(50) → 정보 습득(70) → 실천 의지(85) → 희망 메시지(100)

📖 5부 구성 (60분):

【1부: 도입 - 공감대 형성 (12분)】
- 흔한 증상으로 시작
- "저도 그랬어요" 공감
- 오늘 다룰 건강 주제 소개
- 잘못 알려진 상식 언급

【2부: 원인과 증상 (13분)】
- 왜 이런 증상이 생기는지
- 나이에 따른 신체 변화
- 주의해야 할 신호들
- 실제 경험담 2-3개

【3부: 검사와 진단 (12분)】
- 병원 방문 시점
- 어떤 검사를 받는지
- 검사 과정 상세 설명
- 비용과 보험 정보

【4부: 치료와 관리 (13분)】
- 의학적 치료 방법
- 생활 습관 개선법
- 식이요법과 운동
- 실천 가능한 팁들

【5부: 희망과 격려 (10분)】
- 성공 사례들
- 일상 실천 체크리스트
- 전문가 최종 조언
- 희망적 메시지

각 부별 핵심 내용을 작성해주세요.`
        },
        {
            name: "대본 작성 1부",
            prompt: `1-2부를 상세한 대본으로 작성합니다.

✍️ 작성 지침:
- "여러분도 이런 증상 있으신가요?" 공감 유도
- 의학 용어는 반드시 쉽게 풀어서
- 구체적 수치는 "연구에 따르면" 인용
- 각 부 3,000-4,000자

【1부: 도입 - 공감대 형성】

"안녕하세요, 여러분. 오늘은 우리 나이에 흔히 겪는 ○○ 문제에 대해
이야기해보려고 합니다.

아침에 일어나면 ○○이 아프고,
○○할 때마다 불편하신 분들 많으시죠?
저도 작년까지만 해도..."

(구체적으로 계속 작성)

【2부: 원인과 증상】

"○○대학병원 ○○과 전문의는 이렇게 설명합니다.
나이가 들면서 우리 몸의 ○○이 변하기 때문에..."

(의학적 설명을 쉽게 풀어서 작성)

시니어가 이해하기 쉽도록 작성해주세요.`
        },
        {
            name: "대본 작성 2부",
            prompt: `3-4부를 상세한 대본으로 작성합니다.

실용적인 정보 중심으로 작성해주세요.

【3부: 검사와 진단】

"병원에 가야 할 시점을 놓치면 안 됩니다.
다음과 같은 증상이 있으면 반드시..."

(구체적 기준 제시)

【4부: 치료와 관리】

"전문의들이 권하는 치료법은...
하지만 무엇보다 중요한 것은 일상에서의 관리입니다."

(실천 가능한 방법들)

⚠️ 의료법 준수:
- "개인차가 있을 수 있습니다"
- "전문의 상담을 권합니다"
- "보조적 방법입니다" 등 포함`
        },
        {
            name: "대본 작성 3부",
            prompt: `5부와 마무리를 작성합니다.

【5부: 희망과 격려】

"○○씨는 70세에 이 문제를 발견했지만,
꾸준한 관리로 지금은..."

(성공 사례와 격려)

【일상 실천 체크리스트】
□ 아침:
□ 점심:
□ 저녁:
□ 운동:

【마무리 메시지】
"건강은 하루아침에 좋아지지 않습니다.
하지만 오늘부터 시작하면..."

【의료법 고지】
"본 내용은 일반적인 건강 정보이며,
개인의 상태에 따라 다를 수 있습니다.
정확한 진단과 치료는 반드시 전문의와 상담하세요."

희망적이면서도 신중하게 마무리해주세요.`
        },
        {
            name: "메타데이터 생성",
            prompt: `완성된 콘텐츠의 메타데이터를 생성합니다.

📌 메타데이터:

【제목 후보】 5개
1. (충격적이면서 희망적인 제목)
2.
3.
4.
5.

【썸네일 문구】 5개
- (감정적이고 직접적인 문구, 최대 80자)

【핵심 키워드】
건강, 시니어건강, ○○증상, ○○치료, ○○관리,
노년건강, 건강정보, 의학정보

【예상 재생시간】
60분`
        },
        {
            name: "설명란 작성",
            prompt: `유튜브 설명란을 작성합니다.

채널명: 아토형아 Story

📝 설명란 작성:

【영상 소개】
(2-3문단으로 핵심 내용 요약)

【시청 포인트】
-
-
-

【의료법 고지사항】
⚠️ 중요 안내 ⚠️
이 영상은 가상의 인물을 각색하여 재구성한 내용입니다.
본 채널의 모든 콘텐츠는 연구자료 등을 바탕으로 개인적 학습을 통해 제작되었습니다.
건강한 정보전달을 목적으로 제작되었으며 이는 의학적 진료를 대신할 수 없습니다.
사람마다 체질, 건강상태 등이 모두 다르기에 결과 또한 다를 수 있음을 알려드립니다.
따라서 시청자 본인의 선택과 판단이 요구되며, 선택에 따른 결과는 시청자 본인의 책임임을 밝혀드립니다.

【구독 유도】
다음 건강 정보가 궁금하시면 구독과 좋아요 잊지 말고 챙겨가세요!
여러분의 건강 고민 제보를 기다립니다.

【태그】
#시니어건강 #노년건강 #건강정보 #○○증상 #○○치료
#건강관리 #의학정보

위 형식으로 작성해주세요.`
        },
        {
            name: "품질 검증",
            prompt: `작성된 콘텐츠를 의료법 기준으로 최종 검증합니다.

✅ 의료법 체크리스트:

□ 특정 약물명이나 용량 언급 없음
□ 진단/치료 보장 표현 없음
□ 단정적 표현 없음
□ "개인차" 명시됨
□ 전문의 상담 권유 포함
□ 의료법 고지사항 포함

✅ 콘텐츠 품질:

□ 정확한 의학 정보
□ 시니어 이해 가능한 설명
□ 실천 가능한 조언
□ 희망적 메시지
□ 60분 분량
□ 공감 요소 충분

검증 결과:
- 우수한 점:
- 수정 필요:
- 최종 확인:

문제가 있다면 수정 제안해주세요.`
        },
        {
            name: "미드저니 학습",
            prompt: `미드저니 프롬프트 생성을 위한 학습입니다.

📸 건강 콘텐츠 비주얼:
- 의학적 정확성 유지
- 희망적이고 밝은 톤
- 시니어가 편안하게 볼 수 있는 이미지
- 건강한 라이프스타일 표현

스타일:
- 깨끗하고 전문적인 느낌
- 의료 일러스트레이션 스타일
- 따뜻한 색감

이해했으면 '준비 완료'라고 답변해주세요.`
        },
        {
            name: "미드저니 프롬프트",
            prompt: `건강 콘텐츠용 미드저니 프롬프트를 생성합니다.

🎨 30개 핵심 장면:

각 프롬프트는 다음 요소를 포함해야 합니다:
- 주제: 건강한 시니어 라이프스타일
- 스타일: photorealistic, professional, medical illustration
- 분위기: warm, hopeful, reassuring
- 비율: 9:16 vertical format

예시:
1. Healthy Korean senior woman, morning exercise in park, sunrise, photorealistic, warm lighting, 9:16 vertical
2. Medical illustration of healthy joints, educational style, clean white background, professional diagram, vertical format
3. Korean senior at medical checkup, friendly doctor, modern hospital, reassuring atmosphere, 9:16
4. Senior woman doing gentle yoga at home, peaceful setting, healthy lifestyle, soft natural light, vertical
5. Nutritious Korean food for seniors, colorful vegetables, traditional table setting, overhead view, 9:16

(이런 방식으로 30개 작성)

각 프롬프트를 번호와 함께 완전한 형태로 작성해주세요.`
        },
        {
            name: "최종 출력",
            prompt: `모든 데이터를 최종 정리하여 출력합니다.

⚠️ 반드시 아래 형식 그대로 출력하세요.
⚠️ 마커 바깥에는 절대 아무것도 쓰지 마세요.
⚠️ "네", "알겠습니다" 같은 말도 금지.

---SCRIPT_START---
(1부부터 5부까지 전체 대본을 순서대로 합쳐서 작성)
---SCRIPT_END---

---PROMPTS_START---
1. (첫 번째 미드저니 프롬프트)
2. (두 번째 미드저니 프롬프트)
...
30. (마지막 미드저니 프롬프트)
---PROMPTS_END---`
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
            // 🔥 12단계(마지막)에서만 마커 기반 추출
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

                    if (responseText.includes(scriptStart) && responseText.includes(scriptEnd)) {
                        console.log(`🔍 응답 #${i}에서 마커 발견`);

                        // 대본 추출
                        const scriptStartIdx = responseText.indexOf(scriptStart) + scriptStart.length;
                        const scriptEndIdx = responseText.indexOf(scriptEnd);
                        const cleanScript = responseText.substring(scriptStartIdx, scriptEndIdx).trim();

                        // 이미지 프롬프트 추출
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

                        console.log('✅ 마커 기반 추출 성공!');
                        console.log('   - 대본:', cleanScript.length, '글자');
                        console.log('   - 이미지 프롬프트:', imagePrompts.length, '개');

                        // 🔥 대본만 저장
                        localStorage.setItem('FINAL_SCRIPT', cleanScript);
                        window.FINAL_SCRIPT_FOR_PYTHON = cleanScript;

                        // 🔥 이미지 프롬프트 별도 저장
                        if (imagePrompts.length > 0) {
                            const promptsJson = JSON.stringify(imagePrompts);
                            localStorage.setItem('IMAGE_PROMPTS', promptsJson);
                            window.IMAGE_PROMPTS = imagePrompts;

                            // MOTIVATION_SCRIPT_JSON에 image_prompts만 저장
                            const motivationData = {
                                image_prompts: imagePrompts
                            };
                            localStorage.setItem('MOTIVATION_SCRIPT_JSON', JSON.stringify(motivationData));
                            window.MOTIVATION_SCRIPT_JSON = motivationData;
                        }

                        return cleanScript;
                    }
                }

                console.warn('⚠️ 12단계인데 마커 못 찾음');
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
            <h3>💊 Create: 시니어 건강 케어</h3>
            <div style="text-align: center;">
                <span class="category-badge">HEALTH CARE</span>
            </div>

            <div class="info-box">
                <label>💊 건강 주제 입력</label>
                <textarea id="user-input"
                          placeholder="건강 관련 주제를 입력하세요...

예시:
- 고혈압 관리와 예방법
- 당뇨병 초기 증상과 관리
- 관절염 통증 완화 방법
- 치매 예방 생활습관
- 불면증 개선 방법
- 소화불량과 위장 건강

※ Python에서 자동 입력됩니다"></textarea>
                <small>구체적인 증상이나 관심사를 포함해주세요</small>
            </div>

            <div class="step-counter">
                단계: <span id="step-count">0 / 12</span>
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

        addStatus('🚀 시니어 건강 케어 대본 생성 시작!', 'success');

        if (userPrompt) {
            addStatus(`💊 건강 주제: ${userPrompt.substring(0, 30)}...`);
        } else {
            addStatus('⚠️ 건강 주제를 입력해주세요');
            stopGeneration();
            return;
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

            try {
                let promptToSend = step.prompt;

                // 🔥 2단계에서 건강 주제 삽입
                if (currentStep === 2 && userPrompt) {
                    promptToSend = `건강 관련 주제를 분석합니다.

주제: "${userPrompt}"

위 주제에서:
1. 시니어가 겪는 실제 증상과 불편함
2. 잘못 알려진 상식과 올바른 정보
3. 일상에서 실천 가능한 관리법
4. 전문의 상담이 필요한 경우

시니어 관점에서 분석 결과를 정리해주세요.`;
                }

                const success = await inputPrompt(promptToSend);

                if (!success) {
                    addStatus(`❌ ${step.name} 실패`, 'error');
                    await sleep(3000);
                    currentStep--;
                    continue;
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

                const response = collectResponse();
                allResponses.push({
                    step: `${currentStep}. ${step.name}`,
                    response: response
                });

                addStatus(`✅ ${step.name} 완료`, 'success');

            } catch (error) {
                addStatus(`⚠️ 오류: ${error.message}`, 'error');
                await sleep(5000);
                currentStep--;
                continue;
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
                addStatus('✅ 시니어 건강 케어 생성기 준비 완료');
                addStatus('💊 건강 주제를 입력하고 시작하세요');
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