const express = require('express');
const router = express.Router();
const {authUser} = require('../middleware/auth.middleware');
const {grantAccessTo} = require('../middleware/role.middleware');
const ticketController = require('../controllers/ticket.controller');

router.use(authUser);

router.post('/', ticketController.createTicket);

router.use(grantAccessTo('support', 'admin', 'owner'));

router.get('/', ticketController.getTickets);
router.get('/:id/asset', ticketController.getTicketAsset);
router.patch('/:id/status', ticketController.updateTicketStatus);

module.exports = router;