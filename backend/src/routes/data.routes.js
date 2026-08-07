const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const dataController = require('../controllers/data.controller');

const router = express.Router();

router.get('/categories', dataController.getCategories);
router.get('/categories/:categorySlug/items', dataController.getItemsByCategory);
router.get('/items/:itemSlug/events', dataController.getEventsByItem);

router.post('/subscriptions/toggle', authMiddleware.authUser, dataController.toggleSubscription);

module.exports = router;