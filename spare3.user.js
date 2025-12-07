// ==UserScript==
// @name         여분3
// @namespace    http://tampermonkey.net/
// @version      2.2.0
// @description  롱폼 대본 분석 후 숏츠 생성 - 수동 다운로드 버전
// @author       You
// @match        https://claude.ai/project/019ad908-8efa-7774-b0ba-d5a34ee0b1d1
// @updateURL    https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/spare3.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/elbenze92-cell/ts-x7k9m2p4@main/spare3.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

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