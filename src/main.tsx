// Force dark background immediately to avoid white flash/screen
if (typeof document !== 'undefined') {
  document.body.style.backgroundColor = '#000';
  console.log("[ONYX] Early style applied");
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler
if (typeof window !== 'undefined') {
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'position:fixed;top:0;left:0;z-index:10000;background:red;color:white;padding:10px;font-family:monospace;font-size:12px;width:100%;word-break:break-all;';
    errorMsg.innerText = '[ONYX CRITICAL] ' + msg + '\nFile: ' + url + '\nLine: ' + lineNo + '\nStack: ' + (error?.stack || 'no stack');
    document.body.appendChild(errorMsg);
    console.error("[ONYX CRITICAL]", msg, error);
    return false;
  };
}

console.log("[ONYX] Main entry point hit");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found");
  
  console.log("[ONYX] Initializing React root");
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log("[ONYX] Render called");
} catch (e: any) {
  const errorMsg = document.createElement('div');
  errorMsg.style.cssText = 'position:fixed;top:0;left:0;z-index:10000;background:red;color:white;padding:20px;font-family:monospace;';
  errorMsg.innerHTML = '<h1>Echec Initialisation ONYX</h1><p>' + e.message + '</p>';
  document.body.appendChild(errorMsg);
}
