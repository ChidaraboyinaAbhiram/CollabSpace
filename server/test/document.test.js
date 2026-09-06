/**
 * Sprint 12: Document CRUD & Cache-Aside Integration Tests
 */
const { makeRequest } = require('./auth.test');

async function runDocumentTests(assert, authToken) {
  console.log('\n🔵 [SUITE 2/5] Running Document CRUD & Cache-Aside Tests...');
  let createdDocId = '';

  // 1. Create a new document
  const createRes = await makeRequest('POST', '/api/documents', {
    title: 'QA Engineering Master Plan',
    icon: '🚀',
    content: 'Initial architecture requirements and milestones.'
  }, authToken);

  assert(createRes.status === 201, 'POST /api/documents creates document (201)');
  const doc = createRes.data.document || createRes.data.data;
  assert(!!doc && !!doc.id, 'Created document includes unique ID');
  assert(doc?.title === 'QA Engineering Master Plan', 'Document title persisted accurately');
  assert(doc?.icon === '🚀', 'Document icon persisted accurately');
  createdDocId = doc?.id;

  // 2. List all documents
  const listRes = await makeRequest('GET', '/api/documents', null, authToken);
  assert(listRes.status === 200, 'GET /api/documents returns 200');
  const docsList = listRes.data.documents || listRes.data.data || [];
  assert(Array.isArray(docsList) && docsList.some(d => d.id === createdDocId), 'Document list contains newly created document');

  // 3. Cache Miss on newly flushed item
  await makeRequest('POST', '/api/cache/flush', null, authToken);
  const getRes1 = await makeRequest('GET', `/api/documents/${createdDocId}`, null, authToken);
  assert(getRes1.status === 200, 'GET /api/documents/:id returns 200 on Cache Miss');
  assert(getRes1.data.fromCache === false, 'First fetch correctly flagged as fromCache=false');

  // 4. Cache Hit on second fetch
  const getRes2 = await makeRequest('GET', `/api/documents/${createdDocId}`, null, authToken);
  assert(getRes2.status === 200, 'GET /api/documents/:id returns 200 on Cache Hit');
  assert(getRes2.data.fromCache === true, 'Second fetch served from Redis Cache (fromCache=true)');

  // 5. Update document content and title
  const updateRes = await makeRequest('PUT', `/api/documents/${createdDocId}`, {
    title: 'QA Engineering Master Plan (v2)',
    content: 'Updated content with test matrix and coverage targets.'
  }, authToken);
  assert(updateRes.status === 200, 'PUT /api/documents/:id updates document (200)');

  // 6. Verify cache invalidation returned fresh data
  const getRes3 = await makeRequest('GET', `/api/documents/${createdDocId}`, null, authToken);
  const updatedDoc = getRes3.data.document || getRes3.data.data;
  assert(updatedDoc?.title === 'QA Engineering Master Plan (v2)', 'Updated document reflects in subsequent GET');

  // 7. Share document with a collaborator
  const collabEmail = `collab_${Date.now()}@collabspace.dev`;
  await makeRequest('POST', '/api/auth/register', {
    name: 'QA Collaborator',
    email: collabEmail,
    password: 'securePassword123'
  });

  const shareRes = await makeRequest('POST', `/api/documents/${createdDocId}/share`, {
    email: collabEmail,
    role: 'EDITOR'
  }, authToken);
  assert(shareRes.status === 200 || shareRes.status === 201, 'POST /api/documents/:id/share shares document');

  return { docId: createdDocId, collabEmail };
}

module.exports = { runDocumentTests };
