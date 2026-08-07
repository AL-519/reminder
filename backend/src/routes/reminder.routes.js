const express = require('express');
const router = express.Router();
const { authUser } = require('../middleware/auth.middleware');
const reminderController = require('../controllers/reminder.controller');

router.use(authUser);

router.get('/', reminderController.getPersonalReminders);
router.post('/', reminderController.createPersonalReminder);

router.patch('/:id', reminderController.updatePersonalReminder);
router.delete('/:id', reminderController.deletePersonalReminder);

module.exports = router;