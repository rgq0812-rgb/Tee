// Global error handler - must be FIRST
if (typeof window !== 'undefined') {
    window.onerror = function(msg, url, lineNo, columnNo, error) {
        const root = document.getElementById('root');
        if (root) {
            root.style.background = 'red';
            root.style.color = 'white';
            root.style.display = 'flex';
            root.style.flexDirection = 'column';
            root.style.padding = '20px';
            root.style.fontSize = '12px';
            root.innerHTML = `
                <h1 style="font-size:20px;margin-bottom:10px;">ONYX CRITICAL ERROR</h1>
                <p><strong>Message:</strong> ${msg}</p>
                <p><strong>File:</strong> ${url}</p>
                <p><strong>Line:</strong> ${lineNo}</p>
                <pre style="background:rgba(0,0,0,0.2);padding:10px;margin-top:10px;white-space:pre-wrap;">${error?.stack || 'No stack trace available'}</pre>
                <button onclick="window.location.reload()" style="margin-top:20px;padding:10px;background:white;color:red;border:none;font-weight:bold;cursor:pointer;">RETRY MISSION</button>
            `;
        }
        console.error("[ONYX CRITICAL]", msg, error);
        return false;
    };

    window.onunhandledrejection = (event) => {
        console.error("[ONYX UNHANDLED REJECTION]", event.reason);
    };
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

console.log("[ONYX] Main entry point hit");

async function init() {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    try {
        const { default: App } = await import('./App.tsx');
        const root = createRoot(rootElement);
        root.render(
            <StrictMode>
                <App />
            </StrictMode>
        );
    } catch (e: any) {
        console.error("[ONYX] Initialization failed:", e);
        rootElement.style.background = '#000';
        rootElement.style.color = '#c9964a';
        rootElement.innerHTML = `<div style="padding:40px;text-align:center;font-family:sans-serif;"><h1>ONYX BOOT FAILURE</h1><p>${e.message}</p></div>`;
    }
}

init();
