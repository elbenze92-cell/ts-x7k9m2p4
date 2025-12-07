// ==UserScript==
// @name         *senior life 대본 생성
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  시니어 여성향 롱폼 대본 + 미드저니 프롬프트 자동 생성 (1시간 분량)
// @author       Atobro
// @match        https://claude.ai/project/01997090-b4f0-7559-bf17-32d6f35e6a8b
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/senior_life.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/senior_life.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🎯 Senior Story 대본 생성기 시작');

    // 전역 변수
    let isRunning = false;
    let currentStep = 0;
    let allResponses = [];
    const MAX_STEPS = 10;

    // ============================================
    // 10단계 프롬프트 정의
    // ============================================
    const STEP_PROMPTS = [
        {
            name: "지침 학습",
            prompt: `프로젝트 지침과 첨부파일에 있는 모든 시니어 여성향 대본들을 분석하고 학습하세요.

다음을 파악하세요:
- 성공 패턴: 첫 문장 후킹, "~했어요" 구어체, 감정 곡선
- 구조: 충격→회상→해결 패턴, 20,000자 분량
- 주제: 상속, 배신, 사기, 가족갈등 등 다양한 소재
- 특징: 시니어 여성 공감 요소, 복선과 회수

채널 톤 참고: 긴박하고 몰입감 있는 서술, 사건 중심 전개
목표 분량: 1시간 영상 대본 (챕터별 3,000-4,000자, 총 15,000-20,000자)

1) 목표
원본의 주제·핵심 정서·극적 포인트는 유지하되, 줄거리·인물·관계·직업·동기를 대폭 변형하여, 표절이 되지 않도록 유사성 30% 이하로 재창작.
시니어 여성(50~70대)의 공감→분노→통쾌→희망 감정 여정, 긴장감과 통쾌함을 극대화.
아침드라마 문법(가족·경제적 배신·권선징악·반전)과 현실성(연표/나이 오류 없음), 앞부분 복선-뒷부분 회수를 명확히 할 것.

2) 산출물 형식 (반드시 이 구조로 출력)
메타 정보
- 제목 후보 3개(강렬·명료, 첨부파일 제목과 키워드 참고해서 너무 짧지 않게)
- 썸네일 문구 3개(첨부파일 제목과 키워드 참고해서 2문장)
- 핵심 키워드 6~8개(가족갈등/상속/배신 등)
- 예상 재생시간: 55-65분

캐릭터 시트
- 주인공: 겉모습/성격/과거/현재 직업 또는 역할/핵심 결핍·가치관
- 악역: 겉모습/사회적 가면/진짜 욕망/수단(사기·가스라이팅 등)
- 조력자: 직업/주인공과의 접점/제공 역량(법·의료·행정·탐정)
- 보조 인물 2~3명: 이야기적 기능 사건 전개상 역할만 간단히 (오해 유발, 증언, 갈등 증폭, 감정적 지지)

연표/나이 일치 표
연도·나이·주요 사건을 표로 정리 (최소 7행, 현재부터 과거 순서).

복선 & 회수 리스트
초반에 심어둘 작은 단서 5~7개 + 각 단서의 회수 시점(챕터/장면)과 방식.

확장형 5챕터 시놉시스 (각 300-400단어, 총 1,500-2,000단어)

챕터별 예시:

챕터1 도입(친근한 등장)
- 전체 내용의 가장 하이라이트 : 충격적인 장면, 호기심 궁금증을 유발하는 후킹으로 시작.
- 충격적 오프닝으로 시작 (생명 위험 상황)
- 중간중간 상세한 일상 묘사 (아침 루틴, 동네 풍경, 가족 관계)
- 과거 회상 장면 2-3개 (행복했던 시절, 남편과의 추억)
- 현재 생활 패턴과 인물 관계도 소개
- 미세한 이상 기류 3-4개 복선 삽입
- 주변 인물들과의 자연스러운 대화 장면들
- 상황 설명은 위기 상황 속에서 자연스럽게 언급
- 과거 배경은 최소한만, 현재 위험에 집중
- 조력자와의 만남, 즉각적인 도피
- 엔딩: 더 큰 음모가 있음을 암시

챕터2 전개(의심의 씨앗)
- 가족/인척의 수상한 행동들을 구체적 에피소드로
- 경제·문서·병력·보험 등 현실적 단서들의 연속 발견
- 주인공의 관찰·메모 습관으로 서서히 긴장 고조
- 일상 속 불안감이 커지는 심리 묘사
- 조력자와의 첫 만남이나 힌트 제공
- 과거 경험담을 통한 직감과 지혜 발휘
- 조력자를 통한 충격적 진실 폭로
- 악역의 과거 범죄 이력 공개
- 주인공이 다음 타겟임을 확인
- 구체적 증거와 위험성 제시
- 엔딩: 악역이 다시 접근해옴

챕터3 위기(충격적 배신)
- 모욕·재산탈취 시도·강제 요양 추진 등 "심장 철렁" 장면들
- 여러 배신 상황이 연속으로 터지는 구성
- 주인공의 좌절과 분노, 절망의 상세한 독백
- 가족들의 냉정한 본색 드러내는 대화들
- 위기 상황에서의 생생한 감정 표현
- 포기 직전의 상황과 심리적 바닥 경험
- 악역과의 정면 대결 상황
- 주인공의 위기와 분노 폭발
- 생생한 대결 장면과 위험한 순간들
- 가족의 배신 확인과 절망감
- 엔딩: 주인공의 각성과 반격 결심

챕터4 역전(각성과 반격)
- 조력자 본격 등장, 상세한 작전 수립 과정
- 법·제도·기술 활용한 합법적 반격 준비
- 치밀한 계획 (녹취·문서확인·위임장·공증·CCTV·통장내역 등)
- 주인공의 각성과 의지 다지기 과정
- 증거 수집과 네트워크 구축 장면들
- 반격 직전의 긴장감과 결의 표현
- 조력자와의 치밀한 작전 수립
- 구체적이고 현실적인 함정 설치
- 법적 장치와 증거 확보 과정
- 긴장감 있는 준비 장면들
- 엔딩: 최종 대결 직전의 긴장감

챕터5 해결(통쾌한 복수 & 희망)
- 진실 공개의 극적 장면, 상세한 대결 구도
- 악인의 몰락 과정을 단계별로 세밀하게
- 권선징악, 명예 회복, 사회적 인정
- 주인공의 새로운 시작과 성장
- 후일담과 교훈, 다른 어르신들에게 미치는 영향
- 따뜻하고 희망찬 마무리 메시지

대사 가이드 (오디오 친화)
도입·전개·위기·역전·결말 각 장면별 핵심 내레이션 23줄 + 대사 34줄.
감정 표현 예시 삽입: "뭔가 이상했어요", "가슴이 끓어올랐어요", "더 이상 당하고만 있을 수 없었어요" 등.

CTA (마무리 멘트)
"나이가 들었다고 포기하지 마세요" 등 2문장 + 구독 유도 1문장(노골적 부탁 대신 다음 화 예고형).

3) 변형 규칙 (표절 회피·새로움 강화)
- 관계·역할 치환: 며느리→사위/손주 보호자, 시어머니→고모/큰이모 등
- 배신 동기 변환: 단순 상속→보험·채무·브랜드 평판·의료 결정권 등 현실 제도 의제로
- 배경 전환: 도시/근교/재개발 구역/전원주택/시장상인/요양 관련 기관 등 생활밀착 공간
- 서사 관점 변화: 1인 내레이션 중심 + 간헐적 "편지/메모/녹취록" 인용
- 상징·소품: 오래된 통장, 바느질 상자 열쇠, 낡은 라디오, 손목시계 등 → 복선 장치로 활용
- 합법적 해결 원칙: 신고·변호사·공증·행정절차·언론 제보 등. 불법 보복은 금지

금지사항:
- 과도한 자기소개나 배경 설명
- 교훈적·설교적 메시지
- 복잡한 사회제도 설명
- 지나친 법적 절차 묘사
- 감성적 회상 장면 남발

포함사항 (예시):
- 생명을 위협하는 긴박한 상황
- 연쇄 범죄의 충격적 진실
- 현행범 체포의 통쾌한 장면
- 주인공의 용기와 지혜 부각
- 명확한 악인 처벌과 정의 실현

작성 톤:
- 사건 중심의 빠른 전개
- 짧고 강렬한 문장
- 긴장감을 놓지 않는 서술
- 불필요한 설명 최소화
- 액션과 대결에 집중

학습 완료 후 "프로젝트의 대본 패턴을 완전히 학습했습니다"라고 답하세요.`
        },
        {
            name: "시놉시스 생성",
            prompt: `학습한 대본들을 참고하여 완전히 새로운 시놉시스를 생성하세요.
다음 단계에서 시놉시스를 기반으로 챕터별로 확장 대본을 요청할 것입니다.

📌 시니어 여성향 유튜브 대본 창작 지시서

목표 분량: 1시간 영상 대본 (챕터별 3,000-4,000자, 총 20,000자)

산출물 형식:

메타 정보
- 제목 후보 3개(7~12자, 강렬·명료)
- 썸네일 문구 2개(5~8단어)
- 핵심 키워드 6~8개
- 예상 재생시간: 55-65분

캐릭터 시트
주인공(70대 전후, 여성): 겉모습/성격/과거/현재 직업 또는 역할/핵심 결핍·가치관
악역(30~40대): 겉모습/사회적 가면/진짜 욕망/수단(사기·가스라이팅 등)
조력자(20~30대): 직업/주인공과의 접점/제공 역량(법·의료·행정·탐정)
보조 인물 2~3명: 이야기적 기능(오해 유발, 증언, 갈등 증폭, 감정적 지지)

연표/나이 일치 표
- 최소 7행, 현재부터 과거 순서

복선 & 회수 리스트
- 초반 단서 5~7개 + 회수 시점과 방식

확장형 5챕터 시놉시스
- 챕터1: 충격적 오프닝 + 일상
- 챕터2: 의심의 씨앗
- 챕터3: 배신과 위기
- 챕터4: 각성과 반격
- 챕터5: 통쾌한 해결`
        },
        {
            name: "챕터1 대본",
            prompt: `위 시놉시스의 챕터1을 3,000자 이상으로 확장하세요.

작성 예시:
✓ 전체 내용의 가장 하이라이트 : 충격적인 장면, 호기심 궁금증을 유발하는 후킹으로 시작.
✓ 주인공 소개 (상황에 자연스럽게 녹여도 됨)
✓ 일상 묘사: 시니어 공감 디테일
✓ 복선 2-3개 삽입
✓ 대사 3-5줄: "라고 말했어요" 형식
✓ 엔딩 훅: 다음 챕터 궁금증

말투: "~했어요/했답니다" 1인칭 구어체
부가 설명 없이 나레이션 대본만 작성 (첫 시작 25초의 장면을 별도로 구분해서 5장면으로 아주 긴박하고 세밀하게 묘사하고, 이후 내용은 장면 전환에 적절한 부분을 3군데로 나누어서 총 8개의 코드블럭에 작성합니다.)`
        },
        {
            name: "챕터2 대본",
            prompt: `챕터2를 3,500자 이상으로 확장하세요.

요소 예시:
✓ 이상 징후: 가족의 수상한 행동
✓ 구체적 단서: 서류, 통장, 보험 등
✓ 긴장감 상승: 의심→불안
✓ 복선 추가 2개
✓ 대사 4-6줄
✓ 엔딩 훅: 위기 암시

부가 설명 없이 나레이션 대본만 작성 (장면 전환에 적절한 부분을 3군데로 나누어서 총 3개의 코드블럭에 작성합니다.)`
        },
        {
            name: "챕터3 대본",
            prompt: `챕터3을 4,000자 이상으로 확장하세요.

요소 예시:
✓ 충격적 배신 장면
✓ 감정 폭발: "눈앞이 캄캄했어요"
✓ 구체적 위기 상황
✓ 복선 회수 1개 이상
✓ 대사 5-7줄
✓ 엔딩 훅: 반격 의지

부가 설명 없이 나레이션 대본만 작성 (장면 전환에 적절한 부분을 3군데로 나누어서 총 3개의 코드블럭에 작성합니다.)`
        },
        {
            name: "챕터4 대본",
            prompt: `챕터4를 3,500자 이상으로 확장하세요.

요소 예시:
✓ 각성: "더 이상 당하지 않겠어요"
✓ 조력자 등장/증거 발견
✓ 구체적 반격 준비
✓ 복선 회수 2개
✓ 대사 4-6줄
✓ 엔딩 훅: 대결 예고

부가 설명 없이 나레이션 대본만 작성 (장면 전환에 적절한 부분을 3군데로 나누어서 총 3개의 코드블럭에 작성합니다.)`
        },
        {
            name: "챕터5 대본",
            prompt: `챕터5를 3,000자 이상으로 확장하세요.

요소 예시:
✓ 진실 폭로의 극적 장면
✓ 악인의 몰락
✓ 권선징악 실현
✓ 모든 복선 회수
✓ 대사 5-7줄
✓ 희망 메시지: "나이가 들었다고 포기하지 마세요"
✓ 구독유도 : 이어서 자연스럽게 다음 이야기를 예고하는 문장 추가.
   - 예: "이야기가 마음에 드셨다면 구독하시고, 다음에 또 들려드릴 제 이야기를 기다려주세요."

부가 설명 없이 나레이션 대본만 작성 (장면 전환에 적절한 부분을 3군데로 나누어서 총 3개의 코드블럭에 작성합니다.)`
        },
        {
            name: "메타데이터",
            prompt: `완성된 대본의 메타데이터 생성:

1. 제목 5개 (자극적, 7-12자)
2. 썸네일 문구 5개 (충격 장면)
3. 설명란 (채널: 아토형아 Story)
   - 실화 기반 재구성, 개인정보 보호를 위해 각색 언급
   - 구독/좋아요 유도
4. 태그 10개

각 항목별로 복사 가능하도록 구분`
        },
        {
            name: "미드저니 프롬프트",
            prompt: `챕터별로 나눈 코드블럭의 핵심 장면을 미드저니 프롬프트로 (후킹 포함 총 18개):

극사실주의 스타일 (photo of, hyperrealistic)
한국인 설정 (Korean elderly woman)
각 프롬프트 복사 가능하도록 구분`
        },
        {
            name: "최종 정리 (대본 + 프롬프트)",
            prompt: `챕터 1-5의 전체 대본과 미드저니 프롬프트를 최종 정리해주세요.

⚠️ 반드시 아래 형식 그대로 출력하세요.
⚠️ 마커 바깥에는 절대 아무것도 쓰지 마세요.
⚠️ "네", "알겠습니다" 같은 말도 금지.

---SCRIPT_START---
(챕터1부터 챕터5까지 전체 대본을 순서대로 합쳐서 작성)
---SCRIPT_END---

---PROMPTS_START---
1. (첫 번째 미드저니 프롬프트)
2. (두 번째 미드저니 프롬프트)
...
18. (마지막 미드저니 프롬프트)
---PROMPTS_END---`
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
            const responses = document.querySelectorAll('[data-message-author-role="assistant"]');
            console.log(`🔍 응답 개수: ${responses.length}`);

            // ============================================
            // 🔥 10단계(마지막)에서만 마커 기반 추출
            // ============================================
            if (currentStep === MAX_STEPS) {
                // 모든 응답에서 마커 찾기 (역순)
                for (let i = responses.length - 1; i >= 0; i--) {
                    const responseText = responses[i].textContent || responses[i].innerText || '';

                    // 🔥 동기부여 스크립트와 동일한 마커
                    const scriptStart = '---SCRIPT_START---';
                    const scriptEnd = '---SCRIPT_END---';
                    const promptsStart = '---PROMPTS_START---';
                    const promptsEnd = '---PROMPTS_END---';

                    if (responseText.includes(scriptStart) && responseText.includes(scriptEnd)) {
                        console.log(`🔍 응답 #${i}에서 마커 발견`);

                        // 대본 추출
                        const scriptStartIdx = responseText.indexOf(scriptStart) + scriptStart.length;
                        const scriptEndIdx = responseText.indexOf(scriptEnd);
                        const cleanScript = responseText.substring(scriptStartIdx, scriptEndIdx).trim();

                        // 이미지 프롬프트 추출
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

                        console.log('✅ 마커 기반 추출 성공!');
                        console.log('   - 대본:', cleanScript.length, '글자');
                        console.log('   - 이미지 프롬프트:', imagePrompts.length, '개');

                        // 🔥 대본 저장 (동기부여와 동일)
                        localStorage.setItem('FINAL_SCRIPT', cleanScript);
                        window.FINAL_SCRIPT_FOR_PYTHON = cleanScript;

                        // 🔥 이미지 프롬프트 저장 (동기부여와 동일)
                        if (imagePrompts.length > 0) {
                            const promptsJson = JSON.stringify(imagePrompts);
                            localStorage.setItem('IMAGE_PROMPTS', promptsJson);
                            window.IMAGE_PROMPTS = imagePrompts;

                            // JSON 형식으로도 저장 (Python 호환)
                            const scriptData = {
                                image_prompts: imagePrompts
                            };
                            localStorage.setItem('SENIOR_SCRIPT_JSON', JSON.stringify(scriptData));
                            window.SENIOR_SCRIPT_JSON = scriptData;
                        }

                        return cleanScript;
                    }
                }

                console.warn('⚠️ 10단계인데 마커 못 찾음');
            }

            // ============================================
            // 중간 단계: 기본 응답 수집
            // ============================================
            if (responses.length > 0) {
                const lastResponse = responses[responses.length - 1];
                const fallbackText = lastResponse.textContent || lastResponse.innerText || '';
                
                console.log(`📝 ${currentStep}단계 응답: ${fallbackText.length}자`);
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
            <h3>🎯 Create: 시니어 스토리 대본 생성</h3>
            <div style="text-align: center;">
                <span class="category-badge">SENIOR STORY</span>
            </div>

            <div class="info-box" style="display: none;">
                <label>💡 주제/키워드 (선택사항)</label>
                <textarea id="user-input"
                          placeholder="※ 시니어 스토리는 자동 생성됩니다
※ 첨부파일의 대본들을 학습하여
  새로운 시니어 여성향 스토리를 만듭니다

(이 필드는 사용하지 않습니다)"></textarea>
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

        addStatus('🚀 시니어 스토리 대본 생성 시작!', 'success');
        addStatus('📌 첨부파일 학습 후 자동 생성 모드');

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
                const promptToSend = step.prompt;

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
                addStatus('✅ 시니어 스토리 생성기 준비 완료');
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