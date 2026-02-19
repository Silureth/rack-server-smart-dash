const express = require('express');
const router = express.Router();
const diskService = require('../services/diskService');

router.get('/:rackItemId/disks', (req, res) => {
  res.json(
    diskService.getByRackItem(req.params.rackItemId)
  );
});

router.post('/:rackItemId/disks', (req, res) => {
  diskService.add(req.params.rackItemId, req.body);
  res.json({ success: true });
});

router.delete('/disks/:diskId', (req, res) => {
  diskService.softDelete(req.params.diskId);
  res.json({ success: true });
});

module.exports = router;
