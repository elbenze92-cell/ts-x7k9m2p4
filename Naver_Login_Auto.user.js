
// test 2025-12-06 22:40:02

// test 12/06/2025 22:59:46

// ============================================================
// Claude 팝업 강력 차단 (MutationObserver)
// ============================================================
(function() {
    'use strict';
    
    function killPopup() {
        // 1. 팝업 다이얼로그 제거
        document.querySelectorAll('[role="dialog"], [role="alertdialog"]').forEach(dialog => {
            const text = dialog.textContent || '';
            if (text.includes('Claude를 계속') || 
                text.includes('Continue using') ||
                text.includes('사용하시겠어요') ||
                text.includes('usage') ||
                text.includes('상위 플랜')) {
                console.log('🔥 Claude 팝업 강제 제거!');
                dialog.remove();
            }
        });
        
        // 2. 오버레이/백드롭 제거 (강화)
        document.querySelectorAll('[class*="backdrop"], [class*="overlay"], [class*="modal"], [style*="position: fixed"]').forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex) || 0;
            const position = style.position;
            const bgColor = style.backgroundColor;
            
            // z-index 높고 position fixed이고 배경색 있으면 제거
            if ((zIndex > 999 || position === 'fixed') && 
                (bgColor.includes('rgba') || bgColor.includes('rgb'))) {
                console.log('🔥 오버레이 제거:', el.className);
                el.remove();
            }
        });
        
        // 3. body 스크롤 복구
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.documentElement.style.overflow = '';
        
        // 4. inert 속성 제거 (팝업이 전체 페이지 차단하는 경우)
        document.querySelectorAll('[inert]').forEach(el => {
            el.removeAttribute('inert');
        });
    }
    
    const observer = new MutationObserver(() => killPopup());
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(killPopup, 500);
    console.log('✅ Claude 팝업 차단 활성화됨 (오버레이 강화)');
})();