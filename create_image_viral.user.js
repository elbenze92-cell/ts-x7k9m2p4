// ==UserScript==
// @name         *create_image_viral 동영상 프롬프트
// @namespace    http://tampermonkey.net/
// @version      2.2.4
// @description  Remix 스타일의 고품질 Sora 프롬프트 자동 생성 (JSON 저장)
// @match        https://claude.ai/project/019ad8fd-cf58-7471-a0db-adfdfb46e2cb
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/image_food.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/image_food.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('🎬 Sora Script Generator v2.0 로드됨');

    // ============================================================
    // 📚 단계별 프롬프트 (Remix 스타일)
    // ============================================================

    const STEP_PROMPTS = [
        {
            name: "첨부파일 학습",
            prompt: `1단계를 시작하기 전에,
첨부한 파일과 설정된 지침을 A부터 Z까지 순차적으로 확인해서 학습합니다.

📌 첨부 자료 분석 우선 수행 (필수)

**STEP 1: 모든 첨부 자료 목록 출력**
- 이미지, 문서, 텍스트 파일 등 전체를 번호와 함께 나열

**STEP 2: 각 자료 유형 판별**
- 이미지별로 유형 분류:
  * 영상 캡처 (장면별)
  * 레퍼런스 이미지
  * 기타

**STEP 3: 영상 캡처 심층 분석 (있을 경우)**
영상 캡처로 판별된 이미지가 있을 경우:
1. 각 장면의 시각적 요소 파악
2. 감정/분위기/색감 분석
3. 카메라 워크 (앵글, 무브먼트)
4. 기승전결 어느 부분에 해당하는지 매핑

**STEP 4: 분석 결과 표 작성**
| 이미지 번호 | 유형 | 주요 내용 | 감정/분위기 | 활용 단계 |
|------------|------|----------|------------|----------|
| 1 | 영상 캡처 | [장면 설명] | [분위기] | Part 1 훅 |

**STEP 5: 텍스트 자료 분석**
- 트렌드 정보, 레퍼런스 스크립트 등
- 핵심 키워드 추출
- 바이럴 포인트 파악

이 결과를 시간 아까우니까 출력하지는 말고, 학습만 해둘 것.
"자료 분석이 완료되었습니다. 다음 단계를 진행해주세요." 라고 안내합니다.`
        },
        {
            name: "바이럴 패턴 학습 1",
            prompt: `바이럴 Shorts 성공 패턴 학습

**30초 Shorts의 황금 구조:**

**패턴 001: 반전 드라마**
- 기 (0-5초): 평범한 일상, 익숙한 캐릭터
- 승 (5-15초): 미세한 복선 2-3개 (시각적 힌트)
- 전 (15-25초): 충격 반전 (예상 밖의 진실)
- 결 (25-30초): 여운 + 구독 유도
- 바이럴 포인트: 평범함 → 비범함의 극적 대비
- 타겟: 직장인, 20-40대
- 조회수: 500K-5M

**패턴 002: 물리 법칙 변화**
- 기 (0-5초): 일상적 공간 소개
- 승 (5-15초): 물리 법칙 서서히 변화 (중력, 시간, 색상 등)
- 전 (15-25초): 극한 상황 전개
- 결 (25-30초): 시사점 + 구독 유도
- 바이럴 포인트: What if? 시뮬레이션의 시각적 쾌감
- 타겟: 학생, 과학 관심층
- 조회수: 300K-3M

**패턴 003: 감성 스토리**
- 기 (0-5초): 외로운 주체 등장
- 승 (5-15초): 그리움/갈망 표현
- 전 (15-25초): 카타르시스 순간
- 결 (25-30초): 희망적 메시지 + 구독 유도
- 바이럴 포인트: 공감 → 눈물 → 공유 욕구
- 타겟: 감성적인 사람, 30-50대
- 조회수: 200K-2M

**패턴 004: 코미디 반전**
- 기 (0-5초): 설정 제시
- 승 (5-15초): 상황 악화
- 전 (15-25초): 반전 개그
- 결 (25-30초): 펀치라인 + 구독 유도
- 바이럴 포인트: 웃음 → 친구 태그 → 공유
- 타겟: 유머 감각, 10-30대
- 조회수: 600K-6M

**패턴 005: 공포/스릴러**
- 기 (0-5초): 평온한 시작
- 승 (5-15초): 불안 조성
- 전 (15-25초): 공포 클라이맥스
- 결 (25-30초): 반전/여운 + 구독 유도
- 바이럴 포인트: 오싹함 → 댓글 토론 유발
- 타겟: 스릴러 팬, 10-30대
- 조회수: 400K-4M

**패턴 006: 교육/지식**
- 기 (0-5초): 흥미로운 질문
- 승 (5-15초): 시각화 설명 시작
- 전 (15-25초): 놀라운 사실 공개
- 결 (25-30초): 생각거리 + 구독 유도
- 바이럴 포인트: 몰랐던 지식 → '헉!' → 공유
- 타겟: 학습 욕구, 전 연령
- 조회수: 250K-2.5M

이해했으면 '이해 완료'라고 짧게 대답한다.`
        },
        {
            name: "바이럴 패턴 학습 2",
            prompt: `Sora 2 특성 및 2-Part 전략 학습

**⚠️ SORA 2 중요 제약사항:**
- Sora 2는 한 번에 최대 10-15초만 생성 가능
- 30초 영상 = Part 1 (0-15초) + Part 2 (15-30초)
- 2개 영상을 Python FFmpeg로 합치기

**🎬 2-Part 프롬프트 작성 전략:**

**Part 1 (0-15초)의 핵심:**
1. **강렬한 훅 (0-5초):**
   - 시각적 충격
   - 질문 유도
   - 예상 밖의 등장
   - 예: "Close-up of a man's shocked face, slowly zooming out to reveal..."

2. **스토리 전개 시작 (5-15초):**
   - 복선 2-3개 배치
   - 시각적 힌트
   - 긴장감 조성
   - 예: "Camera pans across empty room, focusing on mysterious object..."

3. **Part 2로의 연결감 (13-15초):**
   - "Camera slowly zooms out, revealing..."
   - "As the door opens, we see..."
   - "Suddenly, the scene shifts to..."
   - **중요:** Part 2가 자연스럽게 이어질 수 있는 장면으로 마무리

**Part 2 (15-30초)의 핵심:**
1. **연결 시작 (15-17초):**
   - "Continuing from previous scene, ..."
   - Part 1의 마지막 장면과 매끄럽게 연결
   - 예: "Following the reveal, camera moves closer..."

2. **클라이맥스 (17-25초):**
   - 반전 순간
   - 감정 폭발
   - 메시지 전달
   - 예: "The truth unfolds as character realizes..."

3. **여운 (25-27초):**
   - 감정 정리
   - 시각적 임팩트
   - 예: "Slow motion of final moment, emotional music swells..."

4. **CTA - 구독 유도 (27-30초) - 필수!:**
   - "Animated subscribe button appears with pointing arrow"
   - "Channel logo fades in with like animation"
   - "Overlay text: 'Subscribe for more!'"
   - **중요:** 모든 영상은 반드시 구독 유도로 끝나야 함

**🎨 시각적 디테일 작성법:**

**좋은 예:**
✅ "Wide shot of abandoned hospital corridor, flickering fluorescent lights casting long shadows. Camera slowly dollies forward as papers scatter across the floor. 0-5 seconds: Close-up of protagonist's trembling hand reaching for doorknob..."

**나쁜 예:**
❌ "A person walks in a hospital."
❌ "Something scary happens."

**핵심 원칙:**
1. 구체적 카메라 워크 명시 (wide shot, close-up, dolly, pan 등)
2. 조명/색감 설명 (golden hour, dramatic lighting, neon glow 등)
3. 시간대별 세부 동작 ("0-5 seconds:", "10-15 seconds:")
4. 감정/분위기 ("tense atmosphere", "joyful mood")
5. 기술 스펙 ("Cinematic 1080p", "dramatic lighting", "slow motion")

이해했으면 '이해 완료'라고 짧게 대답한다.`
        },
        {
            name: "카테고리별 성공 사례 학습",
            prompt: `각 카테고리별 실제 성공 사례 분석

**반전 드라마 성공 사례:**

❌ 예시 금지 (절대 사용 금지):
- 할머니 스파이
- 청소부 천재
- 택시기사 F1 레이서

✅ 창의적 방향 (이런 식으로 생각):
- 직업 + 숨겨진 과거 조합
- 일상 속 비범한 능력
- 세대 간 반전

**물리 현상 성공 사례:**

❌ 예시 금지:
- 커피숍 중력 역전
- 도서관 글자 3D

✅ 창의적 방향:
- 일상 공간 + 물리 법칙 선택 (중력/시간/색상/온도/크기)
- 점진적 변화 강조
- 사람들의 반응 포함

**감성 스토리 성공 사례:**

❌ 예시 금지:
- 마지막 낙엽
- 외로운 로봇

✅ 창의적 방향:
- 자연물 의인화
- 세대 간 연결
- 동물의 감정
- 잃어버린 것에 대한 그리움

**🔥 창의성 강제 규칙:**

각 프롬프트마다 다음을 변경하세요:
✅ 장소 (도시, 자연, 실내, 우주, 수중 등)
✅ 캐릭터 유형 (직업, 나이, 종족, 시대)
✅ 핵심 소재 (물리법칙, 감정, 시간대)
✅ 색감/분위기 (밝음, 어두움, 네온, 복고, 사이버펑크)
✅ 카메라 워크 (FPV, 드론, 클로즈업, 와이드, 스테디캠)
✅ 시간대 (새벽, 황혼, 한밤중, 황금시간대)
✅ 날씨/환경 (비, 눈, 안개, 맑음, 폭풍)

**독창성 체크리스트:**
1. ✅ 이 시나리오를 본 적 없는가?
2. ✅ 주제가 신선한가?
3. ✅ 시각적으로 독특한가?
4. ✅ 다른 프롬프트와 중복 없는가?
5. ✅ 같은 카테고리 내에서도 차별화되는가?

**예시 활용법:**
- 예시는 "구조 이해"용일 뿐
- 실제 프롬프트는 100% 새로운 시나리오
- 한국 문화, 세계 문화, SF, 판타지 모두 활용
- 현실적 + 초현실적 혼합 가능

이해했으면 '이해 완료'라고 짧게 대답한다.`
        },
        {
            name: "프롬프트 생성",
            needsUserInput: true,
            prompt: `이제 실제 Sora 2-part 프롬프트를 생성합니다.

**입력 정보:**
- 카테고리: {CATEGORY}
- 생성 개수: {COUNT}개
- 첨부 자료: (1단계에서 분석한 내용 참고)

**생성 규칙:**

1. **완전히 독창적인 시나리오**
   - 예시 복사 절대 금지
   - 같은 소재 반복 금지
   - 100% 새로운 아이디어

2. **2-Part 구조 필수**
   - Part 1: 0-15초 (훅 + 전개 시작 + 연결)
   - Part 2: 15-30초 (클라이맥스 + 여운 + 구독 유도)
   - 각 Part는 80-120단어

3. **시각적 디테일 필수**
   - 구체적 카메라 워크
   - 조명/색감 설명
   - 시간대별 세부 동작
   - 기술 스펙 명시

4. **구독 유도 필수**
   - Part 2 마지막 3초 (27-30초)
   - 구독 버튼 애니메이션 설명
   - CTA 문구 포함

**출력 형식:**

===PROMPT_START===
CATEGORY: [카테고리]
KOREAN_TITLE: [한국어 제목 - 15자 이내, 호기심 유발]
VIRAL_SCORE: [0-100점]
TARGET_AUDIENCE: [타겟층]
OPTIMAL_DAY: [Monday-Sunday]
HASHTAGS: [#태그1 #태그2 #Shorts]

KOREAN_STORY:
Part 1 (0-15초):
[한국어로 스토리 설명 - 훅과 전개]

Part 2 (15-30초):
[한국어로 스토리 설명 - 클라이맥스와 구독 유도]

PROMPT_PART1:
Wide shot of [장면 설명]. 0-5 seconds: [훅 상세 - 카메라 워크, 조명, 동작]. 5-10 seconds: [전개1 - 복선1, 시각적 디테일]. 10-15 seconds: [전개2 - 복선2, Part 2 연결 힌트], camera slowly [연결 동작] to reveal [다음 장면]. Cinematic 1080p, [조명 스타일], 15 seconds.

PROMPT_PART2:
Continuing from previous scene, [연결 설명]. 15-20 seconds: [클라이맥스 시작 - 반전/감동 순간]. 20-25 seconds: [절정 - 메시지 전달]. 25-27 seconds: [여운 - 감정 정리]. 27-30 seconds: Animated subscribe button with glowing arrow pointing down, channel logo fade-in with sparkle effect, text overlay "Subscribe for more amazing stories!" Cinematic 1080p, 15 seconds.

WHY_VIRAL:
1. [구조적 강점 - 기승전결 분석]
2. [감정적 연결 - 타겟 공감 요소]
3. [공유 동기 - 바이럴 트리거]

===PROMPT_END===

지금 바로 {COUNT}개 생성 시작!
(모든 프롬프트는 완전히 독창적, 2-part 구조, 구독 유도 필수!)`
        },
        {
            name: "프롬프트 검증",
            prompt: `생성된 프롬프트 검증 및 최적화

**검증 항목:**

1. **독창성 체크**
   - 예시와 중복 없는가?
   - 서로 다른 프롬프트끼리 중복 없는가?
   - 시나리오가 충분히 신선한가?

2. **2-Part 구조 체크**
   - Part 1이 0-15초에 맞는가?
   - Part 2가 15-30초에 맞는가?
   - 연결이 자연스러운가?
   - 각 Part가 80-120단어인가?

3. **시각적 디테일 체크**
   - 카메라 워크 명시되었는가?
   - 조명/색감 설명 있는가?
   - 시간대별 동작 구분되어 있는가?

4. **구독 유도 체크**
   - Part 2 마지막 3초에 CTA 있는가?
   - 구독 버튼 애니메이션 설명되어 있는가?

5. **바이럴 점수 정당성**
   - 점수가 WHY_VIRAL 내용과 일치하는가?
   - 타겟층이 명확한가?

**검증 결과:**

각 프롬프트마다:
✅ 통과 or ⚠️ 수정 필요

수정이 필요한 항목:
- 항목명: 문제점 → 수정 방향

**최종 승인:**
모든 프롬프트가 검증을 통과했으면 "검증 완료"라고 응답`
        },
        {
            name: "최종 출력",
            prompt: `최종 프롬프트를 JSON 형식으로 출력합니다.

⚠️ **매우 중요한 출력 규칙:**

1. **순수 JSON만 출력** - 다른 말 일절 금지
2. **마크다운 금지** - \`\`\`json 같은 거 쓰지 마
3. **인사말 금지** - "네", "완료", "여기 있습니다" 같은 말 금지
4. **설명 금지** - JSON 외 어떤 설명도 금지

**출력 형식 (이 형식 그대로만!):**

{
    "sora_prompts": [
        {
            "category": "drama",
            "korean_title": "제목 예시",
            "viral_score": 85,
            "target_audience": "20-40대 직장인",
            "optimal_day": "Monday",
            "hashtags": ["#Shorts", "#반전", "#스토리"],
            "korean_story_part1": "Part 1의 한국어 스토리 설명",
            "korean_story_part2": "Part 2의 한국어 스토리 설명",
            "prompt_part1": "Wide shot of... (Part 1 영문 프롬프트 전문 - 80-120단어)",
            "prompt_part2": "Continuing from previous scene... (Part 2 영문 프롬프트 전문 - 80-120단어)",
            "why_viral": [
                "구조적 강점 설명",
                "감정적 연결 설명",
                "공유 동기 설명"
            ]
        }
    ]
}

**주의사항:**
- viral_score는 숫자 (따옴표 없음)
- hashtags는 배열
- why_viral은 배열 (3개 항목)
- 모든 문자열은 쌍따옴표
- JSON 형식 완벽 준수
- 마지막 항목에 쉼표 없음

지금 바로 출력 시작! (JSON만!)`
        }
    ];

    // ============================================================
    // 🎨 UI 생성 (Remix 스타일)
    // ============================================================

    function createUI() {
        const panel = document.createElement('div');
        panel.id = 'sora-automation-panel';
        panel.innerHTML = `
            <div style="position: fixed; top: 80px; right: 20px; width: 380px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 10000; font-family: 'Segoe UI', sans-serif; color: white;">

                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 28px; margin-bottom: 5px;">🎬</div>
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">Sora Script Generator</div>
                    <div style="font-size: 12px; opacity: 0.9;">v2.0 - JSON 저장 방식</div>
                </div>

                <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 15px; margin-bottom: 15px;">

                    <!-- 카테고리 선택 -->
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 13px;">
                        📂 카테고리
                    </label>
                    <select id="category-select" style="width: 100%; padding: 10px; border: none; border-radius: 8px; font-size: 14px; margin-bottom: 15px; background: white; color: #333;">
                        <option value="auto">🎲 자동 (요일별 최적화)</option>
                        <option value="drama">🎭 반전 드라마</option>
                        <option value="physics">🌀 물리 현상</option>
                        <option value="emotional">💙 감성 스토리</option>
                        <option value="comedy">😂 코미디</option>
                        <option value="horror">👻 공포/스릴러</option>
                        <option value="education">📚 교육/지식</option>
                    </select>

                    <!-- 개수 선택 -->
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 13px;">
                        🔢 생성 개수
                    </label>
                    <input type="number" id="count-input" min="1" max="10" value="7" style="width: 100%; padding: 10px; border: none; border-radius: 8px; font-size: 14px; margin-bottom: 15px;">

                    <!-- 단계 표시 -->
                    <div style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                        단계: <span id="step-count">0 / 7</span>
                    </div>

                    <!-- 진행바 -->
                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; margin-bottom: 15px; overflow: hidden;">
                        <div id="progress-fill" style="height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.3s; width: 0%;"></div>
                    </div>

                    <!-- 시작 버튼 -->
                    <button id="start-btn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s;">
                        🚀 프롬프트 생성 시작
                    </button>

                </div>

                <!-- 진행 상태 -->
                <div id="status-display" style="background: rgba(0,0,0,0.2); border-radius: 10px; padding: 12px; font-size: 13px; line-height: 1.6; margin-bottom: 15px; min-height: 60px; max-height: 200px; overflow-y: auto;">
                    <div style="opacity: 0.8;">💡 카테고리와 개수를 선택하고 시작하세요</div>
                </div>

                <!-- 작업 완료 버튼 -->
                <button id="complete-btn" disabled style="width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: bold; cursor: not-allowed; opacity: 0.5;">
                    ✅ 작업 완료
                </button>

                <div style="margin-top: 15px; font-size: 11px; opacity: 0.7; text-align: center; line-height: 1.5;">
                    ⚙️ Remix 스타일: 첨부파일 학습 → 패턴 학습 → 검증<br>
                    💾 localStorage + JSON 저장 (Python 호환)
                </div>

            </div>
        `;
        document.body.appendChild(panel);

        setupEventListeners();
    }

    // ============================================================
    // 🎯 자동화 핵심 함수들
    // ============================================================

    let currentStep = 0;
    let totalSteps = STEP_PROMPTS.length;
    let selectedCategory = 'auto';
    let selectedCount = 7;
    let allResponses = [];

    // Claude 응답 수집
    function collectResponse() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const messages = document.querySelectorAll('[data-testid="user-message"], [data-testid="assistant-message"]');
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage.getAttribute('data-testid') === 'assistant-message') {
                        const responseText = lastMessage.innerText || lastMessage.textContent;
                        if (responseText && responseText.trim().length > 10) {
                            clearInterval(checkInterval);
                            resolve(responseText);
                        }
                    }
                }
            }, 1000);
        });
    }

    // 프롬프트 입력
    function inputPrompt(text) {
        return new Promise((resolve) => {
            const inputBox = document.querySelector('[contenteditable="true"]');
            if (!inputBox) {
                console.error('❌ 입력창을 찾을 수 없습니다');
                resolve(false);
                return;
            }

            inputBox.focus();
            inputBox.innerText = text;

            // React 이벤트 트리거
            const inputEvent = new Event('input', { bubbles: true });
            inputBox.dispatchEvent(inputEvent);

            setTimeout(() => {
                const sendBtn = document.querySelector('button[aria-label*="Send"], button[aria-label*="전송"]');
                if (sendBtn) {
                    sendBtn.click();
                    resolve(true);
                } else {
                    // Enter 키로 전송
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        bubbles: true
                    });
                    inputBox.dispatchEvent(enterEvent);
                    resolve(true);
                }
            }, 500);
        });
    }

    // 상태 업데이트
    function updateStatus(message, color = '#4CAF50') {
        const statusDisplay = document.getElementById('status-display');
        if (statusDisplay) {
            const timestamp = new Date().toLocaleTimeString('ko-KR');
            statusDisplay.innerHTML += `<div style="color: ${color}; margin-bottom: 5px;">[${timestamp}] ${message}</div>`;
            statusDisplay.scrollTop = statusDisplay.scrollHeight;
        }
    }

    // 진행바 업데이트
    function updateProgress(step) {
        const progressFill = document.getElementById('progress-fill');
        const stepCount = document.getElementById('step-count');

        if (progressFill && stepCount) {
            const percentage = (step / totalSteps) * 100;
            progressFill.style.width = percentage + '%';
            stepCount.textContent = `${step} / ${totalSteps}`;
        }
    }

    // 메인 자동화 프로세스
    async function runAutomation() {
        const startBtn = document.getElementById('start-btn');
        const completeBtn = document.getElementById('complete-btn');

        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
        startBtn.style.cursor = 'not-allowed';

        updateStatus('🚀 Sora 프롬프트 생성 시작!', '#4CAF50');

        for (let i = 0; i < STEP_PROMPTS.length; i++) {
            currentStep = i + 1;
            const step = STEP_PROMPTS[i];

            updateProgress(currentStep);
            updateStatus(`📍 ${currentStep}단계: ${step.name}`, '#2196F3');

            let promptText = step.prompt;

            // 사용자 입력 필요한 단계 처리
            if (step.needsUserInput) {
                promptText = promptText
                    .replace(/{CATEGORY}/g, selectedCategory)
                    .replace(/{COUNT}/g, selectedCount);
            }

            // 프롬프트 입력
            const inputSuccess = await inputPrompt(promptText);
            if (!inputSuccess) {
                updateStatus('❌ 프롬프트 입력 실패', '#f44336');
                break;
            }

            updateStatus(`⏳ Claude 응답 대기 중...`, '#FF9800');

            // 응답 대기
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 응답 수집
            const response = await collectResponse();
            allResponses.push({
                step: currentStep,
                name: step.name,
                response: response
            });

            updateStatus(`✅ ${step.name} 완료`, '#4CAF50');

            // 다음 단계 대기
            if (i < STEP_PROMPTS.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        // 마지막 응답에서 JSON 파싱
        updateStatus('🔄 JSON 데이터 파싱 중...', '#2196F3');
        await parseAndSaveJSON();

        updateStatus('🎉 모든 단계 완료!', '#4CAF50');

        // 완료 버튼 활성화
        completeBtn.disabled = false;
        completeBtn.style.opacity = '1';
        completeBtn.style.cursor = 'pointer';
    }

    // JSON 파싱 및 저장
    async function parseAndSaveJSON() {
        try {
            const lastResponse = allResponses[allResponses.length - 1].response;

            // JSON 추출 (마크다운 제거)
            let jsonText = lastResponse;

            // ```json ... ``` 제거
            jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // 앞뒤 공백 및 불필요한 텍스트 제거
            jsonText = jsonText.trim();

            // JSON 시작/끝 찾기
            const jsonStart = jsonText.indexOf('{');
            const jsonEnd = jsonText.lastIndexOf('}');

            if (jsonStart !== -1 && jsonEnd !== -1) {
                jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
            }

            // JSON 파싱
            const soraData = JSON.parse(jsonText);

            // localStorage 저장
            localStorage.setItem('SORA_PROMPTS_JSON', JSON.stringify(soraData));
            window.SORA_PROMPTS_JSON_FOR_PYTHON = JSON.stringify(soraData);

            updateStatus(`💾 localStorage 저장 완료 (${soraData.sora_prompts.length}개 프롬프트)`, '#4CAF50');

            console.log('✅ Sora JSON 저장 완료:', soraData);

        } catch (error) {
            updateStatus(`❌ JSON 파싱 실패: ${error.message}`, '#f44336');
            console.error('JSON 파싱 에러:', error);
            console.log('원본 응답:', allResponses[allResponses.length - 1].response);
        }
    }

    // 이벤트 리스너 설정
    function setupEventListeners() {
        const startBtn = document.getElementById('start-btn');
        const completeBtn = document.getElementById('complete-btn');
        const categorySelect = document.getElementById('category-select');
        const countInput = document.getElementById('count-input');

        // 카테고리 변경
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                selectedCategory = e.target.value;
                updateStatus(`📂 카테고리: ${e.target.options[e.target.selectedIndex].text}`, '#2196F3');
            });
        }

        // 개수 변경
        if (countInput) {
            countInput.addEventListener('change', (e) => {
                selectedCount = parseInt(e.target.value);
                updateStatus(`🔢 생성 개수: ${selectedCount}개`, '#2196F3');
            });
        }

        // 시작 버튼
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                runAutomation();
            });
        }

        // 완료 버튼
        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                updateStatus('✅ Python에서 localStorage 읽어가세요!', '#4CAF50');
                console.log('📦 저장된 데이터:', {
                    localStorage: localStorage.getItem('SORA_PROMPTS_JSON'),
                    window: window.SORA_PROMPTS_JSON_FOR_PYTHON
                });
            });
        }
    }

    // ============================================================
    // 🚀 초기화
    // ============================================================

    function init() {
        if (window.location.href.includes('claude.ai')) {
            console.log('🎬 Sora v2.0 초기화...');
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createUI);
            } else {
                createUI();
            }
        }
    }

    init();

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