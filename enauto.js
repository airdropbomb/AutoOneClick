// ==UserScript==
// @name         Binance Isolated Margin Auto Closer - Ultra Fast
// @namespace    http://tampermonkey.net/
// @version      2.8.7.2
// @description  Ultra fast auto closer with prompt-based license key validation - BTC-Trader @yannaingko2
// @author       BTC-Trader
// @match        https://www.binance.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // License Validation Logic
    let licenseKey = GM_getValue('licenseKey', '');
    let isLicenseValid = GM_getValue('isLicenseValid', false);
    let isRunning = false;

    // Initialize script
    waitForDocumentReady(() => {
        log('Document ready, initializing script...', 'info');
        initializeAutoCloseScript();
    });

    function log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        if (type === 'error') {
            console.error('❌', logMessage);
        } else if (type === 'success') {
            console.log('✅', logMessage);
        } else if (type === 'warning') {
            console.warn('⚠️', logMessage);
        } else {
            console.log('🔧', logMessage);
        }
        updateStatus(message, type);
    }

    function waitForDocumentReady(callback) {
        log('Checking document readiness...', 'info');
        console.log('Initial document.readyState:', document.readyState, 'document.body:', !!document.body);
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            log('Document state: ' + document.readyState, 'info');
            setTimeout(callback, 200); // Increased delay for SPA stability
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                log('DOMContentLoaded triggered', 'info');
                setTimeout(callback, 200);
            });
            window.addEventListener('load', () => {
                log('Window load triggered', 'info');
                setTimeout(callback, 200);
            });
        }
    }

    function initializeAutoCloseScript() {
        log('Ultra Fast Version Loading...', 'success');
        if (!isLicenseValid) {
            promptLicenseKey();
        } else {
            createControlPanelWithRetry();
        }
    }

    function promptLicenseKey() {
        log('Prompting for license key...', 'info');
        const inputKey = prompt('Enter License Key:', licenseKey);
        if (inputKey === null) {
            log('License key prompt cancelled', 'warning');
            alert('License key required to run the script.');
            return;
        }

        licenseKey = inputKey.trim();
        if (!licenseKey) {
            log('No license key provided', 'error');
            alert('License key required to run the script.');
            promptLicenseKey();
            return;
        }

        log('Validating license key...', 'info');
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://us-central1-autoclose-6aa22.cloudfunctions.net/validateLicense',
            data: JSON.stringify({ key: licenseKey }),
            headers: { 'Content-Type': 'application/json' },
            onload: function(response) {
                let data;
                try {
                    data = JSON.parse(response.responseText);
                } catch (e) {
                    log('Error parsing server response: ' + e, 'error');
                    alert('Error parsing server response. Please try again later.');
                    promptLicenseKey();
                    return;
                }

                if (data.valid) {
                    GM_setValue('licenseKey', licenseKey);
                    GM_setValue('isLicenseValid', true);
                    isLicenseValid = true;
                    log('License activated successfully!', 'success');
                    alert('License activated! Script is ready.');
                    createControlPanelWithRetry();
                } else {
                    GM_setValue('isLicenseValid', false);
                    GM_deleteValue('licenseKey');
                    isLicenseValid = false;
                    licenseKey = '';
                    log('Invalid or already used license key: ' + data.error, 'error');
                    alert('Invalid or already used license key! Please try again.');
                    promptLicenseKey();
                }
            },
            onerror: function() {
                log('Error connecting to license server.', 'error');
                alert('Error connecting to license server. Please try again later.');
                GM_setValue('isLicenseValid', false);
                GM_deleteValue('licenseKey');
                isLicenseValid = false;
                licenseKey = '';
                promptLicenseKey();
            }
        });
    }

    function createControlPanelWithRetry(attempt = 1) {
        const maxRetries = 15;
        if (attempt > maxRetries) {
            log(`Failed to create control panel after ${maxRetries} attempts`, 'error');
            alert('Failed to create control panel. Please refresh the page manually.');
            return;
        }

        log(`Creating control panel (attempt ${attempt}/${maxRetries}), document.readyState: ${document.readyState}, document.body: ${!!document.body}, location: ${window.location.href}`, 'info');

        if (!document.body || document.readyState !== 'complete') {
            log(`Document not fully loaded, retrying (${attempt}/${maxRetries})...`, 'warning');
            setTimeout(() => createControlPanelWithRetry(attempt + 1), 1000 * attempt);
            return;
        }

        try {
            createControlPanel();
            log('Control panel created successfully', 'success');
        } catch (error) {
            log(`Error creating control panel (attempt ${attempt}/${maxRetries}): ${error}`, 'error');
            setTimeout(() => createControlPanelWithRetry(attempt + 1), 1000 * attempt);
        }
    }

    function createControlPanel() {
        const existingPanel = document.getElementById('btc-margin-closer');
        if (existingPanel) {
            existingPanel.remove();
            log('Removed existing control panel', 'info');
        }

        const panel = document.createElement('div');
        panel.id = 'btc-margin-closer';
        panel.style.cssText = `
            position: fixed;
            top: 70px;
            right: 10px;
            z-index: 1000000;
            background: #1e2026;
            border: 2px solid #f0b90b;
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-width: 400px;
            box-shadow: 0 6px 25px rgba(0,0,0,0.8);
            font-size: 13px;
        `;

        panel.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px; font-weight: bold; color: #f0b90b;">
                🚀 Ultra Fast Auto Closer
            </div>
            <div id="status-display" style="background: #2b2f36; padding: 10px; border-radius: 6px; margin-bottom: 10px; text-align: center; font-size: 12px;">
                🟢 Ready - Click START to begin
            </div>
            <button id="start-btn" style="width: 100%; padding: 10px; background: #0ecb81; color: white; border: none; border-radius: 6px; cursor: pointer;">
                🚀 START
            </button>
            <button id="stop-btn" style="width: 100%; padding: 10px; background: #ea3943; color: white; border: none; border-radius: 6px; cursor: pointer; display: none;">
                🛑 STOP
            </button>
        `;

        log('Appending control panel to document.body', 'info');
        document.body.appendChild(panel);
        log('Control panel appended successfully', 'success');

        setTimeout(() => {
            setupEventListeners();
        }, 100);
    }

    function updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('status-display');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.borderLeftColor = type === 'error' ? '#ea3943' : type === 'success' ? '#0ecb81' : type === 'warning' ? '#f0b90b' : '#f0b90b';
            statusElement.style.color = type === 'error' ? '#ea3943' : type === 'success' ? '#0ecb81' : type === 'warning' ? '#f0b90b' : 'white';
        }
    }

    function setupEventListeners() {
        try {
            const startBtn = document.getElementById('start-btn');
            const stopBtn = document.getElementById('stop-btn');

            if (!startBtn || !stopBtn) {
                log('Control panel buttons not found, retrying panel creation...', 'error');
                createControlPanelWithRetry();
                return;
            }

            startBtn.addEventListener('click', () => {
                if (!isLicenseValid) {
                    log('License not validated, prompting for key...', 'warning');
                    promptLicenseKey();
                    return;
                }
                if (!isRunning) {
                    isRunning = true;
                    log('Start button clicked - Auto closer started', 'success');
                    updateStatus('Auto closer running...', 'success');
                    startBtn.style.display = 'none';
                    stopBtn.style.display = 'block';
                    startAutoClose();
                }
            });

            stopBtn.addEventListener('click', () => {
                if (isRunning) {
                    isRunning = false;
                    log('Stop button clicked - Auto closer stopped', 'success');
                    updateStatus('Auto closer stopped', 'warning');
                    stopBtn.style.display = 'none';
                    startBtn.style.display = 'block';
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isRunning) {
                    isRunning = false;
                    log('Emergency stop triggered by ESC key', 'warning');
                    updateStatus('Emergency stop triggered', 'warning');
                    stopBtn.style.display = 'none';
                    startBtn.style.display = 'block';
                }
            });

            log('Event listeners set up successfully', 'success');
        } catch (error) {
            log('Error setting up event listeners: ' + error, 'error');
            createControlPanelWithRetry();
        }
    }

    function startAutoClose() {
        log('Starting auto close process...', 'success');
        updateStatus('Scanning for positions...', 'info');

        // Placeholder for position scanning logic
        setTimeout(() => {
            log('Scanning positions (placeholder)...', 'info');
            updateStatus('No positions found (placeholder)', 'info');
            if (isRunning) {
                setTimeout(startAutoClose, 5000); // Loop every 5 seconds
            }
        }, 1000);
    }

    // Monitor panel existence
    setTimeout(() => {
        if (!document.getElementById('btc-margin-closer') && isLicenseValid) {
            log('Control panel not found after initialization, retrying...', 'warning');
            createControlPanelWithRetry();
        }
    }, 5000);

    log('Ultra Fast Version Successfully Loaded!', 'success');
})();
