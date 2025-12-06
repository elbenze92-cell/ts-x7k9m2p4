// ==UserScript==
// @name         !music Suno 생성 다운 (Python 연동) v3.0
// @namespace    https://atobro.com/
// @version      1.0.2
// @description  Suno 음악 생성 완전 자동화 - 생성, 완료 감지, 다운로드, Python 연동
// @author       Atobro
// @match        https://suno.com/*
// @updateURL    https://raw.githubusercontent.com/elbenze92-cell/ts-x7k9m2p4/main/suno.user.js
// @downloadURL  https://raw.githubusercontent.com/elbenze92-cell/ts-x7k9m2p4/main/suno.user.js
// @icon         https://suno.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🎵 Suno 자동화 v3.0 시작');

    // ============================================================================
    // 🔧 설정
    // ============================================================================
    const CONFIG = {
        // 타이밍 (ms)
        POLL_INTERVAL: 2000,           // 2초마다 상태 체크
        MAX_GENERATION_WAIT: 300000,   // 최대 5분 대기 (곡당)
        BETWEEN_SONGS_DELAY: 5000,     // 곡 사이 대기 5초
        DOWNLOAD_DELAY: 500,           // 다운로드 간격 0.5초
        PAGE_LOAD_WAIT: 3000,          // 페이지 로드 대기

        // UI 색상
        COLORS: {
            primary: '#8b5cf6',
            secondary: '#667eea',
            success: '#22c55e',
            error: '#ef4444',
            warning: '#eab308',
            bg: '#1a1a2e',
            bgLight: '#2a2a3e',
            text: '#ffffff'
        },

        // 시간 패턴 (완료 감지용)
        TIME_PATTERN: /^\d+:\d{2}$/
    };

    // ============================================================================
    // 🗄️ 전역 상태
    // ============================================================================
    let state = {
        isRunning: false,
        isPaused: false,
        currentSongIndex: 0,
        totalSongs: 0,
        songs: [],
        generatedSongs: [],      // 생성 완료된 곡들
        downloadedFiles: [],     // 다운로드된 파일들
        startTime: null,
        errors: [],
        previousSongCount: 0,    // 이전 곡 수 (새 곡 감지용)
        clipMap: [],             // clip_id ↔ 곡 정보 매핑 (동시실행 지원)
        pendingClipIds: [],      // 방금 생성 요청한 clip_id들 (fetch에서 캡처)
        currentChannel: null     // 현재 작업 중인 채널 식별자
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

    // clip_id 정규화 (UUID 형식 처리)
    function normalizeClipId(clipId) {
        if (!clipId) return clipId;
        
        // UUID 형식: 8-4-4-4-12
        const match = clipId.match(/^([a-f0-9]{8})/i);
        if (match) return match[1].toLowerCase();
        
        return clipId.toLowerCase();
    }

    // ============================================================================
    // 🔗 Fetch 가로채기 (clip_id 캡처 + 상태 업데이트)
    // ============================================================================
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        try {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

            // v2?ids= 응답 가로채기 (생성 요청 및 상태 폴링)
            if (url.includes('/api/feed/v2') || url.includes('v2?ids=')) {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();

                if (data.clips && Array.isArray(data.clips)) {
                    data.clips.forEach(clip => {
                        const clipId = normalizeClipId(clip.id);
                        
                        // 기존 clipMap에서 해당 clip 찾기
                        const existingIndex = state.clipMap.findIndex(c => c.clipId === clipId);

                        const clipInfo = {
                            clipId: clipId,
                            title: clip.title || 'untitled',
                            status: clip.status,
                            audioUrl: clip.audio_url || '',
                            imageUrl: clip.image_url || '',
                            duration: clip.metadata?.duration || 0,
                            channel: state.currentChannel || 'default',
                            timestamp: Date.now(),
                            batchIndex: clip.batch_index
                        };

                        if (existingIndex >= 0) {
                            // 기존 항목 업데이트 (batchIndex는 처음 값 유지)
                            state.clipMap[existingIndex] = {
                                ...state.clipMap[existingIndex],
                                ...clipInfo,
                                batchIndex: state.clipMap[existingIndex].batchIndex ?? clipInfo.batchIndex
                            };
                        } else {
                            // 새 항목 추가
                            state.clipMap.push(clipInfo);
                            state.pendingClipIds.push(clipId);
                        }

                        // 완료된 곡이면 로그
                        if (clip.status === 'complete' && clip.audio_url) {
                            console.log(`[Suno Fetch] 곡 완료: ${clipId.substring(0, 8)}... - ${clip.title}`);
                        }
                    });
                }
            }
        } catch (e) {
            // JSON 파싱 실패 등은 무시
        }

        return response;
    };

    // ============================================================================
    // 📝 로그 시스템
    // ============================================================================
    function addStatus(message, type = 'info') {
        const statusLog = document.getElementById('suno-status-log');
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

        console.log(`[Suno Auto] ${icons[type]} ${message}`);
    }

    // ============================================================================
    // 🎯 셀렉터 및 요소 찾기
    // ============================================================================

    // 다양한 셀렉터로 요소 찾기
    function findElement(selectors) {
        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element) return element;
            } catch (e) {}
        }
        return null;
    }

    // 제목 입력 필드
    function getTitleInput() {
        return findElement([
            'input[placeholder*="Song Title" i]',
            'input[placeholder*="title" i]',
            'input[type="text"][class*="title" i]'
        ]);
    }

    // 스타일 입력 필드
    function getStyleTextarea() {
        return findElement([
            'textarea[placeholder*="indie, electronic" i]',
            'textarea[placeholder*="120bpm" i]',
            'textarea[placeholder*="distorted" i]',
            'textarea[maxlength="1000"]',
            'textarea[placeholder*="style" i]',
            'textarea[placeholder*="genre" i]'
        ]);
    }

    // 가사 입력 필드
    function getLyricsTextarea() {
        return findElement([
            'textarea[placeholder*="Write some lyrics" i]',
            'textarea[placeholder*="instrumental" i]',
            'textarea[placeholder*="lyrics" i]'
        ]);
    }

    // Create 버튼
    function getCreateButton() {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase() || '';
            if ((text.includes('create') || text.includes('generate')) && btn.offsetParent !== null) {
                return btn;
            }
        }
        return null;
    }

    // ============================================================================
    // 📊 생성 완료 감지
    // ============================================================================

    // 현재 페이지의 곡 수 카운트 (시간 표시 있는 것만)
    function countCompletedSongs() {
        let count = 0;
        const allElements = document.querySelectorAll('*');

        for (const el of allElements) {
            const text = el.textContent?.trim();
            if (text && CONFIG.TIME_PATTERN.test(text) && el.offsetParent !== null) {
                // 부모 요소가 곡 카드인지 확인 (중복 카운트 방지)
                const parent = el.closest('[class*="hover"]') || el.parentElement;
                if (parent && !parent.dataset.counted) {
                    parent.dataset.counted = 'true';
                    count++;
                }
            }
        }

        // counted 플래그 초기화
        document.querySelectorAll('[data-counted]').forEach(el => {
            delete el.dataset.counted;
        });

        return count;
    }

    // 새 곡이 생성되었는지 확인
    function hasNewSongGenerated() {
        const currentCount = countCompletedSongs();
        if (currentCount > state.previousSongCount) {
            state.previousSongCount = currentCount;
            return true;
        }
        return false;
    }

    // 생성 완료 대기 (스냅샷 기반, 하드코딩 제거)
    async function waitForGeneration(songIndex) {
        const startTime = Date.now();
        let lastLogTime = 0;

        addStatus(`곡 ${songIndex + 1} 생성 대기 중...`, 'progress');

        // 생성 시작 전 clipMap 스냅샷 (새 clip만 감지하기 위해)
        const beforeClipIds = new Set(state.clipMap.map(c => c.clipId));
        
        // fallback용: 현재 곡 수 기록
        const beforeSongCount = countCompletedSongs();

        while (Date.now() - startTime < CONFIG.MAX_GENERATION_WAIT) {
            // 1. 새로 추가된 완료 clip 확인 (스냅샷 기반)
            const newCompleteClips = state.clipMap.filter(c => 
                !beforeClipIds.has(c.clipId) && 
                c.status === 'complete' && 
                c.audioUrl
            );
            
            const elapsed = Date.now() - startTime;
            
            // 최소 10초 대기 후 1곡 이상 완료되면 OK (또는 즉시 2곡 완료)
            if (newCompleteClips.length >= 2) {
                addStatus(`곡 ${songIndex + 1} 생성 완료! (${newCompleteClips.length}곡)`, 'success');
                
                // pendingClipIds 정리
                newCompleteClips.forEach(clip => {
                    const idx = state.pendingClipIds.indexOf(clip.clipId);
                    if (idx >= 0) state.pendingClipIds.splice(idx, 1);
                });
                
                return true;
            }
            
            if (elapsed > 10000 && newCompleteClips.length > 0) {
                addStatus(`곡 ${songIndex + 1} 생성 완료! (${newCompleteClips.length}곡, 10초+ 경과)`, 'success');
                
                // pendingClipIds 정리
                newCompleteClips.forEach(clip => {
                    const idx = state.pendingClipIds.indexOf(clip.clipId);
                    if (idx >= 0) state.pendingClipIds.splice(idx, 1);
                });
                
                return true;
            }

            // 2. fallback: DOM 기반 확인
            const currentSongCount = countCompletedSongs();
            if (currentSongCount > beforeSongCount) {
                addStatus(`곡 ${songIndex + 1} 생성 완료! (DOM 감지)`, 'success');
                return true;
            }

            // 30초마다 상태 로그
            if (elapsed - lastLogTime >= 30000) {
                const pendingCount = state.clipMap.filter(c =>
                    c.status === 'queued' || c.status === 'streaming'
                ).length;
                addStatus(`대기 중... (${Math.floor(elapsed / 1000)}초, 새 곡: ${newCompleteClips.length}, 대기: ${pendingCount})`, 'progress');
                lastLogTime = elapsed;
            }

            await sleep(CONFIG.POLL_INTERVAL);
        }

        addStatus(`곡 ${songIndex + 1} 생성 타임아웃`, 'warning');
        return false;
    }

    // ============================================================================
    // ⌨️ 입력 함수
    // ============================================================================

    // Input 필드에 텍스트 입력
    async function inputToField(element, text) {
        if (!element || !text) return false;

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        element.click();
        await sleep(100);

        // 기존 내용 삭제
        element.select();
        document.execCommand('selectAll');
        document.execCommand('delete');
        element.value = '';
        await sleep(100);

        // React 방식으로 값 설정
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            element.tagName === 'TEXTAREA'
                ? window.HTMLTextAreaElement.prototype
                : window.HTMLInputElement.prototype,
            'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, text);
        } else {
            element.value = text;
        }

        // 이벤트 발생
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        await sleep(200);

        const success = element.value === text;
        return success;
    }

    // 곡 데이터 입력
    async function inputSongData(song) {
        let successCount = 0;

        // 1. 제목 입력
        const titleInput = getTitleInput();
        if (titleInput && song.title) {
            const success = await inputToField(titleInput, song.title);
            if (success) {
                addStatus(`제목 입력: ${song.title.substring(0, 30)}...`, 'info');
                successCount++;
            }
        }
        await sleep(300);

        // 2. 스타일 입력
        const styleTextarea = getStyleTextarea();
        if (styleTextarea && song.style) {
            const success = await inputToField(styleTextarea, song.style);
            if (success) {
                addStatus(`스타일 입력 완료`, 'info');
                successCount++;
            }
        }
        await sleep(300);

        // 3. 가사 입력 (있는 경우)
        if (song.lyrics) {
            const lyricsTextarea = getLyricsTextarea();
            if (lyricsTextarea) {
                const success = await inputToField(lyricsTextarea, song.lyrics);
                if (success) {
                    addStatus(`가사 입력 완료`, 'info');
                    successCount++;
                }
            }
        }

        return successCount >= 2; // 최소 제목 + 스타일
    }

    // Create 버튼 클릭
    async function clickCreateButton() {
        const createBtn = getCreateButton();
        if (createBtn) {
            createBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(200);
            createBtn.click();
            addStatus('Create 버튼 클릭', 'success');
            return true;
        }
        addStatus('Create 버튼을 찾을 수 없음', 'error');
        return false;
    }

    // ============================================================================
    // 💾 다운로드 함수 (기존 로직 활용)
    // ============================================================================

    // Blob 다운로드
    async function downloadBlob(url, fileName) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(a.href);
            document.body.removeChild(a);

            return true;
        } catch (error) {
            console.error('Download error:', error);
            return false;
        }
    }

    // ============================================================================
    // 💾 CDN 직접 다운로드 (clip_id 기반)
    // ============================================================================

    // clip_id로 CDN URL 생성 (정규화 후)
    function getAudioUrlFromClipId(clipId) {
        const normalizedId = normalizeClipId(clipId);
        return `https://cdn1.suno.ai/${normalizedId}.mp3`;
    }

    // clipMap에서 완료된 곡들 다운로드
    async function downloadFromClipMap(channelFilter = null) {
        addStatus('━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addStatus('📥 CDN 직접 다운로드 시작...', 'progress');

        const targetClips = channelFilter
            ? state.clipMap.filter(c => c.channel === channelFilter && c.status === 'complete')
            : state.clipMap.filter(c => c.status === 'complete');

        addStatus(`다운로드 대상: ${targetClips.length}곡`, 'info');

        let successCount = 0;
        const downloadedFiles = [];

        for (let i = 0; i < targetClips.length; i++) {
            const clip = targetClips[i];

            // audio_url이 있으면 사용, 없으면 CDN 패턴으로 생성
            const audioUrl = clip.audioUrl || getAudioUrlFromClipId(clip.clipId);
            const safeTitle = (clip.title || 'untitled').replace(/[\/\\:*?"<>|]/g, '_').trim();
            const fileName = `${safeTitle}_${clip.batchIndex || 0}_${clip.clipId.substring(0, 8)}.mp3`;

            addStatus(`[${i + 1}/${targetClips.length}] 다운로드: ${fileName}`, 'info');

            const success = await downloadBlob(audioUrl, fileName);

            if (success) {
                successCount++;
                downloadedFiles.push({
                    clipId: clip.clipId,
                    fileName,
                    title: clip.title,
                    audioUrl,
                    channel: clip.channel,
                    duration: clip.duration,
                    batchIndex: clip.batchIndex
                });
            } else {
                addStatus(`다운로드 실패: ${fileName}`, 'error');
            }

            await sleep(CONFIG.DOWNLOAD_DELAY);
        }

        addStatus(`✅ 다운로드 완료: ${successCount}/${targetClips.length}곡`, 'success');

        return downloadedFiles;
    }

    // 특정 clip_id들만 다운로드
    async function downloadByClipIds(clipIds) {
        addStatus(`📥 ${clipIds.length}개 곡 다운로드 시작...`, 'progress');

        const downloadedFiles = [];

        for (let i = 0; i < clipIds.length; i++) {
            const clipId = clipIds[i];
            const clipInfo = state.clipMap.find(c => c.clipId === clipId);

            const audioUrl = clipInfo?.audioUrl || getAudioUrlFromClipId(clipId);
            const title = clipInfo?.title || 'untitled';
            const safeTitle = title.replace(/[\/\\:*?"<>|]/g, '_').trim();
            const fileName = `${safeTitle}_${clipInfo?.batchIndex || 0}_${clipId.substring(0, 8)}.mp3`;

            addStatus(`[${i + 1}/${clipIds.length}] ${fileName}`, 'info');

            const success = await downloadBlob(audioUrl, fileName);

            if (success) {
                downloadedFiles.push({
                    clipId,
                    fileName,
                    title,
                    audioUrl,
                    channel: clipInfo?.channel || 'unknown'
                });
            }

            await sleep(CONFIG.DOWNLOAD_DELAY);
        }

        return downloadedFiles;
    }

    // ============================================================================
    // 🗂️ [LEGACY] Library 페이지 다운로드 (CDN 직접 다운로드 실패 시 fallback)
    // TODO: CDN 직접 다운로드 안정화 확인 후 삭제 예정
    // ============================================================================

    /*
    // 다음 페이지 버튼 찾기
    function getNextPageButton() {
        // 오른쪽 화살표 버튼 찾기 (aria-label이 없거나 빈 문자열인 것)
        const buttons = document.querySelectorAll('button.rounded-full');

        for (const btn of buttons) {
            const ariaLabel = btn.getAttribute('aria-label');
            const svg = btn.querySelector('svg path');

            // 오른쪽 화살표 SVG 패턴: "M9 7.343" (왼쪽은 "M15 16.657")
            if (svg && svg.getAttribute('d')?.startsWith('M9')) {
                // disabled 상태가 아닌지 확인
                if (!btn.disabled && !btn.classList.contains('disabled')) {
                    return btn;
                }
            }
        }

        return null;
    }

    // 현재 페이지 번호 가져오기
    function getCurrentPageNumber() {
        const pageSpan = document.querySelector('span.text-center.font-sans.text-base');
        return pageSpan ? parseInt(pageSpan.textContent) : 1;
    }

    // 현재 페이지의 곡들 다운로드
    async function downloadCurrentPage(downloadedUrls, titleCount, allDownloadedFiles) {
        let successCount = 0;
        let skippedCount = 0;
        const newUrls = [];

        // Grid 찾기
        const gridElement = document.querySelector('[role="grid"]');
        if (!gridElement) {
            addStatus('곡 목록을 찾을 수 없습니다', 'error');
            return { successCount, skippedCount, newUrls };
        }

        // React Props에서 데이터 추출
        const reactPropsKey = Object.keys(gridElement).find(k => k.startsWith('__reactProps$'));
        if (!reactPropsKey) {
            addStatus('React props를 찾을 수 없습니다', 'error');
            return { successCount, skippedCount, newUrls };
        }

        const gridProps = gridElement[reactPropsKey];
        const collection = gridProps?.children?.[0]?.props?.values?.[0]?.[1]?.collection;

        if (!collection) {
            addStatus('곡 데이터를 찾을 수 없습니다', 'error');
            return { successCount, skippedCount, newUrls };
        }

        const items = [...collection];
        const rows = document.querySelectorAll('[role="grid"] [role="row"]');

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const row = rows[i];

            if (!item?.value?.audio_url || !row) continue;

            const audioUrl = item.value.audio_url;

            // URL 기반 중복 체크
            if (downloadedUrls.has(audioUrl)) {
                skippedCount++;
                continue;
            }

            // 제목 추출
            const titleElement = row.querySelector('span.hover\\:underline.cursor-pointer');
            const title = titleElement?.innerText || `song_${allDownloadedFiles.length + 1}`;
            const safeTitle = title.replace(/[\/\\:*?"<>|]/g, '_').trim();

            // 전역 제목 카운트로 그룹 분리 (_1, _2)
            if (titleCount[safeTitle]) {
                titleCount[safeTitle]++;
            } else {
                titleCount[safeTitle] = 1;
            }

            // 파일명: 제목_그룹번호.mp3 (같은 제목이면 _1, _2로 구분)
            const groupNumber = titleCount[safeTitle];
            const fileName = `${safeTitle}_${groupNumber}.mp3`;

            addStatus(`다운로드: ${fileName}`, 'info');

            if (await downloadBlob(audioUrl, fileName)) {
                successCount++;
                newUrls.push(audioUrl);
                allDownloadedFiles.push({
                    fileName,
                    title: safeTitle,
                    audioUrl,
                    group: groupNumber,  // 1 또는 2 (롱폼 영상 그룹)
                    originalTitle: title
                });
            }

            await sleep(CONFIG.DOWNLOAD_DELAY);
        }

        return { successCount, skippedCount, newUrls };
    }

    // Library에서 모든 곡 다운로드 (다중 페이지 지원)
    async function downloadFromLibrary() {
        addStatus('━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addStatus('📥 Library 다중 페이지 다운로드 시작...', 'progress');

        // URL 기반 중복 체크 (저장된 기록)
        const downloadedUrls = new Set(GM_getValue('downloadedUrls', []));
        const titleCount = {};  // 전역 제목 카운트 (그룹 분리용)
        const allDownloadedFiles = [];
        const allNewUrls = [];

        let totalSuccess = 0;
        let totalSkipped = 0;
        let pageCount = 0;
        const maxPages = Math.ceil(state.totalSongs / 20) + 1;  // 예상 페이지 수 + 여유

        addStatus(`예상 페이지 수: ${maxPages}페이지 (${state.totalSongs}곡)`, 'info');

        // 페이지 순회
        while (pageCount < maxPages) {
            pageCount++;
            const currentPage = getCurrentPageNumber();

            addStatus(`📄 ${currentPage}페이지 처리 중...`, 'progress');

            // 현재 페이지 다운로드
            const result = await downloadCurrentPage(downloadedUrls, titleCount, allDownloadedFiles);

            totalSuccess += result.successCount;
            totalSkipped += result.skippedCount;
            allNewUrls.push(...result.newUrls);

            // 새로 다운로드한 URL들을 Set에 추가 (다음 페이지에서 중복 방지)
            result.newUrls.forEach(url => downloadedUrls.add(url));

            addStatus(`   ✅ ${result.successCount}개 다운, ${result.skippedCount}개 건너뜀`, 'info');

            // 충분히 다운로드했는지 확인
            if (allDownloadedFiles.length >= state.totalSongs) {
                addStatus('목표 곡 수 도달!', 'success');
                break;
            }

            // 다음 페이지 버튼 확인
            const nextBtn = getNextPageButton();

            if (!nextBtn) {
                addStatus('마지막 페이지 도달', 'info');
                break;
            }

            // 다음 페이지로 이동
            addStatus('다음 페이지로 이동...', 'info');
            nextBtn.click();

            // 페이지 로드 대기
            await sleep(2000);

            // 페이지가 실제로 변경되었는지 확인
            let waitCount = 0;
            while (getCurrentPageNumber() === currentPage && waitCount < 10) {
                await sleep(500);
                waitCount++;
            }

            if (getCurrentPageNumber() === currentPage) {
                addStatus('페이지 변경 실패, 중단', 'warning');
                break;
            }

            await sleep(1000);  // 추가 안정화 대기
        }

        // 다운로드 기록 저장
        if (allNewUrls.length > 0) {
            const existingUrls = GM_getValue('downloadedUrls', []);
            const updated = [...new Set([...existingUrls, ...allNewUrls])];
            GM_setValue('downloadedUrls', updated);
            addStatus(`다운로드 기록 저장: 총 ${updated.length}개`, 'info');
        }

        // 그룹별 통계
        const group1 = allDownloadedFiles.filter(f => f.group === 1);
        const group2 = allDownloadedFiles.filter(f => f.group === 2);

        addStatus('━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addStatus(`🎉 다운로드 완료!`, 'success');
        addStatus(`   📊 총 ${totalSuccess}개 다운, ${totalSkipped}개 건너뜀`, 'info');
        addStatus(`   📁 그룹1 (롱폼A): ${group1.length}곡`, 'info');
        addStatus(`   📁 그룹2 (롱폼B): ${group2.length}곡`, 'info');

        return allDownloadedFiles;
    }
    */

    // [LEGACY END] - CDN 직접 다운로드 안정화 후 위 주석 블록 삭제

    // ============================================================================
    // 🚀 메인 자동화 로직
    // ============================================================================

    async function startAutomation() {
        // localStorage에서 데이터 로드
        const songsJson = localStorage.getItem('SUNO_SONGS');

        if (!songsJson) {
            addStatus('곡 데이터가 없습니다. Python에서 먼저 전달해주세요.', 'error');
            return;
        }

        try {
            state.songs = JSON.parse(songsJson);
        } catch (e) {
            addStatus('JSON 파싱 오류', 'error');
            return;
        }

        state.totalSongs = state.songs.length;
        state.isRunning = true;
        state.currentSongIndex = 0;
        state.generatedSongs = [];
        state.startTime = Date.now();
        state.errors = [];
        state.previousSongCount = countCompletedSongs();
        state.clipMap = [];              // clipMap 초기화
        state.pendingClipIds = [];       // pendingClipIds 초기화

        // 채널 정보 설정 (Python에서 전달하거나 기본값 사용)
        state.currentChannel = localStorage.getItem('SUNO_CHANNEL') || 'default';

        // 초기화
        localStorage.removeItem('SUNO_COMPLETE');
        localStorage.removeItem('SUNO_RESULTS');

        updateUI();
        addStatus(`🚀 자동화 시작: ${state.totalSongs}곡 (채널: ${state.currentChannel})`, 'success');

        // Create 페이지 확인
        if (!window.location.href.includes('/create')) {
            addStatus('Create 페이지로 이동합니다...', 'info');
            window.location.href = 'https://suno.com/create';
            return; // 페이지 로드 후 다시 시작됨
        }

        await sleep(CONFIG.PAGE_LOAD_WAIT);

        // 곡 생성 루프
        for (let i = 0; i < state.totalSongs; i++) {
            if (!state.isRunning) {
                addStatus('사용자에 의해 중단됨', 'warning');
                break;
            }

            // 일시정지 체크
            while (state.isPaused && state.isRunning) {
                await sleep(500);
            }

            state.currentSongIndex = i;
            updateProgress();

            const song = state.songs[i];
            addStatus(`━━━━━━━━━━━━━━━━━━━━━━`, 'info');
            addStatus(`🎵 [${i + 1}/${state.totalSongs}] ${song.title?.substring(0, 30)}...`, 'progress');

            try {
                // 1. 곡 데이터 입력
                const inputSuccess = await inputSongData(song);
                if (!inputSuccess) {
                    addStatus('입력 실패, 건너뜀', 'warning');
                    state.errors.push({ index: i, error: '입력 실패' });
                    continue;
                }

                await sleep(1000);

                // 2. Create 버튼 클릭
                const createSuccess = await clickCreateButton();
                if (!createSuccess) {
                    state.errors.push({ index: i, error: 'Create 버튼 없음' });
                    continue;
                }

                // 3. 생성 완료 대기
                const generated = await waitForGeneration(i);
                if (generated) {
                    state.generatedSongs.push({
                        index: i,
                        title: song.title,
                        style: song.style
                    });
                }

                // 다음 곡 전 대기
                if (i < state.totalSongs - 1) {
                    addStatus(`다음 곡까지 ${CONFIG.BETWEEN_SONGS_DELAY / 1000}초 대기...`, 'info');
                    await sleep(CONFIG.BETWEEN_SONGS_DELAY);
                }

            } catch (error) {
                addStatus(`오류: ${error.message}`, 'error');
                state.errors.push({ index: i, error: error.message });
            }
        }

        // 생성 완료 후 다운로드
        if (state.generatedSongs.length > 0) {
            await startDownloadPhase();
        }

        // 완료 처리
        completeAutomation();
    }

    // 다운로드 단계 (CDN 직접 다운로드)
    async function startDownloadPhase() {
        addStatus('━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addStatus('💾 다운로드 단계 시작...', 'progress');

        // clipMap에 완료된 곡이 있으면 CDN 직접 다운로드
        const completedClips = state.clipMap.filter(c => c.status === 'complete');

        if (completedClips.length > 0) {
            addStatus(`CDN 직접 다운로드: ${completedClips.length}곡`, 'info');
            state.downloadedFiles = await downloadFromClipMap(state.currentChannel);
            return;
        }

        // clipMap이 비어있으면 에러
        addStatus('clipMap 비어있음 - fetch 가로채기 실패?', 'error');
        addStatus('TODO: Library fallback 필요시 주석 해제', 'warning');

        /*
        // [LEGACY FALLBACK] - CDN 실패 시 Library 방식
        if (!window.location.href.includes('/library') && !window.location.href.includes('/me')) {
            addStatus('Library 페이지로 이동...', 'info');
            window.location.href = 'https://suno.com/me';
            localStorage.setItem('SUNO_PENDING_DOWNLOAD', 'true');
            localStorage.setItem('SUNO_CLIP_MAP', JSON.stringify(state.clipMap));
            return;
        }
        await sleep(CONFIG.PAGE_LOAD_WAIT);
        state.downloadedFiles = await downloadFromLibrary();
        */
    }

    // 완료 처리
    function completeAutomation() {
        state.isRunning = false;

        const duration = formatDuration(Date.now() - state.startTime);

        // 결과 저장
        const results = {
            generatedSongs: state.generatedSongs,
            downloadedFiles: state.downloadedFiles,
            errors: state.errors,
            totalSongs: state.totalSongs,
            successCount: state.generatedSongs.length,
            duration,
            timestamp: Date.now()
        };

        localStorage.setItem('SUNO_COMPLETE', 'true');
        localStorage.setItem('SUNO_RESULTS', JSON.stringify(results));
        localStorage.setItem('SUNO_CLIP_MAP', JSON.stringify(state.clipMap));

        // window 전역 변수로도 저장
        window.SUNO_COMPLETE = true;
        window.SUNO_RESULTS = results;
        window.SUNO_CLIP_MAP = state.clipMap;

        updateUI();

        addStatus('━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addStatus(`🎉 자동화 완료!`, 'success');
        addStatus(`⏱️ 소요 시간: ${duration}`, 'info');
        addStatus(`🎵 생성: ${state.generatedSongs.length}/${state.totalSongs}곡`, 'info');
        addStatus(`💾 다운로드: ${state.downloadedFiles.length}개`, 'info');

        if (state.errors.length > 0) {
            addStatus(`⚠️ 오류: ${state.errors.length}개`, 'warning');
        }

        // 알림
        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                title: 'Suno 자동화 완료',
                text: `${state.generatedSongs.length}곡 생성, ${state.downloadedFiles.length}개 다운로드`,
                timeout: 5000
            });
        }
    }

    // ============================================================================
    // 🎨 UI 생성
    // ============================================================================

    function createUI() {
        const existingPanel = document.getElementById('suno-automation-panel');
        if (existingPanel) existingPanel.remove();

        GM_addStyle(`
            #suno-automation-panel {
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

            .suno-header {
                background: linear-gradient(135deg, ${CONFIG.COLORS.primary}, ${CONFIG.COLORS.secondary});
                padding: 12px 16px;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .suno-header h3 { margin: 0; color: white; font-size: 14px; }

            .suno-body { padding: 16px; max-height: 500px; overflow-y: auto; }

            .suno-section { margin-bottom: 16px; }

            .suno-section-title {
                font-size: 11px; font-weight: 600; color: ${CONFIG.COLORS.primary};
                text-transform: uppercase; margin-bottom: 8px;
            }

            .suno-btn {
                padding: 10px 16px; border: none; border-radius: 6px;
                font-size: 13px; font-weight: 600; cursor: pointer;
                transition: all 0.2s; margin-right: 8px; margin-bottom: 8px;
                width: 100%;
            }

            .suno-btn-primary { background: ${CONFIG.COLORS.primary}; color: white; }
            .suno-btn-secondary { background: #333; color: white; }
            .suno-btn-danger { background: ${CONFIG.COLORS.error}; color: white; }
            .suno-btn-success { background: ${CONFIG.COLORS.success}; color: white; }
            .suno-btn:disabled { opacity: 0.5; cursor: not-allowed; }

            .suno-progress-bar {
                width: 100%; height: 8px; background: #333;
                border-radius: 4px; overflow: hidden; margin-bottom: 8px;
            }

            .suno-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, ${CONFIG.COLORS.primary}, ${CONFIG.COLORS.success});
                width: 0%; transition: width 0.3s;
            }

            .suno-progress-text { font-size: 12px; color: #999; text-align: center; }

            #suno-status-log {
                max-height: 200px; overflow-y: auto;
                background: #0a0a0f; border-radius: 6px; padding: 8px;
            }

            .suno-file-input {
                width: 100%; padding: 10px;
                border: 2px dashed ${CONFIG.COLORS.primary}40;
                border-radius: 6px; background: transparent;
                color: white; cursor: pointer; font-size: 12px;
                margin-bottom: 10px;
            }

            .suno-info {
                background: ${CONFIG.COLORS.bgLight};
                padding: 10px; border-radius: 6px;
                font-size: 12px; margin-bottom: 10px;
            }
        `);

        const panel = document.createElement('div');
        panel.id = 'suno-automation-panel';

        const isCreatePage = window.location.href.includes('/create');
        const isLibraryPage = window.location.href.includes('/library') || window.location.href.includes('/me');

        panel.innerHTML = `
            <div class="suno-header">
                <h3>🎵 Suno 자동화 v3.0</h3>
                <button id="suno-minimize-btn" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">−</button>
            </div>

            <div class="suno-body" id="suno-body">
                ${isCreatePage ? `
                <!-- Create 페이지용 UI -->
                <div class="suno-section">
                    <div class="suno-section-title">📁 데이터 입력</div>
                    <input type="file" class="suno-file-input" id="suno-file-upload" accept=".json">
                    <div class="suno-info" id="suno-data-info" style="display:none;">
                        <div id="suno-song-count">🎵 곡 수: 0</div>
                    </div>
                    <button id="suno-load-storage" class="suno-btn suno-btn-secondary">
                        localStorage에서 로드
                    </button>
                </div>

                <div class="suno-section" id="suno-progress-section" style="display:none;">
                    <div class="suno-section-title">📊 진행 상황</div>
                    <div class="suno-progress-bar">
                        <div class="suno-progress-fill" id="suno-progress-fill"></div>
                    </div>
                    <div class="suno-progress-text" id="suno-progress-text">0 / 0</div>
                </div>

                <div class="suno-section">
                    <div class="suno-section-title">🎮 컨트롤</div>
                    <button id="suno-start-btn" class="suno-btn suno-btn-primary" disabled>
                        데이터를 먼저 로드하세요
                    </button>
                    <button id="suno-pause-btn" class="suno-btn suno-btn-secondary" disabled>
                        ⏸️ 일시정지
                    </button>
                    <button id="suno-stop-btn" class="suno-btn suno-btn-danger" disabled>
                        ⏹️ 중지
                    </button>
                </div>
                ` : ''}

                ${isLibraryPage ? `
                <!-- Library 페이지용 UI -->
                <div class="suno-section">
                    <div class="suno-section-title">💾 다운로드 (다중 페이지)</div>

                    <div class="suno-info">
                        <div>📊 설정</div>
                        <label style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                            <span>목표 곡 수:</span>
                            <input type="number" id="suno-target-count" value="50" min="1" max="200"
                                   style="width:60px;padding:4px;border-radius:4px;border:1px solid #666;background:#333;color:white;">
                        </label>
                    </div>

                    <button id="suno-download-all" class="suno-btn suno-btn-success">
                        📥 다중 페이지 다운로드 (3페이지)
                    </button>

                    <div class="suno-info" id="suno-download-stats" style="display:none;">
                        <div>📁 그룹1 (롱폼A): <span id="group1-count">0</span>곡</div>
                        <div>📁 그룹2 (롱폼B): <span id="group2-count">0</span>곡</div>
                    </div>

                    <button id="suno-clear-history" class="suno-btn suno-btn-secondary">
                        🗑️ 다운로드 기록 초기화 (<span id="download-history-count">0</span>개)
                    </button>
                </div>
                ` : ''}

                <div class="suno-section">
                    <div class="suno-section-title">📋 로그</div>
                    <div id="suno-status-log"></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        setupEventListeners();
        makeDraggable(panel, panel.querySelector('.suno-header'));

        // 자동 시작 체크
        checkAutoStart();

        // 대기 중인 다운로드 체크
        checkPendingDownload();

        addStatus('Suno 자동화 준비됨', 'success');
    }

    // ============================================================================
    // 🖱️ 이벤트 리스너
    // ============================================================================

    function setupEventListeners() {
        // 파일 업로드
        const fileUpload = document.getElementById('suno-file-upload');
        if (fileUpload) {
            fileUpload.addEventListener('change', handleFileUpload);
        }

        // localStorage 로드
        const loadStorageBtn = document.getElementById('suno-load-storage');
        if (loadStorageBtn) {
            loadStorageBtn.addEventListener('click', loadFromLocalStorage);
        }

        // 시작 버튼
        const startBtn = document.getElementById('suno-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', startAutomation);
        }

        // 일시정지 버튼
        const pauseBtn = document.getElementById('suno-pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                state.isPaused = !state.isPaused;
                pauseBtn.textContent = state.isPaused ? '▶️ 재개' : '⏸️ 일시정지';
                addStatus(state.isPaused ? '일시정지됨' : '재개됨', 'warning');
            });
        }

        // 중지 버튼
        const stopBtn = document.getElementById('suno-stop-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                state.isRunning = false;
                addStatus('중지 요청됨...', 'warning');
            });
        }

        // 다운로드 버튼
        const downloadBtn = document.getElementById('suno-download-all');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                // 목표 곡 수 가져오기
                const targetInput = document.getElementById('suno-target-count');
                state.totalSongs = targetInput ? parseInt(targetInput.value) : 50;

                addStatus(`목표: ${state.totalSongs}곡 다운로드`, 'info');

                state.downloadedFiles = await downloadFromLibrary();

                // 통계 표시
                const statsDiv = document.getElementById('suno-download-stats');
                if (statsDiv && state.downloadedFiles.length > 0) {
                    statsDiv.style.display = 'block';

                    const group1 = state.downloadedFiles.filter(f => f.group === 1);
                    const group2 = state.downloadedFiles.filter(f => f.group === 2);

                    document.getElementById('group1-count').textContent = group1.length;
                    document.getElementById('group2-count').textContent = group2.length;
                }

                // 결과를 localStorage에 저장 (Python 연동용)
                localStorage.setItem('SUNO_DOWNLOAD_COMPLETE', 'true');
                localStorage.setItem('SUNO_DOWNLOADED_FILES', JSON.stringify(state.downloadedFiles));
            });
        }

        // 기록 초기화
        const clearBtn = document.getElementById('suno-clear-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const count = GM_getValue('downloadedUrls', []).length;
                if (confirm(`${count}개의 다운로드 기록을 초기화하시겠습니까?`)) {
                    GM_setValue('downloadedUrls', []);
                    updateDownloadHistoryCount();
                    addStatus('다운로드 기록 초기화됨', 'success');
                }
            });
        }

        // 다운로드 기록 카운트 표시
        updateDownloadHistoryCount();

        // 최소화 버튼
        const minimizeBtn = document.getElementById('suno-minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                const body = document.getElementById('suno-body');
                body.style.display = body.style.display === 'none' ? 'block' : 'none';
                minimizeBtn.textContent = body.style.display === 'none' ? '+' : '−';
            });
        }
    }

    // 다운로드 기록 카운트 업데이트
    function updateDownloadHistoryCount() {
        const count = GM_getValue('downloadedUrls', []).length;
        const countSpan = document.getElementById('download-history-count');
        if (countSpan) countSpan.textContent = count;
    }

    // 파일 업로드 처리
    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.songs && Array.isArray(data.songs)) {
                state.songs = data.songs;
                state.totalSongs = data.songs.length;

                // localStorage에도 저장
                localStorage.setItem('SUNO_SONGS', JSON.stringify(data.songs));

                document.getElementById('suno-data-info').style.display = 'block';
                document.getElementById('suno-song-count').textContent = `🎵 곡 수: ${data.songs.length}`;

                const startBtn = document.getElementById('suno-start-btn');
                startBtn.disabled = false;
                startBtn.textContent = `▶️ ${data.songs.length}곡 생성 시작`;

                addStatus(`${data.songs.length}곡 로드 완료`, 'success');
            } else {
                throw new Error('올바른 JSON 형식이 아닙니다');
            }
        } catch (error) {
            addStatus(`파일 읽기 실패: ${error.message}`, 'error');
        }
    }

    // localStorage에서 로드
    function loadFromLocalStorage() {
        const songsJson = localStorage.getItem('SUNO_SONGS');

        if (songsJson) {
            try {
                state.songs = JSON.parse(songsJson);
                state.totalSongs = state.songs.length;

                document.getElementById('suno-data-info').style.display = 'block';
                document.getElementById('suno-song-count').textContent = `🎵 곡 수: ${state.songs.length}`;

                const startBtn = document.getElementById('suno-start-btn');
                startBtn.disabled = false;
                startBtn.textContent = `▶️ ${state.songs.length}곡 생성 시작`;

                addStatus(`localStorage에서 ${state.songs.length}곡 로드`, 'success');
            } catch (e) {
                addStatus('localStorage 파싱 오류', 'error');
            }
        } else {
            addStatus('localStorage에 데이터 없음', 'warning');
        }
    }

    // 자동 시작 체크
    function checkAutoStart() {
        const autoStart = localStorage.getItem('SUNO_AUTO_START') === 'true';
        const songsJson = localStorage.getItem('SUNO_SONGS');

        if (autoStart && songsJson && window.location.href.includes('/create')) {
            localStorage.removeItem('SUNO_AUTO_START');
            addStatus('자동 시작 감지됨...', 'info');

            setTimeout(() => {
                loadFromLocalStorage();
                setTimeout(startAutomation, 2000);
            }, CONFIG.PAGE_LOAD_WAIT);
        }
    }

    // 대기 중인 다운로드 체크
    async function checkPendingDownload() {
        const pendingDownload = localStorage.getItem('SUNO_PENDING_DOWNLOAD') === 'true';

        if (pendingDownload && (window.location.href.includes('/library') || window.location.href.includes('/me'))) {
            localStorage.removeItem('SUNO_PENDING_DOWNLOAD');
            addStatus('대기 중인 다운로드 실행...', 'info');

            // clipMap 복원
            const clipMapJson = localStorage.getItem('SUNO_CLIP_MAP');
            if (clipMapJson) {
                state.clipMap = JSON.parse(clipMapJson);
                state.currentChannel = localStorage.getItem('SUNO_CHANNEL') || 'default';

                // CDN 직접 다운로드 시도
                const completedClips = state.clipMap.filter(c => c.status === 'complete');
                if (completedClips.length > 0) {
                    addStatus(`clipMap에서 ${completedClips.length}곡 발견, CDN 다운로드`, 'info');
                    state.downloadedFiles = await downloadFromClipMap(state.currentChannel);
                    completeAutomation();
                    return;
                }
            }

            // fallback: Library 방식
            await sleep(CONFIG.PAGE_LOAD_WAIT);
            state.downloadedFiles = await downloadFromLibrary();
            completeAutomation();
        }
    }

    // ============================================================================
    // 📊 UI 업데이트
    // ============================================================================

    function updateProgress() {
        const progressSection = document.getElementById('suno-progress-section');
        const progressFill = document.getElementById('suno-progress-fill');
        const progressText = document.getElementById('suno-progress-text');

        if (progressSection) progressSection.style.display = 'block';

        const percent = state.totalSongs > 0
            ? ((state.currentSongIndex + 1) / state.totalSongs * 100)
            : 0;

        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${state.currentSongIndex + 1} / ${state.totalSongs}`;
    }

    function updateUI() {
        const startBtn = document.getElementById('suno-start-btn');
        const pauseBtn = document.getElementById('suno-pause-btn');
        const stopBtn = document.getElementById('suno-stop-btn');

        if (state.isRunning) {
            if (startBtn) { startBtn.disabled = true; startBtn.textContent = '⏳ 실행 중...'; }
            if (pauseBtn) pauseBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = false;
        } else {
            if (startBtn) {
                startBtn.disabled = state.songs.length === 0;
                startBtn.textContent = state.songs.length > 0
                    ? `▶️ ${state.songs.length}곡 생성 시작`
                    : '데이터를 먼저 로드하세요';
            }
            if (pauseBtn) pauseBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = true;
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
        if (document.body) {
            setTimeout(createUI, 2000);
        } else {
            document.addEventListener('DOMContentLoaded', () => setTimeout(createUI, 2000));
        }
    }

    init();

})();