const { redisClient, isRedisConnected, memoryCache, cacheStats } = require('../config/redis');

/**
 * Get item from cache
 */
const get = async (key) => {
  try {
    if (isRedisConnected() && redisClient) {
      const data = await redisClient.get(key);
      if (data) {
        cacheStats.hits++;
        return JSON.parse(data);
      }
      cacheStats.misses++;
      return null;
    }

    // In-memory fallback
    if (memoryCache.has(key)) {
      const entry = memoryCache.get(key);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryCache.delete(key);
        cacheStats.misses++;
        return null;
      }
      cacheStats.hits++;
      return entry.value;
    }

    cacheStats.misses++;
    return null;
  } catch (err) {
    cacheStats.misses++;
    return null;
  }
};

/**
 * Set item in cache with TTL
 */
const set = async (key, value, ttlSeconds = 3600) => {
  try {
    cacheStats.sets++;
    if (isRedisConnected() && redisClient) {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return true;
    }

    // In-memory fallback
    memoryCache.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    });
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Delete key from cache
 */
const del = async (key) => {
  try {
    cacheStats.deletes++;
    if (isRedisConnected() && redisClient) {
      await redisClient.del(key);
      return true;
    }

    memoryCache.delete(key);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Cache-aside helper: get cached data or fetch and cache it
 */
const getOrSet = async (key, fetchFn, ttlSeconds = 3600) => {
  const cached = await get(key);
  if (cached !== null) {
    return { data: cached, isCached: true };
  }

  const fresh = await fetchFn();
  if (fresh) {
    await set(key, fresh, ttlSeconds);
  }
  return { data: fresh, isCached: false };
};

/**
 * Get cache metrics and health
 */
const getStats = () => {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRatio = total > 0 ? ((cacheStats.hits / total) * 100).toFixed(2) + '%' : '0%';

  return {
    status: isRedisConnected() ? 'connected' : 'in-memory fallback',
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    hitRatio,
    cachedKeysCount: isRedisConnected() ? 'N/A' : memoryCache.size,
    memoryUsage: process.memoryUsage().heapUsed
  };
};

/**
 * Clear all cache entries
 */
const flush = async () => {
  if (isRedisConnected() && redisClient) {
    await redisClient.flushall();
  }
  memoryCache.clear();
  return true;
};

module.exports = {
  get,
  set,
  del,
  getOrSet,
  getStats,
  flush
};
