// ==UserScript==
// @name         !music long 대본 자동화 (Python 연동)
// @namespace    https://atobro.com/
// @version      2.0.0
// @description  8개 음악 채널 대본 자동 생성 + Midjourney 프롬프트 + Python 연동
// @author       Atobro
// @match        https://chatgpt.com/*
// @match        https://claude.ai/project/01991a16-3ace-725a-b5e7-91f0b1b7ed2c
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/music_long.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/music_long.user.js
// @icon         https://chat.openai.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_notification
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🎵 GPT 음악 자동화 스크립트 v2.0 로딩...');

    // ============================================================================
    // 🔧 설정
    // ============================================================================
    const CONFIG = {
        MAX_SONGS: 25,
        POLL_INTERVAL: 500,
        RESPONSE_TIMEOUT: 120000,  // 2분
        CONTINUE_WAIT: 3000,
        BETWEEN_SONGS_DELAY: 3000,

        // UI 색상
        COLORS: {
            primary: '#8b5cf6',      // 보라색
            secondary: '#667eea',
            success: '#22c55e',
            error: '#ef4444',
            warning: '#eab308',
            bg: '#1e1e2e',
            bgLight: '#2a2a3e',
            text: '#ffffff'
        },

        // 채널 정보
        CHANNELS: {
            'LOFI': { name: 'ATOBRO LOFI', icon: '🎧', color: '#6366f1', mjVersion: 'niji6' },
            'BALLAD': { name: 'ATOBRO BALLAD', icon: '🌅', color: '#ec4899', mjVersion: 'v7' },
            'HIPHOP': { name: 'ATOBRO GROOVE', icon: '🎤', color: '#f59e0b', mjVersion: 'v7' },
            'EDM': { name: 'ATOBRO BEAT', icon: '⚡', color: '#10b981', mjVersion: 'niji6' },
            'POP': { name: 'ATOBRO CAFE', icon: '☕', color: '#f472b6', mjVersion: 'v7' },
            'KPOP': { name: 'ATOBRO KPOP', icon: '💜', color: '#a855f7', mjVersion: 'niji6' },
            'TROT': { name: 'ATOBRO TROT', icon: '🎺', color: '#ef4444', mjVersion: 'v7' },
            'CCM': { name: 'ATOBRO CCM', icon: '✝️', color: '#3b82f6', mjVersion: 'niji6' }
        }
    };

    // ============================================================================
    // 🗄️ 전역 상태
    // ============================================================================
    let state = {
        isRunning: false,
        isPaused: false,
        currentChannel: null,
        songCount: 0,
        currentStep: 0,
        totalSteps: 0,
        songs: [],
        midjourneyPrompts: [],
        youtubeData: null,
        startTime: null,
        errors: []
    };

    // ============================================================================
    // 📝 채널별 프롬프트 정의
    // ============================================================================
    const CHANNEL_PROMPTS = {
        'LOFI': `You are writing instrumental music for the ATOVIA FLOW channel.

목적: LOFI 스타일의 음악을 제작하여 사람들이 공부, 수면, 집중, 독서, 명상, 힐링 중에 무의식적으로 들을 수 있도록 한다.

전체적인 분위기:
- 감정이 과하게 드러나지 않는 차분하고 부드러운 무드
- 반복 가능한 리듬, 감성적이지만 방해되지 않는 멜로디
- 백색소음처럼 작동할 수 있지만 감정의 질감이 느껴지는 사운드

음악 장르: Lofi hip-hop, chillhop, ambient lofi, jazzy lofi, dream pop lofi
악기: 브러시 드럼, 저음 피아노, 부드러운 베이스, 로우파이 텍스처, 테이프 히스

이 음악은 가사가 거의 없고, 듣는 사람의 의식을 방해하지 않아야 하며, 잔잔한 몰입감을 유도해야 한다.

프롬프트를 참고해서 완전히 새로운 노래만 다시 작성해줘 (곡 생성할 필요 없어)
Return in separate copyable code blocks:
- Title: 곡 제목 (창의적이고 다채로운 영어 제목)
- Style: 반드시 영어로 작성하며, 최소 2문장 이상 상세하게 기술. 700자 이내로.
(타이틀에 title, 스타일에 style 단어는 제외할것)
style에 작곡가나 밴드 이름이 들어가면 생성 불가함.`,

        'BALLAD': `Ballad, Indie, Acoustic, 혹은 Folk 장르의 음악에 어울리는 K-pop 가사를 작성해줘.
전체적인 분위기는 잔잔하고 서정적이며 감성적인 흐름을 갖도록 구성하고, 다음 조건을 반드시 반영해줘:

1. 정확한 음악 스타일 표현 (예: 어쿠스틱 기타 중심 + 여성 보컬 + 따뜻한 음색)
2. 감정 키워드 포함 (예: 그리운, 따뜻한, 외로운, 아련한, 진솔한)
3. 가사 구조는 명확히 구분: [Intro], [Verse], [Chorus], [Bridge], [Outro]
4. 보컬톤: 남자 또는 여자 중 하나를 무작위(여자 70% 확률)로 선택
5. 어쿠스틱 악기 기반의 따뜻하고 감성적인 무드 반영
6. 언어: 한국어 메인, 영어 라인은 후렴에 자연스럽게

프롬프트를 참고해서 완전히 새로운 노래 가사만 다시 작성해줘
Return in separate copyable code blocks:
- Title: 곡 제목 (창의적이고 다채로운 제목)
- Style: 반드시 영어로 작성하며, 최소 2문장 이상 상세하게 기술. 700자 이내로
- Lyrics`,

        'HIPHOP': `유튜브 힙합 음악 채널에서 사용할 감성 기반 한국 힙합 가사를 작성해줘.
시점은 남자 또는 여자 중 무작위로 선택하되, 남성 60%, 여성 40% 확률로 정해.

곡 분위기는 Soft chill, emotional Korean hiphop, mellow R&B, lo-fi 기반의 세련된 톤.
전체적으로는 '속삭이듯 랩하는 일기장' 같은 느낌을 목표로 한다.
가사는 한국어 중심 + 위트 있는 일상 표현으로 구성.

가사 구조:
[Verse 1] 인물의 상황과 내면을 드러내는 리얼한 서사
[Pre-Chorus] 리듬 변화 또는 감정 축적
[Chorus] 중독성 있는 훅, 한국어 중심 + 짧고 강한 영어 한 줄
[Verse 2] 시점 확장 또는 감정 고조
[Bridge] 진심이 터지는 한 마디
[Outro] 감정의 잔상을 남기는 마무리

프롬프트를 참고해서 완전히 새로운 힙합 노래 가사만 다시 작성해줘
Return in separate copyable code blocks:
- Title: 곡 제목
- Style: 반드시 영어로 작성, 700자 이내로
- Lyrics`,

        'EDM': `다음 조건에 맞춰 nightcore 기반의 EDM remix 트랙을 만들어줘.
템포와 보컬 피치를 원곡보다 약간 높여서 일반 트랙과 나이트코어의 중간 느낌.

장르: nightcore 기반 EDM Remix + Melodic House, Future House
BPM 130~140 중심, 원곡 대비 15~20% 빠른 템포

사용 상황: 헬스장, 러닝, 클럽 플로어, 게임 보스전

보컬 스타일: 클린한 리드 보컬 (남자/여자 랜덤 50%), 중독성 있는 반복 훅 필수

가사 구조:
[Intro] – 공간감 있는 패드 + 간결한 보컬
[Verse] – 스토리텔링 중심
[Build-Up] – 드럼 필, 필터 스윕, FX Riser
[Drop] – 플럭 리드·딥베이스 + 보컬샘플
[Breakdown] – 여운과 재집중
[Outro] – 에너지를 식히며 마무리

Return in separate copyable code blocks:
- Title: 곡 제목 (창의적이고 다채로운 제목, 2~3단어)
- Style: 반드시 영어로 작성, 700자 이내로
- Lyrics: 반드시 영어로 작성`,

        'POP': `유튜브 음악 채널에 사용할 POP 장르의 가사를 작성해줘.
남자 또는 여자 중 하나를 무작위(여자 70% 확률)로 선택하여 곡을 작성.
중독적인 멜로디, 감정선이 살아있는 보컬, 현대적인 편곡이 특징.

다음 요소들을 반드시 반영:
① 구체적인 음악 스타일 표현
② 감정 키워드 포함 (몽환적인, 아련한, 설레는, 따뜻한)
③ 가사 구조는 [Verse], [Chorus], [Bridge] 등으로 구분
④ 글로벌 감성의 팝 스타일

Return in separate copyable code blocks:
- Title: 곡 제목
- Style: 반드시 영어로 작성, 700자 이내로
- Lyrics: 반드시 영어로 작성`,

        'KPOP': `유튜브 음악 채널에 사용할 K-pop 스타일 가사를 작성해줘.
걸그룹 또는 보이그룹 분위기 중 하나로 (여자 60%, 남자 40% 확률)
강렬한 후렴, 중독적인 멜로디, 댄스 비트, 아이돌풍 보컬 톤

다음 요소들을 반드시 반영:
① 구체적 음악 스타일 표현
② 감정 키워드 포함 (청량한, 자신감 넘치는)
③ 가사 구조는 [Verse], [Chorus], [Bridge] 등으로 구분
④ 한글 가사를 메인으로, 영어는 후렴에서 강조로만

"we go higher", "endless fire" 같은 클리셰 표현 금지.
곡 제목/테마와 직접 연결된 마무리 문구로 끝낼 것.

Return in separate copyable code blocks:
- Title: 곡 제목 (KPOP 특유의 네온, 불꽃 같은 단어보다 창의적인 제목)
- Style: 반드시 영어로 작성, 700자 이내로
- Lyrics`,

        'TROT': () => {
            const isUpbeat = Math.random() < 0.5;
            if (isUpbeat) {
                return `한국의 신나는 댄스트롯(Dance Trot) 곡을 제작하는 프롬프트를 만든다.
축제, 행사, 노래방에서 쉽게 따라 부를 수 있고 흥을 돋우는 곡.

템포: 115~125 BPM, 경쾌한 셔플 리듬
악기: 브라스 섹션, 아코디언/오르간 신스, 펑키한 일렉 기타
보컬: 남자 또는 여자 중 50% 확률로 선택. 시원하고 힘 있는 발성, 트로트 특유의 꺾기

구조:
[Intro]: 브라스 리프와 보컬 외침
[Verse 1]: 사랑·일상 이야기를 위트 있게
[Chorus]: 반복성 강한 훅 + 영어 라인 삽입 가능
[Verse 2]: 감정 고조, 재밌고 과장된 표현
[Bridge]: 콜앤리스폰스, 박수 리듬 유도
[Outro]: 곡 제목과 연결된 상징적 마무리

Return in separate copyable code blocks:
- Title: 곡 제목 (흥 넘치는 한국어 또는 한영 조합)
- Style: 영어로 작성, 700자 이내
- Lyrics: 한국어 메인`;
            } else {
                return `한국의 뉴트로(세미) 트로트 곡을 제작하는 프롬프트를 만든다.
전통 트로트 감성과 현대적 편곡을 결합.

템포: 95~105 BPM
악기: 베이스와 드럼, 브라스, 어쿠스틱 기타, 스트링, 신스 패드
보컬: 남자 또는 여자 중 50% 확률로 선택. 부드럽고 감정 담긴 음색

구조:
[Intro]: 피아노 리프 또는 짧은 보컬
[Verse 1]: 사랑·그리움의 일상적 서사
[Chorus]: 감정적이면서 반복성 있는 훅
[Verse 2]: 더 깊어진 감정, 이별/회상
[Bridge]: 조용히 가라앉았다가 고조
[Outro]: 여운 있는 마무리

Return in separate copyable code blocks:
- Title: 곡 제목
- Style: 영어로 작성, 700자 이내
- Lyrics: 한국어 메인`;
            }
        },

        'CCM': () => {
            const isUpbeat = Math.random() < 0.5;
            if (isUpbeat) {
                return `Korean CCM (Contemporary Christian Music) 신나는 찬양곡을 작성해줘.
집회, 찬양 콘서트, 회중 예배용으로 uplifting하고 powerful한 곡.

보컬: 남자 또는 여자 중 50% 확률로 선택
분위기: 시작부터 텐션 있는 리듬, 후렴은 따라 부르기 쉬운 반복 고백

구조:
[Intro]: 외침 or 강한 라인
[Verse 1]: 하나님 찬양의 이유, 구원, 승리
[Chorus]: 시그니처 고백, 반복 구조, 영어 훅 가능
[Verse 2]: 삶 속의 고백, 주님의 일하심
[Bridge]: 텐션 고조, 고백 강조
[Outro]: 기쁨의 샤우팅 or 밝은 마무리

Return in separate copyable code blocks:
- Title: 곡 제목
- Style: 영어로 작성, 700자 이내
- Lyrics: 한국어 메인`;
            } else {
                return `Korean CCM 잔잔한 워십곡을 작성해줘.
기도, 묵상, 회복 예배용으로 감성적이고 soothing한 곡.

보컬: 남자 또는 여자 중 50% 확률로 선택
분위기: 차분한 도입 → 진심어린 고백 → 따뜻한 마무리

구조:
[Intro]: 기도 같은 한 줄 or 무반주 고백
[Verse 1]: 나의 연약함, 하나님의 부르심
[Chorus]: 회복, 사랑, 은혜에 대한 반복 고백
[Verse 2]: 주님과 동행의 확신
[Bridge]: 헌신/회복의 고조
[Outro]: 평안한 마무리

Return in separate copyable code blocks:
- Title: 곡 제목
- Style: 영어로 작성, 700자 이내
- Lyrics: 한국어 메인`;
            }
        }
    };

    // ============================================================================
    // 📝 Midjourney 학습 프롬프트
    // ============================================================================
    const MIDJOURNEY_LEARNING_PROMPTS = [
        `🎬🎨 Midjourney + Veo3 GPT 프롬프트 통합 지침서

기본 정체성: 너는 연출, 미술, 조명, 스토리텔링까지 다룰 줄 아는 AI 기반 콘텐츠 제작 감독이다.

공통 철칙:
- 언어: 무조건 영어
- 묘사 방식: 구체적인 물리/감정 묘사 + 카메라 연출 중심
- 문장 구조: 이미지 = 쉼표 나열형
- 감정 & 무드: 반드시 포함
- 카메라 시점 & 움직임: 필수

프롬프트 구조:
[캐릭터], [스타일], [구도], [매체], [카메라], [주제], [배경], [조명], [분위기]

이해했으면 "이해했습니다"라고 답변해줘.`,

        `🔥 Midjourney 프롬프트 요소별 전문 용어:

캐릭터: young man, elderly woman, cyberpunk assassin, magical girl
스타일: Korean comic art, Synthwave, Pixar, Oil painting, 3D render
구도: bust shot, wide angle, drone shot, close up shot
매체: photo of, illustration of, sketch of
카메라: Sony A7 III, bokeh, Canon 5D Mark IV
조명: golden hour, volumetric light, cinematic lighting
무드: epic, dreamlike, mystical, melancholic

예시:
female android warrior, Korean comic art, bust shot, illustration of, Sony Alpha A7 III, holding a glowing katana, neon city in background, golden hour lighting, nostalgic mood, ultra detailed

이해했으면 "이해했습니다"라고 답변해줘.`
    ];

    // ============================================================================
    // 🛠️ 유틸리티 함수
    // ============================================================================
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const getTimestamp = () => new Date().toLocaleTimeString('ko-KR', { hour12: false });

    const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${minutes}분 ${seconds % 60}초`;
    };

    // ============================================================================
    // 📝 로그 시스템
    // ============================================================================
    function addStatus(message, type = 'info') {
        const statusLog = document.getElementById('gpt-status-log');
        if (!statusLog) return;

        const colors = {
            info: CONFIG.COLORS.secondary,
            success: CONFIG.COLORS.success,
            error: CONFIG.COLORS.error,
            warning: CONFIG.COLORS.warning,
            progress: CONFIG.COLORS.primary
        };

        const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', progress: '⏳' };

        const entry = document.createElement('div');
        entry.style.cssText = `
            padding: 4px 8px; margin: 2px 0; border-radius: 4px;
            background: ${colors[type]}20; border-left: 3px solid ${colors[type]};
            font-size: 12px; color: ${CONFIG.COLORS.text};
        `;
        entry.innerHTML = `<span style="opacity:0.6">[${getTimestamp()}]</span> ${icons[type]} ${message}`;

        statusLog.insertBefore(entry, statusLog.firstChild);
        while (statusLog.children.length > 30) statusLog.removeChild(statusLog.lastChild);

        console.log(`[GPT Music] ${icons[type]} ${message}`);
    }

    // ============================================================================
    // 🎯 GPT 인터랙션 함수
    // ============================================================================

    // 입력 필드 찾기
    function getInputField() {
        return document.querySelector('div[contenteditable="true"][id="prompt-textarea"]') ||
               document.querySelector('div[contenteditable="true"]') ||
               document.querySelector('textarea[data-id="root"]');
    }

    // 전송 버튼 찾기
    function getSendButton() {
        return document.querySelector('button[data-testid="send-button"]') ||
               document.querySelector('button[aria-label="Send prompt"]');
    }

    // 프롬프트 입력
    async function inputPrompt(promptText) {
        const inputField = getInputField();
        if (!inputField) {
            addStatus('입력 필드를 찾을 수 없습니다', 'error');
            return false;
        }

        inputField.focus();
        inputField.innerHTML = '';

        // 텍스트를 청크로 나눠서 입력 (긴 프롬프트 대응)
        const chunks = promptText.match(/.{1,1000}/gs) || [promptText];
        for (const chunk of chunks) {
            const p = document.createElement('p');
            p.textContent = chunk;
            inputField.appendChild(p);
            await sleep(50);
        }

        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(500);

        const sendButton = getSendButton();
        if (sendButton && !sendButton.disabled) {
            sendButton.click();
            return true;
        }

        return false;
    }

    // 응답 생성 중인지 확인
    function isGenerating() {
        return !!document.querySelector('button[data-testid="stop-button"]') ||
               !!document.querySelector('button[aria-label="Stop generating"]');
    }

    // 응답 완료 대기
    async function waitForResponse(maxWait = CONFIG.RESPONSE_TIMEOUT) {
        const startTime = Date.now();

        // 먼저 생성이 시작될 때까지 대기
        await sleep(1000);

        while (Date.now() - startTime < maxWait) {
            if (!isGenerating()) {
                await sleep(1000); // 안정화 대기
                return true;
            }
            await sleep(CONFIG.POLL_INTERVAL);
        }

        return false;
    }

    // Continue 버튼 처리
    async function handleContinue() {
        await sleep(2000);

        const continueBtn = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent.includes('Continue') ||
                   btn.textContent.includes('계속') ||
                   btn.textContent.includes('Continue generating')
        );

        if (continueBtn) {
            continueBtn.click();
            addStatus('Continue 버튼 클릭', 'info');
            return true;
        }
        return false;
    }

    // ============================================================================
    // 📊 데이터 수집 함수
    // ============================================================================

    // 마지막 응답에서 코드 블록 추출
    function extractCodeBlocks() {
        const responses = document.querySelectorAll('[data-message-author-role="assistant"]');
        if (responses.length === 0) return [];

        const lastResponse = responses[responses.length - 1];
        const codeBlocks = lastResponse.querySelectorAll('pre code');

        return Array.from(codeBlocks).map(block => block.textContent.trim());
    }

    // 곡 데이터 파싱
    function parseSongFromBlocks(blocks) {
        if (blocks.length < 2) return null;

        return {
            title: blocks[0] || '',
            style: blocks[1] || '',
            lyrics: blocks[2] || ''
        };
    }

    // 전체 응답에서 모든 곡 수집
    function collectAllSongs() {
        const songs = [];
        const responses = document.querySelectorAll('[data-message-author-role="assistant"]');

        responses.forEach(response => {
            const codeBlocks = response.querySelectorAll('pre code');

            // 3개씩 묶어서 곡으로 파싱 (Title, Style, Lyrics)
            for (let i = 0; i < codeBlocks.length; i += 3) {
                if (i + 1 < codeBlocks.length) {
                    songs.push({
                        title: codeBlocks[i]?.textContent?.trim() || '',
                        style: codeBlocks[i + 1]?.textContent?.trim() || '',
                        lyrics: codeBlocks[i + 2]?.textContent?.trim() || ''
                    });
                }
            }
        });

        return songs.filter(s => s.title && s.style);
    }

    // Midjourney 프롬프트 수집
    function collectMidjourneyPrompts() {
        const responses = document.querySelectorAll('[data-message-author-role="assistant"]');
        if (responses.length === 0) return [];

        const lastResponse = responses[responses.length - 1];
        const codeBlocks = lastResponse.querySelectorAll('pre code');

        return Array.from(codeBlocks)
            .map(block => block.textContent.trim())
            .filter(text => text.length > 50); // 짧은 것 제외
    }

    // ============================================================================
    // 💾 데이터 저장 (마커 기반)
    // ============================================================================

    function saveDataToLocalStorage() {
        const data = {
            channel: state.currentChannel,
            channelInfo: CONFIG.CHANNELS[state.currentChannel],
            songs: state.songs,
            midjourneyPrompts: state.midjourneyPrompts,
            youtubeData: state.youtubeData,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };

        // 마커 기반 저장 (Python에서 읽기 쉽게)
        const markedData = `---MUSIC_DATA_START---
