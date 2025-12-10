// ==UserScript==
// @name         Claude Automation - senior_family_long
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  시니어 가족 롱폼 20개 주제 생성
// @author       Atobro
// @match        https://claude.ai/project/019ad90a-bb43-70a5-a78a-4adccc41351a
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/senior_family_long.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/senior_family_long.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==
(function(){'use strict';console.log('👨‍👩‍👧‍👦 Senior Family Long Generator');let isRunning=false,currentStep=0;const MAX_STEPS=3;const CHANNEL='SENIOR_FAMILY';const STEP_PROMPTS=[{name:"20개 주제 생성",prompt:`당신은 시니어 가족 관계 전문 콘텐츠 제작자입니다. 20개의 시니어 가족 관계 주제를 생성하세요.

각 주제는 다음 형식으로 작성:
주제번호. 주제 제목 (한글) | 영문 제목 | 카테고리 | 핵심 키워드

시니어 가족 특징:
- 카테고리: 손주관계, 부부관계, 자녀관계, 명절가족, 독립노후, 세대소통
- 대상: 50-70대 가족 관계 고민층
- 주제: 세대 공감, 건강한 거리, 소통 방법, 가족 화목

예시:
1. 손주 육아 도움 적정선 찾기 | Finding Balance in Helping with Grandchildren | 손주관계 | 육아도움, 경계, 건강한거리
2. 50년 부부 행복 비결 | Secrets of 50-Year Marriage Happiness | 부부관계 | 노년부부, 행복, 존중

20개 모두 생성하세요.`},{name:"Midjourney 프롬프트",prompt:`각 주제마다 Midjourney 이미지 프롬프트를 생성하세요.

형식:
주제번호. [주제 제목]
Prompt: 상세한 미드저니 프롬프트 (영문, 따뜻한 가족 감성)

시니어 가족 비주얼 키워드:
- Korean grandparents playing with grandchildren happily, warm moment
- Elderly couple holding hands at home, enduring love, peaceful
- Senior parent and adult child conversation, understanding
- Multi-generational family gathering meal, harmonious atmosphere
- Grandmother cooking with grandchild, generational bonding
- Korean seniors supporting each other emotionally, partnership
- Family photo multiple generations, love and unity
- Senior couple celebrating anniversary, lasting love, romantic

각 프롬프트는 가족 간 따뜻함과 이해를 담아 작성하세요.`},{name:"YouTube 메타데이터",prompt:`각 주제의 YouTube 메타데이터를 생성하세요.

형식:
주제번호. [주제 제목]
Title: [YouTube 제목 - 50자 이내, 공감 유도]
Description: [설명 - 100-150자, 감정 공감 + 해시태그]
Tags: [태그 15개, 쉼표로 구분]

---SENIOR_DATA_START---
(여기에 전체 20개 주제 데이터 통합 출력: 주제정보 + 프롬프트 + 메타데이터)
---SENIOR_DATA_END---`}];GM_addStyle('#script-automation-panel{position:fixed;top:20px;right:20px;width:420px;background:linear-gradient(135deg,#a8edea,#fed6e3);color:#333;padding:25px;border-radius:16px;z-index:10000}#script-automation-panel h3{margin:0 0 15px;font-size:19px;text-align:center}.channel-badge{background:rgba(255,255,255,0.5);padding:8px 20px;border-radius:20px;font-size:12px;display:inline-block;margin-bottom:15px;font-weight:600;color:#333}.step-counter{text-align:center;font-size:20px;margin:15px 0;padding:14px;background:rgba(255,255,255,0.3);border-radius:10px;color:#333}.step-name{font-size:12px;opacity:0.85;margin-top:6px}#start-btn{width:100%;padding:16px;background:linear-gradient(135deg,#10B981,#34D399);color:white;border:none;border-radius:10px;cursor:pointer;margin-bottom:10px;font-size:15px;font-weight:600}#stop-btn{width:100%;padding:16px;background:linear-gradient(135deg,#FF6B6B,#EE5A6F);color:white;border:none;border-radius:10px;display:none;font-weight:600}#download-btn{width:100%;padding:16px;background:#3498db;color:white;border:none;border-radius:10px;margin-bottom:10px;font-weight:600}#download-btn:disabled{background:#999}.progress-bar{width:100%;height:6px;background:rgba(255,255,255,0.3);border-radius:3px;margin:12px 0}.progress-fill{height:100%;background:#10B981;width:0%;transition:width 0.5s}#automation-status{background:rgba(255,255,255,0.2);padding:12px;border-radius:10px;margin-top:12px;font-size:12px;max-height:160px;overflow-y:auto}.status-line{margin:4px 0;padding:6px;background:rgba(255,255,255,0.3);border-radius:6px;font-size:11px;color:#333}');function sleep(ms){return new Promise(r=>setTimeout(r,ms))}function addStatus(msg){const s=document.getElementById('automation-status');if(!s)return;const l=document.createElement('div');l.className='status-line';l.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;s.insertBefore(l,s.firstChild)}function updateStepDisplay(){document.getElementById('step-count').textContent=`${currentStep}/${MAX_STEPS}`;if(currentStep>0)document.getElementById('step-name').textContent=STEP_PROMPTS[currentStep-1].name;document.getElementById('progress-fill').style.width=`${(currentStep/MAX_STEPS)*100}%`}async function waitForResponseComplete(){await sleep(2000);while(document.querySelector('button[aria-label="Stop response"]'))await sleep(1000);await sleep(2000)}async function inputPrompt(promptText){const f=document.querySelector('div.ProseMirror[contenteditable="true"]');f.innerHTML='';promptText.split('\n').forEach(l=>{if(l.trim()){const p=document.createElement('p');p.textContent=l;f.appendChild(p)}});f.dispatchEvent(new Event('input',{bubbles:true}));await sleep(500);Array.from(document.querySelectorAll('button')).find(b=>b.querySelector('svg path')?.getAttribute('d')?.includes('M208.49')).click();await waitForResponseComplete()}function collectResponse(){try{const responses=document.querySelectorAll('div[class*="font-claude-response"]');if(currentStep===MAX_STEPS){for(let i=responses.length-1;i>=0;i--){const txt=responses[i].innerText.trim();if(txt.includes('---SENIOR_DATA_START---')&&txt.includes('---SENIOR_DATA_END---')){const data=txt.substring(txt.indexOf('---SENIOR_DATA_START---')+23,txt.indexOf('---SENIOR_DATA_END---')).trim();localStorage.setItem('SENIOR_DATA_FAMILY',data);return data}}}return''}catch(e){return''}}function createPanel(){const p=document.createElement('div');p.id='script-automation-panel';p.innerHTML=`<h3>👨‍👩‍👧‍👦 시니어 가족 롱폼 20개</h3><div style="text-align:center;"><span class="channel-badge">${CHANNEL}</span></div><div class="step-counter">단계: <span id="step-count">0/${MAX_STEPS}</span><div class="step-name" id="step-name">대기 중</div></div><div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div><button id="start-btn">🚀 20개 주제 생성 시작</button><button id="stop-btn">⏹ 중지</button><button id="download-btn" disabled>✅ 작업 완료</button><div id="automation-status"></div>`;document.body.appendChild(p);document.getElementById('start-btn').onclick=async()=>{isRunning=true;currentStep=0;document.getElementById('start-btn').style.display='none';document.getElementById('stop-btn').style.display='block';addStatus('🚀 생성 시작');while(isRunning&&currentStep<MAX_STEPS){currentStep++;updateStepDisplay();await inputPrompt(STEP_PROMPTS[currentStep-1].prompt);await sleep(3000)}if(currentStep>=MAX_STEPS){collectResponse();addStatus('🎉 완료!');document.getElementById('download-btn').disabled=false}isRunning=false};document.getElementById('stop-btn').onclick=()=>{isRunning=false}}setTimeout(()=>{if(document.body)createPanel()},2000)})();(function(){setInterval(()=>{document.querySelectorAll('[role="dialog"]').forEach(d=>{if((d.textContent||'').includes('Claude를 계속'))d.remove()})},2000)})();
