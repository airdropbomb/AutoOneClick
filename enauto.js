// ==UserScript==
// @name         Binance Isolated Margin Auto Closer - Ultra Fast
// @namespace    http://tampermonkey.net/
// @version      2.8.7.1
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
    }

    function waitForDocumentReady(callback) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            log('Document state: ' + document.readyState, 'info');
            setTimeout(callback, 100); // Small delay to ensure DOM stability
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                log('DOMContentLoaded triggered', 'info');
                setTimeout(callback, 100);
            });
            window.addEventListener('load', () => {
                log('Window load triggered', 'info');
                setTimeout(callback, 100);
            });
        }
    }

    function initializeAutoCloseScript() {
        log('Ultra Fast Version Loading...');

        if (!isLicenseValid) {
            promptLicenseKey();
        } else {
            createControlPanelWithRetry();
        }
    }

    function promptLicenseKey() {
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
        const maxRetries = 10;
        if (attempt > maxRetries) {
            log(`Failed to create control panel after ${maxRetries} attempts`, 'error');
            alert('Failed to create control panel. Please refresh the page manually.');
            return;
        }

        log(`Creating control panel (attempt ${attempt}/${maxRetries}), document.readyState: ${document.readyState}, document.body: ${!!document.body}`, 'info');

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
                🟢 Ready - Select mode and click START
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

        setupEventListeners();
    }

    function setupEventListeners() {
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');

        if (!startBtn || !stopBtn) {
            log('Control panel buttons not found, retrying panel creation...', 'error');
            createControlPanelWithRetry();
            return;
        }

        startBtn.addEventListener('click', () => {
            log('Start button clicked', 'success');
            alert('Auto closer started!');
        });

        stopBtn.addEventListener('click', () => {
            log('Stop button clicked', 'success');
            alert('Auto closer stopped!');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                log('Emergency stop triggered by ESC key', 'warning');
                alert('Emergency stop triggered!');
            }
        });
    }

    // Minimal script for testing
    log('Ultra Fast Version Successfully Loaded!', 'success');
})();