${JSON.stringify(data, null, 2)}
---MUSIC_DATA_END---`;

        // localStorage 저장
        localStorage.setItem('GPT_MUSIC_DATA', JSON.stringify(data));
        localStorage.setItem('GPT_MUSIC_COMPLETE', 'true');
        localStorage.setItem('GPT_MUSIC_CHANNEL', state.currentChannel);

        // 개별 데이터도 저장
        localStorage.setItem('GPT_MUSIC_SONGS', JSON.stringify(state.songs));
        localStorage.setItem('GPT_MUSIC_MJ_PROMPTS', JSON.stringify(state.midjourneyPrompts));

        // window 전역 변수로도 저장 (Selenium에서 접근 용이)
        window.GPT_MUSIC_DATA = data;
        window.GPT_MUSIC_COMPLETE = true;

        addStatus(`데이터 저장 완료: ${state.songs.length}곡`, 'success');

        return data;
    }

    // JSON 파일 다운로드
    function downloadDataFile() {
        const data = saveDataToLocalStorage();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.currentChannel}_music_${new Date().toISOString().slice(0,10)}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addStatus(`파일 다운로드: ${a.download}`, 'success');
    }

    // ============================================================================
    // 🚀 메인 자동화 로직
    // ============================================================================

    async function startAutomation() {
        if (!state.currentChannel) {
            addStatus('채널을 먼저 선택해주세요', 'error');
            return;
        }

        state.isRunning = true;
        state.songCount = 0;
        state.songs = [];
        state.midjourneyPrompts = [];
        state.startTime = Date.now();
        state.errors = [];

        // localStorage 초기화
        localStorage.removeItem('GPT_MUSIC_COMPLETE');
        localStorage.removeItem('GPT_MUSIC_DATA');

        updateUI();
        addStatus(`🚀 ${state.currentChannel} 채널 자동화 시작`, 'success');

        try {
            // 1단계: 25곡 생성
            await generateSongs();

            if (!state.isRunning) {
                addStatus('사용자에 의해 중단됨', 'warning');
                return;
            }

            // 2단계: Midjourney 프롬프트 생성
            await generateMidjourneyPrompts();

            // 3단계: YouTube 제목/설명 생성
            await generateYouTubeData();

            // 완료 처리
            completeAutomation();

        } catch (error) {
            addStatus(`오류 발생: ${error.message}`, 'error');
            state.errors.push(error.message);
        }

        state.isRunning = false;
        updateUI();
    }

    // 25곡 생성
    async function generateSongs() {
        const channelPrompt = typeof CHANNEL_PROMPTS[state.currentChannel] === 'function'
            ? CHANNEL_PROMPTS[state.currentChannel]()
            : CHANNEL_PROMPTS[state.currentChannel];

        while (state.isRunning && state.songCount < CONFIG.MAX_SONGS) {
            // 일시정지 체크
            while (state.isPaused && state.isRunning) {
                await sleep(500);
            }

            state.songCount++;
            updateProgress();
            addStatus(`🎵 ${state.songCount}/${CONFIG.MAX_SONGS} 곡 생성 중...`, 'progress');

            const success = await inputPrompt(channelPrompt);
            if (!success) {
                addStatus('프롬프트 입력 실패, 재시도...', 'warning');
                state.songCount--;
                await sleep(3000);
                continue;
            }

            const responseReceived = await waitForResponse();
            if (!responseReceived) {
                addStatus('응답 타임아웃', 'warning');
                continue;
            }

            // Continue 처리 (최대 3번)
            for (let i = 0; i < 3; i++) {
                const hasContinue = await handleContinue();
                if (hasContinue) {
                    await waitForResponse();
                } else {
                    break;
                }
            }

            // 곡 데이터 수집
            const blocks = extractCodeBlocks();
            const song = parseSongFromBlocks(blocks);
            if (song) {
                state.songs.push(song);
                addStatus(`✅ ${state.songCount}번 곡 완료: ${song.title.substring(0, 30)}...`, 'success');
            }

            await sleep(CONFIG.BETWEEN_SONGS_DELAY);
        }

        addStatus(`🎉 ${state.songs.length}곡 생성 완료!`, 'success');
    }

    // Midjourney 프롬프트 생성
    async function generateMidjourneyPrompts() {
        addStatus('🎨 Midjourney 학습 시작...', 'progress');

        // 학습 프롬프트 입력
        for (let i = 0; i < MIDJOURNEY_LEARNING_PROMPTS.length; i++) {
            addStatus(`학습 ${i + 1}/${MIDJOURNEY_LEARNING_PROMPTS.length}...`, 'info');

            const success = await inputPrompt(MIDJOURNEY_LEARNING_PROMPTS[i]);
            if (success) {
                await waitForResponse();
                await sleep(2000);
            }
        }

        // 실제 프롬프트 생성 요청
        const mjVersion = CONFIG.CHANNELS[state.currentChannel].mjVersion;
        const isNiji = mjVersion === 'niji6';

        const mjPrompt = isNiji
            ? `맨 처음부터 지금까지 쓴 가사 노래 전체 분위기에 어울리는 niji6 미드저니 프롬프트 10개 작성.

