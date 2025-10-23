// ==UserScript==
// @name         Binance Isolated Margin Auto Closer - Ultra Fast
// @namespace    http://tampermonkey.net/
// @version      2.8.7.3
// @description  Ultra fast auto closer with prompt-based license key validation and group-based trading - BTC-Trader @yannaingko2
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
    let currentGroup = GM_getValue('selectedGroup', null);
    let operationMode = GM_getValue('operationMode', 'single');
    let selectedSinglePair = GM_getValue('selectedSinglePair', null);
    let currentPairIndex = 0;
    let currentPositionCount = 0;
    let totalClosed = 0;
    let errorCount = 0;
    let lastActivityTime = Date.now();
    let scanInterval = null;

    const CONFIG = {
        CHECK_INTERVAL: 5,
        DELAY_BETWEEN_CLICKS: 2,
        MODAL_WAIT_TIME: 20,
        REFRESH_DELAY: 3000,
        ERROR_RETRY_DELAY: 500,
        IDLE_REFRESH_TIMEOUT: 300000,
        PANEL_CREATION_RETRIES: 15,
        PANEL_CREATION_DELAY: 1000
    };

    const BTC_GROUPS = {
        0: {
            'name': 'BTC/USDT',
            'category': 'Main Pair',
            'pairs': ['BTCUSDT']
        },
        1: {
            'name': 'Group 1',
            'category': 'A-B Pairs',
            'pairs': [
                '1INCHBTC', 'AAVEBTC', 'ADABTC', 'AGLDBTC', 'ALGOBTC',
                'APEBTC', 'ARBBTC', 'ARBTC', 'ARPABTC', 'ATOMBTC',
                'AUCTIONBTC', 'AUDIOBTC', 'AVAXBTC', 'AXSBTC', 'BATBTC'
            ]
        },
        2: {
            'name': 'Group 2',
            'category': 'B-D Pairs',
            'pairs': [
                'BCHBTC', 'BNBBTC', 'CAKEBTC', 'CELOBTC', 'CFXBTC',
                'CHRBTC', 'CHZBTC', 'COMPBTC', 'COTIBTC', 'CRVBTC',
                'CTKBTC', 'CTSIBTC', 'DASHBTC', 'DIABTC', 'DOGEBTC'
            ]
        },
        3: {
            'name': 'Group 3',
            'category': 'D-I Pairs',
            'pairs': [
                'DOTBTC', 'DUSKBTC', 'DYDXBTC', 'EGLDBTC', 'ENABTC',
                'ENJBTC', 'ENSBTC', 'ETCBTC', 'ETHBTC', 'FETBTC',
                'FILBTC', 'GALABTC', 'GRTBTC', 'HBARBTC', 'INJBTC'
            ]
        },
        4: {
            'name': 'Group 4',
            'category': 'I-Y Pairs',
            'pairs': [
                'IOTXBTC', 'JSTBTC', 'KAVABTC', 'ONTBTC', 'OXTBTC',
                'SNXBTC', 'SUSHIBTC', 'UNIBTC', 'YFIBTC', 'ZRXBTC',
                'FLOWBTC', 'FLUXBTC', 'GASBTC', 'GLMBTC', 'HIVEBTC'
            ]
        },
        5: {
            'name': 'Group 5',
            'category': 'I-N Pairs',
            'pairs': [
                'ICPBTC', 'ICXBTC', 'IDBTC', 'IOTABTC', 'KNCBTC',
                'KSMBTC', 'LINKBTC', 'LPTBTC', 'LRCBTC', 'LTCBTC',
                'MANABTC', 'MINABTC', 'MOVRBTC', 'MTLBTC', 'NEARBTC'
            ]
        },
        6: {
            'name': 'Group 6',
            'category': 'N-R Pairs',
            'pairs': [
                'NEOBTC', 'NMRBTC', 'OGNBTC', 'OMBTC', 'ONGBTC',
                'OPBTC', 'PAXGBTC', 'PEOPLEBTC', 'POWRBTC', 'PYRBTC',
                'QNTBTC', 'RAREBTC', 'REQBTC', 'RLCBTC', 'ROSEBTC'
            ]
        },
        7: {
            'name': 'Group 7',
            'category': 'R-V Pairs',
            'pairs': [
                'RUNEBTC', 'SANDBTC', 'SEIBTC', 'SOLBTC', 'STORJBTC',
                'STXBTC', 'SUIBTC', 'SUPERBTC', 'SXPBTC', 'SYSBTC',
                'THETABTC', 'TRBBTC', 'TRXBTC', 'UMABTC', 'VETBTC'
            ]
        },
        8: {
            'name': 'Group 8',
            'category': 'W-Z & USDT',
            'pairs': [
                'WANBTC', 'WAXPBTC', 'WLDBTC', 'XLMBTC', 'XRPBTC',
                'XTZBTC', 'YGGBTC', 'ZECBTC', 'USDTBTC'
            ]
        }
    };

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
            setTimeout(callback, 200);
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
        const maxRetries = CONFIG.PANEL_CREATION_RETRIES;
        if (attempt > maxRetries) {
            log(`Failed to create control panel after ${maxRetries} attempts`, 'error');
            alert('Failed to create control panel. Please refresh the page manually.');
            return;
        }

        log(`Creating control panel (attempt ${attempt}/${maxRetries}), document.readyState: ${document.readyState}, document.body: ${!!document.body}, location: ${window.location.href}`, 'info');

        if (!document.body || document.readyState !== 'complete') {
            log(`Document not fully loaded, retrying (${attempt}/${maxRetries})...`, 'warning');
            setTimeout(() => createControlPanelWithRetry(attempt + 1), CONFIG.PANEL_CREATION_DELAY * attempt);
            return;
        }

        try {
            createControlPanel();
            log('Control panel created successfully', 'success');
        } catch (error) {
            log(`Error creating control panel (attempt ${attempt}/${maxRetries}): ${error}`, 'error');
            setTimeout(() => createControlPanelWithRetry(attempt + 1), CONFIG.PANEL_CREATION_DELAY * attempt);
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
            min-width: 450px;
            box-shadow: 0 6px 25px rgba(0,0,0,0.8);
            font-size: 13px;
            max-height: 75vh;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px; font-weight: bold; color: #f0b90b;">
                🚀 Ultra Fast Auto Closer
            </div>
            <div id="status-display" style="background: #2b2f36; padding: 10px; border-radius: 6px; margin-bottom: 10px; text-align: center; font-size: 12px;">
                🟢 Ready - Select mode and click START
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 15px;">
                <button id="start-btn" style="padding: 12px; background: #0ecb81; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">
                    🚀 START
                </button>
                <button id="refresh-btn" style="padding: 12px; background: #f0b90b; color: black; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">
                    🔄 REFRESH
                </button>
                <button id="activate-tab-btn" style="padding: 12px; background: #2172e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">
                    📍 ACTIVATE TAB
                </button>
            </div>
            <button id="stop-btn" style="width: 100%; padding: 12px; background: #ea3943; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; margin-bottom: 15px; display: none;">
                🛑 STOP AUTO CLOSER
            </button>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 6px; font-size: 11px; color: #848e9c; font-weight: bold;">⚙️ OPERATION MODE:</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button id="multiple-mode-btn" style="padding: 10px; background: ${operationMode === 'single' ? '#3a3221' : '#2b2f36'}; color: ${operationMode === 'single' ? '#f0b90b' : '#848e9c'}; border: 2px solid ${operationMode === 'single' ? '#f0b90b' : '#848e9c'}; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">
                        🔄 MULTIPLE MODE
                    </button>
                    <button id="single-mode-btn" style="padding: 10px; background: ${operationMode === 'single-pair' ? '#3a243b' : '#2b2f36'}; color: ${operationMode === 'single-pair' ? 'white' : '#848e9c'}; border: 2px solid ${operationMode === 'single-pair' ? '#ea3943' : '#848e9c'}; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">
                        ⚡ SINGLE MODE
                    </button>
                </div>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 6px; font-size: 11px; color: #848e9c; font-weight: bold;">📊 SELECT TRADING GROUP:</label>
                <select id="group-select" style="width: 100%; padding: 8px; border-radius: 5px; background: #2b2f36; color: white; border: 1px solid #848e9c; font-size: 12px;">
                    <option value="">-- Select Trading Group --</option>
                    ${Object.entries(BTC_GROUPS).map(([key, group]) => `
                        <option value="${key}" ${currentGroup !== null && parseInt(key) === currentGroup ? 'selected' : ''}>
                            [${key}] ${group.name} - ${group.pairs.length} pairs
                        </option>
                    `).join('')}
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 6px; font-size: 11px; color: #848e9c; font-weight: bold;">🎯 SELECT SINGLE PAIR:</label>
                <select id="single-pair-select" style="width: 100%; padding: 8px; border-radius: 5px; background: #2b2f36; color: white; border: 1px solid #848e9c; font-size: 12px;">
                    <option value="">-- Select Trading Pair --</option>
                    ${getAllPairs().map(pair => `
                        <option value="${pair}" ${selectedSinglePair === pair ? 'selected' : ''}>${pair}</option>
                    `).join('')}
                </select>
            </div>
            <div style="background: #2b2f36; padding: 10px; border-radius: 5px; text-align: center;">
                <div style="font-size: 10px; color: #848e9c;">
                    <strong>EMERGENCY STOP:</strong> Press <kbd style="background: #ea3943; color: white; padding: 1px 4px; border-radius: 2px;">ESC</kbd>
                </div>
            </div>
        `;

        log('Appending control panel to document.body', 'info');
        document.body.appendChild(panel);
        log('Control panel appended successfully', 'success');

        setTimeout(() => {
            setupEventListeners();
        }, 100);
    }

    function getAllPairs() {
        const allPairs = [];
        for (const group of Object.values(BTC_GROUPS)) {
            allPairs.push(...group.pairs);
        }
        return [...new Set(allPairs)].sort();
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
            const refreshBtn = document.getElementById('refresh-btn');
            const activateTabBtn = document.getElementById('activate-tab-btn');
            const groupSelect = document.getElementById('group-select');
            const singlePairSelect = document.getElementById('single-pair-select');
            const multipleModeBtn = document.getElementById('multiple-mode-btn');
            const singleModeBtn = document.getElementById('single-mode-btn');

            if (!startBtn || !stopBtn || !refreshBtn || !activateTabBtn || !groupSelect || !singlePairSelect || !multipleModeBtn || !singleModeBtn) {
                log('Control panel elements not found, retrying panel creation...', 'error');
                createControlPanelWithRetry();
                return;
            }

            startBtn.addEventListener('click', () => {
                if (!isLicenseValid) {
                    log('License not validated, prompting for key...', 'warning');
                    promptLicenseKey();
                    return;
                }
                if (operationMode === 'single' && currentGroup === null) {
                    log('No trading group selected', 'error');
                    updateStatus('Please select a trading group first', 'error');
                    alert('Please select a trading group first.');
                    return;
                }
                if (operationMode === 'single-pair' && selectedSinglePair === null) {
                    log('No trading pair selected', 'error');
                    updateStatus('Please select a trading pair first', 'error');
                    alert('Please select a trading pair first.');
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
                    if (scanInterval) clearInterval(scanInterval);
                    log('Stop button clicked - Auto closer stopped', 'success');
                    updateStatus('Auto closer stopped', 'warning');
                    stopBtn.style.display = 'none';
                    startBtn.style.display = 'block';
                }
            });

            refreshBtn.addEventListener('click', () => {
                log('Manual refresh triggered', 'info');
                GM_setValue('reactivatePositionsTab', true);
                window.location.reload();
            });

            activateTabBtn.addEventListener('click', () => {
                log('Activate tab button clicked', 'info');
                activatePositionsTab();
            });

            groupSelect.addEventListener('change', (e) => {
                currentGroup = e.target.value === "" ? null : parseInt(e.target.value);
                GM_setValue('selectedGroup', currentGroup);
                currentPairIndex = 0;
                updateModeInfo();
                updateDropdownStates();
                log(`Group changed to: ${currentGroup !== null ? BTC_GROUPS[currentGroup].name : 'None'}`, 'info');
            });

            singlePairSelect.addEventListener('change', (e) => {
                selectedSinglePair = e.target.value === "" ? null : e.target.value;
                GM_setValue('selectedSinglePair', selectedSinglePair);
                updateModeInfo();
                updateDropdownStates();
                log(`Single pair changed to: ${selectedSinglePair || 'None'}`, 'info');
            });

            multipleModeBtn.addEventListener('click', () => {
                setOperationMode('single');
            });

            singleModeBtn.addEventListener('click', () => {
                setOperationMode('single-pair');
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isRunning) {
                    isRunning = false;
                    if (scanInterval) clearInterval(scanInterval);
                    log('Emergency stop triggered by ESC key', 'warning');
                    updateStatus('Emergency stop triggered', 'warning');
                    stopBtn.style.display = 'none';
                    startBtn.style.display = 'block';
                }
            });

            updateModeInfo();
            updateOperationModeButtons();
            updateDropdownStates();
            log('Event listeners set up successfully', 'success');
        } catch (error) {
            log('Error setting up event listeners: ' + error, 'error');
            createControlPanelWithRetry();
        }
    }

    function setOperationMode(mode) {
        operationMode = mode;
        GM_setValue('operationMode', mode);
        updateModeInfo();
        updateOperationModeButtons();
        updateDropdownStates();
        log(`Operation mode changed to: ${mode}`, 'info');
    }

    function updateModeInfo() {
        const modeInfoElement = document.getElementById('mode-info');
        if (modeInfoElement) {
            if (operationMode === 'single' && currentGroup !== null) {
                const groupName = BTC_GROUPS[currentGroup].name;
                const currentPair = BTC_GROUPS[currentGroup].pairs[currentPairIndex];
                modeInfoElement.innerHTML = `Mode: <strong>Multiple (${groupName})</strong> | Pair: <strong>${currentPair}</strong>`;
            } else if (operationMode === 'single-pair' && selectedSinglePair) {
                modeInfoElement.innerHTML = `Mode: <strong>Single Pair</strong> | Pair: <strong>${selectedSinglePair}</strong>`;
            } else {
                modeInfoElement.innerHTML = 'Mode: <strong>Select mode</strong> | Pair: <strong>select</strong>';
            }
        }
    }

    function updateOperationModeButtons() {
        const multipleBtn = document.getElementById('multiple-mode-btn');
        const singleBtn = document.getElementById('single-mode-btn');
        if (multipleBtn && singleBtn) {
            multipleBtn.style.background = operationMode === 'single' ? '#3a3221' : '#2b2f36';
            multipleBtn.style.color = operationMode === 'single' ? '#f0b90b' : '#848e9c';
            multipleBtn.style.border = `2px solid ${operationMode === 'single' ? '#f0b90b' : '#848e9c'}`;
            singleBtn.style.background = operationMode === 'single-pair' ? '#3a243b' : '#2b2f36';
            singleBtn.style.color = operationMode === 'single-pair' ? 'white' : '#848e9c';
            singleBtn.style.border = `2px solid ${operationMode === 'single-pair' ? '#ea3943' : '#848e9c'}`;
        }
    }

    function updateDropdownStates() {
        const groupSelect = document.getElementById('group-select');
        const pairSelect = document.getElementById('single-pair-select');
        if (groupSelect && pairSelect) {
            groupSelect.disabled = operationMode === 'single-pair';
            pairSelect.disabled = operationMode === 'single';
        }
    }

    function startAutoClose() {
        log('Starting auto close process...', 'success');
        updateStatus('Activating Positions tab...', 'info');

        activatePositionsTab(() => {
            log('Positions tab activated, starting scan...', 'success');
            scanAndClosePositions();
        });
    }

    function activatePositionsTab(callback) {
        log('Activating Positions tab...', 'info');
        const selectors = [
            'div.draggableCancel.text-\\[14px\\][data-testid="Positions"]',
            'div[data-testid="Positions"]',
            '[data-testid="Positions"]',
            'div[class*="Positions"]',
            'button:contains("Positions")',
            'div:contains("Positions")'
        ];

        let attempts = 0;
        const maxAttempts = 5;

        function tryActivate() {
            attempts++;
            let tabFound = false;

            for (let selector of selectors) {
                try {
                    let positionsTab = document.querySelector(selector);
                    if (selector.includes(':contains')) {
                        const allTabs = document.querySelectorAll('div[class*="tab"], button[class*="tab"], div.draggableCancel');
                        for (let tab of allTabs) {
                            if (tab.textContent && tab.textContent.includes('Positions')) {
                                positionsTab = tab;
                                break;
                            }
                        }
                    }

                    if (positionsTab && positionsTab.isConnected && isElementVisible(positionsTab)) {
                        log(`Found Positions tab with selector: ${selector}`, 'success');
                        positionsTab.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                        safeClick(positionsTab, 'Positions Tab');
                        log('Positions tab activated successfully', 'success');
                        updateStatus('Positions tab activated', 'success');
                        setTimeout(callback, 1000);
                        tabFound = true;
                        break;
                    }
                } catch (error) {
                    // Continue
                }
            }

            if (!tabFound) {
                log(`Positions tab not found (attempt ${attempts}/${maxAttempts})`, 'warning');
                if (attempts < maxAttempts) {
                    setTimeout(tryActivate, 500);
                } else {
                    log('Positions tab activation failed after all attempts', 'error');
                    updateStatus('Positions tab not found - Manual navigation needed', 'error');
                    callback();
                }
            }
        }

        tryActivate();
    }

    function isElementVisible(element) {
        if (!element) return false;
        try {
            const style = window.getComputedStyle(element);
            return style.display !== 'none' &&
                   style.visibility !== 'hidden' &&
                   element.offsetParent !== null &&
                   element.offsetWidth > 0 &&
                   element.offsetHeight > 0;
        } catch (error) {
            return false;
        }
    }

    function safeClick(element, description) {
        try {
            if (element && element.isConnected && isElementVisible(element)) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                element.click();
                log(`Clicked: ${description}`, 'success');
                return true;
            }
            return false;
        } catch (error) {
            log(`Error clicking ${description}: ${error}`, 'error');
            return false;
        }
    }

    function scanAndClosePositions() {
        if (!isRunning) return;
        if (!isLicenseValid) {
            log('License not validated, stopping scan...', 'error');
            updateStatus('Please validate a license key to start.', 'error');
            return;
        }

        try {
            const positions = findOpenPositions();
            currentPositionCount = positions.length;
            updateStats();

            if (positions.length === 0) {
                log('No Close Position buttons found', 'info');
                updateStatus('No positions found - continuing scan...', 'info');
                if (Date.now() - lastActivityTime > CONFIG.IDLE_REFRESH_TIMEOUT) {
                    log('Idle timeout reached, refreshing page...', 'warning');
                    updateStatus('Idle timeout - Refreshing...', 'warning');
                    GM_setValue('reactivatePositionsTab', true);
                    window.location.reload();
                    return;
                }
                moveToNextPair();
            } else {
                let currentPair = operationMode === 'single' ? BTC_GROUPS[currentGroup].pairs[currentPairIndex] : selectedSinglePair;
                log(`Found ${positions.length} positions for ${currentPair}`, 'success');
                updateStatus(`Found ${positions.length} positions for ${currentPair} - Starting close process...`, 'warning');
                lastActivityTime = Date.now();
                closeNextPosition(positions, 0);
            }
        } catch (error) {
            log('Error during position scanning: ' + error, 'error');
            updateStatus('Error during scanning', 'error');
            setTimeout(scanAndClosePositions, CONFIG.ERROR_RETRY_DELAY);
        }
    }

    function findOpenPositions() {
        const positions = [];
        const processedPositions = new Set();
        const closeButtonTexts = ['Close Position', 'Close', 'Close All', 'Liquidate'];

        try {
            const allElements = document.querySelectorAll('button, div, span');
            for (let element of allElements) {
                try {
                    if (element.textContent && element.isConnected && isElementVisible(element)) {
                        const text = element.textContent.trim();
                        if (closeButtonTexts.some(btnText => text === btnText)) {
                            const positionId = generatePositionId(element);
                            if (!processedPositions.has(positionId)) {
                                positions.push({
                                    element: element,
                                    button: element,
                                    id: positionId
                                });
                                processedPositions.add(positionId);
                            }
                        }
                    }
                } catch (e) {
                    // Skip individual element errors
                }
            }
        } catch (error) {
            log('Error in findOpenPositions: ' + error, 'error');
        }

        return positions;
    }

    function generatePositionId(element) {
        const rect = element.getBoundingClientRect();
        const text = element.textContent || '';
        return `${text}-${rect.top}-${rect.left}-${Date.now()}`.replace(/\s+/g, '_');
    }

    function closeNextPosition(positions, index) {
        if (!isRunning) return;
        if (index >= positions.length) {
            updateStatus('All positions processed in current pair', 'success');
            moveToNextPair();
            return;
        }

        const position = positions[index];
        const currentPair = operationMode === 'single' ? BTC_GROUPS[currentGroup].pairs[currentPairIndex] : selectedSinglePair;
        updateStatus(`Closing position ${index + 1}/${positions.length} in ${currentPair}...`, 'warning');

        if (!position.button.isConnected) {
            setTimeout(() => closeNextPosition(positions, index + 1), CONFIG.DELAY_BETWEEN_CLICKS);
            return;
        }

        if (safeClick(position.button, 'Close Position button')) {
            setTimeout(() => {
                if (!isRunning) return;
                processModalButtons(position, () => {
                    totalClosed++;
                    errorCount = Math.max(0, errorCount - 1);
                    updateStats();
                    updateStatus(`Position ${index + 1} closed successfully in ${currentPair}`, 'success');
                    lastActivityTime = Date.now();
                    setTimeout(() => closeNextPosition(positions, index + 1), CONFIG.DELAY_BETWEEN_CLICKS);
                }, () => {
                    setTimeout(() => closeNextPosition(positions, index + 1), CONFIG.DELAY_BETWEEN_CLICKS);
                });
            }, CONFIG.MODAL_WAIT_TIME);
        } else {
            setTimeout(() => closeNextPosition(positions, index + 1), CONFIG.DELAY_BETWEEN_CLICKS);
        }
    }

    function processModalButtons(position, onSuccess, onError) {
        const settleBtn = findSettleButton();
        if (settleBtn && safeClick(settleBtn, 'Settle in BTC')) {
            setTimeout(() => {
                const confirmBtn = findConfirmButton();
                if (confirmBtn && safeClick(confirmBtn, 'Confirm')) {
                    setTimeout(() => onSuccess(), CONFIG.DELAY_BETWEEN_CLICKS);
                } else {
                    onSuccess();
                }
            }, CONFIG.DELAY_BETWEEN_CLICKS);
        } else {
            const confirmBtn = findConfirmButton();
            if (confirmBtn && safeClick(confirmBtn, 'Confirm')) {
                setTimeout(() => onSuccess(), CONFIG.DELAY_BETWEEN_CLICKS);
            } else {
                onError();
            }
        }
    }

    function findSettleButton() {
        try {
            const allButtons = document.querySelectorAll('button, div, span');
            for (let element of allButtons) {
                if (element.textContent && element.isConnected && isElementVisible(element)) {
                    const text = element.textContent.trim().toLowerCase();
                    if (text.includes('settle') && text.includes('btc')) {
                        return element;
                    }
                }
            }
        } catch (error) {
            log('Error finding settle button: ' + error, 'error');
        }
        return null;
    }

    function findConfirmButton() {
        try {
            const confirmSelectors = [
                'button[type="submit"]',
                'button[class*="confirm" i]',
                'button[class*="primary" i]',
                '[data-testid*="confirm" i]'
            ];
            const modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal" i]');
            for (let modal of modals) {
                for (let selector of confirmSelectors) {
                    const elements = modal.querySelectorAll(selector);
                    for (let element of elements) {
                        if (element.isConnected && isElementVisible(element)) {
                            return element;
                        }
                    }
                }
            }
        } catch (error) {
            log('Error finding confirm button: ' + error, 'error');
        }
        return null;
    }

    function moveToNextPair() {
        if (operationMode === 'single' && currentGroup !== null && currentPairIndex < BTC_GROUPS[currentGroup].pairs.length - 1) {
            currentPairIndex++;
            updateModeInfo();
            log(`Moving to next pair: ${BTC_GROUPS[currentGroup].pairs[currentPairIndex]}`, 'info');
            setTimeout(() => {
                if (isRunning) scanAndClosePositions();
            }, CONFIG.CHECK_INTERVAL);
        } else if (operationMode === 'single' && currentGroup !== null) {
            currentPairIndex = 0;
            updateModeInfo();
            log('Completed group cycle, restarting from first pair', 'info');
            setTimeout(() => {
                if (isRunning) scanAndClosePositions();
            }, CONFIG.CHECK_INTERVAL);
        } else {
            setTimeout(() => {
                if (isRunning) scanAndClosePositions();
            }, CONFIG.CHECK_INTERVAL);
        }
    }

    function updateStats() {
        const positionCountElement = document.getElementById('position-count');
        const totalClosedElement = document.getElementById('total-closed');
        if (positionCountElement) positionCountElement.textContent = currentPositionCount;
        if (totalClosedElement) totalClosedElement.textContent = totalClosed;
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
