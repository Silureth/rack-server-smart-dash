const express = require('express');
const router = express.Router();
const service = require('../services/networkConnectionService');

router.post('/connect', (req, res) => {

    const { portA, portB } = req.body;

    try {
        service.connect(portA, portB);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({
            error: 'Port already connected'
        });
    }
});

router.post('/disconnect', (req, res) => {

    const { portId } = req.body;
    service.disconnect(portId);

    res.json({ success: true });
});

module.exports = router;
