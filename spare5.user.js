// ==UserScript==
// @name         senior family ?€ë³??ì„±
// @namespace    http://tampermonkey.net/
// @version      2.0.3
// @description  ?œë‹ˆ???¬ì„±??ë¡±í¼ ?€ë³?+ ë¯¸ë“œ?€???„ë¡¬?„íŠ¸ ?ë™ ?ì„± (1?œê°„ ë¶„ëŸ‰)
// @author       Atobro
// @match        https://claude.ai/project/01997090-b4f0-7559-bf17-32d6f35e6a8b
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/spare5.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/spare5.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('?¯ Senior Story ?€ë³??ì„±ê¸??œì‘');

    // ?„ì—­ ë³€??
    let isRunning = false;
    let currentStep = 0;
    let allResponses = [];
    const MAX_STEPS = 10;

    // ============================================
    // 10?¨ê³„ ?„ë¡¬?„íŠ¸ ?•ì˜
    // ============================================
    const STEP_PROMPTS = [
        {
            name: "ì§€ì¹??™ìŠµ",
            prompt: `?„ë¡œ?íŠ¸ ì§€ì¹¨ê³¼ ì²¨ë??Œì¼???ˆëŠ” ëª¨ë“  ?œë‹ˆ???¬ì„±???€ë³¸ë“¤??ë¶„ì„?˜ê³  ?™ìŠµ?˜ì„¸??

?¤ìŒ???Œì•…?˜ì„¸??
- ?±ê³µ ?¨í„´: ì²?ë¬¸ì¥ ?„í‚¹, "~?ˆì–´?? êµ¬ì–´ì²? ê°ì • ê³¡ì„ 
- êµ¬ì¡°: ì¶©ê²©?’íšŒ?â†’?´ê²° ?¨í„´, 20,000??ë¶„ëŸ‰
- ì£¼ì œ: ?ì†, ë°°ì‹ , ?¬ê¸°, ê°€ì¡±ê°ˆ?????¤ì–‘???Œì¬
- ?¹ì§•: ?œë‹ˆ???¬ì„± ê³µê° ?”ì†Œ, ë³µì„ ê³??Œìˆ˜

ì±„ë„ ??ì°¸ê³ : ê¸´ë°•?˜ê³  ëª°ì…ê°??ˆëŠ” ?œìˆ , ?¬ê±´ ì¤‘ì‹¬ ?„ê°œ
ëª©í‘œ ë¶„ëŸ‰: 1?œê°„ ?ìƒ ?€ë³?(ì±•í„°ë³?3,000-4,000?? ì´?15,000-20,000??

1) ëª©í‘œ
?ë³¸??ì£¼ì œÂ·?µì‹¬ ?•ì„œÂ·ê·¹ì  ?¬ì¸?¸ëŠ” ? ì??˜ë˜, ì¤„ê±°ë¦?·ì¸ë¬¼Â·ê?ê³„Â·ì§?…Â·ë™ê¸°ë? ?€??ë³€?•í•˜?? ?œì ˆ???˜ì? ?Šë„ë¡?? ì‚¬??30% ?´í•˜ë¡??¬ì°½??
?œë‹ˆ???¬ì„±(50~70?€)??ê³µê°?’ë¶„?¸â†’?µì¾Œ?’í¬ë§?ê°ì • ?¬ì •, ê¸´ì¥ê°ê³¼ ?µì¾Œ?¨ì„ ê·¹ë???
?„ì¹¨?œë¼ë§?ë¬¸ë²•(ê°€ì¡±Â·ê²½?œì  ë°°ì‹ Â·ê¶Œì„ ì§•ì•…Â·ë°˜ì „)ê³??„ì‹¤???°í‘œ/?˜ì´ ?¤ë¥˜ ?†ìŒ), ?ë?ë¶?ë³µì„ -?·ë?ë¶??Œìˆ˜ë¥?ëª…í™•????ê²?

2) ?°ì¶œë¬??•ì‹ (ë°˜ë“œ????êµ¬ì¡°ë¡?ì¶œë ¥)
ë©”í? ?•ë³´
- ?œëª© ?„ë³´ 3ê°?ê°•ë ¬Â·ëª…ë£Œ, ì²¨ë??Œì¼ ?œëª©ê³??¤ì›Œ??ì°¸ê³ ?´ì„œ ?ˆë¬´ ì§§ì? ?Šê²Œ)
- ?¸ë„¤??ë¬¸êµ¬ 3ê°?ì²¨ë??Œì¼ ?œëª©ê³??¤ì›Œ??ì°¸ê³ ?´ì„œ 2ë¬¸ì¥)
- ?µì‹¬ ?¤ì›Œ??6~8ê°?ê°€ì¡±ê°ˆ???ì†/ë°°ì‹  ??
- ?ˆìƒ ?¬ìƒ?œê°„: 55-65ë¶?

ìºë¦­???œíŠ¸
- ì£¼ì¸ê³? ê²‰ëª¨???±ê²©/ê³¼ê±°/?„ì¬ ì§ì—… ?ëŠ” ??• /?µì‹¬ ê²°í•Â·ê°€ì¹˜ê?
- ?…ì—­: ê²‰ëª¨???¬íšŒ??ê°€ë©?ì§„ì§œ ?•ë§/?˜ë‹¨(?¬ê¸°Â·ê°€?¤ë¼?´íŒ… ??
- ì¡°ë ¥?? ì§ì—…/ì£¼ì¸ê³µê³¼???‘ì /?œê³µ ??Ÿ‰(ë²•Â·ì˜ë£ŒÂ·í–‰?•Â·íƒ??
- ë³´ì¡° ?¸ë¬¼ 2~3ëª? ?´ì•¼ê¸°ì  ê¸°ëŠ¥ ?¬ê±´ ?„ê°œ????• ë§?ê°„ë‹¨??(?¤í•´ ? ë°œ, ì¦ì–¸, ê°ˆë“± ì¦í­, ê°ì •??ì§€ì§€)

?°í‘œ/?˜ì´ ?¼ì¹˜ ??
?°ë„Â·?˜ì´Â·ì£¼ìš” ?¬ê±´???œë¡œ ?•ë¦¬ (ìµœì†Œ 7?? ?„ì¬ë¶€??ê³¼ê±° ?œì„œ).

ë³µì„  & ?Œìˆ˜ ë¦¬ìŠ¤??
ì´ˆë°˜???¬ì–´???‘ì? ?¨ì„œ 5~7ê°?+ ê°??¨ì„œ???Œìˆ˜ ?œì (ì±•í„°/?¥ë©´)ê³?ë°©ì‹.

?•ì¥??5ì±•í„° ?œë†‰?œìŠ¤ (ê°?300-400?¨ì–´, ì´?1,500-2,000?¨ì–´)

ì±•í„°ë³??ˆì‹œ:

ì±•í„°1 ?„ì…(ì¹œê·¼???±ì¥)
- ?„ì²´ ?´ìš©??ê°€???˜ì´?¼ì´??: ì¶©ê²©?ì¸ ?¥ë©´, ?¸ê¸°??ê¶ê¸ˆì¦ì„ ? ë°œ?˜ëŠ” ?„í‚¹?¼ë¡œ ?œì‘.
- ì¶©ê²©???¤í”„?ìœ¼ë¡??œì‘ (?ëª… ?„í—˜ ?í™©)
- ì¤‘ê°„ì¤‘ê°„ ?ì„¸???¼ìƒ ë¬˜ì‚¬ (?„ì¹¨ ë£¨í‹´, ?™ë„¤ ?ê²½, ê°€ì¡?ê´€ê³?
- ê³¼ê±° ?Œìƒ ?¥ë©´ 2-3ê°?(?‰ë³µ?ˆë˜ ?œì ˆ, ?¨í¸ê³¼ì˜ ì¶”ì–µ)
- ?„ì¬ ?í™œ ?¨í„´ê³??¸ë¬¼ ê´€ê³„ë„ ?Œê°œ
- ë¯¸ì„¸???´ìƒ ê¸°ë¥˜ 3-4ê°?ë³µì„  ?½ì…
- ì£¼ë? ?¸ë¬¼?¤ê³¼???ì—°?¤ëŸ¬???€???¥ë©´??
- ?í™© ?¤ëª…?€ ?„ê¸° ?í™© ?ì—???ì—°?¤ëŸ½ê²??¸ê¸‰
- ê³¼ê±° ë°°ê²½?€ ìµœì†Œ?œë§Œ, ?„ì¬ ?„í—˜??ì§‘ì¤‘
- ì¡°ë ¥?ì???ë§Œë‚¨, ì¦‰ê°?ì¸ ?„í”¼
- ?”ë”©: ?????Œëª¨ê°€ ?ˆìŒ???”ì‹œ

ì±•í„°2 ?„ê°œ(?˜ì‹¬???¨ì•—)
- ê°€ì¡??¸ì²™???˜ìƒ???‰ë™?¤ì„ êµ¬ì²´???í”¼?Œë“œë¡?
- ê²½ì œÂ·ë¬¸ì„œÂ·ë³‘ë ¥Â·ë³´í—˜ ???„ì‹¤???¨ì„œ?¤ì˜ ?°ì† ë°œê²¬
- ì£¼ì¸ê³µì˜ ê´€ì°°Â·ë©”ëª??µê??¼ë¡œ ?œì„œ??ê¸´ì¥ ê³ ì¡°
- ?¼ìƒ ??ë¶ˆì•ˆê°ì´ ì»¤ì????¬ë¦¬ ë¬˜ì‚¬
- ì¡°ë ¥?ì???ì²?ë§Œë‚¨?´ë‚˜ ?ŒíŠ¸ ?œê³µ
- ê³¼ê±° ê²½í—˜?´ì„ ?µí•œ ì§ê°ê³?ì§€??ë°œíœ˜
- ì¡°ë ¥?ë? ?µí•œ ì¶©ê²©??ì§„ì‹¤ ??¡œ
- ?…ì—­??ê³¼ê±° ë²”ì£„ ?´ë ¥ ê³µê°œ
- ì£¼ì¸ê³µì´ ?¤ìŒ ?€ê²Ÿì„???•ì¸
- êµ¬ì²´??ì¦ê±°?€ ?„í—˜???œì‹œ
- ?”ë”©: ?…ì—­???¤ì‹œ ?‘ê·¼?´ì˜´

ì±•í„°3 ?„ê¸°(ì¶©ê²©??ë°°ì‹ )
- ëª¨ìš•Â·?¬ì‚°?ˆì·¨ ?œë„Â·ê°•ì œ ?”ì–‘ ì¶”ì§„ ??"?¬ì¥ ì² ë " ?¥ë©´??
- ?¬ëŸ¬ ë°°ì‹  ?í™©???°ì†?¼ë¡œ ?°ì???êµ¬ì„±
- ì£¼ì¸ê³µì˜ ì¢Œì ˆê³?ë¶„ë…¸, ?ˆë§???ì„¸???…ë°±
- ê°€ì¡±ë“¤???‰ì •??ë³¸ìƒ‰ ?œëŸ¬?´ëŠ” ?€?”ë“¤
- ?„ê¸° ?í™©?ì„œ???ìƒ??ê°ì • ?œí˜„
- ?¬ê¸° ì§ì „???í™©ê³??¬ë¦¬??ë°”ë‹¥ ê²½í—˜
- ?…ì—­ê³¼ì˜ ?•ë©´ ?€ê²??í™©
- ì£¼ì¸ê³µì˜ ?„ê¸°?€ ë¶„ë…¸ ??°œ
- ?ìƒ???€ê²??¥ë©´ê³??„í—˜???œê°„??
- ê°€ì¡±ì˜ ë°°ì‹  ?•ì¸ê³??ˆë§ê°?
- ?”ë”©: ì£¼ì¸ê³µì˜ ê°ì„±ê³?ë°˜ê²© ê²°ì‹¬

ì±•í„°4 ?? „(ê°ì„±ê³?ë°˜ê²©)
- ì¡°ë ¥??ë³¸ê²© ?±ì¥, ?ì„¸???‘ì „ ?˜ë¦½ ê³¼ì •
- ë²•Â·ì œ?„Â·ê¸°???œìš©???©ë²•??ë°˜ê²© ì¤€ë¹?
- ì¹˜ë???ê³„íš (?¹ì·¨Â·ë¬¸ì„œ?•ì¸Â·?„ì„?¥Â·ê³µì¦Â·CCTVÂ·?µì¥?´ì—­ ??
- ì£¼ì¸ê³µì˜ ê°ì„±ê³??˜ì? ?¤ì?ê¸?ê³¼ì •
- ì¦ê±° ?˜ì§‘ê³??¤íŠ¸?Œí¬ êµ¬ì¶• ?¥ë©´??
- ë°˜ê²© ì§ì „??ê¸´ì¥ê°ê³¼ ê²°ì˜ ?œí˜„
- ì¡°ë ¥?ì???ì¹˜ë????‘ì „ ?˜ë¦½
- êµ¬ì²´?ì´ê³??„ì‹¤?ì¸ ?¨ì • ?¤ì¹˜
- ë²•ì  ?¥ì¹˜?€ ì¦ê±° ?•ë³´ ê³¼ì •
- ê¸´ì¥ê°??ˆëŠ” ì¤€ë¹??¥ë©´??
- ?”ë”©: ìµœì¢… ?€ê²?ì§ì „??ê¸´ì¥ê°?

ì±•í„°5 ?´ê²°(?µì¾Œ??ë³µìˆ˜ & ?¬ë§)
- ì§„ì‹¤ ê³µê°œ??ê·¹ì  ?¥ë©´, ?ì„¸???€ê²?êµ¬ë„
- ?…ì¸??ëª°ë½ ê³¼ì •???¨ê³„ë³„ë¡œ ?¸ë??˜ê²Œ
- ê¶Œì„ ì§•ì•…, ëª…ì˜ˆ ?Œë³µ, ?¬íšŒ???¸ì •
- ì£¼ì¸ê³µì˜ ?ˆë¡œ???œì‘ê³??±ì¥
- ?„ì¼?´ê³¼ êµí›ˆ, ?¤ë¥¸ ?´ë¥´? ë“¤?ê²Œ ë¯¸ì¹˜???í–¥
- ?°ëœ»?˜ê³  ?¬ë§ì°?ë§ˆë¬´ë¦?ë©”ì‹œì§€

?€??ê°€?´ë“œ (?¤ë””??ì¹œí™”)
?„ì…Â·?„ê°œÂ·?„ê¸°Â·?? „Â·ê²°ë§ ê°??¥ë©´ë³??µì‹¬ ?´ë ˆ?´ì…˜ 23ì¤?+ ?€??34ì¤?
ê°ì • ?œí˜„ ?ˆì‹œ ?½ì…: "ë­”ê? ?´ìƒ?ˆì–´??, "ê°€?´ì´ ?“ì–´?¬ë?´ìš”", "???´ìƒ ?¹í•˜ê³ ë§Œ ?ˆì„ ???†ì—ˆ?´ìš”" ??

CTA (ë§ˆë¬´ë¦?ë©˜íŠ¸)
"?˜ì´ê°€ ?¤ì—ˆ?¤ê³  ?¬ê¸°?˜ì? ë§ˆì„¸?? ??2ë¬¸ì¥ + êµ¬ë… ? ë„ 1ë¬¸ì¥(?¸ê³¨??ë¶€???€???¤ìŒ ???ˆê³ ??.

3) ë³€??ê·œì¹™ (?œì ˆ ?Œí”¼Â·?ˆë¡œ?€ ê°•í™”)
- ê´€ê³„Â·ì—­??ì¹˜í™˜: ë©°ëŠë¦¬â†’?¬ìœ„/?ì£¼ ë³´í˜¸?? ?œì–´ë¨¸ë‹ˆ?’ê³ ëª??°ì´ëª???
- ë°°ì‹  ?™ê¸° ë³€?? ?¨ìˆœ ?ì†?’ë³´?˜Â·ì±„ë¬´Â·ë¸Œ?œë“œ ?‰íŒÂ·?˜ë£Œ ê²°ì •ê¶????„ì‹¤ ?œë„ ?˜ì œë¡?
- ë°°ê²½ ?„í™˜: ?„ì‹œ/ê·¼êµ/?¬ê°œë°?êµ¬ì—­/?„ì›ì£¼íƒ/?œì¥?ì¸/?”ì–‘ ê´€??ê¸°ê? ???í™œë°€ì°?ê³µê°„
- ?œì‚¬ ê´€??ë³€?? 1???´ë ˆ?´ì…˜ ì¤‘ì‹¬ + ê°„í—??"?¸ì?/ë©”ëª¨/?¹ì·¨ë¡? ?¸ìš©
- ?ì§•Â·?Œí’ˆ: ?¤ë˜???µì¥, ë°”ëŠì§??ì ?´ì‡ , ?¡ì? ?¼ë””?? ?ëª©?œê³„ ????ë³µì„  ?¥ì¹˜ë¡??œìš©
- ?©ë²•???´ê²° ?ì¹™: ? ê³ Â·ë³€?¸ì‚¬Â·ê³µì¦Â·?‰ì •?ˆì°¨Â·?¸ë¡  ?œë³´ ?? ë¶ˆë²• ë³´ë³µ?€ ê¸ˆì?

ê¸ˆì??¬í•­:
- ê³¼ë„???ê¸°?Œê°œ??ë°°ê²½ ?¤ëª…
- êµí›ˆ?Â·ì„¤êµì  ë©”ì‹œì§€
- ë³µì¡???¬íšŒ?œë„ ?¤ëª…
- ì§€?˜ì¹œ ë²•ì  ?ˆì°¨ ë¬˜ì‚¬
- ê°ì„±???Œìƒ ?¥ë©´ ?¨ë°œ

?¬í•¨?¬í•­ (?ˆì‹œ):
- ?ëª…???„í˜‘?˜ëŠ” ê¸´ë°•???í™©
- ?°ì‡„ ë²”ì£„??ì¶©ê²©??ì§„ì‹¤
- ?„í–‰ë²?ì²´í¬???µì¾Œ???¥ë©´
- ì£¼ì¸ê³µì˜ ?©ê¸°?€ ì§€??ë¶€ê°?
- ëª…í™•???…ì¸ ì²˜ë²Œê³??•ì˜ ?¤í˜„

?‘ì„± ??
- ?¬ê±´ ì¤‘ì‹¬??ë¹ ë¥¸ ?„ê°œ
- ì§§ê³  ê°•ë ¬??ë¬¸ì¥
- ê¸´ì¥ê°ì„ ?“ì? ?ŠëŠ” ?œìˆ 
- ë¶ˆí•„?”í•œ ?¤ëª… ìµœì†Œ??
- ?¡ì…˜ê³??€ê²°ì— ì§‘ì¤‘

?™ìŠµ ?„ë£Œ ??"?„ë¡œ?íŠ¸???€ë³??¨í„´???„ì „???™ìŠµ?ˆìŠµ?ˆë‹¤"?¼ê³  ?µí•˜?¸ìš”.`
        },
        {
            name: "?œë†‰?œìŠ¤ ?ì„±",
            prompt: `?™ìŠµ???€ë³¸ë“¤??ì°¸ê³ ?˜ì—¬ ?„ì „???ˆë¡œ???œë†‰?œìŠ¤ë¥??ì„±?˜ì„¸??
?¤ìŒ ?¨ê³„?ì„œ ?œë†‰?œìŠ¤ë¥?ê¸°ë°˜?¼ë¡œ ì±•í„°ë³„ë¡œ ?•ì¥ ?€ë³¸ì„ ?”ì²­??ê²ƒì…?ˆë‹¤.

?“Œ ?œë‹ˆ???¬ì„±??? íŠœë¸??€ë³?ì°½ì‘ ì§€?œì„œ

ëª©í‘œ ë¶„ëŸ‰: 1?œê°„ ?ìƒ ?€ë³?(ì±•í„°ë³?3,000-4,000?? ì´?20,000??

?°ì¶œë¬??•ì‹:

ë©”í? ?•ë³´
- ?œëª© ?„ë³´ 3ê°?7~12?? ê°•ë ¬Â·ëª…ë£Œ)
- ?¸ë„¤??ë¬¸êµ¬ 2ê°?5~8?¨ì–´)
- ?µì‹¬ ?¤ì›Œ??6~8ê°?
- ?ˆìƒ ?¬ìƒ?œê°„: 55-65ë¶?

ìºë¦­???œíŠ¸
ì£¼ì¸ê³?70?€ ?„í›„, ?¬ì„±): ê²‰ëª¨???±ê²©/ê³¼ê±°/?„ì¬ ì§ì—… ?ëŠ” ??• /?µì‹¬ ê²°í•Â·ê°€ì¹˜ê?
?…ì—­(30~40?€): ê²‰ëª¨???¬íšŒ??ê°€ë©?ì§„ì§œ ?•ë§/?˜ë‹¨(?¬ê¸°Â·ê°€?¤ë¼?´íŒ… ??
ì¡°ë ¥??20~30?€): ì§ì—…/ì£¼ì¸ê³µê³¼???‘ì /?œê³µ ??Ÿ‰(ë²•Â·ì˜ë£ŒÂ·í–‰?•Â·íƒ??
ë³´ì¡° ?¸ë¬¼ 2~3ëª? ?´ì•¼ê¸°ì  ê¸°ëŠ¥(?¤í•´ ? ë°œ, ì¦ì–¸, ê°ˆë“± ì¦í­, ê°ì •??ì§€ì§€)

?°í‘œ/?˜ì´ ?¼ì¹˜ ??
- ìµœì†Œ 7?? ?„ì¬ë¶€??ê³¼ê±° ?œì„œ

ë³µì„  & ?Œìˆ˜ ë¦¬ìŠ¤??
- ì´ˆë°˜ ?¨ì„œ 5~7ê°?+ ?Œìˆ˜ ?œì ê³?ë°©ì‹

?•ì¥??5ì±•í„° ?œë†‰?œìŠ¤
- ì±•í„°1: ì¶©ê²©???¤í”„??+ ?¼ìƒ
- ì±•í„°2: ?˜ì‹¬???¨ì•—
- ì±•í„°3: ë°°ì‹ ê³??„ê¸°
- ì±•í„°4: ê°ì„±ê³?ë°˜ê²©
- ì±•í„°5: ?µì¾Œ???´ê²°`
        },
        {
            name: "ì±•í„°1 ?€ë³?,
            prompt: `???œë†‰?œìŠ¤??ì±•í„°1??3,000???´ìƒ?¼ë¡œ ?•ì¥?˜ì„¸??

?‘ì„± ?ˆì‹œ:
???„ì²´ ?´ìš©??ê°€???˜ì´?¼ì´??: ì¶©ê²©?ì¸ ?¥ë©´, ?¸ê¸°??ê¶ê¸ˆì¦ì„ ? ë°œ?˜ëŠ” ?„í‚¹?¼ë¡œ ?œì‘.
??ì£¼ì¸ê³??Œê°œ (?í™©???ì—°?¤ëŸ½ê²??¹ì—¬????
???¼ìƒ ë¬˜ì‚¬: ?œë‹ˆ??ê³µê° ?”í…Œ??
??ë³µì„  2-3ê°??½ì…
???€??3-5ì¤? "?¼ê³  ë§í–ˆ?´ìš”" ?•ì‹
???”ë”© ?? ?¤ìŒ ì±•í„° ê¶ê¸ˆì¦?

ë§íˆ¬: "~?ˆì–´???ˆë‹µ?ˆë‹¤" 1?¸ì¹­ êµ¬ì–´ì²?
ë¶€ê°€ ?¤ëª… ?†ì´ ?˜ë ˆ?´ì…˜ ?€ë³¸ë§Œ ?‘ì„± (ì²??œì‘ 25ì´ˆì˜ ?¥ë©´??ë³„ë„ë¡?êµ¬ë¶„?´ì„œ 5?¥ë©´?¼ë¡œ ?„ì£¼ ê¸´ë°•?˜ê³  ?¸ë??˜ê²Œ ë¬˜ì‚¬?˜ê³ , ?´í›„ ?´ìš©?€ ?¥ë©´ ?„í™˜???ì ˆ??ë¶€ë¶„ì„ 3êµ°ë°ë¡??˜ëˆ„?´ì„œ ì´?8ê°œì˜ ì½”ë“œë¸”ëŸ­???‘ì„±?©ë‹ˆ??)`
        },
        {
            name: "ì±•í„°2 ?€ë³?,
            prompt: `ì±•í„°2ë¥?3,500???´ìƒ?¼ë¡œ ?•ì¥?˜ì„¸??

?”ì†Œ ?ˆì‹œ:
???´ìƒ ì§•í›„: ê°€ì¡±ì˜ ?˜ìƒ???‰ë™
??êµ¬ì²´???¨ì„œ: ?œë¥˜, ?µì¥, ë³´í—˜ ??
??ê¸´ì¥ê°??ìŠ¹: ?˜ì‹¬?’ë¶ˆ??
??ë³µì„  ì¶”ê? 2ê°?
???€??4-6ì¤?
???”ë”© ?? ?„ê¸° ?”ì‹œ

ë¶€ê°€ ?¤ëª… ?†ì´ ?˜ë ˆ?´ì…˜ ?€ë³¸ë§Œ ?‘ì„± (?¥ë©´ ?„í™˜???ì ˆ??ë¶€ë¶„ì„ 3êµ°ë°ë¡??˜ëˆ„?´ì„œ ì´?3ê°œì˜ ì½”ë“œë¸”ëŸ­???‘ì„±?©ë‹ˆ??)`
        },
        {
            name: "ì±•í„°3 ?€ë³?,
            prompt: `ì±•í„°3??4,000???´ìƒ?¼ë¡œ ?•ì¥?˜ì„¸??

?”ì†Œ ?ˆì‹œ:
??ì¶©ê²©??ë°°ì‹  ?¥ë©´
??ê°ì • ??°œ: "?ˆì•??ìº„ìº„?ˆì–´??
??êµ¬ì²´???„ê¸° ?í™©
??ë³µì„  ?Œìˆ˜ 1ê°??´ìƒ
???€??5-7ì¤?
???”ë”© ?? ë°˜ê²© ?˜ì?

ë¶€ê°€ ?¤ëª… ?†ì´ ?˜ë ˆ?´ì…˜ ?€ë³¸ë§Œ ?‘ì„± (?¥ë©´ ?„í™˜???ì ˆ??ë¶€ë¶„ì„ 3êµ°ë°ë¡??˜ëˆ„?´ì„œ ì´?3ê°œì˜ ì½”ë“œë¸”ëŸ­???‘ì„±?©ë‹ˆ??)`
        },
        {
            name: "ì±•í„°4 ?€ë³?,
            prompt: `ì±•í„°4ë¥?3,500???´ìƒ?¼ë¡œ ?•ì¥?˜ì„¸??

?”ì†Œ ?ˆì‹œ:
??ê°ì„±: "???´ìƒ ?¹í•˜ì§€ ?Šê² ?´ìš”"
??ì¡°ë ¥???±ì¥/ì¦ê±° ë°œê²¬
??êµ¬ì²´??ë°˜ê²© ì¤€ë¹?
??ë³µì„  ?Œìˆ˜ 2ê°?
???€??4-6ì¤?
???”ë”© ?? ?€ê²??ˆê³ 

ë¶€ê°€ ?¤ëª… ?†ì´ ?˜ë ˆ?´ì…˜ ?€ë³¸ë§Œ ?‘ì„± (?¥ë©´ ?„í™˜???ì ˆ??ë¶€ë¶„ì„ 3êµ°ë°ë¡??˜ëˆ„?´ì„œ ì´?3ê°œì˜ ì½”ë“œë¸”ëŸ­???‘ì„±?©ë‹ˆ??)`
        },
        {
            name: "ì±•í„°5 ?€ë³?,
            prompt: `ì±•í„°5ë¥?3,000???´ìƒ?¼ë¡œ ?•ì¥?˜ì„¸??

?”ì†Œ ?ˆì‹œ:
??ì§„ì‹¤ ??¡œ??ê·¹ì  ?¥ë©´
???…ì¸??ëª°ë½
??ê¶Œì„ ì§•ì•… ?¤í˜„
??ëª¨ë“  ë³µì„  ?Œìˆ˜
???€??5-7ì¤?
???¬ë§ ë©”ì‹œì§€: "?˜ì´ê°€ ?¤ì—ˆ?¤ê³  ?¬ê¸°?˜ì? ë§ˆì„¸??
??êµ¬ë…? ë„ : ?´ì–´???ì—°?¤ëŸ½ê²??¤ìŒ ?´ì•¼ê¸°ë? ?ˆê³ ?˜ëŠ” ë¬¸ì¥ ì¶”ê?.
   - ?? "?´ì•¼ê¸°ê? ë§ˆìŒ???œì…¨?¤ë©´ êµ¬ë…?˜ì‹œê³? ?¤ìŒ?????¤ë ¤?œë¦´ ???´ì•¼ê¸°ë? ê¸°ë‹¤?¤ì£¼?¸ìš”."

ë¶€ê°€ ?¤ëª… ?†ì´ ?˜ë ˆ?´ì…˜ ?€ë³¸ë§Œ ?‘ì„± (?¥ë©´ ?„í™˜???ì ˆ??ë¶€ë¶„ì„ 3êµ°ë°ë¡??˜ëˆ„?´ì„œ ì´?3ê°œì˜ ì½”ë“œë¸”ëŸ­???‘ì„±?©ë‹ˆ??)`
        },
        {
            name: "ë©”í??°ì´??,
            prompt: `?„ì„±???€ë³¸ì˜ ë©”í??°ì´???ì„±:

1. ?œëª© 5ê°?(?ê·¹?? 7-12??
2. ?¸ë„¤??ë¬¸êµ¬ 5ê°?(ì¶©ê²© ?¥ë©´)
3. ?¤ëª…?€ (ì±„ë„: ?„í† ?•ì•„ Story)
   - ?¤í™” ê¸°ë°˜ ?¬êµ¬?? ê°œì¸?•ë³´ ë³´í˜¸ë¥??„í•´ ê°ìƒ‰ ?¸ê¸‰
   - êµ¬ë…/ì¢‹ì•„??? ë„
4. ?œê·¸ 10ê°?

ê°???ª©ë³„ë¡œ ë³µì‚¬ ê°€?¥í•˜?„ë¡ êµ¬ë¶„`
        },
        {
            name: "ë¯¸ë“œ?€???„ë¡¬?„íŠ¸",
            prompt: `ì±•í„°ë³„ë¡œ ?˜ëˆˆ ì½”ë“œë¸”ëŸ­???µì‹¬ ?¥ë©´??ë¯¸ë“œ?€???„ë¡¬?„íŠ¸ë¡?(?„í‚¹ ?¬í•¨ ì´?18ê°?:

ê·¹ì‚¬?¤ì£¼???¤í???(photo of, hyperrealistic)
?œêµ­???¤ì • (Korean elderly woman)
ê°??„ë¡¬?„íŠ¸ ë³µì‚¬ ê°€?¥í•˜?„ë¡ êµ¬ë¶„`
        },
        {
            name: "ìµœì¢… ?•ë¦¬ (?€ë³?+ ?„ë¡¬?„íŠ¸)",
            prompt: `ì±•í„° 1-5???„ì²´ ?€ë³¸ê³¼ ë¯¸ë“œ?€???„ë¡¬?„íŠ¸ë¥?ìµœì¢… ?•ë¦¬?´ì£¼?¸ìš”.

? ï¸ ë°˜ë“œ???„ë˜ ?•ì‹ ê·¸ë?ë¡?ì¶œë ¥?˜ì„¸??
? ï¸ ë§ˆì»¤ ë°”ê¹¥?ëŠ” ?ˆë? ?„ë¬´ê²ƒë„ ?°ì? ë§ˆì„¸??
? ï¸ "??, "?Œê² ?µë‹ˆ?? ê°™ì? ë§ë„ ê¸ˆì?.

---SCRIPT_START---
(ì±•í„°1ë¶€??ì±•í„°5ê¹Œì? ?„ì²´ ?€ë³¸ì„ ?œì„œ?€ë¡??©ì³???‘ì„±)
---SCRIPT_END---

---PROMPTS_START---
1. (ì²?ë²ˆì§¸ ë¯¸ë“œ?€???„ë¡¬?„íŠ¸)
2. (??ë²ˆì§¸ ë¯¸ë“œ?€???„ë¡¬?„íŠ¸)
...
18. (ë§ˆì?ë§?ë¯¸ë“œ?€???„ë¡¬?„íŠ¸)
---PROMPTS_END---`
        }
    ];

    // ============================================
    // UI ?¤í???
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
    // ? í‹¸ë¦¬í‹° ?¨ìˆ˜
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
                          document.querySelector('button[aria-label="?‘ë‹µ ì¤‘ë‹¨"]');
        return stopButton !== null;
    }

    async function waitForResponseComplete(maxWait = 1800000) { // ?”¥ 30ë¶„ìœ¼ë¡??˜ë¦¼ (ê¸??„ë¡¬?„íŠ¸ ?€ë¹?
        const startTime = Date.now();

        addStatus('??Claude ?‘ë‹µ ?€ê¸?ì¤?..');
        let responseStarted = false;

        for (let i = 0; i < 40; i++) { // ?”¥ 10ì´???20ì´ˆë¡œ ?˜ë¦¼
            if (isClaudeResponding()) {
                responseStarted = true;
                addStatus('?ï¸ Claude ?‘ë‹µ ì¤?..');
                break;
            }
            await sleep(500);
        }

        if (!responseStarted) {
            addStatus('???‘ë‹µ ?„ë£Œ (ì¦‰ì‹œ)');
            await sleep(2000); // ?”¥ 1ì´???2ì´ˆë¡œ ?˜ë¦¼
            return true;
        }

        // 2?¨ê³„: ?‘ë‹µ ?„ë£Œ ?€ê¸?(ë²„íŠ¼ ?¬ë¼ì§??Œê¹Œì§€)
        let checkCount = 0;

        while (isClaudeResponding()) {
            const elapsed = Date.now() - startTime;

            // ?”¥ ?€?„ì•„??ì²´í¬
            if (elapsed > maxWait) {
                addStatus(`? ï¸ ?‘ë‹µ ?€?„ì•„??(${maxWait/60000}ë¶?ì´ˆê³¼)`, 'error');
                throw new Error('?‘ë‹µ ?€?„ì•„??);
            }

            // ?”¥ 30ì´ˆë§ˆ??ì§„í–‰ ?í™© ë¡œê·¸
            checkCount++;
            if (checkCount % 30 === 0) {
                const elapsedMin = Math.floor(elapsed / 60000);
                const elapsedSec = Math.floor((elapsed % 60000) / 1000);
                addStatus(`   ???‘ë‹µ ?€ê¸?ì¤?.. (${elapsedMin}ë¶?${elapsedSec}ì´?ê²½ê³¼)`);
            }

            await sleep(1000);
        }

        addStatus('??Claude ?‘ë‹µ ?„ë£Œ!', 'success');
        await sleep(2000); // ?”¥ 2ì´?(?ˆì •??
        return true;
    }

    // ============================================
    // ?„ë¡¬?„íŠ¸ ?…ë ¥ ?¨ìˆ˜
    // ============================================
    async function inputPrompt(promptText, maxRetries = 5) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                addStatus(`[${attempt}/${maxRetries}] ë©”ì‹œì§€ ?„ì†¡ ?œë„...`);

                const inputField = document.querySelector('div.ProseMirror[contenteditable="true"]') ||
                                  document.querySelector('div[contenteditable="true"]');

                if (!inputField) {
                    throw new Error('?…ë ¥ ?„ë“œë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤');
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
                                document.querySelector('button[aria-label="ë©”ì‹œì§€ ë³´ë‚´ê¸?]');

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
                    throw new Error('?„ì†¡ ë²„íŠ¼ ?†ìŒ/ë¹„í™œ?±í™”');
                }

                sendButton.click();
                addStatus(`??ë©”ì‹œì§€ ?„ì†¡ ?±ê³µ!`, 'success');

                await waitForResponseComplete();
                return true;

            } catch (error) {
                addStatus(`? ï¸ ?¤íŒ¨: ${error.message}`, 'error');

                if (attempt < maxRetries) {
                    const waitTime = attempt * 2;
                    addStatus(`   ${waitTime}ì´????¬ì‹œ??..`);
                    await sleep(waitTime * 1000);
                } else {
                    throw error;
                }
            }
        }
        return false;
    }

    // ============================================
    // ?‘ë‹µ ?˜ì§‘ ?¨ìˆ˜ (ë§ˆì»¤ ê¸°ë°˜ ì¶”ì¶œ)
    // ============================================
    function collectResponse() {
        try {
            const responses = document.querySelectorAll('[data-message-author-role="assistant"]');
            console.log(`?” ?‘ë‹µ ê°œìˆ˜: ${responses.length}`);

            // ============================================
            // ?”¥ 10?¨ê³„(ë§ˆì?ë§??ì„œë§?ë§ˆì»¤ ê¸°ë°˜ ì¶”ì¶œ
            // ============================================
            if (currentStep === MAX_STEPS) {
                // ëª¨ë“  ?‘ë‹µ?ì„œ ë§ˆì»¤ ì°¾ê¸° (??ˆœ)
                for (let i = responses.length - 1; i >= 0; i--) {
                    const responseText = responses[i].textContent || responses[i].innerText || '';

                    // ?”¥ ?™ê¸°ë¶€???¤í¬ë¦½íŠ¸?€ ?™ì¼??ë§ˆì»¤
                    const scriptStart = '---SCRIPT_START---';
                    const scriptEnd = '---SCRIPT_END---';
                    const promptsStart = '---PROMPTS_START---';
                    const promptsEnd = '---PROMPTS_END---';

                    if (responseText.includes(scriptStart) && responseText.includes(scriptEnd)) {
                        console.log(`?” ?‘ë‹µ #${i}?ì„œ ë§ˆì»¤ ë°œê²¬`);

                        // ?€ë³?ì¶”ì¶œ
                        const scriptStartIdx = responseText.indexOf(scriptStart) + scriptStart.length;
                        const scriptEndIdx = responseText.indexOf(scriptEnd);
                        const cleanScript = responseText.substring(scriptStartIdx, scriptEndIdx).trim();

                        // ?´ë?ì§€ ?„ë¡¬?„íŠ¸ ì¶”ì¶œ
                        let imagePrompts = [];
                        if (responseText.includes(promptsStart) && responseText.includes(promptsEnd)) {
                            const promptsStartIdx = responseText.indexOf(promptsStart) + promptsStart.length;
                            const promptsEndIdx = responseText.indexOf(promptsEnd);
                            const promptsText = responseText.substring(promptsStartIdx, promptsEndIdx).trim();

                            // ë²ˆí˜¸ ?¨í„´?¼ë¡œ ë¶„ë¦¬ (1. 2. 3. ...)
                            imagePrompts = promptsText.split(/\n?\d+\.\s*/)
                                .map(line => line.trim())
                                .filter(line => line.length > 10);

                            // ?”¥ ë²ˆí˜¸ ?¨í„´ ?¤íŒ¨ ??ì¤„ë°”ê¿ˆìœ¼ë¡?ë¶„ë¦¬ (ë°±ì—…)
                            if (imagePrompts.length < 5) {
                                console.log('? ï¸ ë²ˆí˜¸ ?¨í„´ ?¤íŒ¨, ì¤„ë°”ê¿ˆìœ¼ë¡??¬ì‹œ??);
                                imagePrompts = promptsText.split('\n')
                                    .map(line => line.trim())
                                    .filter(line => line.length > 20);
                            }
                        }

                        console.log('??ë§ˆì»¤ ê¸°ë°˜ ì¶”ì¶œ ?±ê³µ!');
                        console.log('   - ?€ë³?', cleanScript.length, 'ê¸€??);
                        console.log('   - ?´ë?ì§€ ?„ë¡¬?„íŠ¸:', imagePrompts.length, 'ê°?);

                        // ?”¥ ?€ë³??€??(?™ê¸°ë¶€?¬ì? ?™ì¼)
                        localStorage.setItem('FINAL_SCRIPT', cleanScript);
                        window.FINAL_SCRIPT_FOR_PYTHON = cleanScript;

                        // ?”¥ ?´ë?ì§€ ?„ë¡¬?„íŠ¸ ?€??(?™ê¸°ë¶€?¬ì? ?™ì¼)
                        if (imagePrompts.length > 0) {
                            const promptsJson = JSON.stringify(imagePrompts);
                            localStorage.setItem('IMAGE_PROMPTS', promptsJson);
                            window.IMAGE_PROMPTS = imagePrompts;

                            // JSON ?•ì‹?¼ë¡œ???€??(Python ?¸í™˜)
                            const scriptData = {
                                image_prompts: imagePrompts
                            };
                            localStorage.setItem('SENIOR_SCRIPT_JSON', JSON.stringify(scriptData));
                            window.SENIOR_SCRIPT_JSON = scriptData;
                        }

                        return cleanScript;
                    }
                }

                console.warn('? ï¸ 10?¨ê³„?¸ë° ë§ˆì»¤ ëª?ì°¾ìŒ');
            }

            // ============================================
            // ì¤‘ê°„ ?¨ê³„: ê¸°ë³¸ ?‘ë‹µ ?˜ì§‘
            // ============================================
            if (responses.length > 0) {
                const lastResponse = responses[responses.length - 1];
                const fallbackText = lastResponse.textContent || lastResponse.innerText || '';
                
                console.log(`?“ ${currentStep}?¨ê³„ ?‘ë‹µ: ${fallbackText.length}??);
                return fallbackText;
            }

            return '';
        } catch (error) {
            console.error('??collectResponse ?¤ë¥˜:', error);
            return '';
        }
    }

    // ============================================
    // UI ?ì„±
    // ============================================
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'script-automation-panel';
        panel.innerHTML = `
            <h3>?¯ Create: ?œë‹ˆ???¤í† ë¦??€ë³??ì„±</h3>
            <div style="text-align: center;">
                <span class="category-badge">SENIOR STORY</span>
            </div>

            <div class="info-box" style="display: none;">
                <label>?’¡ ì£¼ì œ/?¤ì›Œ??(? íƒ?¬í•­)</label>
                <textarea id="user-input"
                          placeholder="???œë‹ˆ???¤í† ë¦¬ëŠ” ?ë™ ?ì„±?©ë‹ˆ??
??ì²¨ë??Œì¼???€ë³¸ë“¤???™ìŠµ?˜ì—¬
  ?ˆë¡œ???œë‹ˆ???¬ì„±???¤í† ë¦¬ë? ë§Œë“­?ˆë‹¤

(???„ë“œ???¬ìš©?˜ì? ?ŠìŠµ?ˆë‹¤)"></textarea>
                <small>Python?ì„œ ?ë™ ?…ë ¥?©ë‹ˆ??/small>
            </div>

            <div class="step-counter">
                ?¨ê³„: <span id="step-count">0 / 7</span>
                <div class="step-name" id="step-name">?€ê¸?ì¤?/div>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>

            <button id="start-btn">?? ?€ë³??ì„± ?œì‘</button>
            <button id="stop-btn">??ì¤‘ì?</button>
            <button id="download-btn" disabled>???‘ì—… ?„ë£Œ</button>

            <div id="automation-status"></div>
        `;
        document.body.appendChild(panel);

        document.getElementById('start-btn').addEventListener('click', startGeneration);
        document.getElementById('stop-btn').addEventListener('click', stopGeneration);
    }

    // ============================================
    // ë©”ì¸ ?ë™???¨ìˆ˜
    // ============================================
    async function startGeneration() {
        // Python?ì„œ ?…ë ¥???„ë¡¬?„íŠ¸/?¤ì›Œ??ê°€?¸ì˜¤ê¸?
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

        addStatus('?? ?œë‹ˆ???¤í† ë¦??€ë³??ì„± ?œì‘!', 'success');
        addStatus('?“Œ ì²¨ë??Œì¼ ?™ìŠµ ???ë™ ?ì„± ëª¨ë“œ');

        // ë°±ê·¸?¼ìš´??ë°©ì?
        function keepAlive() {
            if (isRunning) requestAnimationFrame(keepAlive);
        }
        keepAlive();

        while (isRunning && currentStep < MAX_STEPS) {
            const step = STEP_PROMPTS[currentStep];
            currentStep++;
            updateStepDisplay();

            addStatus(`?“ ${currentStep}?¨ê³„: ${step.name}`);

            try {
                const promptToSend = step.prompt;

                const success = await inputPrompt(promptToSend);

                if (!success) {
                    addStatus(`??${step.name} ?¤íŒ¨`, 'error');
                    await sleep(3000);
                    currentStep--;
                    continue;
                }

                await sleep(2000);

                // Continue ë²„íŠ¼ ì²˜ë¦¬
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

                addStatus(`??${step.name} ?„ë£Œ`, 'success');

            } catch (error) {
                addStatus(`? ï¸ ?¤ë¥˜: ${error.message}`, 'error');
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
            btn => btn.textContent.includes('Continue') || btn.textContent.includes('ê³„ì†')
        );

        if (continueBtn) {
            continueBtn.click();
            addStatus('??Continue ë²„íŠ¼ ?´ë¦­??);
            return true;
        }
        return false;
    }

    function stopGeneration() {
        isRunning = false;
        document.getElementById('start-btn').style.display = 'block';
        document.getElementById('stop-btn').style.display = 'none';

        if (currentStep >= MAX_STEPS) {
            addStatus('?‰ ?€ë³??ì„± ?„ë£Œ!', 'success');
            addStatus('?“‹ JSON??localStorage???€?¥ë¨', 'success');

            // ?”¥ ?„ë£Œ ë²„íŠ¼ ?œì„±??(Python??ê°ì?)
            document.getElementById('download-btn').disabled = false;

            // ê²°ê³¼ ?•ì¸??
            const savedJson = localStorage.getItem('MOTIVATION_SCRIPT_JSON');
            if (savedJson) {
                console.log('=== ?ì„±??JSON ===');
                console.log(JSON.parse(savedJson));
            }
        } else {
            addStatus('???ì„± ì¤‘ë‹¨??);
        }
    }

    // ============================================
    // ì´ˆê¸°??(ì§œê¹ê¸??¤í¬ë¦½íŠ¸ ê¸°ë°˜)
    // ============================================
    function init() {
        console.log('?¯ Create Motivation ?¤í¬ë¦½íŠ¸ ì´ˆê¸°???œì‘...');
        console.log('?“ ?„ì¬ URL:', window.location.href);

        if (!document.body) {
            console.error('??document.bodyê°€ ?†ìŠµ?ˆë‹¤!');
            setTimeout(init, 1000);
            return;
        }

        const existingPanel = document.getElementById('script-automation-panel');
        if (existingPanel) {
            console.log('?—‘ï¸?ê¸°ì¡´ ?¨ë„ ?œê±°');
            existingPanel.remove();
        }

        try {
            createPanel();
            console.log('???¨ë„ ?ì„± ?œë„ ?„ë£Œ');

            const panel = document.getElementById('script-automation-panel');
            if (panel) {
                console.log('???¨ë„??DOM??ì¶”ê???);
                addStatus('???œë‹ˆ???¤í† ë¦??ì„±ê¸?ì¤€ë¹??„ë£Œ');
                addStatus('?? ë²„íŠ¼???ŒëŸ¬ ?œì‘?˜ì„¸??);
            } else {
                console.error('???¨ë„ ?ì„± ?¤íŒ¨!');
            }
        } catch (error) {
            console.error('??ì´ˆê¸°???¤ë¥˜:', error);
        }
    }

    // ESC ?¤ë¡œ ?¨ë„ ?¨ê¸°ê¸?ë³´ì´ê¸?
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('script-automation-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        }
    });

    // ?˜ì´ì§€ ë¡œë“œ ?€ê¸?(ì§œê¹ê¸??¤í¬ë¦½íŠ¸ ë°©ì‹)
    function waitForPageLoad() {
        const body = document.body;
        const main = document.querySelector('main');
        const readyState = document.readyState;

        console.log('?” ë¡œë”© ?íƒœ:', {
            hasBody: !!body,
            hasMain: !!main,
            readyState: readyState
        });

        if (body && main && (readyState === 'interactive' || readyState === 'complete')) {
            console.log('???˜ì´ì§€ ë¡œë“œ ?„ë£Œ - ì´ˆê¸°???œì‘');
            setTimeout(() => {
                console.log('?¬ init() ?¤í–‰');
                init();

                setTimeout(() => {
                    const panel = document.getElementById('script-automation-panel');
                    console.log('?“¦ ?¨ë„ ?ì„± ?•ì¸:', !!panel);
                    if (panel) {
                        console.log('??UI ?•ìƒ ?œì‹œ??);
                    } else {
                        console.error('??UI ?ì„± ?¤íŒ¨ - ?¬ì‹œ??);
                        init();
                    }
                }, 500);
            }, 2000);
        } else {
            console.log('???˜ì´ì§€ ë¡œë”© ?€ê¸?ì¤?..');
            setTimeout(waitForPageLoad, 500);
        }
    }

    // ?œì‘
    waitForPageLoad();

})();

// ============================================================
// Claude ?ì—… ì°¨ë‹¨
// ============================================================
(function() {
    'use strict';
    
    function killPopup() {
        document.querySelectorAll('[role="dialog"], [role="alertdialog"]').forEach(dialog => {
            const text = dialog.textContent || '';
            if (text.includes('Claudeë¥?ê³„ì†') || text.includes('Continue using') || 
                text.includes('?¬ìš©?˜ì‹œê² ì–´??) || text.includes('usage') || text.includes('?ìœ„ ?Œëœ')) {
                console.log('?”¥ ?ì—… ?œê±°');
                dialog.remove();
            }
        });
        
        document.querySelectorAll('[class*="backdrop"], [class*="overlay"], [class*="modal"]').forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex) || 0;
            
            if (zIndex > 999 && style.position === 'fixed') {
                console.log('?”¥ ?¤ë²„?ˆì´ ?œê±°');
                el.remove();
            }
        });
        
        document.body.style.overflow = '';
        document.querySelectorAll('[inert]').forEach(el => el.removeAttribute('inert'));
    }
    
    const observer = new MutationObserver(killPopup);
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(killPopup, 2000);
    
    console.log('???ì—… ì°¨ë‹¨ ?œì„±??);
})();
// trigger update 2025-12-31 06:51:01
