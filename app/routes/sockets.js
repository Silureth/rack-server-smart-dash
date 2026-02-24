const express = require('express');
const router = express.Router();
const socketService = require('../services/socketService');

router.get('/:rackItemId', (req, res) => {
  res.json(
    socketService.getByRackItem(req.params.rackItemId)
  );
});

router.post('/:rackItemId', (req, res) => {
  socketService.add(req.params.rackItemId, req.body);
  res.json({ success: true });
});

router.delete('/:socketId', (req, res) => {
  socketService.softDelete(req.params.socketId);
  res.json({ success: true });
});

router.post('/:rackItemId/reorder', (req, res) => {
  socketService.reorder(
    req.params.rackItemId,
    req.body.order
  );
  res.json({ success: true });
});


module.exports = router;
