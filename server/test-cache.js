/**
 * Sprint 10 Redis Caching & Cache-Aside Verification Script
 */
const http = require('http');

let token = '';

function request(method, path, body = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runCacheTests() {
  const { server } = require('./src/server');

  await new Promise(r => setTimeout(r, 600));

  console.log('🚀 Running Sprint 10 Redis & Cache-Aside Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${name} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    console.log('🧪 0. Authenticating Test User:');
    const authRes = await request('POST', '/api/auth/register', {
      name: 'Cache Tester',
      email: `cachetester_${Date.now()}@collabspace.dev`,
      password: 'password123'
    });
    token = authRes.data.token || authRes.data.data?.token;
    assert(!!token, 'Obtained valid Auth Token for caching test');

    console.log('\n🧪 1. Testing Cache Stats Initial Endpoint:');
    const stats1 = await request('GET', '/api/cache/stats', null, token);
    assert(stats1.status === 200, 'GET /api/cache/stats returns 200', `Status: ${stats1.data.status}`);

    console.log('\n🧪 2. Testing Create Document:');
    const createRes = await request('POST', '/api/documents', {
      title: 'Redis Caching Whitepaper',
      content: 'Testing cache speed and invalidation'
    }, token);
    const docId = createRes.data.document?.id || createRes.data.data?.id;
    assert(createRes.status === 201 && !!docId, 'POST /api/documents returns 201', `Doc ID: ${docId}`);

    // Flush cache so first fetch is a true cache miss
    await request('POST', '/api/cache/flush', null, token);

    console.log('\n🧪 3. Testing Cache-Aside Pattern (First Fetch - Cache MISS):');
    const t1Start = Date.now();
    const fetch1 = await request('GET', `/api/documents/${docId}`, null, token);
    const t1Elapsed = Date.now() - t1Start;
    assert(fetch1.status === 200, 'First GET /api/documents/:id returns 200', `${t1Elapsed}ms - fromCache: ${fetch1.data.fromCache}`);
    assert(fetch1.data.fromCache === false, 'First fetch correctly flagged as fromCache=false (Cache Miss)');

    console.log('\n🧪 4. Testing Cache-Aside Pattern (Second Fetch - Cache HIT):');
    const t2Start = Date.now();
    const fetch2 = await request('GET', `/api/documents/${docId}`, null, token);
    const t2Elapsed = Date.now() - t2Start;
    assert(fetch2.status === 200, 'Second GET /api/documents/:id returns 200', `${t2Elapsed}ms - fromCache: ${fetch2.data.fromCache}`);
    assert(fetch2.data.fromCache === true, 'Second fetch correctly flagged as fromCache=true (Cache Hit)');
    assert(fetch2.data.document?.title === 'Redis Caching Whitepaper', 'Cached document data matches original');

    console.log('\n🧪 5. Testing Cache Invalidation on Update:');
    const updateRes = await request('PUT', `/api/documents/${docId}`, {
      title: 'Redis Caching Whitepaper (Updated)',
      content: 'Updated content invalidating cache'
    }, token);
    assert(updateRes.status === 200, 'PUT /api/documents/:id returns 200', 'Document updated');

    console.log('\n🧪 6. Testing Cache Freshness After Invalidation:');
    const fetch3 = await request('GET', `/api/documents/${docId}`, null, token);
    assert(fetch3.status === 200, 'GET /api/documents/:id returns 200', `Title: ${fetch3.data.document?.title}`);
    assert(fetch3.data.document?.title === 'Redis Caching Whitepaper (Updated)', 'Fresh content returned after cache update');

    console.log('\n🧪 7. Testing Cache Metrics Endpoint:');
    const stats2 = await request('GET', '/api/cache/stats', null, token);
    assert(stats2.status === 200, 'GET /api/cache/stats returns updated metrics');
    const statsData = stats2.data.stats || stats2.data;
    assert(statsData.hits >= 1, 'Cache hits counted accurately', `Hits: ${statsData.hits}`);
    assert(statsData.misses >= 1, 'Cache misses counted accurately', `Misses: ${statsData.misses}, Hit Ratio: ${statsData.hitRatio}`);

    console.log('\n🧪 8. Testing Cache Flush Endpoint:');
    const flushRes = await request('POST', '/api/cache/flush', null, token);
    assert(flushRes.status === 200, 'POST /api/cache/flush returns 200', flushRes.data.message);

    console.log(`\n========================================`);
    console.log(`🏁 Sprint 10 Cache Verification Complete: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runCacheTests();
