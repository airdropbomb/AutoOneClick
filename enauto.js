// ==UserScript==
// @name         Binance Isolated Margin Auto Closer - Ultra Fast
// @namespace    http://tampermonkey.net/
// @version      2.8.3
// @description  Ultra fast auto closer with license key validation - BTC-Trader @yannaingko2
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

    if (!licenseKey) {
        licenseKey = prompt('Enter your license key:');
        if (!licenseKey) {
            alert('License key required! Script will not run.');
            console.error('❌ License key required! Script stopped.');
            return;
        }
    }

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
                alert('Error parsing server response. Please try again later.');
                console.error('❌ Error parsing server response:', e);
                return;
            }

            if (data.valid) {
                GM_setValue('licenseKey', licenseKey);
                alert('License activated! Script is running.');
                console.log('✅ License activated! Starting auto-close script...');
                initializeAutoCloseScript();
            } else {
                alert('Invalid or already used license key! Script will not run.');
                console.error('❌ Invalid or already used license key:', data.error);
                GM_deleteValue('licenseKey');
                return;
            }
        },
        onerror: function() {
            alert('Error connecting to license server. Please try again later.');
            console.error('❌ Error connecting to license server.');
            return;
        }
    });

    // Original script logic wrapped in a function
    function initializeAutoCloseScript() {
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

        log('Ultra Fast Version Loading...');

        const CONFIG = {
            CHECK_INTERVAL: 5,
            DELAY_BETWEEN_CLICKS: 2,
            MODAL_WAIT_TIME: 20,
            REFRESH_DELAY: 3000,
            ERROR_RETRY_DELAY: 500,
            IDLE_REFRESH_TIMEOUT: 300000,
            POSITIONS_TAB_RETRY_DELAY: 200,
            POPUP_WAIT_TIME: 15,
            MAX_ERROR_COUNT: 10,
            POSITION_PROCESS_DELAY: 10,
            SAFETY_DELAY: 50,
            SETTLE_CHECK_ATTEMPTS: 1,
            SETTLE_CHECK_DELAY: 10,
            CONFIRM_CHECK_ATTEMPTS: 1,
            CONFIRM_CHECK_DELAY: 10,
            RETRY_ATTEMPTS: 1
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

        const THEMES = {
            'dark': {
                'background': '#1e2026',
                'text': 'white',
                'border': '#f0b90b',
                'panelBg': '#2b2f36',
                'secondary': '#848e9c'
            },
            'light': {
                'background': '#ffffff',
                'text': '#1e2026',
                'border': '#f0b90b',
                'panelBg': '#f8f9fa',
                'secondary': '#6c757d'
            },
            'blue': {
                'background': '#0a1a2d',
                'text': '#e9ecef',
                'border': '#2172e5',
                'panelBg': '#152642',
                'secondary': '#6c8ab3'
            }
        };

        let isRunning = false;
        let processedPositions = new Set();
        let currentPositionCount = 0;
        let totalClosed = 0;
        let errorCount = 0;
        let lastActivityTime = Date.now();
        let currentGroup = null;
        let currentPairIndex = 0;
        let operationMode = 'single';
        let selectedSinglePair = null;
        let currentProcessingPair = '';
        let scanInterval = null;
        let currentTheme = GM_getValue('panelTheme', 'dark');
        let headerInterval = null;
        let currentHeaderIndex = 0;
        let startTime = 0;
        let pairsProcessed = 0;

        function getAllPairs() {
            const allPairs = [];
            for (const group of Object.values(BTC_GROUPS)) {
                allPairs.push(...group.pairs);
            }
            return [...new Set(allPairs)].sort();
        }

        function initializeScript() {
            log('Initializing Ultra Fast Version...');

            const savedGroup = GM_getValue('selectedGroup', null);
            const savedMode = GM_getValue('operationMode', 'single');
            const savedPair = GM_getValue('selectedSinglePair', null);

            currentGroup = savedGroup;
            operationMode = savedMode;
            selectedSinglePair = savedPair;

            createControlPanel();
            startMonitoring();
            startHeaderAnimation();

            updateStatus('🟢 Ready - Select mode and click START', 'info');
            updateButtonStates();
            log('Ultra fast version initialized successfully', 'success');

            setOptimalZoom();
        }

        function setOptimalZoom() {
            document.body.style.zoom = '90%';
            log('Browser zoom optimized for better visibility', 'info');
        }

        function startHeaderAnimation() {
            if (headerInterval) clearInterval(headerInterval);

            headerInterval = setInterval(() => {
                currentHeaderIndex = (currentHeaderIndex + 1) % 2;
                updateHeaderText();
            }, 3000);
        }

        function updateHeaderText() {
            const headerElement = document.getElementById('header-text');
            const headers = [
                '🚀 Ultra Fast Auto Closer',
                '⚡ BTC-Trader @yannaingko2'
            ];

            if (headerElement) {
                headerElement.textContent = headers[currentHeaderIndex];
                headerElement.style.fontWeight = 'bold';
                headerElement.style.color = THEMES[currentTheme].border;
                headerElement.style.fontSize = '18px';
                headerElement.style.marginBottom = '3px';
            }
        }

        function createControlPanel() {
            const existingPanel = document.getElementById('btc-margin-closer');
            if (existingPanel) {
                existingPanel.remove();
            }

            const theme = THEMES[currentTheme];
            const panel = document.createElement('div');
            panel.id = 'btc-margin-closer';
            panel.style.cssText = `
                position: fixed;
                top: 70px;
                right: 10px;
                z-index: 1000000;
                background: ${theme.background};
                border: 2px solid ${theme.border};
                border-radius: 10px;
                padding: 15px;
                color: ${theme.text};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: 450px;
                max-width: 450px;
                box-shadow: 0 6px 25px rgba(0,0,0,0.8);
                font-size: 13px;
                max-height: 75vh;
                overflow-y: auto;
                transform: scale(0.95);
                transform-origin: top right;
            `;

            const allPairs = getAllPairs();
            panel.innerHTML = `
                <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid ${theme.border};">
                    <div id="header-text" style="font-weight: bold; color: ${theme.border}; font-size: 18px; margin-bottom: 3px;">🚀 Ultra Fast Auto Closer</div>
                    <div style="font-size: 11px; color: ${theme.secondary};">v2.8.3 | BTC-Trader @yannaingko2</div>
                </div>

                <div id="status-display" style="background: ${theme.panelBg}; padding: 12px; border-radius: 6px; margin-bottom: 15px; text-align: center; font-size: 12px; min-height: 25px; border-left: 3px solid ${theme.border};">
                    🟢 Ready - Select mode and click START
                </div>

                <div style="background: ${theme.panelBg}; padding: 10px; border-radius: 5px; margin-bottom: 12px; text-align: center;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <div style="font-size: 10px; color: ${theme.secondary};">Pairs Processed</div>
                            <div id="pairs-processed" style="font-size: 14px; font-weight: bold; color: ${theme.border};">0</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: ${theme.secondary};">Time Elapsed</div>
                            <div id="time-elapsed" style="font-size: 14px; font-weight: bold; color: #0ecb81;">0s</div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 15px;">
                    <button id="start-btn" style="padding: 12px; background: linear-gradient(135deg, #0ecb81, #0a8); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">
                        🚀 START
                    </button>
                    <button id="refresh-btn" style="padding: 12px; background: linear-gradient(135deg, #f0b90b, #d99c00); color: black; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">
                        🔄 REFRESH
                    </button>
                    <button id="activate-tab-btn" style="padding: 12px; background: linear-gradient(135deg, #2172e5, #0052cc); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">
                        📍 ACTIVATE TAB
                    </button>
                </div>
                <button id="stop-btn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #ea3943, #c00); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; margin-bottom: 15px; display: none;">
                    🛑 STOP AUTO CLOSER
                </button>

                <div style="background: ${theme.panelBg}; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                        <div style="text-align: center;">
                            <div style="font-size: 10px; color: ${theme.secondary};">Active Positions</div>
                            <div id="position-count" style="font-size: 16px; font-weight: bold; color: ${theme.border};">0</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 10px; color: ${theme.secondary};">Total Closed</div>
                            <div id="total-closed" style="font-size: 16px; font-weight: bold; color: #0ecb81;">0</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div style="text-align: center;">
                            <div style="font-size: 10px; color: ${theme.secondary};">Current Mode</div>
                            <div id="current-mode" style="font-size: 11px; font-weight: bold; color: ${theme.text};">Select mode</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 10px; color: ${theme.secondary};">Errors</div>
                            <div id="error-count" style="font-size: 11px; font-weight: bold; color: #ea3943;">0/${CONFIG.MAX_ERROR_COUNT}</div>
                        </div>
                    </div>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${theme.secondary};">
                        <div style="font-size: 10px; color: ${theme.secondary};">Current Pair</div>
                        <div id="current-pair" style="font-size: 12px; font-weight: bold; color: ${theme.text};">-</div>
                    </div>
                    <div style="margin-top: 6px;">
                        <div style="font-size: 10px; color: ${theme.secondary};">Processing Pair</div>
                        <div id="processing-pair" style="font-size: 12px; font-weight: bold; color: ${theme.border};">-</div>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 11px; color: ${theme.secondary}; font-weight: bold;">⚙️ OPERATION MODE:</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button id="multiple-mode-btn" style="padding: 10px; background: ${operationMode === 'single' ? '#3a3221' : theme.panelBg}; color: ${operationMode === 'single' ? '#f0b90b' : theme.secondary}; border: 2px solid ${operationMode === 'single' ? '#f0b90b' : theme.secondary}; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">
                            🔄 MULTIPLE MODE
                        </button>
                        <button id="single-mode-btn" style="padding: 10px; background: ${operationMode === 'single-pair' ? '#3a243b' : theme.panelBg}; color: ${operationMode === 'single-pair' ? 'white' : theme.secondary}; border: 2px solid ${operationMode === 'single-pair' ? '#ea3943' : theme.secondary}; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">
                            ⚡ SINGLE MODE
                        </button>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 11px; color: ${theme.secondary}; font-weight: bold;">📊 SELECT TRADING GROUP:</label>
                    <select id="group-select" style="width: 100%; padding: 8px; border-radius: 5px; background: ${theme.panelBg}; color: ${theme.text}; border: 1px solid ${theme.secondary}; font-size: 12px;">
                        <option value="">-- Select Trading Group --</option>
                        ${Object.entries(BTC_GROUPS).map(([key, group]) => `
                            <option value="${key}" ${currentGroup !== null && parseInt(key) === currentGroup ? 'selected' : ''}>
                                [${key}] ${group.name} - ${group.pairs.length} pairs
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 11px; color: ${theme.secondary}; font-weight: bold;">🎯 SELECT SINGLE PAIR:</label>
                    <select id="single-pair-select" style="width: 100%; padding: 8px; border-radius: 5px; background: ${theme.panelBg}; color: ${theme.text}; border: 1px solid ${theme.secondary}; font-size: 12px;">
                        <option value="">-- Select Trading Pair --</option>
                        ${allPairs.map(pair => `
                            <option value="${pair}" ${selectedSinglePair === pair ? 'selected' : ''}>${pair}</option>
                        `).join('')}
                    </select>
                </div>

                <div style="background: ${theme.panelBg}; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 10px; color: ${theme.secondary}; margin-bottom: 4px;">
                        <strong>EMERGENCY STOP:</strong> Press <kbd style="background: #ea3943; color: white; padding: 1px 4px; border-radius: 2px;">ESC</kbd>
                    </div>
                    <div style="font-size: 9px; color: ${theme.secondary};">
                        Close → Settle in BTC → Confirm
                    </div>
                    <div id="mode-info" style="font-size: 10px; color: ${theme.border}; margin-top: 4px; font-weight: bold;">
                        Mode: <strong>Select mode</strong> | Pair: <strong id="selected-pair-info">select</strong>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    <button id="test-panel-btn" style="padding: 6px; background: ${theme.panelBg}; color: ${theme.text}; border: 1px solid ${theme.secondary}; border-radius: 3px; cursor: pointer; font-size: 10px;">
                        Test Panel
                    </button>
                    <select id="theme-selector" style="padding: 6px; background: ${theme.panelBg}; color: ${theme.text}; border: 1px solid ${theme.secondary}; border-radius: 3px; font-size: 10px;">
                        <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark Theme</option>
                        <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light Theme</option>
                        <option value="blue" ${currentTheme === 'blue' ? 'selected' : ''}>Blue Theme</option>
                    </select>
                </div>
            `;

            try {
                document.body.appendChild(panel);
                log('Control panel created successfully', 'success');

                setTimeout(() => {
                    setupEventListeners();
                }, 50);
            } catch (error) {
                log('Error creating control panel: ' + error, 'error');
            }
        }

        function updateSpeedStats() {
            const pairsProcessedElement = document.getElementById('pairs-processed');
            const timeElapsedElement = document.getElementById('time-elapsed');

            if (pairsProcessedElement) pairsProcessedElement.textContent = pairsProcessed;
            if (timeElapsedElement && startTime > 0) {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                timeElapsedElement.textContent = `${elapsed}s`;
            }
        }

        function findOpenPositions() {
            const positions = [];

            try {
                const closeButtonTexts = ['Close Position', 'Close', 'Close All', 'Liquidate'];
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
                        try {
                            const elements = modal.querySelectorAll(selector);
                            for (let element of elements) {
                                if (element.isConnected && isElementVisible(element)) {
                                    return element;
                                }
                            }
                        } catch (error) {
                            // Continue
                        }
                    }
                }

                for (let selector of confirmSelectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        for (let element of elements) {
                            if (element.isConnected && isElementVisible(element)) {
                                return element;
                            }
                        }
                    } catch (error) {
                        // Continue
                    }
                }
            } catch (error) {
                log('Error finding confirm button: ' + error, 'error');
            }
            return null;
        }

        function safeClick(element, description) {
            try {
                if (element && element.isConnected && isElementVisible(element)) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

                    const clickMethods = [
                        () => { if (typeof element.click === 'function') element.click(); },
                        () => {
                            const event = new MouseEvent('click', {
                                view: window,
                                bubbles: true,
                                cancelable: true
                            });
                            element.dispatchEvent(event);
                        }
                    ];

                    for (let method of clickMethods) {
                        try {
                            method();
                        } catch (e) {
                            // Continue to next method
                        }
                    }

                    log(`Clicked: ${description}`);
                    return true;
                }
                return false;
            } catch (error) {
                log(`Error clicking ${description}: ` + error, 'error');
                return false;
            }
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

        function processModalButtons(position, onSuccess, onError) {
            const settleBtn = findSettleButton();
            if (settleBtn && safeClick(settleBtn, 'Settle in BTC')) {
                setTimeout(() => {
                    const confirmBtn = findConfirmButton();
                    if (confirmBtn && safeClick(confirmBtn, 'Confirm')) {
                        setTimeout(() => onSuccess(), CONFIG.CONFIRM_CHECK_DELAY);
                    } else {
                        onSuccess();
                    }
                }, CONFIG.SETTLE_CHECK_DELAY);
            } else {
                const confirmBtn = findConfirmButton();
                if (confirmBtn && safeClick(confirmBtn, 'Confirm')) {
                    setTimeout(() => onSuccess(), CONFIG.CONFIRM_CHECK_DELAY);
                } else {
                    onSuccess();
                }
            }
        }

        function closeNextPosition(positions, index, retryCount = 0) {
            if (!isRunning) return;

            if (index >= positions.length) {
                updateStatus('All positions processed in current pair', 'success');
                moveToNextPair();
                return;
            }

            const position = positions[index];
            const currentPair = BTC_GROUPS[currentGroup].pairs[currentPairIndex];
            updateStatus(`Closing position ${index + 1}/${positions.length} in ${currentPair}...`, 'warning');

            if (!position.button.isConnected) {
                processedPositions.add(position.id);
                setTimeout(() => closeNextPosition(positions, index + 1), 1);
                return;
            }

            if (safeClick(position.button, 'Close Position button')) {
                setTimeout(() => {
                    if (!isRunning) return;

                    processModalButtons(position, () => {
                        processedPositions.add(position.id);
                        totalClosed++;
                        errorCount = Math.max(0, errorCount - 1);
                        updateStats();
                        updateStatus(`Position ${index + 1} closed successfully in ${currentPair}`, 'success');
                        lastActivityTime = Date.now();
                        setTimeout(() => closeNextPosition(positions, index + 1), CONFIG.DELAY_BETWEEN_CLICKS);
                    }, () => {
                        processedPositions.add(position.id);
                        setTimeout(() => closeNextPosition(positions, index + 1), CONFIG.DELAY_BETWEEN_CLICKS);
                    });

                }, CONFIG.MODAL_WAIT_TIME);
            } else {
                processedPositions.add(position.id);
                setTimeout(() => closeNextPosition(positions, index + 1), CONFIG.DELAY_BETWEEN_CLICKS);
            }
        }

        function generatePositionId(element) {
            const rect = element.getBoundingClientRect();
            const text = element.textContent || '';
            return `${text}-${rect.top}-${rect.left}-${Date.now()}`.replace(/\s+/g, '_');
        }

        function moveToNextPair() {
            pairsProcessed++;
            updateSpeedStats();

            if (operationMode === 'single' && currentGroup !== null && currentPairIndex < BTC_GROUPS[currentGroup].pairs.length - 1) {
                currentPairIndex++;
                updateModeInfo();
                const nextPair = BTC_GROUPS[currentGroup].pairs[currentPairIndex];
                log(`Moving to next pair: ${nextPair}`);
                updateStatus(`Moving to next pair: ${nextPair}`, 'info');

                setTimeout(() => {
                    if (isRunning) {
                        scanAndClosePositions();
                    }
                }, CONFIG.CHECK_INTERVAL);
            } else if (operationMode === 'single' && currentGroup !== null && currentPairIndex >= BTC_GROUPS[currentGroup].pairs.length - 1) {
                currentPairIndex = 0;
                updateModeInfo();
                log(`Completed group cycle, restarting from first pair`);
                updateStatus(`Completed group cycle, restarting from first pair`, 'info');

                setTimeout(() => {
                    if (isRunning) {
                        scanAndClosePositions();
                    }
                }, CONFIG.CHECK_INTERVAL);
            } else {
                setTimeout(() => {
                    if (isRunning) {
                        scanAndClosePositions();
                    }
                }, CONFIG.CHECK_INTERVAL);
            }
        }

        function scanAndClosePositions() {
            if (!isRunning) return;

            try {
                const positions = findOpenPositions();
                currentPositionCount = positions.length;
                updateStats();

                if (positions.length === 0) {
                    log('No Close Position buttons found');
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
                handleError('Error during position scanning: ' + error);
            }
        }

        function setupEventListeners() {
            try {
                document.getElementById('start-btn').addEventListener('click', startAutoClose);
                document.getElementById('stop-btn').addEventListener('click', stopAutoClose);
                document.getElementById('refresh-btn').addEventListener('click', refreshPage);
                document.getElementById('activate-tab-btn').addEventListener('click', activatePositionsTab);
                document.getElementById('test-panel-btn').addEventListener('click', testPanelVisibility);

                document.getElementById('group-select').addEventListener('change', function(e) {
                    currentGroup = e.target.value === "" ? null : parseInt(e.target.value);
                    GM_setValue('selectedGroup', currentGroup);
                    currentPairIndex = 0;
                    updateModeInfo();
                    updateDropdownStates();
                    log(`Group changed to: ${currentGroup !== null ? BTC_GROUPS[currentGroup].name : 'None'}`);
                });

                document.getElementById('single-pair-select').addEventListener('change', function(e) {
                    selectedSinglePair = e.target.value === "" ? null : e.target.value;
                    GM_setValue('selectedSinglePair', selectedSinglePair);
                    updateModeInfo();
                    updateDropdownStates();
                    log(`Single pair changed to: ${selectedSinglePair || 'None'}`);
                });

                document.getElementById('multiple-mode-btn').addEventListener('click', function() {
                    setOperationMode('single');
                });

                document.getElementById('single-mode-btn').addEventListener('click', function() {
                    setOperationMode('single-pair');
                });

                document.getElementById('theme-selector').addEventListener('change', function(e) {
                    currentTheme = e.target.value;
                    GM_setValue('panelTheme', currentTheme);
                    createControlPanel();
                    startHeaderAnimation();
                    log(`Theme changed to: ${currentTheme}`);
                });

                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        log('Emergency stop triggered by ESC key');
                        stopAutoClose();
                    }
                });

                updateModeInfo();
                updateOperationModeButtons();
                updateDropdownStates();
                updateButtonStates();

            } catch (error) {
                log('Error setting up event listeners: ' + error, 'error');
            }
        }

        function testPanelVisibility() {
            const panel = document.getElementById('btc-margin-closer');
            if (panel) {
                panel.style.border = '3px solid #00ff00';
                panel.style.boxShadow = '0 0 20px #00ff00';

                setTimeout(() => {
                    panel.style.border = `3px solid ${THEMES[currentTheme].border}`;
                    panel.style.boxShadow = '0 8px 35px rgba(0,0,0,0.8)';
                }, 1000);

                log('Panel visibility test completed', 'success');
                updateStatus('Panel visibility test completed', 'success');
            }
        }

        function startAutoClose() {
            log('Starting auto close process...', 'success');

            if (operationMode === 'single' && currentGroup === null) {
                updateStatus('Please select a trading group first', 'error');
                return;
            }

            if (operationMode === 'single-pair' && selectedSinglePair === null) {
                updateStatus('Please select a trading pair first', 'error');
                return;
            }

            if (!isRunning) {
                isRunning = true;
                startTime = Date.now();
                pairsProcessed = 0;
                log('Auto-close process STARTED', 'success');

                processedPositions.clear();
                currentPositionCount = 0;
                totalClosed = 0;
                errorCount = 0;
                currentPairIndex = 0;
                lastActivityTime = Date.now();

                updateButtonStates();
                updateStats();
                updateSpeedStats();

                switch(operationMode) {
                    case 'single':
                        updateStatus(`Running - Multiple: ${BTC_GROUPS[currentGroup].name}`, 'success');
                        break;
                    case 'single-pair':
                        updateStatus(`Running - Single: ${selectedSinglePair}`, 'success');
                        break;
                }

                setTimeout(() => {
                    log('Step 1: Activating Positions Tab...', 'info');
                    activatePositionsTab();

                    setTimeout(() => {
                        if (isRunning) {
                            log('Step 2: Starting Position Scan...', 'info');
                            scanAndClosePositions();
                        }
                    }, 1000);
                }, CONFIG.SAFETY_DELAY);
            } else {
                updateStatus('Auto closer is already running', 'warning');
            }
        }

        function stopAutoClose() {
            log('Stopping auto close process...');

            if (isRunning) {
                isRunning = false;

                if (scanInterval) {
                    clearInterval(scanInterval);
                    scanInterval = null;
                }
                if (headerInterval) {
                    clearInterval(headerInterval);
                    headerInterval = null;
                }

                processedPositions.clear();
                updateProcessingPair('');

                updateButtonStates();
                updateStatus('Auto closer stopped by user', 'error');
                log('Auto-close process STOPPED', 'success');
            } else {
                updateStatus('Auto closer is not running', 'warning');
            }
        }

        function updateStatus(message, type = 'info') {
            const statusElement = document.getElementById('status-display');
            if (statusElement) {
                statusElement.textContent = message;

                if (type === 'error') {
                    statusElement.style.borderLeftColor = '#ea3943';
                    statusElement.style.color = '#ea3943';
                } else if (type === 'success') {
                    statusElement.style.borderLeftColor = '#0ecb81';
                    statusElement.style.color = '#0ecb81';
                } else if (type === 'warning') {
                    statusElement.style.borderLeftColor = '#f0b90b';
                    statusElement.style.color = '#f0b90b';
                } else {
                    statusElement.style.borderLeftColor = THEMES[currentTheme].border;
                    statusElement.style.color = THEMES[currentTheme].text;
                }
            }
        }

        function updateStats() {
            const positionCountElement = document.getElementById('position-count');
            const totalClosedElement = document.getElementById('total-closed');
            const errorCountElement = document.getElementById('error-count');
            const currentPairElement = document.getElementById('current-pair');

            if (positionCountElement) positionCountElement.textContent = currentPositionCount;
            if (totalClosedElement) totalClosedElement.textContent = totalClosed;
            if (errorCountElement) errorCountElement.textContent = `${errorCount}/${CONFIG.MAX_ERROR_COUNT}`;

            if (currentPairElement) {
                if (operationMode === 'single' && currentGroup !== null) {
                    currentPairElement.textContent = BTC_GROUPS[currentGroup].pairs[currentPairIndex];
                } else if (operationMode === 'single-pair' && selectedSinglePair) {
                    currentPairElement.textContent = selectedSinglePair;
                } else {
                    currentPairElement.textContent = '-';
                }
            }
        }

        function updateProcessingPair(pair) {
            const processingElement = document.getElementById('processing-pair');
            if (processingElement) {
                processingElement.textContent = pair || '-';
            }
            currentProcessingPair = pair;
        }

        function updateButtonStates() {
            const startBtn = document.getElementById('start-btn');
            const stopBtn = document.getElementById('stop-btn');

            if (startBtn) startBtn.style.display = isRunning ? 'none' : 'block';
            if (stopBtn) stopBtn.style.display = isRunning ? 'block' : 'none';
        }

        function updateModeInfo() {
            const modeInfoElement = document.getElementById('mode-info');
            const currentModeElement = document.getElementById('current-mode');
            const selectedPairInfoElement = document.getElementById('selected-pair-info');

            if (modeInfoElement && currentModeElement && selectedPairInfoElement) {
                if (operationMode === 'single' && currentGroup !== null) {
                    const groupName = BTC_GROUPS[currentGroup].name;
                    const currentPair = BTC_GROUPS[currentGroup].pairs[currentPairIndex];
                    modeInfoElement.innerHTML = `Mode: <strong>Multiple (${groupName})</strong> | Pair: <strong>${currentPair}</strong>`;
                    currentModeElement.textContent = `Multiple: ${groupName}`;
                    selectedPairInfoElement.textContent = currentPair;
                } else if (operationMode === 'single-pair' && selectedSinglePair) {
                    modeInfoElement.innerHTML = `Mode: <strong>Single Pair</strong> | Pair: <strong>${selectedSinglePair}</strong>`;
                    currentModeElement.textContent = 'Single Pair';
                    selectedPairInfoElement.textContent = selectedSinglePair;
                } else {
                    modeInfoElement.innerHTML = 'Mode: <strong>Select mode</strong> | Pair: <strong>select</strong>';
                    currentModeElement.textContent = 'Select mode';
                    selectedPairInfoElement.textContent = 'select';
                }
            }
        }

        function updateOperationModeButtons() {
            const multipleBtn = document.getElementById('multiple-mode-btn');
            const singleBtn = document.getElementById('single-mode-btn');
            const theme = THEMES[currentTheme];

            if (multipleBtn && singleBtn) {
                if (operationMode === 'single') {
                    multipleBtn.style.background = '#3a3221';
                    multipleBtn.style.color = '#f0b90b';
                    multipleBtn.style.border = '2px solid #f0b90b';

                    singleBtn.style.background = theme.panelBg;
                    singleBtn.style.color = theme.secondary;
                    singleBtn.style.border = `2px solid ${theme.secondary}`;
                } else {
                    multipleBtn.style.background = theme.panelBg;
                    multipleBtn.style.color = theme.secondary;
                    multipleBtn.style.border = `2px solid ${theme.secondary}`;

                    singleBtn.style.background = '#3a243b';
                    singleBtn.style.color = 'white';
                    singleBtn.style.border = '2px solid #ea3943';
                }
            }
        }

        function updateDropdownStates() {
            const groupSelect = document.getElementById('group-select');
            const pairSelect = document.getElementById('single-pair-select');

            if (groupSelect && pairSelect) {
                if (operationMode === 'single') {
                    groupSelect.disabled = false;
                    pairSelect.disabled = true;
                } else {
                    groupSelect.disabled = true;
                    pairSelect.disabled = false;
                }
            }
        }

        function setOperationMode(mode) {
            operationMode = mode;
            GM_setValue('operationMode', mode);

            updateModeInfo();
            updateOperationModeButtons();
            updateDropdownStates();
            updateButtonStates();

            log(`Operation mode changed to: ${mode}`);
        }

        function refreshPage() {
            log('Manual refresh triggered');
            GM_setValue('reactivatePositionsTab', true);
            window.location.reload();
        }

        function activatePositionsTab() {
            log('Activating Positions tab...', 'info');
            updateStatus('Activating Positions tab...', 'info');

            let attempts = 0;
            const maxAttempts = 5;

            function tryActivate() {
                attempts++;

                const selectors = [
                    'div.draggableCancel.text-\\[14px\\][data-testid="Positions"]',
                    'div[data-testid="Positions"]',
                    '[data-testid="Positions"]',
                    'div[class*="Positions"]',
                    'button:contains("Positions")',
                    'div:contains("Positions")',
                    '.css-1dbjc4n.r-1habvwh.r-18u37iz.r-16x7wis.r-1ny4l3l'
                ];

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

                            positionsTab.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                                inline: 'nearest'
                            });

                            setTimeout(() => {
                                safeClick(positionsTab, 'Positions Tab');
                                log('Positions tab ACTIVATED successfully!', 'success');
                                updateStatus('Positions tab ACTIVATED', 'success');
                            }, 100);

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
                        log('Positions tab activation FAILED after all attempts', 'error');
                        updateStatus('Positions tab not found - Manual navigation needed', 'error');
                    }
                }
            }

            tryActivate();
            return true;
        }

        function handleError(errorMessage) {
            errorCount++;
            log(`Error: ${errorMessage}`, 'error');
            updateStatus(`Error: ${errorMessage}`, 'error');

            if (errorCount >= CONFIG.MAX_ERROR_COUNT) {
                log('Max error count reached, refreshing page...', 'error');
                updateStatus('Max errors - Refreshing page...', 'error');
                GM_setValue('reactivatePositionsTab', true);
                window.location.reload();
            }

            updateStats();
        }

        function startMonitoring() {
            log('Starting background monitoring...');
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeScript);
        } else {
            initializeScript();
        }

        window.addEventListener('load', function() {
            setTimeout(() => {
                const needReactivate = GM_getValue('reactivatePositionsTab', false);
                if (needReactivate) {
                    GM_setValue('reactivatePositionsTab', false);
                    log('AUTO REFRESH DETECTED - Reactivating Positions tab...', 'success');
                    updateStatus('Reactivating Positions tab after refresh...', 'info');

                    setTimeout(() => {
                        activatePositionsTab();

                        setTimeout(() => {
                            if (isRunning) {
                                log('Auto resuming scanning after refresh...', 'success');
                                scanAndClosePositions();
                            }
                        }, 2000);
                    }, 1000);
                }
            }, 1000);
        });

        log('Ultra Fast Version Successfully Loaded!', 'success');
    }
})();
