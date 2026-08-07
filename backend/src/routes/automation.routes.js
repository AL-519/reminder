const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automation.controller');

router.post('/digest', automationController.dispatchHourlyDigest);

module.exports = router;