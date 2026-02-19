const express = require('express');
const router = express.Router();
const serverService = require('../services/serverService');

router.post('/create', (req, res) => {
    try {
        serverService.create({
            rack_id: req.body.rack_id,
            name: req.body.name,
            brand: req.body.brand,
            sn: req.body.sn,
            type: req.body.type,
            orientation: req.body.orientation,
            height_u: parseInt(req.body.height_u),
            position_u_start: parseInt(req.body.position_u_start)
        });
    } catch (err) {
        console.error(err.message);
    }

    res.redirect('/');
});
router.post('/update', (req, res) => {

    try {
        serverService.updateServer(req.body);
    } catch (err) {
        console.error(err.message);
    }

    res.redirect('/');
});

router.post('/move', (req, res) => {
    const { id, position_u_start, orientation } = req.body;

    try {
        serverService.move(
            id,
            parseInt(position_u_start),
            orientation
        );

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

router.post('/delete', (req, res) => {
    try {
        serverService.softDelete(req.body.id);
    } catch (err) {
        console.error(err.message);
    }

    res.redirect('/');
});
router.post('/resize', (req, res) => {
    const { id, height_u } = req.body;

    try {
        serverService.resize(id, parseInt(height_u));
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});
router.get('/:id/disks', (req, res) => {
    const serverId = req.params.id;
    res.json(serverService.getDisks(serverId));
});

router.post('/:id/disks', (req, res) => {
    serverService.addDisk(req.params.id, req.body);
    res.json({ success: true });
});
router.delete('/disks/:diskId', (req, res) => {

    try {
        serverService.deleteDisk(req.params.diskId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

router.put("/disks/:id", (req, res) => {

    const diskId = parseInt(req.params.id);
    const payload = req.body;

    try {
        serverService.updateDisk(diskId, payload);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }

});

router.post('/:id/disks/reorder', (req, res) => {

  const serverId = req.params.id;
  const { placement, order } = req.body;

  if (!placement || !Array.isArray(order)) {
    return res.status(400).json({ error: "Invalid reorder payload" });
  }

  try {
    serverService.reorderDisks(serverId, placement, order);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
