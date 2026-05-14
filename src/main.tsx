import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to help diagnosis white screens before React mounts
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

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found");
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (e: any) {
  const errorMsg = document.createElement('div');
  errorMsg.style.cssText = 'position:fixed;top:0;left:0;z-index:10000;background:red;color:white;padding:20px;font-family:monospace;';
  errorMsg.innerHTML = '<h1>Echec Initialisation ONYX</h1><p>' + e.message + '</p>';
  document.body.appendChild(errorMsg);
}