파라미터(--niji6 --ar 16:9 등)는 모두 제외.
각 프롬프트를 개별 코드블록으로 작성.

이미지 컨셉: 한국인, Korean comic art, illustration of, Extremely rich facial details
${state.currentChannel === 'LOFI' ? '10대 동양인 남자가 100% 등장' : '인물 등장 시 80% 확률로 여자'}`

            : `맨 처음부터 지금까지 쓴 가사 노래 전체 분위기에 어울리는 V7 미드저니 프롬프트 10개 작성.

파라미터(--v 7 --ar 16:9 등)는 모두 제외.
각 프롬프트를 개별 코드블록으로 작성.

이미지 컨셉: 극사실주의 기반
인물 등장 시 80% 확률로 여자`;

        addStatus('Midjourney 프롬프트 생성 중...', 'progress');

        const success = await inputPrompt(mjPrompt);
        if (success) {
            await waitForResponse();
            state.midjourneyPrompts = collectMidjourneyPrompts();
            addStatus(`✅ Midjourney 프롬프트 ${state.midjourneyPrompts.length}개 생성`, 'success');
        }
    }

    // YouTube 제목/설명 생성
    async function generateYouTubeData() {
        addStatus('📺 YouTube 제목/설명 생성 중...', 'progress');

        const channelInfo = CONFIG.CHANNELS[state.currentChannel];

        const ytPrompt = `${state.currentChannel} 채널의 ${state.songs.length}곡을 기반으로 유튜브 업로드용 제목과 설명란을 작성해줘.

