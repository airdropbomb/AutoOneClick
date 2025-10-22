const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// SQLite database setup
const db = new sqlite3.Database('./devices.db');
db.run('CREATE TABLE IF NOT EXISTS devices (deviceID TEXT, used INTEGER DEFAULT 0)');

app.use(express.json());

// Device ID verify endpoint
app.post('/verify-device-id', (req, res) => {
    const { deviceID } = req.body;
    db.get('SELECT * FROM devices WHERE deviceID = ?', [deviceID], (err, row) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Database error' });
        }
        if (!row) {
            return res.json({ status: 'denied', message: 'Invalid Device ID' });
        }
        if (row.used === 1) {
            return res.json({ status: 'denied', message: 'Device ID already used' });
        }
        db.run('UPDATE devices SET used = 1 WHERE deviceID = ?', [deviceID], (err) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Failed to update' });
            }
            res.json({ status: 'allowed' });
        });
    });
});

// Script serve endpoint
app.get('/enauto.js', (req, res) => {
    const deviceID = req.query.deviceID;
    db.get('SELECT * FROM devices WHERE deviceID = ? AND used = 1', [deviceID], (err, row) => {
        if (err || !row) {
            return res.status(403).send('Access Denied: Invalid or unused Device ID');
        }
        res.sendFile('/var/www/scripts/enauto.js');
    });
});

app.listen(port, () => {
    console.log(`Server running at http://your-vps-ip:${port}`);
});
