if (typeof window !== 'undefined') {
    window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error("[ONYX CRITICAL]", msg, error);
        // Only show overlay if it's a real crash
        if (msg.toString().toLowerCase().includes('script error') || msg.toString().toLowerCase().includes('load failed')) return false;
        
        const root = document.getElementById('root');
        if (root && !root.innerHTML.includes('ONYX_ERROR')) {
            root.style.background = '#800';
            root.style.color = 'white';
            root.style.padding = '20px';
            root.style.fontFamily = 'monospace';
            root.innerHTML = `<div id="ONYX_ERROR"><h1>BOOT ERROR</h1><p>${msg}</p><button onclick="location.reload()" style="background:white;color:black;padding:10px;border:none;">RETRY MISSION</button></div>`;
        }
        return false;
    };
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}