채널명: ${channelInfo.name}
장르: ${state.currentChannel}

[작성 지침]
1. 감정·상황·시간대가 녹아 있는 매력적인 제목 5개
2. 해외+국내(영어+한글) 하이브리드 제목
3. CTR 10% 이상 노릴 수 있는 자극적인 문장
4. 썸네일 문구 (TROT, CCM만 해당)

설명란 필수 포함:
- 댓글로 시간대 남기면 별도 업로드
- 요청 많으면 추천수 순 업데이트
- 아토형아(ATOBRO)가 자체제작
- 이 채널에서만 청취 가능

Return in separate copyable code blocks:
제목1, 제목2, 제목3, 제목4, 제목5 (각각 코드블록)
설명란 (코드블록)
태그 5개 (쉼표 구분, 코드블록)`;

        const success = await inputPrompt(ytPrompt);
        if (success) {
            await waitForResponse();

            const blocks = extractCodeBlocks();
            state.youtubeData = {
                titles: blocks.slice(0, 5),
                description: blocks[5] || '',
                tags: blocks[6] || ''
            };

            addStatus('✅ YouTube 데이터 생성 완료', 'success');
        }
    }

    // 완료 처리
    function completeAutomation() {
        const duration = formatDuration(Date.now() - state.startTime);

        // 데이터 저장 및 다운로드
        downloadDataFile();

        addStatus('━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addStatus(`🎉 ${state.currentChannel} 채널 자동화 완료!`, 'success');
        addStatus(`⏱️ 소요 시간: ${duration}`, 'info');
        addStatus(`🎵 곡: ${state.songs.length}개`, 'info');
        addStatus(`🎨 MJ 프롬프트: ${state.midjourneyPrompts.length}개`, 'info');

        // 알림
        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                title: 'GPT 음악 자동화 완료',
                text: `${state.currentChannel}: ${state.songs.length}곡 생성`,
                timeout: 5000
            });
        }
    }

    // ============================================================================
    // 🎨 UI 생성
    // ============================================================================

    function createUI() {
        const existingPanel = document.getElementById('gpt-music-panel');
        if (existingPanel) existingPanel.remove();

        GM_addStyle(`
            #gpt-music-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 380px;
                max-height: 700px;
                background: ${CONFIG.COLORS.bg};
                border: 1px solid ${CONFIG.COLORS.primary}40;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
            }

            .gpt-header {
                background: linear-gradient(135deg, ${CONFIG.COLORS.primary}, ${CONFIG.COLORS.secondary});
                padding: 12px 16px;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .gpt-header h3 { margin: 0; color: white; font-size: 14px; }

            .gpt-body { padding: 16px; max-height: 600px; overflow-y: auto; }

            .gpt-section { margin-bottom: 16px; }

            .gpt-section-title {
                font-size: 11px; font-weight: 600; color: ${CONFIG.COLORS.primary};
                text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;
            }

            .channel-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }

            .channel-btn {
                background: ${CONFIG.COLORS.bgLight};
                border: 2px solid transparent;
                color: white;
                padding: 10px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 600;
                font-size: 12px;
                text-align: center;
            }

            .channel-btn:hover { background: ${CONFIG.COLORS.primary}30; }
            .channel-btn.selected { border-color: ${CONFIG.COLORS.primary}; background: ${CONFIG.COLORS.primary}20; }
            .channel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

            .gpt-btn {
                padding: 10px 16px; border: none; border-radius: 6px;
                font-size: 13px; font-weight: 600; cursor: pointer;
                transition: all 0.2s; margin-right: 8px; margin-bottom: 8px;
            }

            .gpt-btn-primary { background: ${CONFIG.COLORS.primary}; color: white; }
            .gpt-btn-primary:hover { transform: translateY(-1px); }
            .gpt-btn-secondary { background: #333; color: white; }
            .gpt-btn-danger { background: ${CONFIG.COLORS.error}; color: white; }
            .gpt-btn:disabled { opacity: 0.5; cursor: not-allowed; }

            .gpt-progress-bar {
                width: 100%; height: 8px; background: #333;
                border-radius: 4px; overflow: hidden; margin-bottom: 8px;
            }

            .gpt-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, ${CONFIG.COLORS.primary}, ${CONFIG.COLORS.success});
                width: 0%; transition: width 0.3s;
            }

            .gpt-progress-text { font-size: 12px; color: #999; text-align: center; }

            #gpt-status-log {
                max-height: 200px; overflow-y: auto;
                background: #0a0a0f; border-radius: 6px; padding: 8px;
            }
        `);

        const panel = document.createElement('div');
        panel.id = 'gpt-music-panel';
        panel.innerHTML = `
            <div class="gpt-header">
                <h3>🎵 GPT 음악 자동화 v2.0</h3>
                <button id="gpt-minimize-btn" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">−</button>
            </div>

            <div class="gpt-body" id="gpt-body">
                <!-- 채널 선택 -->
                <div class="gpt-section">
                    <div class="gpt-section-title">🎹 채널 선택</div>
                    <div class="channel-grid">
                        ${Object.entries(CONFIG.CHANNELS).map(([key, info]) => `
                            <button class="channel-btn" data-channel="${key}">
                                ${info.icon} ${key}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- 진행 상황 -->
                <div class="gpt-section" id="gpt-progress-section" style="display:none;">
                    <div class="gpt-section-title">📊 진행 상황</div>
                    <div class="gpt-progress-bar">
                        <div class="gpt-progress-fill" id="gpt-progress-fill"></div>
                    </div>
                    <div class="gpt-progress-text" id="gpt-progress-text">0 / 25</div>
                </div>

                <!-- 컨트롤 -->
                <div class="gpt-section">
                    <div class="gpt-section-title">🎮 컨트롤</div>
                    <button id="gpt-start-btn" class="gpt-btn gpt-btn-primary" disabled>채널 선택</button>
                    <button id="gpt-pause-btn" class="gpt-btn gpt-btn-secondary" disabled>⏸️ 일시정지</button>
                    <button id="gpt-stop-btn" class="gpt-btn gpt-btn-danger" disabled>⏹️ 중지</button>
                </div>

                <!-- 로그 -->
                <div class="gpt-section">
                    <div class="gpt-section-title">📋 로그</div>
                    <div id="gpt-status-log"></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        setupEventListeners();
        makeDraggable(panel, panel.querySelector('.gpt-header'));
        loadFromLocalStorage();

        addStatus('GPT 음악 자동화 준비됨', 'success');
    }

    // ============================================================================
    // 🖱️ 이벤트 리스너
    // ============================================================================

    function setupEventListeners() {
        // 채널 선택
        document.querySelectorAll('.channel-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (state.isRunning) return;

                document.querySelectorAll('.channel-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');

                state.currentChannel = this.dataset.channel;
                localStorage.setItem('GPT_MUSIC_SELECTED_CHANNEL', state.currentChannel);

                const startBtn = document.getElementById('gpt-start-btn');
                startBtn.disabled = false;
                startBtn.textContent = `▶️ ${state.currentChannel} 시작`;

                addStatus(`${state.currentChannel} 채널 선택됨`, 'info');
            });
        });

        // 시작 버튼
        document.getElementById('gpt-start-btn').addEventListener('click', () => {
            startAutomation();
        });

        // 일시정지 버튼
        document.getElementById('gpt-pause-btn').addEventListener('click', () => {
            state.isPaused = !state.isPaused;
            const btn = document.getElementById('gpt-pause-btn');
            btn.textContent = state.isPaused ? '▶️ 재개' : '⏸️ 일시정지';
            addStatus(state.isPaused ? '일시정지됨' : '재개됨', 'warning');
        });

        // 중지 버튼
        document.getElementById('gpt-stop-btn').addEventListener('click', () => {
            state.isRunning = false;
            addStatus('중지 요청됨...', 'warning');
        });

        // 최소화 버튼
        document.getElementById('gpt-minimize-btn').addEventListener('click', () => {
            const body = document.getElementById('gpt-body');
            const btn = document.getElementById('gpt-minimize-btn');
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
            btn.textContent = body.style.display === 'none' ? '+' : '−';
        });
    }

    // localStorage에서 채널 로드
    function loadFromLocalStorage() {
        const savedChannel = localStorage.getItem('GPT_MUSIC_SELECTED_CHANNEL');
        if (savedChannel && CONFIG.CHANNELS[savedChannel]) {
            state.currentChannel = savedChannel;

            const btn = document.querySelector(`.channel-btn[data-channel="${savedChannel}"]`);
            if (btn) {
                btn.classList.add('selected');
                document.getElementById('gpt-start-btn').disabled = false;
                document.getElementById('gpt-start-btn').textContent = `▶️ ${savedChannel} 시작`;
            }
        }

        // Python에서 전달한 채널 확인
        const pythonChannel = localStorage.getItem('GPT_MUSIC_START_CHANNEL');
        if (pythonChannel && CONFIG.CHANNELS[pythonChannel]) {
            state.currentChannel = pythonChannel;
            addStatus(`Python에서 ${pythonChannel} 채널 요청됨`, 'info');

            // 자동 시작 여부 확인
            const autoStart = localStorage.getItem('GPT_MUSIC_AUTO_START') === 'true';
            if (autoStart) {
                localStorage.removeItem('GPT_MUSIC_AUTO_START');
                localStorage.removeItem('GPT_MUSIC_START_CHANNEL');
                setTimeout(() => startAutomation(), 3000);
            }
        }
    }

    // ============================================================================
    // 📊 UI 업데이트
    // ============================================================================

    function updateProgress() {
        const progressSection = document.getElementById('gpt-progress-section');
        const progressFill = document.getElementById('gpt-progress-fill');
        const progressText = document.getElementById('gpt-progress-text');

        progressSection.style.display = 'block';

        const percent = (state.songCount / CONFIG.MAX_SONGS) * 100;
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${state.songCount} / ${CONFIG.MAX_SONGS}`;
    }

    function updateUI() {
        const startBtn = document.getElementById('gpt-start-btn');
        const pauseBtn = document.getElementById('gpt-pause-btn');
        const stopBtn = document.getElementById('gpt-stop-btn');
        const channelBtns = document.querySelectorAll('.channel-btn');

        if (state.isRunning) {
            startBtn.disabled = true;
            startBtn.textContent = '⏳ 실행 중...';
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            channelBtns.forEach(btn => btn.disabled = true);
        } else {
            startBtn.disabled = !state.currentChannel;
            startBtn.textContent = state.currentChannel ? `▶️ ${state.currentChannel} 시작` : '채널 선택';
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            channelBtns.forEach(btn => btn.disabled = false);
        }
    }

    // ============================================================================
    // 🖱️ 드래그 기능
    // ============================================================================

    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        handle.onmousedown = (e) => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = null;
                document.onmousemove = null;
            };
            document.onmousemove = (e) => {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
                element.style.right = 'auto';
            };
        };
    }

    // ============================================================================
    // 🚀 초기화
    // ============================================================================

    function init() {
        if (document.body && document.querySelector('main')) {
            setTimeout(createUI, 1000);
        } else {
            setTimeout(init, 500);
        }
    }

    init();

})();