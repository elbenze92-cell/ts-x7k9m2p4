// ==UserScript==
// @name         @동영상 Sora 완전 자동화 (Python 연동) v2.0
// @namespace    https://atobro.com/
// @version      2.2.0
// @description  Sora 영상 생성 완전 자동화 - Storyboard 모드, 연속 생성, Drafts 다운로드, Python 연동
// @author       Atobro
// @match        https://sora.chatgpt.com/*
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/sora.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/sora.user.js
// @icon         https://sora.chatgpt.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_download
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🎬 Sora 자동화 v2.0 시작');

    // ============================================================================
    // 🔧 설정
    // ============================================================================
    const CONFIG = {
        // URL
        BASE_URL: 'https://sora.chatgpt.com',
        EXPLORE_URL: 'https://sora.chatgpt.com/explore',
        STORYBOARD_URL: 'https://sora.chatgpt.com/storyboard',  // 스토리보드 페이지 (연속 생성용)
        PROFILE_URL: 'https://sora.chatgpt.com/me',  // 프로필/Drafts 페이지

        // 타이밍 (ms)
        POLL_INTERVAL: 3000,           // 3초마다 상태 체크
        MAX_GENERATION_WAIT: 600000,   // 최대 10분 대기 (전체 영상)
        BETWEEN_PROMPTS_DELAY: 3000,   // 프롬프트 사이 대기 3초
        STORYBOARD_DRAFT_WAIT: 60000,  // 스토리보드 드래프팅 대기 60초
        PAGE_LOAD_WAIT: 3000,          // 페이지 로드 대기
        INPUT_DELAY: 300,              // 입력 딜레이
        DOWNLOAD_DELAY: 2000,          // 다운로드 간격

        // 기본 설정
        DEFAULT_ORIENTATION: 'Portrait',  // Portrait | Landscape
        DEFAULT_DURATION: '15',           // 10 | 15 (25초는 352p 제한으로 불가)

        // UI 색상
        COLORS: {
            primary: '#10a37f',
            secondary: '#6e6e80',
            success: '#22c55e',
            error: '#ef4444',
            warning: '#eab308',
            bg: '#0d0d0d',
            bgLight: '#1a1a1a',
            text: '#ffffff'
        },

        // 셀렉터
        SELECTORS: {
            // 메인 페이지
            mainPromptInput: 'textarea[placeholder="Describe your video..."]',
            storyboardButton: 'button:has-text("Storyboard")',
            settingsButton: 'button[aria-label="Settings"]',

            // 스토리보드 페이지
            storyboardPromptInput: 'textarea[enterkeyhint="send"], textarea[placeholder="Describe your video..."]',
            sendButton: 'button[aria-label="Send"]',
            createButton: 'button[aria-label="Create"]',
            sceneTextarea: 'textarea[placeholder*="Describe this scene"]',

            // 설정
            orientationButton: 'button:has(div:has-text("Portrait")), button:has(div:has-text("Landscape"))',
            durationButton: 'button:has(div:has-text("15s")), button:has(div:has-text("10s"))',

            // 프로필/Drafts
            profileButton: 'img[alt*="profile"], a[href="/me"]',
            draftsSection: 'div:has-text("Drafts")',
            draftItem: 'div[class*="grid"] > div',
            loadingSpinner: 'circle[stroke-dasharray]',
            completeBadge: 'div.rounded-full.bg-white',

            // 다운로드
            moreButton: 'button[id^="radix-"]:has(svg path[d*="M3 12a2"])',
            downloadMenuItem: 'div[role="menuitem"]:has-text("Download")',

            // 상태
            queueToast: 'div[data-title]:has-text("Added to queue")',
            draftingText: 'h2:has-text("Drafting storyboard")'
        }
    };

    // ============================================================================
    // 🗄️ 전역 상태
    // ============================================================================
    let state = {
        isRunning: false,
        isPaused: false,
        phase: 'idle',  // idle | generating | downloading
        currentPromptIndex: 0,
        totalPrompts: 0,
        videoPrompts: [],
        generatedCount: 0,
        downloadedFiles: [],
        startTime: null,
        errors: [],
        settings: {
            orientation: CONFIG.DEFAULT_ORIENTATION,
            duration: CONFIG.DEFAULT_DURATION
        },
        taskMap: [],                    // task_id ↔ prompt 매핑 (동시실행 지원)
        pendingTaskId: null,            // 방금 입력한 프롬프트의 task_id (fetch에서 캡처)
        currentChannel: null,           // 현재 작업 중인 채널 식별자
        idMap: null                     // 🔥 고유 ID ↔ prompt 매핑 (Organize 검색용)
    };

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

    // task_id 정규화 (UUID 형식 처리)
    function normalizeTaskId(taskId) {
        if (!taskId) return taskId;
        
        // UUID 형식: 8-4-4-4-12 또는 짧은 형식
        const match = taskId.match(/^([a-f0-9]{8})/i);
        if (match) return match[1].toLowerCase();
        
        // 이미 짧은 형식
        if (taskId.length <= 12) return taskId.toLowerCase();
        
        return taskId.toLowerCase();
    }

    // ============================================================================
    // 🔗 Fetch 가로채기 (create API 응답에서 task_id 캡처)
    // ============================================================================
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        try {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

            // create API 응답 가로채기
            if (url.includes('/create') || url.endsWith('/create')) {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();

                if (data.id) {
                    const taskId = normalizeTaskId(data.id);

                    // 전역 상태에 저장
                    state.pendingTaskId = taskId;

                    // 현재 프롬프트 가져오기
                    const currentPrompt = state.videoPrompts[state.currentPromptIndex] || 'unknown';

                    // taskMap에 추가 (채널 정보 포함)
                    state.taskMap.push({
                        taskId: taskId,
                        prompt: currentPrompt,
                        channel: state.currentChannel || 'default',
                        timestamp: Date.now(),
                        status: 'pending',
                        priority: data.priority || 1
                    });

                    console.log(`[Sora Fetch] task_id 캡처: ${taskId}`);
                }
            }
        } catch (e) {
            // JSON 파싱 실패 등은 무시 (일반 요청일 수 있음)
        }

        return response;
    };

    // ============================================================================
    // 🔍 DOM 변경 감지 (fetch 실패 시 대안) - 강화 버전
    // ============================================================================
    
    let detectedTaskIds = new Set(); // 🔥 Set으로 변경 (모든 감지된 Task ID 추적)
    
    function detectNewTaskFromDOM() {
        // 🔥 여러 선택자 시도 (더 많은 경로 확인)
        const selectors = [
            'a[href^="/jobs/"]',
            'div[data-task-id]',
            '[class*="task"]',
            '[class*="job"]'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            
            // 🔥 모든 요소 확인 (첫 번째만 아니라)
            for (const el of elements) {
                let taskId = null;
                
                // href에서 추출
                if (el.hasAttribute('href')) {
                    const href = el.getAttribute('href');
                    const match = href.match(/\/jobs\/([a-f0-9-]+)/);
                    if (match) taskId = match[1];
                }
                
                // data 속성에서 추출
                if (!taskId && el.hasAttribute('data-task-id')) {
                    taskId = el.getAttribute('data-task-id');
                }
                
                // 🔥 Task ID 정규화
                if (taskId) {
                    taskId = normalizeTaskId(taskId);
                }
                
                // 🔥 새 Task ID 발견 시
                if (taskId && !detectedTaskIds.has(taskId)) {
                    detectedTaskIds.add(taskId);
                    
                    // 🔥 항상 pendingTaskId 업데이트 (덮어쓰기 OK)
                    state.pendingTaskId = taskId;
                    console.log(`[Sora DOM] 새 Task ID 감지: ${taskId} (총 ${detectedTaskIds.size}개)`);
                    
                    return taskId;
                }
            }
        }
        
        return null;
    }
    
    // 🔥 0.3초마다 DOM 체크
    setInterval(detectNewTaskFromDOM, 300);

    // ============================================================================
    // 📝 로그 시스템
    // ============================================================================
    function addStatus(message, type = 'info') {
        const statusLog = document.getElementById('sora-status-log');
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
            font-size: 11px; color: ${CONFIG.COLORS.text};
        `;
        entry.innerHTML = `<span style="opacity:0.6">[${getTimestamp()}]</span> ${icons[type]} ${message}`;

        statusLog.insertBefore(entry, statusLog.firstChild);
        while (statusLog.children.length > 50) statusLog.removeChild(statusLog.lastChild);

        console.log(`[Sora Auto] ${icons[type]} ${message}`);
    }

    // ============================================================================
    // 🎯 요소 찾기 함수
    // ============================================================================

    // 텍스트로 요소 찾기
    function findByText(text, tag = '*', exact = false) {
        const elements = document.querySelectorAll(tag);
        for (const el of elements) {
            const elText = el.textContent?.trim();
            if (exact ? elText === text : elText?.toLowerCase().includes(text.toLowerCase())) {
                if (el.offsetParent !== null) return el;
            }
        }
        return null;
    }

    // 여러 셀렉터로 찾기
    function findElement(selectors, parent = document) {
        if (typeof selectors === 'string') selectors = [selectors];
        for (const selector of selectors) {
            try {
                // :has-text 커스텀 처리
                if (selector.includes(':has-text(')) {
                    const match = selector.match(/(.*):has-text\("(.*)"\)/);
                    if (match) {
                        const [, baseSelector, text] = match;
                        const elements = parent.querySelectorAll(baseSelector || '*');
                        for (const el of elements) {
                            if (el.textContent?.includes(text) && el.offsetParent !== null) {
                                return el;
                            }
                        }
                    }
                    continue;
                }

                const element = parent.querySelector(selector);
                if (element && element.offsetParent !== null) return element;
            } catch (e) {}
        }
        return null;
    }

    // ============================================================================
    // 🎬 페이지별 요소 찾기
    // ============================================================================

    // Storyboard 버튼
    function getStoryboardButton() {
        return findByText('Storyboard', 'button');
    }

    // 프롬프트 입력창
    function getPromptInput() {
        return document.querySelector('textarea[placeholder="Describe your video..."]') ||
               document.querySelector('textarea[enterkeyhint="send"]');
    }

    // Send 버튼 (스토리보드 프롬프트 전송)
    function getSendButton() {
        return document.querySelector('button[aria-label="Send"]');
    }

    // Create 버튼
    function getCreateButton() {
        // aria-label="Create" 또는 텍스트가 "Create"인 버튼
        const byLabel = document.querySelector('button[aria-label="Create"]');
        if (byLabel && byLabel.offsetParent !== null) return byLabel;

        return findByText('Create', 'button', true);
    }

    // 프로필 버튼 (Drafts로 이동)
    function getProfileButton() {
        // 프로필 이미지 또는 링크
        return document.querySelector('a[href="/me"]') ||
               document.querySelector('img[src*="profile"]')?.closest('a, button');
    }

    // Drafts 섹션 찾기
    function getDraftsSection() {
        return findByText('Drafts', 'div');
    }

    // 설정 버튼들
    function getOrientationButton() {
        // Portrait 또는 Landscape 텍스트가 있는 버튼
        const portraitBtn = findByText('Portrait', 'button');
        const landscapeBtn = findByText('Landscape', 'button');
        return portraitBtn || landscapeBtn;
    }

    function getDurationButton() {
        // 15s, 10s 텍스트가 있는 버튼
        return findByText('15s', 'button') || findByText('10s', 'button');
    }

    // ============================================================================
    // ⌨️ 입력 함수
    // ============================================================================

    async function inputToTextarea(element, text) {
        if (!element || !text) return false;

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        await sleep(100);

        // 기존 내용 삭제
        element.select();
        document.execCommand('selectAll');
        document.execCommand('delete');
        await sleep(50);

        // React 방식 입력
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        )?.set;

        if (nativeTextAreaValueSetter) {
            nativeTextAreaValueSetter.call(element, text);
        } else {
            element.value = text;
        }

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        await sleep(CONFIG.INPUT_DELAY);
        return element.value === text;
    }

    // ============================================================================
    // 🎬 스토리보드 모드 자동화
    // ============================================================================

    async function enterStoryboardMode() {
        addStatus('스토리보드 모드 진입...', 'progress');

        const storyboardBtn = getStoryboardButton();
        if (!storyboardBtn) {
            addStatus('Storyboard 버튼을 찾을 수 없음', 'error');
            return false;
        }

        storyboardBtn.click();
        await sleep(1500);

        // Scene 텍스트로 스토리보드 모드 확인
        const sceneText = findByText('Scene 1') || findByText('Draft your video');
        if (sceneText) {
            addStatus('스토리보드 모드 진입 완료', 'success');
            return true;
        }

        return false;
    }

    // 설정 적용 (Portrait, 15초)
    async function applySettings() {
        addStatus('설정 적용 중...', 'progress');

        // Portrait 선택
        const orientationBtn = getOrientationButton();
        if (orientationBtn) {
            // 현재 설정이 원하는 것과 다르면 클릭해서 변경
            if (!orientationBtn.textContent?.includes(state.settings.orientation)) {
                orientationBtn.click();
                await sleep(300);

                const targetOption = findByText(state.settings.orientation, 'div');
                if (targetOption) {
                    targetOption.click();
                    await sleep(200);
                }
            }
            addStatus(`${state.settings.orientation} 설정됨`, 'success');
        }

        // Duration 선택 (15초)
        const durationBtn = getDurationButton();
        if (durationBtn) {
            durationBtn.click();
            await sleep(300);

            const targetDuration = `${state.settings.duration} seconds`;
            const durationOption = findByText(targetDuration, 'div') ||
                                   findByText(`${state.settings.duration}s`, 'div');
            if (durationOption) {
                durationOption.click();
                await sleep(200);
            }
            addStatus(`${state.settings.duration}초 설정됨`, 'success');
        }

        return true;
    }

    // 프롬프트 입력 및 드래프팅
    async function inputPromptAndDraft(prompt) {
        addStatus('프롬프트 입력 중...', 'progress');

        const promptInput = getPromptInput();
        if (!promptInput) {
            addStatus('프롬프트 입력창을 찾을 수 없음', 'error');
            return false;
        }

        const success = await inputToTextarea(promptInput, prompt);
        if (!success) {
            addStatus('프롬프트 입력 실패', 'error');
            return false;
        }

        addStatus('프롬프트 입력 완료', 'success');
        await sleep(500);

        // Send 버튼 클릭
        const sendBtn = getSendButton();
        if (sendBtn) {
            sendBtn.click();
            addStatus('스토리보드 드래프팅 시작...', 'progress');

            // 드래프팅 완료 대기
            await waitForDraftingComplete();
        } else {
            // Send 버튼이 없으면 Enter 키로 전송
            promptInput.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                bubbles: true
            }));
        }

        return true;
    }

    // 드래프팅 완료 대기
    async function waitForDraftingComplete() {
        const startTime = Date.now();

        while (Date.now() - startTime < CONFIG.STORYBOARD_DRAFT_WAIT) {
            // "Drafting storyboard..." 텍스트 확인
            const draftingText = findByText('Drafting storyboard');

            if (!draftingText) {
                // Scene 요소들이 생성되었는지 확인
                const scenes = document.querySelectorAll('div[class*="Scene"], textarea[placeholder*="scene"]');
                if (scenes.length > 0) {
                    addStatus(`드래프팅 완료 (${scenes.length}개 씬 감지)`, 'success');
                    return true;
                }

                // Create 버튼이 활성화되었는지 확인
                const createBtn = getCreateButton();
                if (createBtn && !createBtn.disabled) {
                    addStatus('드래프팅 완료', 'success');
                    return true;
                }
            }

            await sleep(2000);
        }

        addStatus('드래프팅 타임아웃 (계속 진행)', 'warning');
        return true;
    }

    // Create 버튼 클릭
    async function clickCreate() {
        const createBtn = getCreateButton();

        if (!createBtn) {
            addStatus('Create 버튼을 찾을 수 없음', 'error');
            return false;
        }

        createBtn.click();
        addStatus('Create 클릭! Queue에 추가됨', 'success');

        // "Added to queue" 토스트 확인
        await sleep(1000);
        const queueToast = findByText('Added to queue');
        if (queueToast) {
            addStatus('Queue 추가 확인됨', 'success');
        }

        state.generatedCount++;
        return true;
    }

    // ============================================================================
    // 📥 다운로드 단계
    // ============================================================================

    async function goToProfileAndDownload() {
        addStatus('━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addStatus('📥 다운로드 단계 시작...', 'progress');

        // 프로필 페이지로 이동
        if (!window.location.href.includes('/me')) {
            addStatus('프로필 페이지로 이동...', 'info');
            window.location.href = CONFIG.PROFILE_URL;

            // 페이지 로드 후 다운로드 진행하도록 플래그 설정
            localStorage.setItem('SORA_PENDING_DOWNLOAD', 'true');
            localStorage.setItem('SORA_EXPECTED_COUNT', state.totalPrompts.toString());
            return;
        }

        await sleep(CONFIG.PAGE_LOAD_WAIT);
        await downloadFromDrafts();
    }

    // Drafts에서 다운로드
    async function downloadFromDrafts() {
        addStatus('Drafts 확인 중...', 'progress');

        const expectedCount = parseInt(localStorage.getItem('SORA_EXPECTED_COUNT') || state.totalPrompts);

        // Drafts 섹션 클릭
        const draftsSection = getDraftsSection();
        if (draftsSection) {
            const draftsClickable = draftsSection.closest('div[class*="cursor"], a, button') || draftsSection;
            draftsClickable.click();
            await sleep(2000);
        }

        // 생성 완료 대기 (로딩 스피너가 사라지고 숫자 배지가 나타날 때까지)
        addStatus('영상 생성 완료 대기 중...', 'progress');
        await waitForGenerationComplete(expectedCount);

        // 다운로드 시작
        await downloadAllVideos();
    }

    // 생성 완료 대기 (task_id 기반)
    async function waitForGenerationComplete(expectedCount) {
        const startTime = Date.now();
        
        // 대기 중인 task_id들 (현재 채널의 pending 상태만)
        const batchTaskIds = state.taskMap
            .filter(t => t.channel === state.currentChannel && t.status === 'pending')
            .map(t => t.taskId);
        
        if (batchTaskIds.length === 0) {
            addStatus('대기 중인 task가 없음, DOM 기반 감지로 전환', 'warning');
            
            // fallback: 기존 DOM 기반 감지
            while (Date.now() - startTime < CONFIG.MAX_GENERATION_WAIT) {
                const loadingItems = document.querySelectorAll('circle[stroke-dasharray]');
                let stillLoading = false;
                
                for (const item of loadingItems) {
                    if (item.closest('div')?.offsetParent !== null) {
                        stillLoading = true;
                        break;
                    }
                }

                if (!stillLoading) {
                    addStatus('모든 영상 생성 완료! (DOM 감지)', 'success');
                    return true;
                }

                const elapsed = Date.now() - startTime;
                if (elapsed % 30000 < CONFIG.POLL_INTERVAL) {
                    addStatus(`생성 대기 중... (${Math.floor(elapsed / 1000)}초)`, 'progress');
                }

                await sleep(CONFIG.POLL_INTERVAL);
            }
            
            addStatus('생성 완료 대기 타임아웃', 'warning');
            return false;
        }
        
        addStatus(`대기 중인 task: ${batchTaskIds.length}개`, 'info');

        while (Date.now() - startTime < CONFIG.MAX_GENERATION_WAIT) {
            const completedTasks = [];
            
            // 각 task별로 완료 여부 확인
            for (const taskId of batchTaskIds) {
                // 이미 완료로 표시된 task는 건너뜀
                const taskInfo = state.taskMap.find(t => t.taskId === taskId);
                if (taskInfo && taskInfo.status === 'complete') {
                    completedTasks.push(taskId);
                    continue;
                }
                
                // task_id로 해당 draft 찾기 (href에 task_id 포함)
                const allLinks = document.querySelectorAll('a[href^="/jobs/"]');
                let taskLink = null;
                
                for (const link of allLinks) {
                    const href = link.getAttribute('href');
                    if (href && href.includes(taskId)) {
                        taskLink = link;
                        break;
                    }
                }
                
                if (!taskLink) continue;
                
                const parent = taskLink.closest('div');
                if (!parent) continue;
                
                // 로딩 스피너 확인
                const spinner = parent.querySelector('circle[stroke-dasharray]');
                const isLoading = spinner && spinner.offsetParent !== null;
                
                if (!isLoading) {
                    completedTasks.push(taskId);
                    
                    // taskMap 상태 업데이트
                    if (taskInfo) {
                        taskInfo.status = 'complete';
                        addStatus(`Task ${taskId.substring(0, 8)} 완료`, 'success');
                    }
                }
            }
            
            // 진행 상황 로그
            const elapsed = Date.now() - startTime;
            if (elapsed % 30000 < CONFIG.POLL_INTERVAL) {
                addStatus(`진행: ${completedTasks.length}/${batchTaskIds.length} (${Math.floor(elapsed / 1000)}초)`, 'progress');
            }
            
            // 모두 완료
            if (completedTasks.length >= batchTaskIds.length) {
                addStatus('모든 영상 생성 완료!', 'success');
                return true;
            }

            await sleep(CONFIG.POLL_INTERVAL);
        }

        addStatus('생성 완료 대기 타임아웃', 'warning');
        return false;
    }

    // 🔥 모든 영상 다운로드 (ID 기반 - Midjourney 방식)
    async function downloadAllVideos() {
        addStatus('영상 다운로드 시작...', 'progress');

        // 🔥 ID 매핑 확인
        if (!state.idMap || Object.keys(state.idMap).length === 0) {
            addStatus('⚠️ ID 매핑 없음 - 순차 다운로드 시도', 'warning');
            await downloadSequentially();
            return;
        }

        addStatus(`📋 ID 기반 다운로드: ${Object.keys(state.idMap).length}개`, 'info');

        let downloadCount = 0;
        const results = [];

        // 각 ID로 Drafts에서 검색
        for (const [uniqueId, info] of Object.entries(state.idMap)) {
            const index = info.index;
            const originalPrompt = info.original;
            
            addStatus(`🔍 [${index + 1}] ID:${uniqueId} 검색 중...`, 'info');

            try {
                // 🔥 DOM에서 프롬프트 텍스트로 영상 찾기
                const allDrafts = document.querySelectorAll('div, a, span');
                let foundElement = null;

                for (const el of allDrafts) {
                    const text = el.textContent || el.innerText || '';
                    
                    // ID 매칭 (여러 형식 지원)
                    if (text.includes(`ID${uniqueId}`) || 
                        text.includes(`ID:${uniqueId}`) ||
                        text.includes(`[ID:${uniqueId}]`)) {
                        
                        // 영상 링크 찾기
                        const link = el.closest('a[href^="/jobs/"]') || 
                                    el.querySelector('a[href^="/jobs/"]') ||
                                    el.parentElement?.querySelector('a[href^="/jobs/"]');
                        
                        if (link) {
                            foundElement = link;
                            addStatus(`✅ [${index + 1}] 매칭 발견!`, 'success');
                            break;
                        }
                    }
                }

                if (!foundElement) {
                    addStatus(`⚠️ [${index + 1}] ID:${uniqueId} 미발견`, 'warning');
                    state.errors.push({ 
                        index: index, 
                        uniqueId: uniqueId,
                        error: '영상 미발견' 
                    });
                    continue;
                }

                // 영상 상세 보기
                foundElement.click();
                await sleep(1500);

                // ... 버튼 클릭
                const moreBtn = document.querySelector('button[id^="radix-"]:has(svg path[d*="M3 12a2"])') ||
                               findByText('...', 'button') ||
                               document.querySelector('button:has(svg path[d*="12a2"])');

                if (moreBtn) {
                    moreBtn.click();
                    await sleep(500);

                    const downloadItem = findByText('Download', 'div[role="menuitem"]') ||
                                        findByText('Download', 'div');

                    if (downloadItem) {
                        downloadItem.click();
                        await sleep(CONFIG.DOWNLOAD_DELAY);

                        const safePrompt = originalPrompt.substring(0, 30).replace(/[\/\\:*?"<>|]/g, '_');
                        const fileName = `sora_${index + 1}_${safePrompt}_${uniqueId}.mp4`;

                        state.downloadedFiles.push({
                            index: index,
                            uniqueId: uniqueId,
                            prompt: originalPrompt,
                            fileName,
                            timestamp: Date.now()
                        });
                        downloadCount++;
                        addStatus(`✅ [${index + 1}] ${fileName}`, 'success');
                    }
                } else {
                    // 직접 다운로드
                    const videoEl = document.querySelector('video[src*="openai"]');
                    if (videoEl?.src) {
                        const safePrompt = originalPrompt.substring(0, 30).replace(/[\/\\:*?"<>|]/g, '_');
                        const fileName = `sora_${index + 1}_${safePrompt}_${uniqueId}.mp4`;

                        const a = document.createElement('a');
                        a.href = videoEl.src;
                        a.download = fileName;
                        a.click();

                        state.downloadedFiles.push({
                            index: index,
                            uniqueId: uniqueId,
                            prompt: originalPrompt,
                            fileName,
                            url: videoEl.src,
                            timestamp: Date.now()
                        });
                        downloadCount++;
                        addStatus(`✅ [${index + 1}] ${fileName} (direct)`, 'success');
                    }
                }

                // 뒤로 가기
                const backBtn = document.querySelector('button:has(svg path[d*="M15"]), a[href="/me"]');
                if (backBtn) {
                    backBtn.click();
                    await sleep(1000);
                } else {
                    window.history.back();
                    await sleep(1000);
                }

            } catch (error) {
                addStatus(`❌ [${index + 1}] 오류: ${error.message}`, 'error');
                state.errors.push({ 
                    index: index, 
                    uniqueId: uniqueId,
                    error: error.message 
                });
            }
        }

        addStatus(`━━━━━━━━━━━━━━━━━━━━━━`, 'info');
        addStatus(`✅ 다운로드 완료: ${downloadCount}/${Object.keys(state.idMap).length}개`, 'success');

        // 완료 처리
        completeAutomation();
    }

    // 🔥 순차 다운로드 (fallback - ID 없을 때)
    async function downloadSequentially() {
        const videoItems = document.querySelectorAll('div[class*="relative"]:has(video), div:has(img[src*="openai"])');
        addStatus(`${videoItems.length}개 영상 발견 (순차 모드)`, 'info');
        
        let downloadCount = 0;

        for (let i = 0; i < videoItems.length && i < state.totalPrompts; i++) {
            const item = videoItems[i];
            addStatus(`[${i + 1}/${videoItems.length}] 다운로드 중...`, 'progress');

            item.click();
            await sleep(1500);

            const moreBtn = document.querySelector('button[id^="radix-"]:has(svg path[d*="M3 12a2"])') ||
                           findByText('...', 'button');

            if (moreBtn) {
                moreBtn.click();
                await sleep(500);

                const downloadItem = findByText('Download', 'div[role="menuitem"]');
                if (downloadItem) {
                    downloadItem.click();
                    await sleep(CONFIG.DOWNLOAD_DELAY);
                    downloadCount++;
                    addStatus(`영상 ${i + 1} 다운로드`, 'success');
                }
            }

            const backBtn = document.querySelector('button:has(svg path[d*="M15"]), a[href="/me"]');
            if (backBtn) {
                backBtn.click();
                await sleep(1000);
            } else {
                window.history.back();
                await sleep(1000);
            }
        }
        
        addStatus(`다운로드 완료: ${downloadCount}/${videoItems.length}개`, 'success');
        completeAutomation();
    }

    // ============================================================================
    // 🚀 메인 자동화 로직
    // ============================================================================

    async function startAutomation() {
        // 🔥 localStorage 초기화 (기존 결과 제거)
        const keysToRemove = [
            'SORA_COMPLETE',
            'SORA_RESULTS',
            'SORA_PENDING_DOWNLOAD',
            'SORA_EXPECTED_COUNT',
            'SORA_AUTO_CONTINUE',
            'SORA_CURRENT_INDEX'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        addStatus('🧹 localStorage 초기화 완료', 'info');

        // localStorage에서 데이터 로드
        const promptsJson = localStorage.getItem('SORA_PROMPTS');
        const idMapJson = localStorage.getItem('SORA_ID_MAP');
        const settingsJson = localStorage.getItem('SORA_SETTINGS');

        if (!promptsJson) {
            addStatus('프롬프트 데이터가 없습니다.', 'error');
            return;
        }

        try {
            state.videoPrompts = JSON.parse(promptsJson);
            
            // 🔥 ID 매핑 확인 (Python에서 전달)
            let idMap = null;
            if (idMapJson) {
                idMap = JSON.parse(idMapJson);
                addStatus(`✅ ID 매핑 로드됨 (${Object.keys(idMap).length}개)`, 'success');
            } else {
                addStatus('⚠️ ID 매핑 없음 - 기본 모드 실행', 'warning');
            }
            
            // 🔥 프롬프트에 ID가 없으면 자동 추가 (Python 미사용 시)
            if (!idMap) {
                idMap = {};
                state.videoPrompts = state.videoPrompts.map((prompt, index) => {
                    // 이미 ID가 있는지 확인
                    const hasId = /\[ID:[a-z0-9]{8}\]/.test(prompt);
                    if (hasId) return prompt;
                    
                    // 고유 ID 생성 (8자리)
                    const uniqueId = Date.now().toString(36).substr(-5) + Math.random().toString(36).substr(2, 3);
                    idMap[uniqueId] = {
                        index: index,
                        original: prompt
                    };
                    
                    // 프롬프트 끝에 ID 추가 (자연스럽게)
                    return `${prompt}. Reference code ID${uniqueId}`;
                });
                
                // 업데이트된 프롬프트 저장
                localStorage.setItem('SORA_PROMPTS', JSON.stringify(state.videoPrompts));
                localStorage.setItem('SORA_ID_MAP', JSON.stringify(idMap));
                addStatus(`✅ 고유 ID 자동 생성됨 (${Object.keys(idMap).length}개)`, 'success');
            }
            
            // idMap을 전역 상태에 저장
            state.idMap = idMap;
            
            if (settingsJson) {
                state.settings = { ...state.settings, ...JSON.parse(settingsJson) };
            }
        } catch (e) {
            addStatus('JSON 파싱 오류', 'error');
            return;
        }

        state.totalPrompts = state.videoPrompts.length;
        state.isRunning = true;
        state.phase = 'generating';
        state.currentPromptIndex = 0;
        state.generatedCount = 0;
        state.downloadedFiles = [];
        state.startTime = Date.now();
        state.errors = [];
        state.taskMap = [];              // taskMap 초기화
        state.pendingTaskId = null;      // pendingTaskId 초기화

        // 채널 정보 설정 (Python에서 전달하거나 기본값 사용)
        state.currentChannel = localStorage.getItem('SORA_CHANNEL') || 'default';

        // 초기화
        localStorage.removeItem('SORA_COMPLETE');
        localStorage.removeItem('SORA_RESULTS');

        updateUI();
        addStatus(`🚀 자동화 시작: ${state.totalPrompts}개 영상 (채널: ${state.currentChannel})`, 'success');
        addStatus(`설정: ${state.settings.orientation}, ${state.settings.duration}초`, 'info');

        await sleep(CONFIG.PAGE_LOAD_WAIT);

        // ===== 1단계: 모든 프롬프트 연속 생성 =====
        for (let i = 0; i < state.totalPrompts; i++) {
            if (!state.isRunning) {
                addStatus('사용자에 의해 중단됨', 'warning');
                break;
            }

            while (state.isPaused && state.isRunning) {
                await sleep(500);
            }

            state.currentPromptIndex = i;
            updateProgress();

            const prompt = state.videoPrompts[i];
            addStatus(`━━━━━━━━━━━━━━━━━━━━━━`, 'info');
            addStatus(`🎬 [${i + 1}/${state.totalPrompts}] 영상 생성`, 'progress');

            try {
                // 첫 번째 영상만 스토리보드 모드 진입
                if (i === 0) {
                    const storyboardOk = await enterStoryboardMode();
                    if (!storyboardOk) {
                        // 스토리보드 진입 실패해도 계속 시도
                        addStatus('스토리보드 진입 실패, 직접 입력 시도', 'warning');
                    }

                    await applySettings();
                }

                // 프롬프트 입력 및 드래프팅
                const inputOk = await inputPromptAndDraft(prompt);
                if (!inputOk) {
                    state.errors.push({ index: i, error: '프롬프트 입력 실패' });
                    continue;
                }

                await sleep(1000);

                // Create 버튼 클릭
                const createOk = await clickCreate();
                if (!createOk) {
                    state.errors.push({ index: i, error: 'Create 실패' });
                    continue;
                }

                // 다음 프롬프트 전 대기
                if (i < state.totalPrompts - 1) {
                    addStatus('다음 영상 준비...', 'info');
                    await sleep(CONFIG.BETWEEN_PROMPTS_DELAY);

                    // 새 스토리보드 시작을 위해 스토리보드 페이지로 이동
                    window.location.href = CONFIG.STORYBOARD_URL;

                    // 다음 프롬프트 처리를 위해 상태 저장
                    localStorage.setItem('SORA_CURRENT_INDEX', (i + 1).toString());
                    localStorage.setItem('SORA_AUTO_CONTINUE', 'true');
                    localStorage.setItem('SORA_TASK_MAP', JSON.stringify(state.taskMap));
                    return;
                }

            } catch (error) {
                addStatus(`오류: ${error.message}`, 'error');
                state.errors.push({ index: i, error: error.message });
            }
        }

        // ===== 2단계: 다운로드 =====
        if (state.generatedCount > 0) {
            await goToProfileAndDownload();
        } else {
            completeAutomation();
        }
    }

    // 자동 계속 처리 (페이지 새로고침 후)
    async function continueAutomation() {
        const currentIndex = parseInt(localStorage.getItem('SORA_CURRENT_INDEX') || '0');
        const promptsJson = localStorage.getItem('SORA_PROMPTS');
        const taskMapJson = localStorage.getItem('SORA_TASK_MAP');

        if (!promptsJson) return;

        state.videoPrompts = JSON.parse(promptsJson);
        state.totalPrompts = state.videoPrompts.length;
        state.currentPromptIndex = currentIndex;
        state.isRunning = true;
        state.phase = 'generating';
        state.generatedCount = currentIndex;

        // taskMap 복원
        if (taskMapJson) {
            state.taskMap = JSON.parse(taskMapJson);
        }

        // 채널 정보 복원
        state.currentChannel = localStorage.getItem('SORA_CHANNEL') || 'default';

        localStorage.removeItem('SORA_AUTO_CONTINUE');
        localStorage.removeItem('SORA_CURRENT_INDEX');
        localStorage.removeItem('SORA_TASK_MAP');

        addStatus(`계속 진행: ${currentIndex + 1}/${state.totalPrompts}`, 'info');

        await sleep(CONFIG.PAGE_LOAD_WAIT);

        // 나머지 프롬프트 처리
        for (let i = currentIndex; i < state.totalPrompts; i++) {
            if (!state.isRunning) break;

            state.currentPromptIndex = i;
            updateProgress();

            const prompt = state.videoPrompts[i];
            addStatus(`🎬 [${i + 1}/${state.totalPrompts}] 영상 생성`, 'progress');

            try {
                await enterStoryboardMode();
                await applySettings();
                await inputPromptAndDraft(prompt);
                await clickCreate();

                state.generatedCount++;

                if (i < state.totalPrompts - 1) {
                    await sleep(CONFIG.BETWEEN_PROMPTS_DELAY);
                    window.location.href = CONFIG.EXPLORE_URL;
                    localStorage.setItem('SORA_CURRENT_INDEX', (i + 1).toString());
                    localStorage.setItem('SORA_AUTO_CONTINUE', 'true');
                    return;
                }
            } catch (error) {
                addStatus(`오류: ${error.message}`, 'error');
            }
        }

        // 모든 생성 완료 → 다운로드
        await goToProfileAndDownload();
    }

    // 완료 처리
    function completeAutomation() {
        state.isRunning = false;
        state.phase = 'idle';

        const duration = state.startTime ? formatDuration(Date.now() - state.startTime) : '알 수 없음';

        // 결과 저장
        const results = {
            generatedCount: state.generatedCount,
            downloadedFiles: state.downloadedFiles,
            errors: state.errors,
            totalPrompts: state.totalPrompts,
            duration,
            timestamp: Date.now()
        };

        localStorage.setItem('SORA_COMPLETE', 'true');
        localStorage.setItem('SORA_RESULTS', JSON.stringify(results));
        localStorage.setItem('SORA_TASK_MAP', JSON.stringify(state.taskMap));
        localStorage.removeItem('SORA_PENDING_DOWNLOAD');
        localStorage.removeItem('SORA_EXPECTED_COUNT');
        localStorage.removeItem('SORA_AUTO_CONTINUE');
        localStorage.removeItem('SORA_CURRENT_INDEX');

        window.SORA_COMPLETE = true;
        window.SORA_RESULTS = results;
        window.SORA_TASK_MAP = state.taskMap;

        updateUI();

        addStatus('━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addStatus(`🎉 자동화 완료!`, 'success');
        addStatus(`⏱️ 소요 시간: ${duration}`, 'info');
        addStatus(`🎬 생성: ${state.generatedCount}개`, 'info');
        addStatus(`💾 다운로드: ${state.downloadedFiles.length}개`, 'info');

        if (state.errors.length > 0) {
            addStatus(`⚠️ 오류: ${state.errors.length}개`, 'warning');
        }

        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                title: 'Sora 자동화 완료',
                text: `${state.generatedCount}개 생성, ${state.downloadedFiles.length}개 다운로드`,
                timeout: 5000
            });
        }
    }

    // ============================================================================
    // 🎨 UI 생성
    // ============================================================================

    function createUI() {
        const existingPanel = document.getElementById('sora-automation-panel');
        if (existingPanel) existingPanel.remove();

        GM_addStyle(`
            #sora-automation-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                max-height: 600px;
                background: ${CONFIG.COLORS.bg};
                border: 1px solid ${CONFIG.COLORS.primary}40;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
            }

            .sora-header {
                background: linear-gradient(135deg, ${CONFIG.COLORS.primary}, #0d8a6f);
                padding: 12px 16px;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .sora-header h3 { margin: 0; color: white; font-size: 14px; }

            .sora-body { padding: 16px; max-height: 500px; overflow-y: auto; }

            .sora-section { margin-bottom: 16px; }

            .sora-section-title {
                font-size: 11px; font-weight: 600; color: ${CONFIG.COLORS.primary};
                text-transform: uppercase; margin-bottom: 8px;
            }

            .sora-btn {
                padding: 10px 16px; border: none; border-radius: 6px;
                font-size: 13px; font-weight: 600; cursor: pointer;
                transition: all 0.2s; margin-bottom: 8px;
                width: 100%;
            }

            .sora-btn-primary { background: ${CONFIG.COLORS.primary}; color: white; }
            .sora-btn-secondary { background: #333; color: white; }
            .sora-btn-danger { background: ${CONFIG.COLORS.error}; color: white; }
            .sora-btn:disabled { opacity: 0.5; cursor: not-allowed; }

            .sora-progress-bar {
                width: 100%; height: 8px; background: #333;
                border-radius: 4px; overflow: hidden; margin-bottom: 8px;
            }

            .sora-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, ${CONFIG.COLORS.primary}, ${CONFIG.COLORS.success});
                width: 0%; transition: width 0.3s;
            }

            .sora-progress-text { font-size: 12px; color: #999; text-align: center; }

            #sora-status-log {
                max-height: 200px; overflow-y: auto;
                background: #0a0a0f; border-radius: 6px; padding: 8px;
            }

            .sora-setting-row {
                display: flex; align-items: center; justify-content: space-between;
                padding: 8px; background: ${CONFIG.COLORS.bgLight};
                border-radius: 6px; margin-bottom: 8px;
            }

            .sora-select {
                padding: 6px 10px; border-radius: 4px;
                border: 1px solid #444; background: #222; color: white;
            }

            .sora-info {
                background: ${CONFIG.COLORS.bgLight};
                padding: 10px; border-radius: 6px;
                font-size: 12px; margin-bottom: 10px;
            }
        `);

        const panel = document.createElement('div');
        panel.id = 'sora-automation-panel';

        panel.innerHTML = `
            <div class="sora-header">
                <h3>🎬 Sora 자동화 v2.0</h3>
                <button id="sora-minimize-btn" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">−</button>
            </div>

            <div class="sora-body" id="sora-body">
                <div class="sora-section">
                    <div class="sora-section-title">⚙️ 설정</div>

                    <div class="sora-setting-row">
                        <span>Orientation:</span>
                        <select id="sora-orientation" class="sora-select">
                            <option value="Portrait" selected>Portrait (세로)</option>
                            <option value="Landscape">Landscape (가로)</option>
                        </select>
                    </div>

                    <div class="sora-setting-row">
                        <span>Duration:</span>
                        <select id="sora-duration" class="sora-select">
                            <option value="10">10초</option>
                            <option value="15" selected>15초</option>
                        </select>
                    </div>

                    <div class="sora-info" style="color: #eab308;">
                        ⚠️ 25초는 352p 제한으로 15초 권장
                    </div>
                </div>

                <div class="sora-section">
                    <div class="sora-section-title">📝 프롬프트</div>
                    <textarea id="sora-prompt-input" style="width:100%;height:80px;background:#222;border:1px solid #444;border-radius:6px;color:white;padding:8px;resize:vertical;box-sizing:border-box;" placeholder="영상 프롬프트를 입력하세요..."></textarea>
                    <button id="sora-add-prompt" class="sora-btn sora-btn-secondary">
                        ➕ 프롬프트 추가
                    </button>

                    <div class="sora-info" id="sora-prompt-list" style="display:none; max-height:100px; overflow-y:auto;">
                        <div id="prompt-count-text">🎬 대기 중: 0개</div>
                        <div id="prompt-list-items" style="font-size:11px; margin-top:5px;"></div>
                    </div>
                </div>

                <div class="sora-section">
                    <button id="sora-load-storage" class="sora-btn sora-btn-secondary">
                        📂 localStorage에서 로드
                    </button>
                </div>

                <div class="sora-section" id="sora-progress-section" style="display:none;">
                    <div class="sora-section-title">📊 진행 상황</div>
                    <div class="sora-progress-bar">
                        <div class="sora-progress-fill" id="sora-progress-fill"></div>
                    </div>
                    <div class="sora-progress-text" id="sora-progress-text">0 / 0</div>
                </div>

                <div class="sora-section">
                    <div class="sora-section-title">🎮 컨트롤</div>
                    <button id="sora-start-btn" class="sora-btn sora-btn-primary" disabled>
                        프롬프트를 먼저 입력하세요
                    </button>
                    <button id="sora-stop-btn" class="sora-btn sora-btn-danger" disabled>
                        ⏹️ 중지
                    </button>
                </div>

                <div class="sora-section">
                    <div class="sora-section-title">📋 로그</div>
                    <div id="sora-status-log"></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        setupEventListeners();
        makeDraggable(panel, panel.querySelector('.sora-header'));

        // 자동 시작/계속 체크
        checkAutoStart();

        addStatus('Sora 자동화 준비됨', 'success');
    }

    // ============================================================================
    // 🖱️ 이벤트 리스너
    // ============================================================================

    function setupEventListeners() {
        // 프롬프트 추가
        document.getElementById('sora-add-prompt')?.addEventListener('click', () => {
            const input = document.getElementById('sora-prompt-input');
            const prompt = input.value.trim();

            if (prompt) {
                state.videoPrompts.push(prompt);
                state.totalPrompts = state.videoPrompts.length;
                input.value = '';

                updatePromptList();

                localStorage.setItem('SORA_PROMPTS', JSON.stringify(state.videoPrompts));
                addStatus(`프롬프트 추가됨 (총 ${state.videoPrompts.length}개)`, 'success');
            }
        });

        // localStorage 로드
        document.getElementById('sora-load-storage')?.addEventListener('click', loadFromLocalStorage);

        // 설정 변경
        document.getElementById('sora-orientation')?.addEventListener('change', (e) => {
            state.settings.orientation = e.target.value;
            localStorage.setItem('SORA_SETTINGS', JSON.stringify(state.settings));
        });

        document.getElementById('sora-duration')?.addEventListener('change', (e) => {
            state.settings.duration = e.target.value;
            localStorage.setItem('SORA_SETTINGS', JSON.stringify(state.settings));
        });

        // 시작 버튼
        document.getElementById('sora-start-btn')?.addEventListener('click', startAutomation);

        // 중지 버튼
        document.getElementById('sora-stop-btn')?.addEventListener('click', () => {
            state.isRunning = false;
            addStatus('중지 요청됨...', 'warning');
        });

        // 최소화 버튼
        document.getElementById('sora-minimize-btn')?.addEventListener('click', () => {
            const body = document.getElementById('sora-body');
            const btn = document.getElementById('sora-minimize-btn');
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
            btn.textContent = body.style.display === 'none' ? '+' : '−';
        });
    }

    function updatePromptList() {
        const listDiv = document.getElementById('sora-prompt-list');
        const countText = document.getElementById('prompt-count-text');
        const listItems = document.getElementById('prompt-list-items');
        const startBtn = document.getElementById('sora-start-btn');

        if (state.videoPrompts.length > 0) {
            listDiv.style.display = 'block';
            countText.textContent = `🎬 대기 중: ${state.videoPrompts.length}개`;

            listItems.innerHTML = state.videoPrompts.map((p, i) =>
                `<div style="padding:2px 0; border-bottom:1px solid #333;">
                    ${i + 1}. ${p.substring(0, 40)}...
                </div>`
            ).join('');

            startBtn.disabled = false;
            startBtn.textContent = `▶️ ${state.videoPrompts.length}개 영상 생성 시작`;
        } else {
            listDiv.style.display = 'none';
            startBtn.disabled = true;
            startBtn.textContent = '프롬프트를 먼저 입력하세요';
        }
    }

    function loadFromLocalStorage() {
        const promptsJson = localStorage.getItem('SORA_PROMPTS');
        const settingsJson = localStorage.getItem('SORA_SETTINGS');

        if (promptsJson) {
            try {
                state.videoPrompts = JSON.parse(promptsJson);
                state.totalPrompts = state.videoPrompts.length;
                updatePromptList();
                addStatus(`localStorage에서 ${state.videoPrompts.length}개 프롬프트 로드`, 'success');
            } catch (e) {
                addStatus('localStorage 파싱 오류', 'error');
            }
        } else {
            addStatus('localStorage에 데이터 없음', 'warning');
        }

        if (settingsJson) {
            try {
                state.settings = { ...state.settings, ...JSON.parse(settingsJson) };
                document.getElementById('sora-orientation').value = state.settings.orientation;
                document.getElementById('sora-duration').value = state.settings.duration;
            } catch (e) {}
        }
    }

    // 자동 시작 체크
    function checkAutoStart() {
        // 자동 계속
        if (localStorage.getItem('SORA_AUTO_CONTINUE') === 'true') {
            addStatus('자동 계속 감지됨...', 'info');
            setTimeout(continueAutomation, CONFIG.PAGE_LOAD_WAIT);
            return;
        }

        // 대기 중인 다운로드
        if (localStorage.getItem('SORA_PENDING_DOWNLOAD') === 'true' &&
            window.location.href.includes('/me')) {
            addStatus('대기 중인 다운로드 감지됨...', 'info');
            setTimeout(downloadFromDrafts, CONFIG.PAGE_LOAD_WAIT);
            return;
        }

        // 자동 시작
        if (localStorage.getItem('SORA_AUTO_START') === 'true') {
            localStorage.removeItem('SORA_AUTO_START');
            addStatus('자동 시작 감지됨...', 'info');
            setTimeout(() => {
                loadFromLocalStorage();
                setTimeout(startAutomation, 2000);
            }, CONFIG.PAGE_LOAD_WAIT);
        }
    }

    // 진행률 업데이트
    function updateProgress() {
        const progressSection = document.getElementById('sora-progress-section');
        const progressFill = document.getElementById('sora-progress-fill');
        const progressText = document.getElementById('sora-progress-text');

        if (progressSection) progressSection.style.display = 'block';

        const percent = state.totalPrompts > 0
            ? ((state.currentPromptIndex + 1) / state.totalPrompts * 100)
            : 0;

        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${state.currentPromptIndex + 1} / ${state.totalPrompts}`;
    }

    function updateUI() {
        const startBtn = document.getElementById('sora-start-btn');
        const stopBtn = document.getElementById('sora-stop-btn');

        if (state.isRunning) {
            if (startBtn) { startBtn.disabled = true; startBtn.textContent = '⏳ 실행 중...'; }
            if (stopBtn) stopBtn.disabled = false;
        } else {
            updatePromptList();
            if (stopBtn) stopBtn.disabled = true;
        }
    }

    // 드래그 기능
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
    // 🐛 디버깅 함수 (전역 노출)
    // ============================================================================
    
    window.SORA_DEBUG = {
        // Fetch 캡처된 Task ID들
        getTaskMap: function() {
            console.log("=== Fetch 캡처된 Task ID들 ===");
            if (state.taskMap.length === 0) {
                console.log("(비어있음)");
            } else {
                state.taskMap.forEach((task, idx) => {
                    console.log(`${idx + 1}. ID: ${task.taskId} | Status: ${task.status} | Channel: ${task.channel} | Prompt: ${task.prompt.substring(0, 50)}...`);
                });
            }
            return state.taskMap;
        },
        
        // DOM에 있는 Task ID들
        getDomTasks: function() {
            console.log("=== DOM에 있는 Task ID들 ===");
            const links = document.querySelectorAll('a[href*="/jobs/"]');
            const taskIds = [];
            
            links.forEach((link, idx) => {
                const href = link.getAttribute('href');
                const match = href.match(/\/jobs\/([a-f0-9-]+)/);
                if (match) {
                    const fullId = match[1];
                    const shortId = normalizeTaskId(fullId);
                    console.log(`${idx + 1}. ${shortId}... (전체: ${fullId})`);
                    taskIds.push(fullId);
                }
            });
            
            if (taskIds.length === 0) {
                console.log("(비어있음)");
            }
            
            return taskIds;
        },
        
        // 비교
        compare: function() {
            console.log("=== 비교 분석 ===");
            const fetchIds = state.taskMap.map(t => t.taskId);
            const domIds = this.getDomTasks();
            
            console.log(`\nFetch 캡처: ${fetchIds.length}개`);
            console.log(`DOM 존재: ${domIds.length}개`);
            
            // 매칭 확인
            console.log("\n매칭 확인:");
            fetchIds.forEach((fetchId, idx) => {
                const found = domIds.some(domId => {
                    const shortDomId = normalizeTaskId(domId);
                    return shortDomId === fetchId || domId.startsWith(fetchId);
                });
                const task = state.taskMap[idx];
                console.log(`${idx + 1}. ${fetchId} (${task.status}) → ${found ? '✅ 매칭' : '❌ 없음'}`);
            });
            
            // 추가 Task (DOM에만 있는 것)
            console.log("\nDOM에만 있는 Task:");
            domIds.forEach(domId => {
                const shortDomId = normalizeTaskId(domId);
                const found = fetchIds.some(fetchId => 
                    fetchId === shortDomId || domId.startsWith(fetchId)
                );
                if (!found) {
                    console.log(`- ${shortDomId}...`);
                }
            });
        },
        
        // 현재 상태
        getState: function() {
            console.log("=== 현재 상태 ===");
            console.log(`실행 중: ${state.isRunning}`);
            console.log(`일시정지: ${state.isPaused}`);
            console.log(`단계: ${state.phase}`);
            console.log(`총 프롬프트: ${state.totalPrompts}`);
            console.log(`현재 인덱스: ${state.currentPromptIndex}`);
            console.log(`생성 완료: ${state.generatedCount}`);
            console.log(`다운로드: ${state.downloadedFiles.length}개`);
            console.log(`에러: ${state.errors.length}개`);
            console.log(`taskMap: ${state.taskMap.length}개`);
            console.log(`현재 채널: ${state.currentChannel || '(없음)'}`);
            
            return {
                isRunning: state.isRunning,
                isPaused: state.isPaused,
                phase: state.phase,
                totalPrompts: state.totalPrompts,
                currentPromptIndex: state.currentPromptIndex,
                generatedCount: state.generatedCount,
                downloadedFiles: state.downloadedFiles.length,
                errors: state.errors.length,
                taskMap: state.taskMap.length,
                currentChannel: state.currentChannel
            };
        },
        
        // localStorage 확인
        checkLocalStorage: function() {
            console.log("=== localStorage 확인 ===");
            const keys = [
                'SORA_PROMPTS',
                'SORA_SETTINGS',
                'SORA_AUTO_START',
                'SORA_COMPLETE',
                'SORA_RESULTS',
                'SORA_TASK_MAP',
                'SORA_CHANNEL',
                'SORA_PENDING_DOWNLOAD',
                'SORA_EXPECTED_COUNT',
                'SORA_AUTO_CONTINUE',
                'SORA_CURRENT_INDEX'
            ];
            
            keys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        const parsed = JSON.parse(value);
                        if (typeof parsed === 'object') {
                            if (Array.isArray(parsed)) {
                                console.log(`${key}: [배열 ${parsed.length}개]`);
                            } else {
                                console.log(`${key}:`, parsed);
                            }
                        } else {
                            console.log(`${key}: ${parsed}`);
                        }
                    } catch {
                        console.log(`${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
                    }
                } else {
                    console.log(`${key}: (없음)`);
                }
            });
        },
        
        // 강제 완료 처리 (테스트용)
        forceComplete: function() {
            console.log("⚠️ 강제 완료 처리 실행...");
            state.isRunning = false;
            completeAutomation();
        },
        
        // taskMap 초기화
        clearTaskMap: function() {
            console.log("🧹 taskMap 초기화");
            state.taskMap = [];
            state.pendingTaskId = null;
            detectedTaskIds.clear();
            localStorage.removeItem('SORA_TASK_MAP');
        }
    };
    
    console.log("🐛 디버깅 함수 활성화됨! 사용법:");
    console.log("  SORA_DEBUG.getTaskMap()        - Fetch 캡처된 Task ID 확인");
    console.log("  SORA_DEBUG.getDomTasks()       - DOM의 Task ID 확인");
    console.log("  SORA_DEBUG.compare()           - 둘을 비교");
    console.log("  SORA_DEBUG.getState()          - 현재 상태");
    console.log("  SORA_DEBUG.checkLocalStorage() - localStorage 확인");
    console.log("  SORA_DEBUG.forceComplete()     - 강제 완료 (테스트용)");
    console.log("  SORA_DEBUG.clearTaskMap()      - taskMap 초기화");

    // ============================================================================
    // 🚀 초기화
    // ============================================================================

    function init() {
        if (document.body) {
            setTimeout(createUI, 2000);
        } else {
            document.addEventListener('DOMContentLoaded', () => setTimeout(createUI, 2000));
        }
    }

    init();

})();

