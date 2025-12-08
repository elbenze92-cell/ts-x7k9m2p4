// ==UserScript==
// @name         #SRT Generator 자막 교정
// @namespace    atobro
// @version      2.2.2
// @description  Whisper → SRT 자동 생성
// @match        https://claude.ai/project/019acaca-6f06-702b-a145-2d851ad72936
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/srt.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/srt.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🎬 SRT Generator v3.0 로드됨');

    // 전역 변수
    let isRunning = false;

    // 🔥 SRT 프롬프트 템플릿 (Python과 100% 동일)
    const SRT_PROMPT_TEMPLATE = `You are a professional subtitle timing expert with color emphasis and meme insertion capabilities.

**Task:**
1. Create accurate SRT timestamps
2. Identify ONE keyword per subtitle for color emphasis
3. Mark 3-4 emotional peaks for meme insertion (GIFs will replace video at these moments)

**Language:** {LANGUAGE_CODE}
{LANGUAGE_NOTE}

**Whisper Transcription (with word-level timestamps):**
\`\`\`json
{WHISPER_JSON}
\`\`\`

**Reference Text (target subtitle lines):**
\`\`\`
{SUBTITLE_TEXT}
\`\`\`

**CRITICAL INSTRUCTIONS:**

1. **ONE-TO-ONE LINE MAPPING (MOST IMPORTANT)**:
   - EACH reference text line MUST become EXACTLY ONE subtitle
   - NEVER merge multiple reference lines into one subtitle
   - NEVER skip any reference line
   - Total subtitles MUST equal {LINE_COUNT} reference lines
   - Example: 33 reference lines = EXACTLY 33 subtitles
   - Even if timing is tight, distribute time evenly across all lines
   - Even for ending phrases, create separate subtitles

2. **Pronunciation Matching**: Handle OCR/speech recognition errors intelligently
   - Example: "설계됧죠" in Whisper matches "설계됐죠" in reference
   - Consider phonetic similarity, not just exact character match
   - For Indic scripts (Bengali, Hindi, etc.), be VERY flexible with character matching

3. **Context-Based Disambiguation**: Use context to distinguish similar words
   - Look at surrounding words and timing to choose correct match
   - Trust the sequential order of reference text

4. **Sequential Timing**: Timestamps MUST be sequential
   - start[n] >= end[n-1]
   - No time reversals or overlaps
   - If Whisper timing seems wrong, distribute time evenly across text lines

5. **Exact Text**: Use EXACT text from reference lines, not Whisper text

6. **COLOR EMPHASIS**:
   - **MANDATORY: First subtitle (index 1) MUST have a highlight**
   - For remaining subtitles: Choose 4-5 additional keywords TOTAL
   - Selection criteria:
     * 🔴 RED: Most impactful moments (climax, main message, conclusion, hook)
     * 🟡 YELLOW: Important emotional turning points or surprising facts
   - Most subtitles (except first) should have highlight: null

7. **MEME & SOUND EFFECTS INSERTION (MANDATORY)**:

   **A. MEMES (3-6 locations, QUALITY OVER QUANTITY):**
   - **ONLY identify 3-6 CLEAR emotional peak moments**
   - **CRITICAL: If emotion is unclear or forced, DO NOT add meme**
   - Better to have 3 perfect memes than 6 awkward ones

   **EMOTION CATEGORIES (가장 구체적인 것 선택, 총 30개):**

   **놀람 계열 (Shock/Surprise):**
   - shocked: 충격적 사실, 믿을 수 없음, "헐/충격/세상에/말도 안 돼"
   - surprised: 예상 밖, 반전, "놀랍게도/의외로/뜻밖에"
   - amazed: 압도적, 엄청남, "대박/엄청/어마어마/경이로운"
   - mindblown: 이해 불가, 머리 터짐, "이해가 안 돼/정신 나가/미쳤다"
   - disbelief: 의심, 진짜?, "설마/믿기지 않아/정말?"

   **고민 계열 (Thinking):**
   - thinking: 생각 유도, "생각해보면/한번 보자/살펴보면"
   - questioning: 질문 제기, "왜/어떻게/무엇이/과연"
   - confused: 복잡함, 헷갈림, "복잡한/어렵다/이해하기 힘든"
   - pondering: 깊은 고민, "심사숙고/곰곰이/진지하게 생각하면"
   - curious: 궁금함, 호기심, "궁금하지 않나요/알고 싶다/관심"

   **긍정 계열 (Positive):**
   - happy: 기쁨, 좋음, "좋아요/기쁘다/행복/즐겁다"
   - celebrating: 성공 달성, "성공/완성/달성/해냈다"
   - satisfied: 만족, 완벽, "훌륭/최고/완벽/대단한"
   - excited: 신남, 기대, "기대돼/설레는/두근두근/신난다"
   - laughing: 웃김, 재밌음, "웃겨/재밌어/ㅋㅋㅋ/유머"
   - relief: 안도, 다행, "다행히/휴/걱정 끝/해결됐다"

   **부정 계열 (Negative):**
   - sad: 슬픔, 안타까움, "슬프게도/불행히도/애석하게도"
   - disappointed: 실망, 아쉬움, "아쉽게도/기대 이하/실망"
   - worried: 걱정, 불안, "걱정/불안/위험/염려"
   - crying: 우는 중, 너무 슬픔, "너무 슬퍼/울어/눈물"
   - frustrated: 답답함, 짜증, "답답해/짜증/막막한"
   - hopeless: 절망, 포기, "절망적/희망 없어/포기/망했다"

   **강조 계열 (Emphasis):**
   - angry: 화남, 분노, "화나/분노/빡쳐/짜증"
   - warning: 경고, 주의, "경고/조심/위험/주의하세요"
   - forbidden: 금지, 절대 안 됨, "절대 안 돼/금지/하지 마세요"
   - serious: 진지함, 중요, "중요해/진지하게/심각/반드시"

   **피로 계열 (Tired):**
   - tired: 피곤, 지침, "피곤/지쳐/힘들어"
   - exhausted: 탈진, 극한, "너무 힘들다/기절/탈진/한계"

   **구독 유도 (Call-to-Action):**
   - subscribe: 구독 요청, "구독/좋아요/알림/눌러주세요"
   - please: 부탁, 애원, "부탁해요/제발/꼭"
   - pointing: 아래 가리키기, "여기/버튼/클릭/아래"

   **SELECTION CRITERIA (엄격하게):**

   **반드시 포함 (MUST HAVE):**
   - 마지막 자막: subscribe/please/pointing (구독 유도) ← 필수!

   **포함 가능 (ONLY if VERY CLEAR):**
   - 충격적 반전: "놀랍게도/엄청난/충격적" → surprised/amazed/shocked
   - 성공/달성: "성공했다/해냈다/완성" → celebrating
   - 강한 부정: "절대 안 돼/금지" → forbidden
   - 웃긴 순간: "재밌다/웃겨/ㅋㅋ" → laughing

   **절대 포함하지 말 것 (DO NOT USE):**
   ❌ 애매한 정보 전달: "~할 수 있습니다", "~입니다"
   ❌ 중립적 설명: "이것은 ~", "방법은 ~"
   ❌ 약한 감정: "좋아요", "나쁘네요"
   ❌ 억지로 감정 끼워넣기

   **RULE:**
   - 감정이 명확하지 않으면 → 밈 추가 안 함
   - "이거 밈 넣으면 웃기겠다" 싶을 때만 추가
   - 자연스러움 > 개수
   - Aim for 3-4 memes typically, up to 6 if truly warranted

   **B. SOUND EFFECTS ONLY (1-2 additional locations):**
   - **YOU MUST identify 1-2 additional moments for sound effects ONLY (no GIF)**
   - These are SHORT, PUNCHY emphasis at SPECIFIC linguistic moments
   - Duration: 0.3-0.5 seconds (짧게!)

   **SPECIFIC PLACEMENT CRITERIA (우선순위 순서):**

   **1순위: 지시/강조 표현**
   - 지시대명사: "이 남자", "그 방법", "저 결과", "이것", "그것"
   - 강조 부사: "바로", "정말", "매우", "특히", "딱", "무려"
   → Use: curious, pointing, serious

   **2순위: 숫자/통계**
   - "3가지", "50%", "2배", "첫 번째", "100만", "10년"
   → Use: surprised, amazed, shocked

   **3순위: 전환 표현**
   - "그런데", "하지만", "그러나", "따라서", "그렇다면", "그래서"
   → Use: thinking, questioning, pondering

   **4순위: 질문 표현**
   - "왜?", "어떻게?", "과연?", "정말?", 물음표 포함 문장
   → Use: questioning, curious, confused

   **5순위: 강한 긍정/부정**
   - "절대", "반드시", "꼭", "아니야", "맞아", "무조건", "결코"
   → Use: serious, forbidden, warning

   **PLACEMENT RULES:**
   - Distribute EVENLY across video (avoid clustering)
   - Match SPECIFIC linguistic pattern above
   - Duration: 0.3-0.5 seconds (shorter than memes!)
   - **TOTAL: 6-10 sound moments (3-6 with GIF + 3-4 sound-only)**

   **구독 유도 (마지막 필수):**
   - 마지막 자막(또는 끝에서 2번째)에 구독 유도 밈 필수!
   - "구독 부탁드려요" → subscribe (MEME, not sound-only!)
   - "좋아요 눌러주세요" → subscribe + pointing (MEME)

**Output Format (JSON only, no explanation):**
\`\`\`json
[
  {
    "index": 1,
    "start": 0.00,
    "end": 0.88,
    "text": "exact reference text line 1",
    "highlight": {"word": "keyword", "color": "red"},
    "meme": null
  },
  {
    "index": 5,
    "start": 8.20,
    "end": 10.80,
    "text": "exact reference text line 5",
    "highlight": {"word": "놀라운", "color": "red"},
    "meme": {
      "emotion": "surprised",
      "start": 8.5,
      "natural_duration": 1.8,
      "sound_only": false
    }
  },
  {
    "index": 8,
    "start": 12.50,
    "end": 14.20,
    "text": "exact reference text line 8",
    "highlight": null,
    "meme": {
      "emotion": "thinking",
      "start": 13.0,
      "natural_duration": 0.5,
      "sound_only": true
    }
  }
]
\`\`\`

**IMPORTANT:**
- Return ONLY valid JSON array
- Use exact text from reference lines
- MUST create EXACTLY {LINE_COUNT} subtitles (one per reference line)
- NEVER merge multiple lines into one subtitle
- Even if Whisper words are insufficient, evenly distribute timing
- Maximum 1 highlight per subtitle (or null)
- "word" must be exact substring of "text"
- Only use "red" or "yellow" for color
- Meme placement: Total 3-4 memes, natural duration 0.5-3.0 seconds
- Distribute memes evenly (e.g., one every 8-10 seconds in a 30s video)`;

    // UI 스타일
    GM_addStyle(`
        #srt-automation-panel {
            position: fixed;
            top: 20px;
            right: 440px;
            width: 400px;
            background: linear-gradient(135deg, #9c27b0 0%, #6a1b9a 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        #srt-automation-panel h3 {
            margin: 0 0 20px 0;
            font-size: 20px;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .srt-input-area {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }

        .srt-input-area label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: bold;
        }

        .srt-input-area textarea {
            width: 100%;
            height: 100px;
            padding: 10px;
            border-radius: 6px;
            border: none;
            font-size: 12px;
            resize: vertical;
            background: white;
            color: #333;
            font-family: 'Consolas', monospace;
        }

        .srt-input-area input {
            width: 100%;
            padding: 10px;
            border-radius: 6px;
            border: none;
            font-size: 13px;
            background: white;
            color: #333;
        }

        .srt-hint {
            font-size: 11px;
            color: rgba(255,255,255,0.8);
            margin-top: 5px;
        }

        #srt-start-btn, #srt-complete-btn {
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

        #srt-start-btn {
            background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
            color: white;
        }

        #srt-start-btn:hover:not(:disabled) {
            transform: scale(1.05);
        }

        #srt-start-btn:disabled {
            background: #666;
            cursor: not-allowed;
            opacity: 0.6;
        }

        #srt-complete-btn {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            display: none;
        }

        #srt-status {
            background: rgba(0,0,0,0.2);
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 13px;
            max-height: 150px;
            overflow-y: auto;
            display: none;
        }

        .srt-status-line {
            margin: 5px 0;
            padding: 5px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
        }
    `);

    // UI 패널 생성
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'srt-automation-panel';
        panel.innerHTML = `
            <h3>🎬 SRT Generator</h3>

            <div class="srt-input-area">
                <label>Whisper JSON:</label>
                <textarea id="whisper-json-input" placeholder='{"words": [...], "segments": [...]}'></textarea>
                <div class="srt-hint">Whisper API 응답 JSON</div>
            </div>

            <div class="srt-input-area">
                <label>자막 텍스트 (줄바꿈 구분):</label>
                <textarea id="subtitle-text-input" placeholder="첫 번째 자막
두 번째 자막
세 번째 자막"></textarea>
                <div class="srt-hint">각 줄 = 1개 자막</div>
            </div>

            <div class="srt-input-area">
                <label>언어 코드:</label>
                <input type="text" id="language-code-input" placeholder="ko-KR" value="ko-KR" />
                <div class="srt-hint">예: ko-KR, en-US, ja-JP</div>
            </div>

            <button id="srt-start-btn">🚀 SRT 생성</button>
            <button id="srt-complete-btn" disabled>✅ 작업 완료</button>

            <div id="srt-status"></div>
        `;

        document.body.appendChild(panel);

        // 🔥 [버튼 클릭 문제 해결법 #1]
        // 문제: document.body.appendChild(panel) 직후 즉시 getElementById 호출 시
        //       DOM 렌더링이 완료되지 않아 버튼을 못 찾거나 이벤트 리스너가 안 붙음
        // 해결: setTimeout으로 100ms 대기 후 이벤트 리스너 연결
        // 증상: 버튼은 보이지만 클릭해도 아무 반응 없음, 콘솔에 "이벤트 리스너 붙임" 로그 안 나옴
        setTimeout(() => {
            const startBtn = document.getElementById('srt-start-btn');
            const completeBtn = document.getElementById('srt-complete-btn');

            console.log('🔍 버튼 찾기:', { startBtn: !!startBtn, completeBtn: !!completeBtn });

            if (startBtn) {
                startBtn.addEventListener('click', function() {
                    console.log('🚀 SRT 생성 시작 버튼 클릭됨!');
                    startSRTGeneration();
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
                const p = document.getElementById('srt-automation-panel');
                if (p) {
                    p.style.display = p.style.display === 'none' ? 'block' : 'none';
                }
            }
        });

        addStatus('✅ SRT Generator 준비 완료');
    }

    function addStatus(message) {
        const status = document.getElementById('srt-status');
        if (!status) return;

        status.style.display = 'block';

        const line = document.createElement('div');
        line.className = 'srt-status-line';
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

    // 🔥 작업 완료 표시
    function markAsCompleted() {
        localStorage.setItem('SRT_STATUS', 'COMPLETED');
        localStorage.setItem('SRT_COMPLETED_AT', new Date().toISOString());

        addStatus('✅ 완료 상태 저장됨 - Python이 읽을 수 있습니다');

        document.getElementById('srt-complete-btn').disabled = true;
    }

    // SRT 생성 시작 (재시도 로직 추가)
    async function startSRTGeneration() {
        const whisperJson = document.getElementById('whisper-json-input').value.trim();
        const subtitleText = document.getElementById('subtitle-text-input').value.trim();
        const langCode = document.getElementById('language-code-input').value.trim();

        if (!whisperJson) {
            alert('Whisper JSON을 입력하세요!');
            return;
        }

        if (!subtitleText) {
            alert('자막 텍스트를 입력하세요!');
            return;
        }

        // 상태 초기화
        localStorage.removeItem('SRT_STATUS');
        localStorage.removeItem('SRT_RESULT_JSON');
        window.SRT_RESULT_FOR_PYTHON = undefined;

        isRunning = true;
        document.getElementById('srt-start-btn').disabled = true;
        document.getElementById('whisper-json-input').disabled = true;
        document.getElementById('subtitle-text-input').disabled = true;
        document.getElementById('language-code-input').disabled = true;
        document.getElementById('srt-complete-btn').style.display = 'none';

        addStatus('⏳ SRT 생성 시작...');

        // 프롬프트 생성
        const prompt = generateSRTPrompt(whisperJson, subtitleText);

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

                extractSRTResult();
                success = true;

            } catch (error) {
                retryCount++;
                addStatus(`⚠️ 오류: ${error.message}`);

                if (retryCount >= maxRetries) {
                    addStatus('❌ 최대 재시도 초과');
                    localStorage.setItem('SRT_STATUS', 'FAILED');
                    localStorage.setItem('SRT_ERROR', error.message);
                    resetUI();
                    return;
                }
            }
        }
    }

    function generateSRTPrompt(whisperJson, subtitleText) {
        const lines = subtitleText.split('\n').filter(l => l.trim());

        let prompt = SRT_PROMPT_TEMPLATE;
        prompt = prompt.replace('{WHISPER_JSON}', whisperJson);
        prompt = prompt.replace('{SUBTITLE_TEXT}', subtitleText);
        prompt = prompt.replace(/{LINE_COUNT}/g, lines.length);

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

    // 🔥 기존 스크립트 방식 그대로 (Create 참고)
    function extractSRTResult() {
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

            console.log(`📝 SRT 결과 수집: ${fullText.length}글자`);

            if (!fullText || fullText.length < 50) {
                addStatus('❌ 유효한 응답을 찾을 수 없습니다');
                resetUI();
                return;
            }

            // JSON 파싱
            const srtResult = parseSRTResponse(fullText);

            if (!srtResult || srtResult.length === 0) {
                addStatus('❌ SRT 결과 파싱 실패!');
                addStatus('⚠️ Claude 응답 형식을 확인하세요');
                resetUI();
                return;
            }

            addStatus(`🎉 SRT 생성 완료! (${srtResult.length}개 자막)`);

            // 통계
            const red = srtResult.filter(x => x.highlight && x.highlight.color === 'red').length;
            const yellow = srtResult.filter(x => x.highlight && x.highlight.color === 'yellow').length;
            const meme = srtResult.filter(x => x.meme && !x.meme.sound_only).length;
            const sound = srtResult.filter(x => x.meme && x.meme.sound_only).length;

            addStatus(`🎨 색상: 🔴 ${red}개, 🟡 ${yellow}개`);
            addStatus(`🎭 밈: ${meme}개, 🔊 사운드: ${sound}개`);

            // 🔥 저장 (기존 스크립트 방식)
            const saveData = {
                timestamp: new Date().toISOString(),
                srt_data: srtResult,
                subtitle_count: srtResult.length,
                statistics: {
                    red_highlights: red,
                    yellow_highlights: yellow,
                    memes: meme,
                    sounds: sound
                }
            };

            localStorage.setItem('SRT_RESULT_JSON', JSON.stringify(saveData));
            window.SRT_RESULT_FOR_PYTHON = saveData;

            console.log('✅ SRT 결과 저장 완료:', saveData);

            // 완료 버튼 활성화
            document.getElementById('srt-complete-btn').style.display = 'block';
            document.getElementById('srt-complete-btn').disabled = false;

            resetUI();

        } catch (error) {
            addStatus(`❌ 파싱 오류: ${error.message}`);
            console.error('파싱 오류:', error);
            resetUI();
        }
    }

    function parseSRTResponse(text) {
        try {
            let jsonText = text;

            // 코드 블록 제거
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            // 배열 찾기
            const arrayMatch = jsonText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
                jsonText = arrayMatch[0];
            }

            const result = JSON.parse(jsonText);

            if (!Array.isArray(result)) {
                throw new Error('응답이 배열이 아닙니다');
            }

            return result;

        } catch (e) {
            console.error('JSON 파싱 실패:', e);
            return [];
        }
    }

    function resetUI() {
        isRunning = false;
        document.getElementById('srt-start-btn').disabled = false;
        document.getElementById('whisper-json-input').disabled = false;
        document.getElementById('subtitle-text-input').disabled = false;
        document.getElementById('language-code-input').disabled = false;
    }

    function init() {
        if (!document.body) {
            setTimeout(init, 1000);
            return;
        }

        const existing = document.getElementById('srt-automation-panel');
        if (existing) {
            existing.remove();
        }

        createPanel();
        console.log('✅ SRT Generator v3.0 초기화 완료');
    }

    // 페이지 로드 대기 (Translation 방식과 동일)
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
                    const panel = document.getElementById('srt-automation-panel');
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