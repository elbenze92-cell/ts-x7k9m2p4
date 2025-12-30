// ==UserScript==
// @name         *image_stories_user 대본 생성
// @namespace    http://tampermonkey.net/
// @version      2.0.9
// @description  동기부여 숏폼 대본 + 이미지 프롬프트 자동 생성 (완전 자동)
// @author       Atobro 
// @match        https://claude.ai/project/01991e6d-41c6-7177-93ce-65687a23a022
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/image_stories.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/image_stories.user.js
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
    const MAX_STEPS = 12;

    // ============================================
    // 7단계 프롬프트 정의
    // ============================================
    const STEP_PROMPTS = [
        {
            name: "기본 구조 설정",
            prompt: `1단계 : 첨부한 파일과 설정된 지침을 A부터 Z까지 첨부된 파일을 포함해서 순차적으로 다시 한 번 확인해서 학습합니다.
마스터키워드가 포함된 첨부파일은 앞으로 전달할 프롬프트의 기반이 되는 내용입니다.

위 내용을 이해했으면 '이해 완료'라고 짧게 대답한다. (지금 이 프롬프트에는 구구절절 답변하지 말자 시간아깝다)
이해했다면 다음 단계를 바로 진행하겠다.`
        },
        {
            name: "프롬프트 패턴 학습 1",
            prompt: `ㅇ.`
        },
        {
            name: "프롬프트 패턴 학습 2",
            prompt: `ㅇ.`
        },
        {
            name: "창작형 콘텐츠 전략",
            prompt: `ㅇ.`
        },
        {
            name: "대본 생성 준비",
            prompt: `ㅇㅇ`
        },
        {
            name: "대본 생성",
            needsAnalysisData: true,
            prompt: `ㅇ.`
        },
        {
            name: "알파 대본 학습",
            prompt: `ㅇ`
        },
        {
            name: "알파 대본 생성 1차",
            needsAnalysisData: true,
            prompt: `ㅇ.`
        },
        {
            name: "알파 대본 생성 2차",
            needsAnalysisData: true,
            prompt: `ㅇ요.`
        },
        {
            name: "품질 검증",
            prompt: `🎯 최종 선택 및 분량 검증

1단계: 최적 대본 선택 (먼저!)
방금 작성한 알파 대본 중에서 가장 참여율(첫3초)과 시청지속시간이 좋을 것 같은
대본 1개를 고르고, 왜 이 대본을 선택했는지 다른 대본들과 비교해서 설명해줘.

2단계: 분량 검증 (필수)
선택한 대본을 whisper로 읽었을 때 부자연스럽지 않은지 확인하고,
공백 제외 글자수를 정확히 측정해줘.
⚠️ 400자 미만이면 3단계로 진행
✅ 400~550자면 그대로 최종 확정

3단계: 자연스러운 분량 확보 (400자 미만일 경우만)
아래 4가지 방법만 사용해서 원본 스토리 구조를 유지하면서 확장:

✅ 방법 1: 강조 부사 2~3개 추가
예: "미쳤다" → "완전히 미쳤다"
예: "많았다" → "정말 많았다"
사용 가능: 완전히, 정말, 너무, 진짜, 엄청

✅ 방법 2: 구체적 동사/형용사 1~2개 추가
예: "버티지 못하고" → "버티지 못하고 주저앉았고"
예: "힘들어서" → "잘 안 되고 힘들어서"

✅ 방법 3: 전환구 1~2개 삽입
중간에 자연스럽게 연결:
"그런데 여기서 놀라운 건~"
"하지만 진짜 이야기는~"
"이 남자는 그 시간을 견뎌냈고"

✅ 방법 4: 공감 유도 문장 1개 삽입
시청자에게 말 거는 문장:
"우리도 처음 뭔가를 시작할 때 이렇지 않나요"
"누구나 처음엔 이런 경험 있잖아요"

❌ 절대 금지:
- 불필요한 시간/숫자 디테일 ("새벽 5시", "500그램, 2kg")
- 스토리 구조 변경
- 마무리 CTA 변경
- 같은 내용 반복

4단계: 최종 출력 형식
선택 이유 + 수정 전후 비교 + 최종 대본을 코드블럭으로 출력

📊 출력 예시:
---
## 🏆 최종 선택: 버전 X

### 선택 이유:
(다른 대본들과 비교 분석)

### 분량 검증:
- 수정 전: XXX자
- 수정 후: XXX자 (적합/부족)

### 적용한 방법 (400자 미만이었을 경우):
- 강조 부사 X개 추가
- 전환구 X개 삽입
- 공감 유도 X줄 추가

### 최종 대본:
\`\`\`
(최종 대본 내용)
\`\`\`
---`
        },
        {
            name: "메타데이터 생성",
            prompt: `위에서 선택한 최종 대본만 출력해.

⚠️ 중요: 반드시 아래 형식을 정확히 따라야 해:

---SCRIPT_START---
(여기에 대본만, 설명/인사/코드블럭 없이)
---SCRIPT_END---

마커 바깥에는 절대 아무것도 쓰지 마.
"네", "알겠습니다", "최종 대본입니다" 같은 말도 금지.
오직 마커와 그 사이의 대본만.`
        },
        {
            name: "미드저니 프롬프트",
            prompt: `🚨🚨🚨 CRITICAL: 반드시 3개 마커 모두 출력해야 합니다! 🚨🚨🚨

출력해야 할 마커 (하나라도 빠지면 실패):
1. ---SCRIPT_START--- / ---SCRIPT_END---
2. ---PROMPTS_START--- / ---PROMPTS_END---
3. ---SCENES_START--- / ---SCENES_END---  ← 필수! 빠뜨리지 마!

⛔ 절대 금지:
- 마커 생략 (3개 모두 필수!)
- "Let me create..." 같은 메타 설명
- 마커 밖에 어떠한 텍스트도 금지

---

🎯 출력 형식 (이 순서대로 정확히 출력):

---SCRIPT_START---
(11단계 최종 대본 전체를 여기에)
---SCRIPT_END---

---PROMPTS_START---
1. (이미지 프롬프트 1 - 영어, 9:16, 극사실주의, 50-180단어)
2. (이미지 프롬프트 2)
3. (이미지 프롬프트 3)
...
(15개 이상 작성)
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
9. lines: 17-18 | image: 9
10. lines: 19-20 | image: 10
(대본 줄 수에 맞게 계속 - 모든 줄이 커버될 때까지)
---SCENES_END---

⚠️ SCENES 필수 규칙:
- 대본의 모든 줄이 반드시 커버되어야 함
- lines: 시작줄-끝줄 | image: 이미지번호
- 이미지 번호는 PROMPTS의 순서 (1부터 시작)
- 예: 대본이 24줄이면 SCENES에서 1-24줄 모두 매핑

📌 이미지 프롬프트 규칙:
- 완전한 영어 문장
- 9:16 vertical composition 명시
- 극사실주의/시네마틱 스타일`
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
            // 🔥 마지막 단계에서만 마커 기반 추출
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
                                // 형식: "lines: 1-2 | image: 1" 또는 "1. lines: 1-2 | image: 1, 2"
                                // 🔥 번호 선택적, 이미지 여러 개 지원
                                const match = line.match(/(?:^\d+\.\s*)?lines:\s*(\d+)-(\d+)\s*\|\s*image:\s*([\d,\s]+)/i);
                                
                                if (match) {
                                    const startLine = parseInt(match[1]);
                                    const endLine = parseInt(match[2]);
                                    // 🔥 여러 이미지 중 첫 번째만 사용
                                    const imageStr = match[3].trim();
                                    const firstImage = imageStr.split(/[,\s]+/)[0];
                                    const imageIdx = parseInt(firstImage) - 1; // 0-based index
                                    
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

                console.warn('⚠️ 마지막 단계인데 마커 못 찾음');
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

            try {
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