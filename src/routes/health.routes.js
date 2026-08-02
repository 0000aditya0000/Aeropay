const express = require('express');
const healthController = require('../controllers/health.controller');

const router = express.Router();

router.get('/health', healthController.health);
router.get('/ping', healthController.ping);

module.exports = router;
