const express = require('express');
const router = express.Router();
const diskService = require('../services/diskService');
const portService = require('../services/portService');
const rackItemService = require('../services/rackItemService');
const powerInputService = require('../services/powerInputService');
const powerOutletService = require('../services/powerOutletService');
const powerConnectionService = require('../services/powerConnectionService');
const networkConnectionService = require('../services/networkConnectionService');




router.post('/:rackItemId/disks', (req, res) => {
  diskService.add(req.params.rackItemId, req.body);
  res.json({ success: true });
});

router.post('/:rackItemId/ports', (req, res) => {
  portService.add(req.params.rackItemId, req.body);
  res.json({ success: true });
});

router.post('/:rackItemId/power-inputs', (req, res) => {
  powerInputService.add(req.params.rackItemId, req.body);
  res.json({ success: true });
});

router.post('/:rackItemId/power-outlets', (req, res) => {
  powerOutletService.add(req.params.rackItemId, req.body);
  res.json({ success: true });
});


router.delete('/disks/:diskId', (req, res) => {
  diskService.softDelete(req.params.diskId);
  res.json({ success: true });
});


router.get('/:rackItemId/disks', (req, res) => {
  const rackItem = rackItemService.getById(req.params.rackItemId);
  if (!rackItem) {
    return res.status(404).json({ error: 'Rack item not found' });
  }

  const disks = diskService.getByRackItem(req.params.rackItemId);
  const ports = portService.getByRackItem(req.params.rackItemId);
  const powerInputs = powerInputService.getByRackItem(req.params.rackItemId);
  const powerOutlets = powerOutletService.getByRackItem(req.params.rackItemId);

  const allConnections = powerConnectionService.getAll();
  const usedOutletIds = allConnections.map(c => c.outlet_id);
  const freeOutlets = powerConnectionService.getFreeOutlets(usedOutletIds);

  const networkConnections = networkConnectionService.getAll();
  const usedPortIds = networkConnections.flatMap(c => [
    c.port_a_id,
    c.port_b_id
  ]);
  const freePorts = networkConnectionService.getFreePorts(usedPortIds);

  res.json({
    rackItem,
    disks,
    ports,
    powerInputs,
    powerOutlets,
    powerConnections: allConnections,
    freeOutlets,
    networkConnections,
    freePorts
  });
});



module.exports = router;
