// ==UserScript==
// @name         #Translation Automation 대본 번역
// @namespace    atobro
// @version      2.2.1
// @description  한국어 대본 → 24개 언어 자동 번역
// @match        https://claude.ai/project/019acac9-ba7a-77dc-9eb2-91b0bba89308
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/translation.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/translation.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🌐 Translation Automation v3.0 로드됨');

    // 전역 변수
    let isRunning = false;

    // 🔥 번역 프롬프트 템플릿 (Python과 100% 동일)
    const TRANSLATION_PROMPT_TEMPLATE = `You are a professional localization expert. Process {LANGUAGE_COUNT} languages simultaneously.

**Languages to process:**
{LANGUAGE_INSTRUCTIONS}

**CRITICAL: 각 언어마다 5가지 버전 생성 필수**

1. **ORIGINAL**: TTS용 자연스러운 문장 버전
   - 각 문장 끝에 **마침표(.) 필수** (단, 중국어는 。, 일본어는 。, 태국어는 마침표 없음)
   - 문장과 문장 사이를 명확히 구분
   - 구글 TTS가 문장을 자연스럽게 인식하고 읽을 수 있도록
   - **한국어 원문과 동일한 줄 수 유지** (문장별로 1:1 대응)
   - 너무 긴 문장은 2-3개로 자연스럽게 분리 가능
   - 예: "이것은 첫 번째 문장입니다.\\n두 번째 문장입니다.\\n세 번째입니다."

2. **SUBTITLE**: 자막 표시용 자연스럽게 끊은 버전
   - **마침표/쉼표 모두 제거** (깔끔한 화면 표시)
   - 의미 단위로 자연스럽게 끊기 (문법적으로 자연스러운 위치에서)
   - 목표 글자수 (Target)에 가깝게, 하지만 의미를 우선
   - 최대 글자수 (Max) 절대 초과 금지

3. **YOUTUBE_TITLE**: YouTube Shorts 제목 (최대 50자!)
   - 모바일 화면에 최적화된 짧고 강렬한 제목
   - 이모지 1개 포함 (시작 부분)
   - 핵심 키워드 앞에 배치
   - 호기심 유발 or 질문형 제목
   - 예: "🚦 빨간불 건너면?" (17자)

4. **DESCRIPTION**: 설명란 (200-300자 **필수**) - YouTube/Instagram/TikTok 공통
   - **YouTube 설명, Instagram 캡션, TikTok 캡션으로 모두 사용됨**
   - **최소 200자 이상 작성** (중요!)
   - 3-5줄로 구성
   - 첫 2-3문장: 핵심 내용 요약 (흥미 유발)
   - 빈 줄 하나 추가
   - 마지막 줄: 해시태그 4-5개 포함 (#Shorts #Reels 필수)
   - 예시 구조:
\`\`\`
     첫 번째 문장으로 호기심 유발하는 상황 설명.
     두 번째 문장으로 반전이나 재미있는 포인트 강조!
     세 번째 문장으로 감정이나 메시지 전달.

     #해시태그1 #해시태그2 #Shorts #Reels
\`\`\`

5. **COMMENT**: 시청자 참여 유도 댓글 (100자 이내) - Instagram/YouTube/TikTok 공통
   - 부계정으로 작성할 댓글
   - 제품이나 상황에 대한 경험담/개인 의견 스타일
   - 논란/호기심 유발하는 자연스러운 댓글
   - 예시:
     * "이 할머니 쏘는 총 쿠팡에서 샀는데 사람들이 다 쳐다봄"
     * "윤석열/이재명같은 주인 안 만나면 강아지한텐 축복임"
   - 정치/종교를 간접적으로 끼워넣어 논란 유발 가능
   - 제품/상황의 특정 부분에 대한 개인적 의견 표현

**한국어 원문:**
{KOREAN_SCRIPT}

**CRITICAL REQUIREMENTS:**
- Count the number of lines in the Korean original text above
- ORIGINAL version MUST have approximately the same number of lines (±2 lines acceptable)
- SUBTITLE version will have MORE lines (2-3x more) because text is broken into shorter chunks
- Example: If Korean has 12 lines → ORIGINAL should have 10-14 lines, SUBTITLE should have 20-30 lines

**OUTPUT FORMAT (각 언어마다):**

===LANGUAGE_START===
CODE: [language code]

ORIGINAL:
[TTS용 문장1.]
[TTS용 문장2.]

SUBTITLE:
[자막줄1]
[자막줄2]

YOUTUBE_TITLE:
[YouTube 제목 - 이모지 포함, 50자 이내]

DESCRIPTION:
[설명/캡션 - 200-300자]
[YouTube/Instagram/TikTok 공통 사용]
[핵심 내용 요약]
[해시태그 포함]

COMMENT:
[댓글 - 100자 이내]
[부계정용 자연스러운 댓글]

===LANGUAGE_END===

Repeat for all {LANGUAGE_COUNT} languages.

**CRITICAL FORMAT REQUIREMENTS - DO NOT USE JSON:**
- MUST use ===LANGUAGE_START=== and ===LANGUAGE_END=== markers
- DO NOT output JSON format
- DO NOT wrap in code blocks
- Output plain text with markers only

IMPORTANT:
- All 5 sections are MANDATORY for each language!
- ORIGINAL: MUST end each sentence with period (. for most, 。 for Chinese/Japanese, NO period for Thai)
- SUBTITLE: NO periods, NO commas - clean text only!
- SUBTITLE: Each line must be between target±30% and strictly under max characters!
- YOUTUBE_TITLE: Maximum 50 characters (mobile-optimized, with 1 emoji at start)
- DESCRIPTION: 200-300 characters, 2-3 sentences + blank line + hashtags (4-5 tags including #Shorts #Reels)
- COMMENT: Maximum 100 characters, natural viewer comment style
- NO EMPTY LINES between text lines in ORIGINAL and SUBTITLE sections!
- Maintain consistent formatting across all languages!`;

    // TTS 설정
    const TTS_CONFIGS = {
        'ko-KR': { target: 25, max: 40 },
        'en-US': { target: 35, max: 50 },
        'ja-JP': { target: 30, max: 45 },
        'cmn-CN': { target: 20, max: 35 },
        'es-ES': { target: 35, max: 50 },
        'fr-FR': { target: 35, max: 50 },
        'de-DE': { target: 35, max: 50 },
        'it-IT': { target: 35, max: 50 },
        'pt-BR': { target: 35, max: 50 },
        'ru-RU': { target: 30, max: 45 },
        'ar-XA': { target: 30, max: 45 },
        'hi-IN': { target: 30, max: 45 },
        'bn-IN': { target: 30, max: 45 },
        'id-ID': { target: 30, max: 45 },
        'th-TH': { target: 25, max: 40 },
        'vi-VN': { target: 30, max: 45 },
        'tr-TR': { target: 30, max: 45 },
        'pl-PL': { target: 30, max: 45 },
        'uk-UA': { target: 30, max: 45 },
        'nl-NL': { target: 35, max: 50 },
        'sv-SE': { target: 35, max: 50 },
        'cs-CZ': { target: 30, max: 45 },
        'el-GR': { target: 30, max: 45 },
        'ro-RO': { target: 30, max: 45 }
    };

    // UI 스타일
    GM_addStyle(`
        #translation-automation-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            background: linear-gradient(135deg, #0066cc 0%, #004c99 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        #translation-automation-panel h3 {
            margin: 0 0 20px 0;
            font-size: 20px;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .trans-input-area {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }

        .trans-input-area label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: bold;
        }

        .trans-input-area textarea {
            width: 100%;
            height: 120px;
            padding: 10px;
            border-radius: 6px;
            border: none;
            font-size: 13px;
            resize: vertical;
            background: white;
            color: #333;
            font-family: 'Malgun Gothic', sans-serif;
        }

        .trans-input-area select {
            width: 100%;
            height: 100px;
            padding: 8px;
            border-radius: 6px;
            border: none;
            font-size: 12px;
            background: white;
            color: #333;
        }

        .trans-hint {
            font-size: 11px;
            color: rgba(255,255,255,0.8);
            margin-top: 5px;
        }

        .trans-counter {
            font-size: 13px;
            color: #ffeb3b;
            font-weight: bold;
            margin-top: 5px;
        }

        .trans-counter.warning {
            color: #ff5252;
        }

        #trans-start-btn, #trans-complete-btn {
            width: 100%;
            padding: 12px;
            font-size: 15px;
            font-weight: bold;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin-bottom: 10px;
            transition: all 0.3s;
        }

        #trans-start-btn {
            background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
            color: white;
        }

        #trans-start-btn:hover:not(:disabled) {
            transform: scale(1.05);
        }

        #trans-start-btn:disabled {
            background: #666;
            cursor: not-allowed;
            opacity: 0.6;
        }

        #trans-complete-btn {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            display: none;
        }

        #trans-status {
            background: rgba(0,0,0,0.2);
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 13px;
            max-height: 150px;
            overflow-y: auto;
            display: none;
        }

        .trans-status-line {
            margin: 5px 0;
            padding: 5px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
        }
    `);

    // UI 패널 생성
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'translation-automation-panel';
        panel.innerHTML = `
            <h3>🌐 Translation Automation</h3>

            <div class="trans-input-area">
                <label>한국어 대본:</label>
                <textarea id="korean-script-input" placeholder="번역할 한국어 대본을 입력하세요..."></textarea>
            </div>

            <div class="trans-input-area">
                <label>언어 코드 (Python 자동 입력):</label>
                <input type="text" id="language-codes-input" readonly 
                       placeholder="ar-XA,bn-IN,cmn-CN (Python이 자동으로 입력)" 
                       style="width: 100%; padding: 10px; border-radius: 6px; border: none; background: white; color: #333;">
                <div class="trans-hint">Python이 자동으로 3개 언어 코드를 입력합니다</div>
                <div class="trans-counter" id="lang-counter">대기 중...</div>
            </div>

            <button id="trans-start-btn">🚀 번역 시작</button>
            <button id="trans-complete-btn" disabled>✅ 작업 완료</button>

            <div id="trans-status"></div>
        `;

        document.body.appendChild(panel);

        // 🔥 DOM 추가 후 약간 대기
        setTimeout(() => {
            const startBtn = document.getElementById('trans-start-btn');
            const completeBtn = document.getElementById('trans-complete-btn');

            console.log('🔍 버튼 찾기:', { startBtn: !!startBtn, completeBtn: !!completeBtn });

            if (startBtn) {
                startBtn.addEventListener('click', function() {
                    console.log('🚀 번역 시작 버튼 클릭됨!');
                    startTranslation();
                });
                console.log('✅ 시작 버튼 이벤트 리스너 붙임');
            } else {
                console.error('❌ 시작 버튼을 찾을 수 없음!');
            }

            if (completeBtn) {
                completeBtn.addEventListener('click', function() {
                    console.log('✅ 완료 버튼 클릭됨!');
                    markAsCompleted();
                });
                console.log('✅ 완료 버튼 이벤트 리스너 붙임');
            } else {
                console.error('❌ 완료 버튼을 찾을 수 없음!');
            }
        }, 100);

        // ESC 키로 숨기기/보이기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const p = document.getElementById('translation-automation-panel');
                if (p) {
                    p.style.display = p.style.display === 'none' ? 'block' : 'none';
                }
            }
        });

        addStatus('✅ Translation Automation 준비 완료');
    }


    function markAsCompleted() {
        localStorage.setItem('TRANSLATION_STATUS', 'COMPLETED');
        localStorage.setItem('TRANSLATION_COMPLETED_AT', new Date().toISOString());

        addStatus('✅ 완료 상태 저장됨 - Python이 읽을 수 있습니다');

        document.getElementById('trans-complete-btn').disabled = true;
    }

    function addStatus(message) {
        const status = document.getElementById('trans-status');
        if (!status) return;

        status.style.display = 'block';

        const line = document.createElement('div');
        line.className = 'trans-status-line';
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        status.insertBefore(line, status.firstChild);

        while (status.children.length > 10) {
            status.removeChild(status.lastChild);
        }
        console.log(message);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 번역 시작
    async function startTranslation() {
        const koreanScript = document.getElementById('korean-script-input').value.trim();
        const languageCodesInput = document.getElementById('language-codes-input').value.trim();

        if (!koreanScript) {
            alert('한국어 대본을 입력하세요!');
            return;
        }

        if (!languageCodesInput) {
            alert('Python이 언어 코드를 입력하지 않았습니다!');
            return;
        }

        // 언어 코드 파싱: "ar-XA,bn-IN,cmn-CN" → [{code: 'ar-XA', name: 'العربية'}, ...]
        const languageCodes = languageCodesInput.split(',').map(c => c.trim());
        
        if (languageCodes.length === 0 || languageCodes.length > 3) {
            alert('언어 코드는 1-3개여야 합니다!');
            return;
        }

        // 언어 이름 매핑
        const languageNames = {
            'ko-KR': '한국어',
            'en-US': 'English',
            'ja-JP': '日本語',
            'cmn-CN': '中文（普通话）',
            'es-ES': 'Español',
            'fr-FR': 'Français',
            'de-DE': 'Deutsch',
            'it-IT': 'Italiano',
            'pt-BR': 'Português',
            'ru-RU': 'Русский',
            'ar-XA': 'العربية',
            'hi-IN': 'हिन्दी',
            'bn-IN': 'বাংলা',
            'id-ID': 'Bahasa Indonesia',
            'th-TH': 'ภาษาไทย',
            'vi-VN': 'Tiếng Việt',
            'tr-TR': 'Türkçe',
            'pl-PL': 'Polski',
            'uk-UA': 'Українська',
            'nl-NL': 'Nederlands',
            'sv-SE': 'Svenska',
            'cs-CZ': 'Čeština',
            'el-GR': 'Ελληνικά',
            'ro-RO': 'Română'
        };

        const languages = languageCodes.map(code => ({
            code: code,
            name: languageNames[code] || code
        }));

        // 🔥 [버튼 클릭 문제 해결법 #2]
        // 문제: delete window.PROPERTY 사용 시 Proxy로 보호된 window 객체에서
        //       "deleteProperty on proxy: trap returned falsish" 에러 발생
        // 해결: delete 대신 undefined 할당 사용
        // 증상: 버튼 클릭은 되지만 startTranslation 함수 내부에서
        //       에러 발생하여 작업이 중단됨 (콘솔에 Proxy 관련 에러 표시)
        
        // 상태 초기화
        localStorage.removeItem('TRANSLATION_STATUS');
        localStorage.removeItem('TRANSLATION_RESULT_JSON');
        window.TRANSLATION_RESULT_FOR_PYTHON = undefined;  // delete 대신 undefined 할당

        isRunning = true;
        document.getElementById('trans-start-btn').disabled = true;
        document.getElementById('korean-script-input').disabled = true;
        document.getElementById('language-codes-input').disabled = true;
        document.getElementById('trans-complete-btn').style.display = 'none';

        addStatus(`⏳ 번역 시작... (${languages.length}개 언어: ${languages.map(l => l.name).join(', ')})`);

        // 프롬프트 생성
        const prompt = generateTranslationPrompt(koreanScript, languages);

        // 🔥 재시도 루프
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;

        while (retryCount < maxRetries && !success) {
            try {
                if (retryCount > 0) {
                    addStatus(`🔄 재시도 ${retryCount}/${maxRetries}`);
                    await sleep(3000 * retryCount);
                }

                await sendPromptToClaude(prompt);
                addStatus('✅ 프롬프트 전송 완료');

                await waitForResponseComplete();

                // 🔥 응답 수집 및 에러 체크
                const responses = document.querySelectorAll('div[class*="font-claude-response"][class*="leading-"]');
                if (responses.length === 0) {
                    throw new Error('응답을 찾을 수 없습니다');
                }

                const lastResponse = responses[responses.length - 1];
                const responseText = lastResponse.innerText.trim();

                extractTranslationResult(languages);
                success = true;

            } catch (error) {
                retryCount++;
                addStatus(`⚠️ 오류: ${error.message}`);

                if (retryCount >= maxRetries) {
                    addStatus('❌ 최대 재시도 초과');
                    localStorage.setItem('TRANSLATION_STATUS', 'FAILED');
                    localStorage.setItem('TRANSLATION_ERROR', error.message);
                    resetUI();
                    return;
                }
            }
        }
    }

    function generateTranslationPrompt(koreanScript, languages) {
        const languageInstructions = languages.map(lang => {
            const config = TTS_CONFIGS[lang.code] || { target: 30, max: 45 };
            let specialInstructions = '';

            if (lang.code === 'cmn-CN') {
                specialInstructions = `
**ULTRA CRITICAL FOR CHINESE:**
- ORIGINAL 버전: EACH SENTENCE MUST BE 13-20 CHARACTERS MAXIMUM
- EVERY SENTENCE MUST END WITH 。
- NO COMMAS (，) ALLOWED - USE PERIODS (。) ONLY`;
            } else if (lang.code === 'th-TH') {
                specialInstructions = `
**CRITICAL FOR THAI:**
- ORIGINAL 버전: 각 줄을 최대 35자로 짧게 유지
- 마침표 없이 공백으로만 문장 구분`;
            } else if (lang.code === 'ja-JP') {
                specialInstructions = `
**CRITICAL FOR JAPANESE:**
- ORIGINAL 버전: 각 문장 끝에 일문 마침표 。 필수`;
            }

            return `
**Language: ${lang.name}**
Code: ${lang.code}
Target: ${config.target} characters per line
Max: ${config.max} characters per line

${specialInstructions}

Localization principles:
- Cultural adaptation for ${lang.name} speakers
- Natural spoken language style
- Similar length to original (30-35 seconds when spoken)
`;
        }).join('\n');

        // 템플릿에 값 채우기
        let prompt = TRANSLATION_PROMPT_TEMPLATE;
        prompt = prompt.replace(/{LANGUAGE_COUNT}/g, languages.length);
        prompt = prompt.replace(/{LANGUAGE_INSTRUCTIONS}/g, languageInstructions);
        prompt = prompt.replace(/{KOREAN_SCRIPT}/g, koreanScript);

        return prompt;
    }

    async function sendPromptToClaude(prompt) {
        const inputField = document.querySelector('div.ProseMirror[contenteditable="true"]') ||
                          document.querySelector('div[contenteditable="true"]');

        if (!inputField) {
            throw new Error('입력창을 찾을 수 없습니다');
        }

        inputField.focus();
        inputField.click();
        await sleep(200);

        inputField.innerHTML = '';

        const lines = prompt.split('\n');
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

        let sendButton = document.querySelector('button[aria-label="메시지 보내기"]') ||
                        document.querySelector('button[aria-label="Send message"]');

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
            throw new Error('전송 버튼을 찾을 수 없거나 비활성화되어 있습니다');
        }

        sendButton.click();
        await sleep(1000);
    }

    async function waitForResponseComplete() {
        addStatus('⏳ 응답 대기 중...');

        for (let i = 0; i < 60; i++) {
            if (isClaudeResponding()) {
                addStatus('✍️ Claude 응답 중...');
                break;
            }
            await sleep(500);
        }

        while (isClaudeResponding()) {
            await sleep(1000);
        }

        addStatus('✅ Claude 응답 완료!');
        await sleep(2000);
    }

    function isClaudeResponding() {
        const stopButton = document.querySelector('button[aria-label="응답 중단"]') ||
                          document.querySelector('button[aria-label="Stop response"]') ||
                          document.querySelector('button[aria-label="Stop"]');
        if (stopButton) return true;

        const streaming = document.querySelector('[data-is-streaming="true"]');
        if (streaming) return true;

        return false;
    }

    // 🔥 기존 스크립트 방식 그대로
    function extractTranslationResult(expectedLanguages) {
        try {
            const responses = document.querySelectorAll('div[class*="font-claude-response"][class*="leading-"]');
            console.log(`🔍 응답 개수: ${responses.length}`);

            if (responses.length === 0) {
                addStatus('❌ 응답을 찾을 수 없습니다!');
                resetUI();
                return;
            }

            const lastResponse = responses[responses.length - 1];
            let fullText = '';

            const markdownDiv = lastResponse.querySelector('[class*="standard-markdown"]') ||
                               lastResponse.querySelector('[class*="progressive-markdown"]');

            if (markdownDiv) {
                fullText = markdownDiv.innerText.trim();
            }

            if (!fullText || fullText.length < 50) {
                fullText = lastResponse.innerText.trim();
            }

            if (!fullText || fullText.length < 50) {
                const streamingEls = document.querySelectorAll('[data-is-streaming]');
                if (streamingEls.length > 0) {
                    fullText = streamingEls[streamingEls.length - 1].innerText.trim();
                }
            }

            if (!fullText || fullText.length < 50) {
                const allDivs = document.querySelectorAll('div[class*="font-claude-response"]');
                let maxText = '';
                allDivs.forEach(div => {
                    const text = div.innerText.trim();
                    if (text.length > maxText.length && text.length < 100000) {
                        maxText = text;
                    }
                });
                if (maxText.length > 50) {
                    fullText = maxText;
                }
            }

            console.log(`📝 번역 결과 수집: ${fullText.length}글자`);

            const results = parseTranslationResponse(fullText);

            const expectedCodes = expectedLanguages.map(l => l.code);
            const actualCodes = Object.keys(results);

            if (actualCodes.length === 0) {
                addStatus('❌ 번역 결과 파싱 실패!');
                resetUI();
                return;
            }

            const missing = expectedCodes.filter(code => !actualCodes.includes(code));
            if (missing.length > 0) {
                addStatus(`⚠️ 누락된 언어: ${missing.join(', ')}`);
            }

            let validCount = 0;
            for (const [code, data] of Object.entries(results)) {
                const hasAllVersions =
                    data.original && data.original.trim().length > 0 &&
                    data.subtitle && data.subtitle.trim().length > 0 &&
                    data.youtube_title && data.youtube_title.trim().length > 0 &&
                    data.description && data.description.trim().length > 0 &&
                    data.comment && data.comment.trim().length > 0;

                if (hasAllVersions) {
                    validCount++;
                    addStatus(`✅ ${code}: 5가지 버전 완료`);
                } else {
                    addStatus(`⚠️ ${code}: 일부 버전 누락`);
                }
            }

            if (validCount > 0) {
                addStatus(`🎉 번역 완료! (${validCount}/${expectedCodes.length}개 언어)`);

                const saveData = {
                    timestamp: new Date().toISOString(),
                    languages: expectedCodes,
                    results: results,
                    valid_count: validCount,
                    total_count: expectedCodes.length
                };

                // 🔥 저장
                localStorage.setItem('TRANSLATION_RESULT_JSON', JSON.stringify(saveData));
                window.TRANSLATION_RESULT_FOR_PYTHON = saveData;

                console.log('✅ 번역 결과 저장 완료:', saveData);

                document.getElementById('trans-complete-btn').style.display = 'block';
                document.getElementById('trans-complete-btn').disabled = false;
            } else {
                addStatus('❌ 유효한 번역 결과가 없습니다!');
            }

            resetUI();

        } catch (error) {
            addStatus(`❌ 파싱 오류: ${error.message}`);
            console.error(error);
            resetUI();
        }
    }

    function parseTranslationResponse(text) {
        const results = {};
        const sections = text.split('===LANGUAGE_START===');

        for (let i = 1; i < sections.length; i++) {
            const section = sections[i].split('===LANGUAGE_END===')[0];

            try {
                const codeMatch = section.match(/CODE:\s*(.+)/);
                if (!codeMatch) continue;

                const langCode = codeMatch[1].trim();

                results[langCode] = {
                    original: extractSection(section, 'ORIGINAL:', 'SUBTITLE:'),
                    subtitle: extractSection(section, 'SUBTITLE:', 'YOUTUBE_TITLE:'),
                    youtube_title: extractSection(section, 'YOUTUBE_TITLE:', 'DESCRIPTION:'),
                    description: extractSection(section, 'DESCRIPTION:', 'COMMENT:'),
                    comment: extractSection(section, 'COMMENT:', null)
                };
            } catch (e) {
                console.error('파싱 오류:', e);
            }
        }

        return results;
    }

    function extractSection(text, startMarker, endMarker) {
        const startIdx = text.indexOf(startMarker);
        if (startIdx === -1) return '';

        const contentStart = startIdx + startMarker.length;
        const endIdx = endMarker ? text.indexOf(endMarker, contentStart) : text.length;

        return text.substring(contentStart, endIdx === -1 ? text.length : endIdx).trim();
    }

    function resetUI() {
        isRunning = false;
        document.getElementById('trans-start-btn').disabled = false;
        document.getElementById('korean-script-input').disabled = false;
        document.getElementById('language-codes-input').disabled = false;
    }

    function init() {
        if (!document.body) {
            setTimeout(init, 1000);
            return;
        }

        const existing = document.getElementById('translation-automation-panel');
        if (existing) {
            existing.remove();
        }

        createPanel();
        console.log('✅ Translation Automation 초기화 완료');
    }

    // 페이지 로드 대기 (Remix Viral 방식과 동일)
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

                // 패널 생성 확인
                setTimeout(() => {
                    const panel = document.getElementById('translation-automation-panel');
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