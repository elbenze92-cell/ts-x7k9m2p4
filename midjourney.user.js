// ==UserScript==
// @name         @이미지 Midjourney 완전 자동화 (Python 연동)
// @namespace    https://atobro.com/
// @version      1.1.0
// @description  Midjourney 이미지 생성 완전 자동화 - 프롬프트 입력, 설정, 생성 대기, CDN 다운로드, Python 연동
// @author       Atobro
// @match        https://www.midjourney.com/*
// @updateURL    https://raw.githubusercontent.com/elbenze92-cell/ts-x7k9m2p4/main/scripts/midjourney.user.js
// @downloadURL  https://raw.githubusercontent.com/elbenze92-cell/ts-x7k9m2p4/main/scripts/midjourney.user.js
// @icon         https://www.midjourney.com/favicon.ico
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      cdn.midjourney.com
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================================
    // 🔧 설정1.10 12.07 00시 49분.
    // ============================================================================
    const CONFIG = {
        // 폴링 간격 (ms)
        POLL_INTERVAL: 3000,           // 3초마다 상태 체크
        STATUS_LOG_INTERVAL: 30000,    // 30초마다 상태 로그

        // 타임아웃 (ms)
        MAX_GENERATION_WAIT: 600000,   // 10분 (Relax 모드는 오래 걸림)
        MAX_SETTING_WAIT: 10000,       // 설정 패널 대기 10초
        SETTINGS_PANEL_WAIT: 2000,     // 설정 패널 완전히 열릴 때까지 대기 2초

        // 다운로드 설정
        DOWNLOAD_DELAY: 2000,          // 다운로드 간 딜레이
        PROMPT_DELAY: 5000,            // 프롬프트 간 딜레이

        // CDN URL 패턴
        CDN_BASE: 'https://cdn.midjourney.com',

        // UI 색상
        COLORS: {
            primary: '#f97316',        // 오렌지
            success: '#22c55e',        // 초록
            error: '#ef4444',          // 빨강
            warning: '#eab308',        // 노랑
            info: '#3b82f6',           // 파랑
            bg: '#1a1a2e',             // 어두운 배경
            bgLight: '#16213e',        // 밝은 배경
            text: '#ffffff'            // 흰색 텍스트
        }
    };

    // ============================================================================
    // 🗄️ 전역 상태
    // ============================================================================
    let state = {
        isRunning: false,
        isPaused: false,
        currentPromptIndex: 0,
        totalPrompts: 0,
        prompts: [],
        settings: {
            aspectRatio: '9:16',        // 기본: 세로 (숏폼)
            version: 'niji 6',          // v7 또는 niji 6
            mode: 'Standard',
            speed: 'Relax'              // 무조건 Relax!
        },
        results: [],                    // 완료된 이미지 정보
        errors: [],                     // 에러 목록
        startTime: null
    };

    // ============================================================================
    // 🛠️ 유틸리티 함수
    // ============================================================================
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const getTimestamp = () => {
        const now = new Date();
        return now.toLocaleTimeString('ko-KR', { hour12: false });
    };

    const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}분 ${remainingSeconds}초`;
    };

    // ============================================================================
    // 📝 로그 시스템
    // ============================================================================
    function addStatus(message, type = 'info') {
        const statusLog = document.getElementById('mj-status-log');
        if (!statusLog) return;

        const colors = {
            info: CONFIG.COLORS.info,
            success: CONFIG.COLORS.success,
            error: CONFIG.COLORS.error,
            warning: CONFIG.COLORS.warning,
            progress: CONFIG.COLORS.primary
        };

        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            progress: '⏳'
        };

        const entry = document.createElement('div');
        entry.style.cssText = `
            padding: 4px 8px;
            margin: 2px 0;
            border-radius: 4px;
            background: ${colors[type]}20;
            border-left: 3px solid ${colors[type]};
            font-size: 12px;
            color: ${CONFIG.COLORS.text};
        `;
        entry.innerHTML = `
            <span style="opacity: 0.6">[${getTimestamp()}]</span>
            ${icons[type]} ${message}
        `;

        statusLog.insertBefore(entry, statusLog.firstChild);

        // 최대 50개 로그 유지
        while (statusLog.children.length > 50) {
            statusLog.removeChild(statusLog.lastChild);
        }

        console.log(`[MJ Auto] ${icons[type]} ${message}`);
    }

    // ============================================================================
    // 🎯 셀렉터 정의 (실제 사이트에서 확인한 값들)
    // ============================================================================
    const SELECTORS = {
        // 입력 영역
        promptInput: '#desktop_input_bar',

        // 설정 버튼 (슬라이더 아이콘)
        settingsButton: 'button svg[viewBox="0 0 24 24"] g#Settings',

        // 상태 표시 (생성 중)
        statusStarting: 'span.relative:contains("Starting")',
        statusQueued: 'span.relative:contains("Queued")',
        statusComplete: 'span.relative:contains("Complete")',

        // 이미지 그리드 (Create 탭)
        imageGrid: 'div.grid[style*="grid-template-columns"]',
        imageCard: 'div.grid > div.relative > a[href^="/jobs/"]',
        imageImg: 'div.grid > div.relative > a > img[src*="cdn.midjourney.com"]',

        // Organize 탭 이미지
        organizeImage: 'a[href^="/jobs/"] img[src*="cdn.midjourney.com"]',

        // 다운로드 버튼
        saveImageButton: 'button span.relative:contains("Save Image")',

        // 설정 패널 요소들
        portraitButton: 'button:contains("Portrait")',
        landscapeButton: 'button:contains("Landscape")',
        relaxButton: 'button:contains("Relax")',
        standardModeButton: 'button:contains("Standard")',
        versionDropdown: 'button[id^="headlessui-listbox-button"]',
        versionOption7: 'span:contains("7")',
        versionOptionNiji6: 'span:contains("niji 6")'
    };

    // ============================================================================
    // 🔍 DOM 헬퍼 함수
    // ============================================================================

    // jQuery 스타일 :contains 셀렉터 지원
    function querySelectorContains(selector) {
        const match = selector.match(/(.+):contains\("(.+)"\)/);
        if (!match) return document.querySelector(selector);

        const [, baseSelector, text] = match;
        const elements = document.querySelectorAll(baseSelector);
        for (const el of elements) {
            if (el.textContent.includes(text)) {
                return el;
            }
        }
        return null;
    }

    function querySelectorAllContains(selector) {
        const match = selector.match(/(.+):contains\("(.+)"\)/);
        if (!match) return document.querySelectorAll(selector);

        const [, baseSelector, text] = match;
        const elements = document.querySelectorAll(baseSelector);
        return Array.from(elements).filter(el => el.textContent.includes(text));
    }

    // 요소가 나타날 때까지 대기
    async function waitForElement(selector, maxWait = 10000, useContains = false) {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            const element = useContains
                ? querySelectorContains(selector)
                : document.querySelector(selector);

            if (element) return element;
            await sleep(200);
        }

        return null;
    }

    // ============================================================================
    // 📊 상태 감지 함수
    // ============================================================================

    // 현재 대기열/생성 중인 작업 개수 (Midjourney 웹사이트에서 읽기)
    function getQueuedJobsCount() {
        // "10 queued jobs" 텍스트 찾기
        const allText = document.body.innerText;
        
        // "X queued jobs" 패턴 매칭
        const match = allText.match(/(\d+)\s+queued\s+jobs?/i);
        
        if (match) {
            const count = parseInt(match[1]);
            return count;
        }
        
        // 텍스트가 없으면 0 (큐 비어있음)
        return 0;
    }

    // 현재 생성 중인 작업이 있는지 확인
    function isGenerating() {
        // Starting..., Queued, XX% Complete 중 하나라도 있으면 생성 중
        const statusSpans = document.querySelectorAll('span.relative');

        for (const span of statusSpans) {
            const text = span.textContent || '';
            if (text.includes('Starting') ||
                text.includes('Queued') ||
                text.includes('Complete')) {
                return true;
            }
        }

        return false;
    }

    // 현재 진행 상태 텍스트 가져오기
    function getGenerationStatus() {
        const statusSpans = document.querySelectorAll('span.relative');

        for (const span of statusSpans) {
            const text = span.textContent || '';
            if (text.includes('Starting')) return { status: 'starting', text };
            if (text.includes('Queued')) return { status: 'queued', text };
            if (text.includes('Complete')) {
                const match = text.match(/(\d+)%/);
                return {
                    status: 'generating',
                    text,
                    progress: match ? parseInt(match[1]) : 0
                };
            }
        }

        return { status: 'idle', text: '' };
    }

    // 새로 생성된 이미지의 Job ID 추출
    function getLatestJobId() {
        // Create 탭의 이미지 링크에서 Job ID 추출
        const imageLinks = document.querySelectorAll('a[href^="/jobs/"]');

        if (imageLinks.length === 0) return null;

        // 가장 최근 이미지 (첫 번째)
        const href = imageLinks[0].getAttribute('href');
        const match = href.match(/\/jobs\/([a-f0-9-]+)/);

        return match ? match[1] : null;
    }

    // 특정 Job ID의 이미지 URL들 가져오기
    function getImageUrls(jobId) {
        // CDN URL 패턴: https://cdn.midjourney.com/{jobId}/0_{index}_640_N.webp
        const urls = [];

        for (let i = 0; i < 4; i++) {
            urls.push({
                thumbnail: `${CONFIG.CDN_BASE}/${jobId}/0_${i}_640_N.webp`,
                full: `${CONFIG.CDN_BASE}/${jobId}/0_${i}.webp`,
                index: i
            });
        }

        return urls;
    }

    // ============================================================================
    // ⚙️ 설정 적용 함수
    // ============================================================================

    async function openSettingsPanel() {
        addStatus('━━━ [1단계] 설정 패널 열기 ━━━', 'info');
        await sleep(2000); // 2초 대기
        
        // 설정 버튼 찾기
        const buttons = document.querySelectorAll('button');
        let settingsBtn = null;

        for (const btn of buttons) {
            const svg = btn.querySelector('svg');
            if (svg) {
                const gSettings = svg.querySelector('g#Settings');
                if (gSettings) {
                    settingsBtn = btn;
                    addStatus('✓ 설정 버튼 찾음', 'success');
                    break;
                }
            }
        }

        if (!settingsBtn) {
            addStatus('❌ 설정 버튼 없음', 'error');
            return false;
        }

        await sleep(1000);
        addStatus('설정 버튼 클릭...', 'info');
        
        settingsBtn.click();
        await sleep(3000); // 3초 대기 - 패널 완전히 열릴 때까지

        // 패널 열림 확인
        const portraitCheck = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent.trim() === 'Portrait'
        );
        
        if (portraitCheck) {
            addStatus('✅ 설정 패널 열림!', 'success');
            await sleep(2000); // 2초 더 대기
            return true;
        } else {
            addStatus('❌ 설정 패널 안 열림', 'error');
            return false;
        }
    }

    async function applySettings() {
        try {
            // 1. 설정 패널 열기
            const opened = await openSettingsPanel();
            if (!opened) {
                addStatus('❌ 설정 패널 열기 실패', 'error');
                return false;
            }

            await sleep(2000);
            addStatus('━━━ [2단계] Relax 모드 설정 ━━━', 'info');
            await sleep(1000);

            // 2. Relax 버튼 찾기 및 클릭
            const buttons = document.querySelectorAll('button');
            let relaxBtn = null;
            
            for (const btn of buttons) {
                const text = btn.textContent.trim();
                const className = btn.className;
                
                if (text === 'Relax' && className.includes('text-splash')) {
                    relaxBtn = btn;
                    addStatus('✓ Relax 버튼 찾음', 'success');
                    break;
                }
            }

            if (!relaxBtn) {
                addStatus('⚠️ Relax 버튼 없음 (Fast 모드 유지)', 'warning');
            } else {
                addStatus('Relax 버튼 클릭...', 'info');
                relaxBtn.click();
                await sleep(2000);
                addStatus('✅ Relax 모드 설정됨', 'success');
            }

            await sleep(2000);
            addStatus('━━━ [3단계] 설정 패널 닫기 ━━━', 'info');
            await sleep(1000);

            // 3. ESC로 패널 닫기
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27,
                bubbles: true
            }));
            
            await sleep(3000);
            addStatus('✅ 설정 완료!', 'success');
            return true;

        } catch (error) {
            addStatus(`❌ 오류: ${error.message}`, 'error');
            return false;
        }
    }

    // ============================================================================
    // 📝 프롬프트 입력 함수
    // ============================================================================

    async function inputPrompt(prompt) {
        try {
            await sleep(2000);
            addStatus('━━━ [6단계] 프롬프트 입력 ━━━', 'info');
            await sleep(1000);
            
            // 파라미터 추가 (중복 방지)
            let finalPrompt = prompt;
            
            // 버전 추가 (프롬프트에 없을 때만)
            const hasVersion = /--v\s+\d+|--niji\s+\d+/.test(prompt);
            if (!hasVersion && state.settings.version) {
                if (state.settings.version.includes('niji')) {
                    finalPrompt += ` --${state.settings.version}`;
                } else {
                    const versionNumber = state.settings.version.replace('v', '');
                    finalPrompt += ` --v ${versionNumber}`;
                }
            }
            
            // 비율 추가 (프롬프트에 없을 때만)
            const hasAspect = /--ar\s+\d+:\d+/.test(prompt);
            if (!hasAspect && state.settings.aspectRatio) {
                finalPrompt += ` --ar ${state.settings.aspectRatio}`;
            }
            
            addStatus(`프롬프트: "${finalPrompt.substring(0, 50)}..."`, 'info');
            await sleep(2000);

            // 입력창 찾기
            const inputArea = document.getElementById('desktop_input_bar');
            if (!inputArea) {
                addStatus('❌ 입력창 없음', 'error');
                return false;
            }

            addStatus('✓ 입력창 찾음', 'success');
            await sleep(1000);

            // 🔥 1. 기존 내용 완전히 지우기
            inputArea.value = '';
            inputArea.focus();
            await sleep(500);

            // 🔥 2. React 상태 강제 업데이트 (여러 이벤트 발생)
            addStatus('React 상태 업데이트 중...', 'info');
            
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, 
                'value'
            ).set;
            
            nativeInputValueSetter.call(inputArea, finalPrompt);
            
            // 🔥 모든 React 이벤트 발생
            inputArea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            inputArea.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            inputArea.dispatchEvent(new Event('blur', { bubbles: true }));
            inputArea.focus();
            inputArea.dispatchEvent(new Event('focus', { bubbles: true }));
            
            await sleep(3000);  // 🔥 3초로 증가
            addStatus('✅ 입력 완료!', 'success');

            await sleep(2000);
            addStatus('━━━ [7단계] 전송 ━━━', 'info');
            await sleep(1000);

            // 🔥 우선순위 1: Enter 키 시도 (가장 안정적)
            addStatus('Enter 키로 전송 시도...', 'info');
            inputArea.focus();
            await sleep(500);
            
            inputArea.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            }));
            
            await sleep(3000);  // 🔥 3초 대기
            
            // 🔥 입력창이 비워졌는지 확인
            if (inputArea.value === '') {
                addStatus('✅✅✅ Enter로 전송 성공! ✅✅✅', 'success');
                
                // 🔥 "Starting..." 상태 확인 (5초 대기)
                let foundStarting = false;
                for (let i = 0; i < 5; i++) {
                    await sleep(1000);
                    const statusSpans = document.querySelectorAll('span.relative');
                    for (const span of statusSpans) {
                        if (span.textContent.includes('Starting') || span.textContent.includes('Queued')) {
                            foundStarting = true;
                            addStatus('✅ 생성 시작 확인됨!', 'success');
                            break;
                        }
                    }
                    if (foundStarting) break;
                }
                
                if (!foundStarting) {
                    addStatus('⚠️ "Starting" 상태 미확인 (5초 이내)', 'warning');
                    addStatus('💡 Create 탭에서 수동 확인 필요', 'warning');
                }
                
                return true;
            }

            // 🔥 우선순위 2: 전송 버튼 클릭
            addStatus('⚠️ Enter 실패 - 버튼 클릭 시도', 'warning');
            
            const inputParent = inputArea.closest('div');
            let submitBtn = null;
            
            if (inputParent) {
                const buttons = inputParent.querySelectorAll('button');
                addStatus(`버튼 ${buttons.length}개 발견`, 'info');
                await sleep(1000);
                
                if (buttons.length >= 2) {
                    submitBtn = buttons[1];
                    addStatus('✓ 전송 버튼 찾음 (두번째)', 'success');
                } else if (buttons.length === 1) {
                    submitBtn = buttons[0];
                    addStatus('✓ 전송 버튼 찾음 (단일)', 'success');
                }
            }

            if (!submitBtn) {
                addStatus('❌ 전송 버튼 없음', 'error');
                return false;
            }

            // 🔥 버튼 활성화 대기 (최대 5초)
            let btnEnabled = false;
            for (let i = 0; i < 5; i++) {
                if (!submitBtn.disabled) {
                    btnEnabled = true;
                    break;
                }
                await sleep(1000);
                addStatus(`버튼 활성화 대기 중... (${i + 1}/5초)`, 'info');
            }
            
            if (!btnEnabled) {
                addStatus('❌ 버튼 활성화 타임아웃', 'error');
                return false;
            }

            await sleep(1000);
            addStatus('버튼 클릭...', 'info');
            submitBtn.click();
            await sleep(3000);

            if (inputArea.value === '') {
                addStatus('✅✅✅ 버튼으로 전송 성공! ✅✅✅', 'success');
                
                // 🔥 "Starting..." 상태 확인
                let foundStarting = false;
                for (let i = 0; i < 5; i++) {
                    await sleep(1000);
                    const statusSpans = document.querySelectorAll('span.relative');
                    for (const span of statusSpans) {
                        if (span.textContent.includes('Starting') || span.textContent.includes('Queued')) {
                            foundStarting = true;
                            addStatus('✅ 생성 시작 확인됨!', 'success');
                            break;
                        }
                    }
                    if (foundStarting) break;
                }
                
                if (!foundStarting) {
                    addStatus('⚠️ "Starting" 상태 미확인 (5초 이내)', 'warning');
                    addStatus('💡 Create 탭에서 수동 확인 필요', 'warning');
                }
                
                return true;
            } else {
                addStatus('❌ 버튼 클릭도 실패', 'error');
                return false;
            }

        } catch (error) {
            addStatus(`❌ 오류: ${error.message}`, 'error');
            return false;
        }
    }


    // ============================================================================
    // 💾 CDN 직접 다운로드
    // ============================================================================

    async function downloadFromCDN(jobId, promptIndex, selectRandom = true) {
        const imageUrls = getImageUrls(jobId);

        // 랜덤 1장 선택 (또는 전체)
        let selectedIndex;
        if (selectRandom) {
            selectedIndex = Math.floor(Math.random() * 4);
            addStatus(`4장 중 ${selectedIndex + 1}번째 이미지 선택 (랜덤)`, 'info');
        }

        const targetUrl = imageUrls[selectedIndex].full;
        const filename = `mj_${promptIndex + 1}_${jobId.substring(0, 8)}_${selectedIndex}.webp`;

        addStatus(`다운로드 시작: ${filename}`, 'info');

        return new Promise((resolve, reject) => {
            // GM_download 사용 (Tampermonkey 기능)
            if (typeof GM_download !== 'undefined') {
                GM_download({
                    url: targetUrl,
                    name: filename,
                    saveAs: false,
                    onload: () => {
                        addStatus(`다운로드 완료: ${filename}`, 'success');
                        
                        // localStorage에 다운로드 정보 저장
                        const downloads = JSON.parse(localStorage.getItem('MIDJOURNEY_DOWNLOADS') || '[]');
                        downloads.push({
                            filename: filename,
                            jobId: jobId,
                            promptIndex: promptIndex,
                            timestamp: Date.now()
                        });
                        localStorage.setItem('MIDJOURNEY_DOWNLOADS', JSON.stringify(downloads));
                        
                        resolve({
                            success: true,
                            filename,
                            url: targetUrl,
                            jobId,
                            selectedIndex,
                            promptIndex
                        });
                    },
                    onerror: (error) => {
                        addStatus(`다운로드 실패: ${error.error}`, 'error');
                        reject(error);
                    }
                });
            } else {
                // GM_download 없으면 새 탭에서 열기
                window.open(targetUrl, '_blank');
                addStatus(`새 탭에서 열림: ${filename}`, 'warning');
                resolve({
                    success: true,
                    filename,
                    url: targetUrl,
                    jobId,
                    selectedIndex,
                    promptIndex,
                    method: 'newTab'
                });
            }
        });
    }

    // fetch로 다운로드 (대안)
    async function downloadViaFetch(jobId, promptIndex, selectedIndex = null) {
        if (selectedIndex === null) {
            selectedIndex = Math.floor(Math.random() * 4);
        }

        const imageUrl = `${CONFIG.CDN_BASE}/${jobId}/0_${selectedIndex}.webp`;
        const filename = `mj_${promptIndex + 1}_${jobId.substring(0, 8)}_${selectedIndex}.webp`;

        addStatus(`Fetch 다운로드: ${filename}`, 'info');

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // 다운로드 링크 생성
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addStatus(`다운로드 완료: ${filename}`, 'success');

            return {
                success: true,
                filename,
                url: imageUrl,
                jobId,
                selectedIndex,
                promptIndex
            };

        } catch (error) {
            addStatus(`Fetch 다운로드 실패: ${error.message}`, 'error');
            throw error;
        }
    }

    // ============================================================================
    // 🚀 메인 자동화 루프 (Seed 기반)
    // ============================================================================

    async function startAutomation() {
        // 🔥 localStorage 초기화
        localStorage.removeItem('MIDJOURNEY_DOWNLOADS');
        localStorage.removeItem('MIDJOURNEY_RESULTS');
        localStorage.removeItem('MIDJOURNEY_ERRORS');
        localStorage.removeItem('MIDJOURNEY_COMPLETE');
        localStorage.removeItem('MIDJOURNEY_INPUT_COMPLETE');
        addStatus('🧹 localStorage 초기화 완료', 'info');
        
        // Python에서 전달한 프롬프트 가져오기
        const promptsJson = localStorage.getItem('MIDJOURNEY_PROMPTS');
        const settingsJson = localStorage.getItem('MIDJOURNEY_SETTINGS');

        if (!promptsJson) {
            addStatus('프롬프트가 없습니다. Python에서 먼저 설정해주세요.', 'error');
            return;
        }

        try {
            state.prompts = JSON.parse(promptsJson);

            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                state.settings = { ...state.settings, ...settings };
            }

        } catch (e) {
            addStatus(`❌ JSON 파싱 오류: ${e.message}`, 'error');
            console.error('파싱 오류 상세:', e);
            console.log('PROMPTS:', promptsJson?.substring(0, 100));
            return;
        }

        state.totalPrompts = state.prompts.length;
        state.isRunning = true;
        state.startTime = Date.now();
        state.results = [];
        state.errors = [];

        // UI 업데이트
        updateUI();

        addStatus(`🚀 자동화 시작: ${state.totalPrompts}개 프롬프트`, 'success');
        addStatus(`설정: ${state.settings.aspectRatio}, ${state.settings.version}, ${state.settings.speed}`, 'info');

        // 설정 적용
        await applySettings();
        await sleep(1000);

        // 프롬프트 연속 입력
        addStatus(`━━━━━━━━━━━━━━━━━━━━━━`, 'info');
        addStatus(`📝 ${state.totalPrompts}개 프롬프트 입력 시작`, 'progress');
        
        let successCount = 0;
        
        for (let i = 0; i < state.prompts.length; i++) {
            if (!state.isRunning) break;
            
            const prompt = state.prompts[i];
            
            state.currentPromptIndex = i;
            updateProgress();
            
            addStatus(`📝 [${i + 1}/${state.totalPrompts}] 입력 중...`, 'info');
            
            try {
                const inputSuccess = await inputPrompt(prompt);
                
                if (inputSuccess) {
                    addStatus(`✅ [${i + 1}] 입력 성공`, 'success');
                    successCount++;
                } else {
                    addStatus(`❌ [${i + 1}] 입력 실패`, 'error');
                    state.errors.push({ 
                        index: i, 
                        prompt: prompt,
                        error: '입력 실패'
                    });
                }
            } catch (error) {
                addStatus(`❌ [${i + 1}] 오류: ${error.message}`, 'error');
                state.errors.push({ 
                    index: i, 
                    prompt: prompt,
                    error: error.message
                });
            }
            
            await sleep(5000);  // 🔥 5초로 증가 (프롬프트 간 여유)
        }
        
        addStatus(`✅ 입력 완료 (${successCount}/${state.totalPrompts}개)`, 'success');
        
        if (successCount === 0) {
            addStatus(`⚠️생성 시작된 작업이 없습니다`, 'error');
            completeAutomation();
            return;
        }
        
        // 🔥 입력 완료 플래그 설정 (Python이 이어받음)
        addStatus(`━━━━━━━━━━━━━━━━━━━━━━`, 'info');
        localStorage.setItem('MIDJOURNEY_INPUT_COMPLETE', 'true');
        addStatus(`✅ 입력 완료! Python이 Organize 탭 검색을 진행합니다.`, 'success');
        
        // 완료 처리
        completeAutomation();
    }


    // ============================================================================
    // 🏁 완료 처리
    // ============================================================================

    function completeAutomation() {
        state.isRunning = false;

        const duration = formatDuration(Date.now() - state.startTime);
        const successCount = state.results.length;
        const errorCount = state.errors.length;

        // 결과 저장 (Python이 읽을 수 있도록)
        localStorage.setItem('MIDJOURNEY_COMPLETE', 'true');
        localStorage.setItem('MIDJOURNEY_RESULTS', JSON.stringify(state.results));
        localStorage.setItem('MIDJOURNEY_ERRORS', JSON.stringify(state.errors));
        localStorage.setItem('MIDJOURNEY_COMPLETE_TIME', new Date().toISOString());

        // UI 업데이트
        updateUI();

        addStatus(`━━━━━━━━━━━━━━━━━━━━━━`, 'info');
        addStatus(`🎉 자동화 완료!`, 'success');
        addStatus(`소요 시간: ${duration}`, 'info');
        addStatus(`✅ 성공: ${successCount}개`, 'success');
        if (errorCount > 0) {
            addStatus(`❌ 실패: ${errorCount}개`, 'error');
        }

        // 알림 (권한 있으면)
        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                title: 'Midjourney 자동화 완료',
                text: `${successCount}개 이미지 생성 완료 (${duration})`,
                timeout: 5000
            });
        }
    }

    // ============================================================================
    // 🎨 UI 생성
    // ============================================================================

    function createUI() {
        // 기존 UI 제거
        const existingUI = document.getElementById('mj-automation-panel');
        if (existingUI) existingUI.remove();

        const panel = document.createElement('div');
        panel.id = 'mj-automation-panel';
        panel.innerHTML = `
            <style>
                #mj-automation-panel {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 380px;
                    max-height: 600px;
                    background: ${CONFIG.COLORS.bg};
                    border: 1px solid ${CONFIG.COLORS.primary}40;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    z-index: 99999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    overflow: hidden;
                }

                #mj-header {
                    background: linear-gradient(135deg, ${CONFIG.COLORS.primary}, #ea580c);
                    padding: 12px 16px;
                    cursor: move;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                #mj-header h3 {
                    margin: 0;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                }

                #mj-minimize-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 0 4px;
                }

                #mj-body {
                    padding: 16px;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .mj-section {
                    margin-bottom: 16px;
                }

                .mj-section-title {
                    font-size: 11px;
                    font-weight: 600;
                    color: ${CONFIG.COLORS.primary};
                    text-transform: uppercase;
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                }

                .mj-input-group {
                    margin-bottom: 12px;
                }

                .mj-input-group label {
                    display: block;
                    font-size: 12px;
                    color: #999;
                    margin-bottom: 4px;
                }

                .mj-input-group select,
                .mj-input-group textarea {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #333;
                    border-radius: 6px;
                    background: ${CONFIG.COLORS.bgLight};
                    color: white;
                    font-size: 13px;
                }

                .mj-input-group textarea {
                    height: 80px;
                    resize: vertical;
                    font-family: monospace;
                }

                .mj-btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-right: 8px;
                    margin-bottom: 8px;
                }

                .mj-btn-primary {
                    background: ${CONFIG.COLORS.primary};
                    color: white;
                }

                .mj-btn-primary:hover {
                    background: #ea580c;
                    transform: translateY(-1px);
                }

                .mj-btn-secondary {
                    background: #333;
                    color: white;
                }

                .mj-btn-secondary:hover {
                    background: #444;
                }

                .mj-btn-danger {
                    background: ${CONFIG.COLORS.error};
                    color: white;
                }

                .mj-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                #mj-progress-bar {
                    width: 100%;
                    height: 8px;
                    background: #333;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                #mj-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, ${CONFIG.COLORS.primary}, ${CONFIG.COLORS.success});
                    width: 0%;
                    transition: width 0.3s;
                }

                #mj-progress-text {
                    font-size: 12px;
                    color: #999;
                    text-align: center;
                }

                #mj-status-log {
                    max-height: 200px;
                    overflow-y: auto;
                    background: #0a0a0f;
                    border-radius: 6px;
                    padding: 8px;
                }

                .mj-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .mj-badge-success { background: ${CONFIG.COLORS.success}30; color: ${CONFIG.COLORS.success}; }
                .mj-badge-error { background: ${CONFIG.COLORS.error}30; color: ${CONFIG.COLORS.error}; }
                .mj-badge-running { background: ${CONFIG.COLORS.primary}30; color: ${CONFIG.COLORS.primary}; }
            </style>

            <div id="mj-header">
                <h3>🎨 Midjourney 자동화</h3>
                <button id="mj-minimize-btn">−</button>
            </div>

            <div id="mj-body">
                <!-- 설정 섹션 -->
                <div class="mj-section">
                    <div class="mj-section-title">⚙️ 설정</div>

                    <div class="mj-input-group">
                        <label>화면 비율</label>
                        <select id="mj-aspect-ratio">
                            <option value="9:16" selected>Portrait 9:16 (숏폼)</option>
                            <option value="16:9">Landscape 16:9 (롱폼)</option>
                            <option value="1:1">Square 1:1</option>
                        </select>
                    </div>

                    <div class="mj-input-group">
                        <label>버전</label>
                        <select id="mj-version">
                            <option value="v7">v7 (사실적)</option>
                            <option value="niji 6" selected>niji 6 (애니/일러스트)</option>
                        </select>
                    </div>
                </div>

                <!-- 프롬프트 입력 -->
                <div class="mj-section">
                    <div class="mj-section-title">📝 프롬프트 (Python 또는 직접 입력)</div>
                    <div class="mj-input-group">
                        <textarea id="mj-prompts-input" placeholder="프롬프트를 한 줄에 하나씩 입력하세요.&#10;&#10;또는 Python에서 localStorage로 전달하면 자동으로 로드됩니다."></textarea>
                    </div>
                    <button id="mj-load-prompts" class="mj-btn mj-btn-secondary">localStorage에서 로드</button>
                </div>

                <!-- 진행 상황 -->
                <div class="mj-section" id="mj-progress-section" style="display: none;">
                    <div class="mj-section-title">📊 진행 상황</div>
                    <div id="mj-progress-bar">
                        <div id="mj-progress-fill"></div>
                    </div>
                    <div id="mj-progress-text">0 / 0</div>
                </div>

                <!-- 컨트롤 버튼 -->
                <div class="mj-section">
                    <div class="mj-section-title">🎮 컨트롤</div>
                    <button id="mj-start-btn" class="mj-btn mj-btn-primary">▶️ 시작</button>
                    <button id="mj-pause-btn" class="mj-btn mj-btn-secondary" disabled>⏸️ 일시정지</button>
                    <button id="mj-stop-btn" class="mj-btn mj-btn-danger" disabled>⏹️ 중지</button>
                </div>

                <!-- 상태 로그 -->
                <div class="mj-section">
                    <div class="mj-section-title">📋 로그</div>
                    <div id="mj-status-log"></div>
                </div>

                <!-- 결과 요약 -->
                <div class="mj-section" id="mj-results-section" style="display: none;">
                    <div class="mj-section-title">📈 결과</div>
                    <div id="mj-results-summary"></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // 이벤트 리스너 등록
        setupEventListeners();

        // 드래그 가능하게
        makeDraggable(panel, document.getElementById('mj-header'));

        // 초기 상태 로드
        loadFromLocalStorage();

        addStatus('Midjourney 자동화 패널 준비됨', 'success');
    }

    // ============================================================================
    // 🖱️ 이벤트 리스너
    // ============================================================================

    function setupEventListeners() {
        // 시작 버튼
        document.getElementById('mj-start-btn').addEventListener('click', () => {
            // 직접 입력된 프롬프트 확인
            const textarea = document.getElementById('mj-prompts-input');
            const inputText = textarea.value.trim();

            if (inputText) {
                // 줄바꿈으로 분리
                const prompts = inputText.split('\n')
                    .map(p => p.trim())
                    .filter(p => p.length > 0);

                if (prompts.length > 0) {
                    localStorage.setItem('MIDJOURNEY_PROMPTS', JSON.stringify(prompts));
                }
            }

            // 설정 저장
            const settings = {
                aspectRatio: document.getElementById('mj-aspect-ratio').value,
                version: document.getElementById('mj-version').value,
                speed: 'Relax' // 항상 Relax
            };
            localStorage.setItem('MIDJOURNEY_SETTINGS', JSON.stringify(settings));

            startAutomation();
        });

        // 일시정지 버튼
        document.getElementById('mj-pause-btn').addEventListener('click', () => {
            state.isPaused = !state.isPaused;
            const btn = document.getElementById('mj-pause-btn');
            btn.textContent = state.isPaused ? '▶️ 재개' : '⏸️ 일시정지';
            addStatus(state.isPaused ? '일시정지됨' : '재개됨', 'warning');
        });

        // 중지 버튼
        document.getElementById('mj-stop-btn').addEventListener('click', () => {
            state.isRunning = false;
            addStatus('중지 요청됨...', 'warning');
        });

        // localStorage 로드 버튼
        document.getElementById('mj-load-prompts').addEventListener('click', () => {
            loadFromLocalStorage();
        });

        // 최소화 버튼
        document.getElementById('mj-minimize-btn').addEventListener('click', () => {
            const body = document.getElementById('mj-body');
            const btn = document.getElementById('mj-minimize-btn');

            if (body.style.display === 'none') {
                body.style.display = 'block';
                btn.textContent = '−';
            } else {
                body.style.display = 'none';
                btn.textContent = '+';
            }
        });
    }

    // localStorage에서 프롬프트 로드
    function loadFromLocalStorage() {
        const promptsJson = localStorage.getItem('MIDJOURNEY_PROMPTS');
        const settingsJson = localStorage.getItem('MIDJOURNEY_SETTINGS');

        if (promptsJson) {
            try {
                const prompts = JSON.parse(promptsJson);
                document.getElementById('mj-prompts-input').value = prompts.join('\n');
                addStatus(`${prompts.length}개 프롬프트 로드됨`, 'success');
            } catch (e) {
                addStatus('프롬프트 로드 실패', 'error');
            }
        }

        if (settingsJson) {
            try {
                const settings = JSON.parse(settingsJson);
                if (settings.aspectRatio) {
                    document.getElementById('mj-aspect-ratio').value = settings.aspectRatio;
                }
                if (settings.version) {
                    document.getElementById('mj-version').value = settings.version;
                }
                addStatus('설정 로드됨', 'info');
            } catch (e) {}
        }
    }

    // ============================================================================
    // 📊 UI 업데이트
    // ============================================================================

    function updateProgress() {
        const progressSection = document.getElementById('mj-progress-section');
        const progressFill = document.getElementById('mj-progress-fill');
        const progressText = document.getElementById('mj-progress-text');

        progressSection.style.display = 'block';

        const percent = state.totalPrompts > 0
            ? ((state.currentPromptIndex + 1) / state.totalPrompts * 100)
            : 0;

        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${state.currentPromptIndex + 1} / ${state.totalPrompts}`;
    }

    function updateUI() {
        const startBtn = document.getElementById('mj-start-btn');
        const pauseBtn = document.getElementById('mj-pause-btn');
        const stopBtn = document.getElementById('mj-stop-btn');

        if (state.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            startBtn.textContent = '⏳ 실행 중...';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            startBtn.textContent = '▶️ 시작';
        }

        // 결과 표시
        if (state.results.length > 0 || state.errors.length > 0) {
            const resultsSection = document.getElementById('mj-results-section');
            const resultsSummary = document.getElementById('mj-results-summary');

            resultsSection.style.display = 'block';
            resultsSummary.innerHTML = `
                <span class="mj-badge mj-badge-success">성공: ${state.results.length}</span>
                ${state.errors.length > 0 ? `<span class="mj-badge mj-badge-error">실패: ${state.errors.length}</span>` : ''}
            `;
        }
    }

    // ============================================================================
    // 🖱️ 드래그 기능
    // ============================================================================

    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    

    // ============================================================================
    // 🚀 초기화
    // ============================================================================

    function init() {
        // 페이지 로드 후 UI 생성
        if (document.readyState === 'complete') {
            setTimeout(createUI, 1000);
        } else {
            window.addEventListener('load', () => setTimeout(createUI, 1000));
        }
    }

    init();

})();


// test
