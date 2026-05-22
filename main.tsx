import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

console.log("Intelligence: main.tsx execution started");

// Global error handling
window.addEventListener('error', (event) => {
    console.error("Intelligence: Global Error Caught:", event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error("Intelligence: Unhandled Rejection Detected");
    console.error("Reason Type:", typeof event.reason);
    console.error("Reason Value:", event.reason);
    
    if (event.reason instanceof Error) {
        console.error("Stack Trace:", event.reason.stack);
    } else if (event.reason && typeof event.reason === 'object') {
        try {
            console.error("Reason Object (JSON):", JSON.stringify(event.reason, null, 2));
        } catch {
            console.error("Reason Object (Circular):", event.reason);
        }
    }
});

const rootElement = document.getElementById('root');

if (!rootElement) {
    console.error("Intelligence: Root element not found!");
} else {
    try {
        console.log("Intelligence: Attempting to render React app");
        const root = ReactDOM.createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </React.StrictMode>
        );
        console.log("Intelligence: React render called");
    } catch (error) {
        console.error("Intelligence: Critical error during initialization:", error);
        rootElement.innerHTML = `
            <div style="padding: 20px; color: white; background: #6366f1;">
                <h1>Intelligence Initialisation Protocol Failure</h1>
                <pre>${error instanceof Error ? error.stack : String(error)}</pre>
            </div>
        `;
    }
}
