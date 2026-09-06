/**
 * Sprint 12: Authentication & Authorization Integration Tests
 */
const http = require('http');

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runAuthTests(assert) {
  console.log('\n🔵 [SUITE 1/5] Running Authentication & Security Tests...');
  const testEmail = `qa_tester_${Date.now()}@collabspace.dev`;
  let authToken = '';

  // 1. Register with valid details
  const regRes = await makeRequest('POST', '/api/auth/register', {
    name: 'QA Lead Tester',
    email: testEmail,
    password: 'securePassword123'
  });
  assert(regRes.status === 201, 'POST /api/auth/register creates user (201)', `Email: ${testEmail}`);
  authToken = regRes.data.token || regRes.data.data?.token;
  assert(!!authToken, 'Registration returns valid JWT token');

  // 2. Register with duplicate email
  const dupRes = await makeRequest('POST', '/api/auth/register', {
    name: 'Duplicate User',
    email: testEmail,
    password: 'securePassword123'
  });
  assert(dupRes.status === 400 || dupRes.status === 409, 'POST /api/auth/register rejects duplicate email (400/409)');

  // 3. Register with short password
  const shortPassRes = await makeRequest('POST', '/api/auth/register', {
    name: 'Short Pass User',
    email: `shortpass_${Date.now()}@collabspace.dev`,
    password: '123'
  });
  assert(shortPassRes.status === 400, 'POST /api/auth/register rejects password < 6 characters (400)');

  // 4. Login with valid credentials
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    email: testEmail,
    password: 'securePassword123'
  });
  assert(loginRes.status === 200, 'POST /api/auth/login succeeds with correct password (200)');
  assert(!!(loginRes.data.token || loginRes.data.data?.token), 'Login response contains auth token');

  // 5. Login with invalid password
  const wrongPassRes = await makeRequest('POST', '/api/auth/login', {
    email: testEmail,
    password: 'incorrectPassword'
  });
  assert(wrongPassRes.status === 401 || wrongPassRes.status === 400, 'POST /api/auth/login rejects wrong password (401/400)');

  // 6. Access protected route without token
  const noTokenRes = await makeRequest('GET', '/api/documents');
  assert(noTokenRes.status === 401, 'Protected route rejects request without Authorization header (401)');

  // 7. Access protected route with invalid token
  const invalidTokenRes = await makeRequest('GET', '/api/documents', null, 'invalid.token.signature');
  assert(invalidTokenRes.status === 401, 'Protected route rejects forged token signature (401)');

  return { token: authToken, email: testEmail };
}

module.exports = { runAuthTests, makeRequest };
