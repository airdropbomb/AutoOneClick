// ==UserScript==
// @name         Binance Isolated Margin Auto Closer - Ultra Fast with UUID
// @namespace    http://tampermonkey.net/
// @version      2.8.3
// @description  Ultra fast auto closer with UUID verification - BTC-Trader @yannaingko2
// @author       BTC-Trader
// @match        https://www.binance.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // UUID input တောင်းပါ
    let deviceID = localStorage.getItem('deviceID');
    if (!deviceID) {
        deviceID = prompt('Please enter your Device ID (UUID):');
        if (!deviceID) {
            console.log('No Device ID provided. Script stopped.');
            alert('Please provide a valid Device ID.');
            return;
        }
        localStorage.setItem('deviceID', deviceID);
    }

    // Server ကို Device ID ပို့ပြီး verify
    GM_xmlhttpRequest({
        method: 'POST',
        url: 'http://your-vps-ip/verify-device-id',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ deviceID: deviceID }),
        onload: function(response) {
            const result = JSON.parse(response.responseText);
            if (result.status !== 'allowed') {
                console.log('Not allow this Device ID: ' + result.message);
                alert('Invalid or already used Device ID: ' + result.message);
                return;
            }
            console.log('Script running for allowed Device ID: ' + deviceID);
            const script = document.createElement('script');
            script.src = `http://your-vps-ip/enauto.js?deviceID=${deviceID}`;
            document.head.appendChild(script);
        },
        onerror: function() {
            console.log('Failed to connect to server');
            alert('Failed to connect to server.');
        }
    });
})();
