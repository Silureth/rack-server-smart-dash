const express = require('express');
const router = express.Router();
const portService = require('../services/portService');

router.get('/:rackItemId', (req, res) => {
  res.json(
    portService.getByRackItem(req.params.rackItemId)
  );
});

router.post('/:rackItemId', (req, res) => {
  portService.add(req.params.rackItemId, req.body);
  res.json({ success: true });
});

router.delete('/:portId', (req, res) => {
  portService.softDelete(req.params.portId);
  res.json({ success: true });
});

router.post('/:rackItemId/reorder', (req, res) => {
  portService.reorder(
    req.params.rackItemId,
    req.body.order
  );
  res.json({ success: true });
});

module.exports = router;
