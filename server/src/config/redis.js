const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;
let isRedisConnected = false;

// Fallback in-memory cache when Redis server is offline
const memoryCache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 800,
    lazyConnect: true,
    retryStrategy: () => null // Do not retry indefinitely in local dev
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    console.log('🔴 Connected to Redis Server successfully');
  }).catch(() => {
    isRedisConnected = false;
    console.log('ℹ️ Redis server offline. Using high-performance in-memory cache fallback for Sprint 10.');
  });

  redisClient.on('error', () => {
    isRedisConnected = false;
  });
} catch (err) {
  isRedisConnected = false;
}

module.exports = {
  redisClient,
  isRedisConnected: () => isRedisConnected,
  memoryCache,
  cacheStats
};
