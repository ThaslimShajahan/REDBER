/**
 * Redber AI Chatbot Integration Script
 * Add this script to your website's <body> to display the floating chat widget.
 *
 * IMPORTANT: Do NOT use the `async` attribute — it causes document.currentScript
 * to be null by the time the IIFE executes. Use defer or no attribute instead.
 *
 * Usage:
 *   Production:  <script src="https://redber.in/widget.js" data-bot-id="your-bot-id"></script>
 *   Local test:  <script src="http://localhost:3000/widget.js" data-bot-id="your-bot-id" data-domain="http://localhost:3000"></script>
 */
(function() {
    // document.currentScript works synchronously (without async attribute).
    // Fallback: find our own script tag by looking for a data-bot-id attribute.
    var scriptTag = document.currentScript;
    if (!scriptTag) {
        var scripts = document.querySelectorAll('script[data-bot-id]');
        scriptTag = scripts[scripts.length - 1] || null;
    }
    if (!scriptTag) {
        console.error('Redber AI Widget: Could not locate script tag. Do not use the async attribute.');
        return;
    }

    var botId = scriptTag.getAttribute('data-bot-id');
    var domain = scriptTag.getAttribute('data-domain') || 'https://redber.in';

    if (!botId) {
        console.error('Redber AI Widget: Missing data-bot-id attribute.');
        return;
    }

    // Container for widget
    var container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end';

    // Create iframe to host the Chatbot component securely
    var iframe = document.createElement('iframe');
    iframe.src = domain + '/embed/' + botId;
    iframe.allow = 'microphone';
    iframe.style.border = 'none';
    iframe.style.width = '420px';
    iframe.style.height = '600px';
    iframe.style.maxWidth = 'calc(100vw - 40px)';
    iframe.style.maxHeight = 'calc(100vh - 100px)';
    iframe.style.borderRadius = '24px';
    iframe.style.boxShadow = '0 20px 80px rgba(0,0,0,0.6)';
    iframe.style.display = 'none';
    iframe.style.marginBottom = '16px';
    iframe.style.background = '#0a0a0a';
    iframe.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(20px)';

    // Create the floating action button
    var btn = document.createElement('button');
    var chatIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    var closeIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    btn.innerHTML = chatIcon;
    btn.style.width = '64px';
    btn.style.height = '64px';
    btn.style.borderRadius = '50%';
    btn.style.background = 'linear-gradient(135deg, #e11d48, #f43f5e)';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 10px 25px rgba(225, 29, 72, 0.4)';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.36, 1)';

    btn.onmouseover = function() { btn.style.transform = 'scale(1.05)'; };
    btn.onmouseout  = function() { btn.style.transform = 'scale(1)'; };

    var isOpen = false;
    btn.onclick = function() {
        isOpen = !isOpen;
        if (isOpen) {
            iframe.style.display = 'block';
            setTimeout(function() {
                iframe.style.opacity = '1';
                iframe.style.transform = 'translateY(0)';
            }, 10);
            btn.innerHTML = closeIcon;
        } else {
            iframe.style.opacity = '0';
            iframe.style.transform = 'translateY(20px)';
            setTimeout(function() {
                iframe.style.display = 'none';
            }, 300);
            btn.innerHTML = chatIcon;
        }
    };

    container.appendChild(iframe);
    container.appendChild(btn);
    document.body.appendChild(container);

    // Auto-open after 5 seconds if not manually opened
    setTimeout(function() {
        if (!isOpen && document.visibilityState === 'visible') {
            btn.click();
        }
    }, 5000);
})();
