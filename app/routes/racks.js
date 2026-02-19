const express = require('express');
const router = express.Router();
const rackService = require('../services/rackService');

router.post('/create', (req, res) => {
  rackService.create(req.body.name);
  res.redirect('/');
});

module.exports = router;
