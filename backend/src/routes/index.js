const router = require('express').Router();
const wrap = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const meta = require('../controllers/metaController');
const reqs = require('../controllers/requestController');
const stats = require('../controllers/statsController');
const notif = require('../controllers/notificationController');

// Auth
router.post('/auth/register', wrap(auth.register));
router.post('/auth/login', wrap(auth.login));
router.get('/auth/me', authenticate, wrap(auth.me));
router.put('/auth/profile', authenticate, wrap(auth.updateProfile));
router.put('/auth/password', authenticate, wrap(auth.changePassword));

// Lookup data
router.get('/meta', authenticate, wrap(meta.getMeta));

// Requests
router.post('/requests/recommend-priority', authenticate, wrap(reqs.recommend));
router.post('/requests', authenticate, authorize('student'), wrap(reqs.create));
router.get('/requests', authenticate, wrap(reqs.list));
router.get('/requests/:id(\\d+)', authenticate, wrap(reqs.get));
router.put('/requests/:id(\\d+)', authenticate, authorize('admin'), wrap(reqs.adminUpdate));
router.delete('/requests/:id(\\d+)', authenticate, wrap(reqs.remove));

// Stats
router.get('/stats/admin', authenticate, authorize('admin'), wrap(stats.admin));
router.get('/stats/student', authenticate, authorize('student'), wrap(stats.student));

// Notifications
router.get('/notifications', authenticate, wrap(notif.list));
router.get('/notifications/unread-count', authenticate, wrap(notif.unreadCount));
router.patch('/notifications/read-all', authenticate, wrap(notif.markAllRead));
router.patch('/notifications/:id(\\d+)/read', authenticate, wrap(notif.markRead));

module.exports = router;
