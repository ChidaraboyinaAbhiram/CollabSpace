const cacheService = require('../services/cache.service');

/**
 * Get cache metrics and health status
 * GET /api/cache/stats
 */
const getCacheStats = (req, res) => {
  try {
    const stats = cacheService.getStats();
    return res.status(200).json({
      status: 'success',
      stats
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve cache stats'
    });
  }
};

/**
 * Flush all cached entries
 * POST /api/cache/flush
 */
const flushCache = async (req, res) => {
  try {
    await cacheService.flush();
    return res.status(200).json({
      status: 'success',
      message: 'Cache flushed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to flush cache'
    });
  }
};

module.exports = {
  getCacheStats,
  flushCache
};