$popupCode = @'

// ============================================================
// Claude 팝업 강력 차단 (MutationObserver)
// ============================================================
(function() {
    'use strict';
    
    function killPopup() {
        document.querySelectorAll('[role="dialog"], [role="alertdialog"]').forEach(dialog => {
            const text = dialog.textContent || '';
            if (text.includes('Claude를 계속') || text.includes('Continue using') || 
                text.includes('사용하시겠어요') || text.includes('usage') || text.includes('상위 플랜')) {
                console.log('🔥 Claude 팝업 강제 제거!');
                dialog.remove();
            }
        });
        
        document.querySelectorAll('[class*="backdrop"], [class*="overlay"], [class*="modal"], [style*="position: fixed"]').forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex) || 0;
            const position = style.position;
            const bgColor = style.backgroundColor;
            
            if ((zIndex > 999 || position === 'fixed') && (bgColor.includes('rgba') || bgColor.includes('rgb'))) {
                console.log('🔥 오버레이 제거:', el.className);
                el.remove();
            }
        });
        
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.documentElement.style.overflow = '';
        document.querySelectorAll('[inert]').forEach(el => {
            el.removeAttribute('inert');
        });
    }
    
    const observer = new MutationObserver(() => killPopup());
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(killPopup, 500);
    
    console.log('✅ Claude 팝업 차단 활성화됨 (오버레이 강화)');
})();
'@

Get-ChildItem *.user.js | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    if ($content -notmatch 'Claude 팝업 강력 차단') {
        Add-Content $_.FullName $popupCode -Encoding UTF8 -NoNewline
        Write-Host "✅ $($_.Name)"
    } else {
        Write-Host "⏭️ $($_.Name) (이미 있음)"
    }
}