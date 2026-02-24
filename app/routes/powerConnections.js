const express = require('express');
const router = express.Router();
const powerConnectionService = require('../services/powerConnectionService');

router.post('/connect', (req, res) => {

  const { inputId, outletId } = req.body;

  if (!inputId || !outletId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    powerConnectionService.connect(inputId, outletId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({
      error: 'Outlet already used or PSU already connected'
    });
  }
});

router.post('/disconnect', (req, res) => {

  const { inputId } = req.body;

  powerConnectionService.disconnectByInput(inputId);
  res.json({ success: true });
});

module.exports = router;
