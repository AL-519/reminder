const express = require('express');
const router = express.Router();
const multer = require('multer');
const {authUser} = require('../middleware/auth.middleware');
const {grantAccessTo} = require('../middleware/role.middleware');
const adminController = require('../controllers/admin.controller');

const upload = multer({storage: multer.memoryStorage()});

router.use(authUser);

router.post('/categories', grantAccessTo('admin', 'owner'), upload.single('backgroundImage'), adminController.createCategory);
router.patch('/categories/:id', grantAccessTo('admin', 'owner'), upload.single('backgroundImage'), adminController.updateCategory);
router.delete('/categories/:id', grantAccessTo('admin', 'owner'), adminController.deleteCategory);

router.post('/items', grantAccessTo('admin', 'owner'), upload.single('thumbnailImage'), adminController.createItem);
router.patch('/items/:id', grantAccessTo('admin', 'owner'), upload.single('thumbnailImage'), adminController.updateItem);
router.delete('/items/:id', grantAccessTo('admin', 'owner'), adminController.deleteItem);

router.post('/events', grantAccessTo('admin', 'owner'), upload.single('eventImage'), adminController.createEvent);
router.patch('/events/:id', grantAccessTo('admin', 'owner'), upload.single('eventImage'), adminController.updateEvent);
router.delete('/events/:id', grantAccessTo('admin', 'owner'), adminController.deleteEvent);

router.delete('/purge-events', grantAccessTo('admin', 'owner'), adminController.purgeExpiredEvents);
router.patch('/modify-role', grantAccessTo('admin', 'owner'), adminController.modifyUserRole);

router.post('/transfer', grantAccessTo('owner'), adminController.transferOwnership);

module.exports = router;