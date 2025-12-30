// ==UserScript==
// @name         Claude Automation - music_ballad_long
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  발라드 음악 롱폼 25곡 생성
// @author       Atobro
// @match        https://claude.ai/project/019b085b-22a3-70c5-a8cb-4752968eba78
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/music_ballad_long.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/music_ballad_long.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==
(function(){'use strict';console.log('💔 Ballad Long Music Generator');let isRunning=false,currentStep=0;const MAX_STEPS=3;const CHANNEL='BALLAD';const STEP_PROMPTS=[{name:"25곡 생성",prompt:`당신은 발라드 음악 전문 큐레이터입니다. 25곡의 감성 발라드 플레이리스트를 생성하세요.

각 곡은 다음 형식으로 작성:
곡번호. 곡 제목 (영문) | 한글 제목 | BPM | 분위기 키워드

발라드 특징:
- BPM: 60-80 사이
- 분위기: 감성적, 애절함, 위로, 그리움, 카타르시스
- 주제: 이별, 사랑, 추억, 후회, 위로, 힐링

예시:
1. Fading Memories | 희미해지는 기억 | 68 BPM | 애절한, 그리움, 이별
2. Healing Rain | 치유의 비 | 72 BPM | 위로, 평온함, 힐링

25곡 모두 생성하세요.`},{name:"Midjourney 프롬프트",prompt:`각 곡마다 Midjourney 이미지 프롬프트를 생성하세요.

형식:
곡번호. [곡제목]
Prompt: 상세한 미드저니 프롬프트 (영문, 발라드 감성)

발라드 비주얼 키워드:
- rainy window, melancholic mood, emotional depth
- empty chair at cafe, loneliness theme
- fading photograph, nostalgic atmosphere
- sunset silhouette, emotional moment
- crying person comforted, healing concept

각 프롬프트는 고유하고 감성적으로 작성하세요.`},{name:"YouTube 메타데이터",prompt:`각 곡의 YouTube 메타데이터를 생성하세요.

형식:
곡번호. [곡제목]
Title: [YouTube 제목 - 한글/영문 혼합, 50자 이내]
Description: [설명 - 100-150자, 해시태그 포함]
Tags: [태그 15개, 쉼표로 구분]

---MUSIC_DATA_START---
(여기에 전체 25곡 데이터 통합 출력: 곡정보 + 프롬프트 + 메타데이터)
---MUSIC_DATA_END---`}];GM_addStyle('#script-automation-panel{position:fixed;top:20px;right:20px;width:420px;background:linear-gradient(135deg,#ee9ca7,#ffdde1);color:#333;padding:25px;border-radius:16px;z-index:10000}#script-automation-panel h3{margin:0 0 15px;font-size:19px;text-align:center}.channel-badge{background:rgba(255,255,255,0.5);padding:8px 20px;border-radius:20px;font-size:12px;display:inline-block;margin-bottom:15px;font-weight:600;color:#333}');function sleep(ms){return new Promise(r=>setTimeout(r,ms))}function addStatus(msg){const s=document.getElementById('automation-status');if(!s)return;const l=document.createElement('div');l.className='status-line';l.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;s.insertBefore(l,s.firstChild)}function updateStepDisplay(){document.getElementById('step-count').textContent=`${currentStep}/${MAX_STEPS}`;if(currentStep>0)document.getElementById('step-name').textContent=STEP_PROMPTS[currentStep-1].name;document.getElementById('progress-fill').style.width=`${(currentStep/MAX_STEPS)*100}%`}async function waitForResponseComplete(){await sleep(2000);while(document.querySelector('button[aria-label="Stop response"]'))await sleep(1000);await sleep(2000)}async function inputPrompt(promptText){const f=document.querySelector('div.ProseMirror[contenteditable="true"]');f.innerHTML='';promptText.split('\n').forEach(l=>{if(l.trim()){const p=document.createElement('p');p.textContent=l;f.appendChild(p)}});f.dispatchEvent(new Event('input',{bubbles:true}));await sleep(500);Array.from(document.querySelectorAll('button')).find(b=>b.querySelector('svg path')?.getAttribute('d')?.includes('M208.49')).click();await waitForResponseComplete()}function collectResponse(){try{const responses=document.querySelectorAll('div[class*="font-claude-response"]');if(currentStep===MAX_STEPS){for(let i=responses.length-1;i>=0;i--){const txt=responses[i].innerText.trim();if(txt.includes('---MUSIC_DATA_START---')&&txt.includes('---MUSIC_DATA_END---')){const data=txt.substring(txt.indexOf('---MUSIC_DATA_START---')+22,txt.indexOf('---MUSIC_DATA_END---')).trim();localStorage.setItem('MUSIC_DATA_BALLAD',data);return data}}}return''}catch(e){return''}}function createPanel(){const p=document.createElement('div');p.id='script-automation-panel';p.innerHTML=`<h3>💔 발라드 롱폼 25곡</h3><div style="text-align:center;"><span class="channel-badge">${CHANNEL} MUSIC</span></div><div class="step-counter">단계: <span id="step-count">0/${MAX_STEPS}</span><div class="step-name" id="step-name">대기 중</div></div><div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div><button id="start-btn">🚀 25곡 생성 시작</button><button id="stop-btn">⏹ 중지</button><button id="download-btn" disabled>✅ 작업 완료</button><div id="automation-status"></div>`;document.body.appendChild(p);document.getElementById('start-btn').onclick=async()=>{isRunning=true;currentStep=0;document.getElementById('start-btn').style.display='none';document.getElementById('stop-btn').style.display='block';while(isRunning&&currentStep<MAX_STEPS){currentStep++;updateStepDisplay();await inputPrompt(STEP_PROMPTS[currentStep-1].prompt);await sleep(3000)}if(currentStep>=MAX_STEPS){collectResponse();document.getElementById('download-btn').disabled=false}isRunning=false};document.getElementById('stop-btn').onclick=()=>{isRunning=false}}setTimeout(()=>{if(document.body)createPanel()},2000)})();(function(){setInterval(()=>{document.querySelectorAll('[role="dialog"]').forEach(d=>{if((d.textContent||'').includes('Claude를 계속'))d.remove()})},2000)})();
