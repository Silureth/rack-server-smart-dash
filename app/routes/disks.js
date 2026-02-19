const express = require('express');
const router = express.Router();
const diskService = require('../services/diskService');
const portService = require('../services/portService');

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


router.get('/:rackItemId/disks', (req, res) => {

  const rackItem = rackItemService.getById(req.params.rackItemId);

  const disks = diskService.getByRackItem(req.params.rackItemId);

  const ports = portService.getByRackItem(req.params.rackItemId);

  res.json({
    rackItem,
    disks,
    ports
  });
});

module.exports = router;
