const express = require('express');
const router = express.Router();
const {authUser} = require('../middleware/auth.middleware');
const channelController = require('../controllers/channel.controller');

router.use(authUser);

router.post('/verify-request', channelController.requestChannelVerification);
router.post('/verify-confirm', channelController.confirmChannelVerification);
router.patch('/timezone', channelController.updateNotificationTimezone);
router.delete('/', channelController.removeChannel);

module.exports = router;