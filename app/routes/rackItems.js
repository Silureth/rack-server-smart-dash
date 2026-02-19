const express = require('express');
const router = express.Router();
const rackItemService = require('../services/rackItemService');

router.post('/create', (req, res) => {
  try {
    rackItemService.create({
      rack_id: req.body.rack_id,
      type: req.body.type,
      name: req.body.name,
      brand: req.body.brand,
      sn: req.body.sn,
      orientation: req.body.orientation,
      height_u: parseInt(req.body.height_u),
      position_u_start: parseInt(req.body.position_u_start)
    });

    res.redirect('/');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/update', (req, res) => {
  try {
    rackItemService.update({
      id: req.body.id,
      name: req.body.name,
      brand: req.body.brand,
      sn: req.body.sn,
      type: req.body.type,
      orientation: req.body.orientation,
      height_u: parseInt(req.body.height_u),
      position_u_start: parseInt(req.body.position_u_start)
    });

    res.redirect('/');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/move', (req, res) => {
  try {
    rackItemService.move(
      req.body.id,
      parseInt(req.body.position_u_start),
      req.body.orientation
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.post('/resize', (req, res) => {
  try {
    rackItemService.resize(
      req.body.id,
      parseInt(req.body.height_u)
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.post('/delete', (req, res) => {
  rackItemService.softDelete(req.body.id);
  res.redirect('/');
});

module.exports = router;
