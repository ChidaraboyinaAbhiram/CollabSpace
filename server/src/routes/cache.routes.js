const express = require('express');
const router = express.Router();
const { getCacheStats, flushCache } = require('../controllers/cache.controller');

router.get('/stats', getCacheStats);
router.post('/flush', flushCache);

module.exports = router;
