/**
 * Sprint 12: Version History & Point-in-Time Restoration Integration Tests
 */
const { makeRequest } = require('./auth.test');

async function runVersionTests(assert, authToken, docId) {
  console.log('\n🔵 [SUITE 4/5] Running Version History & Restoration Tests...');
  let snapshotVersionId = '';

  // 1. Create an explicit named version snapshot
  const createVerRes = await makeRequest('POST', `/api/documents/${docId}/versions`, {
    name: 'v1.0 Milestone Release',
    content: 'Stable release candidate content before major refactor.'
  }, authToken);

  assert(createVerRes.status === 201, 'POST /api/documents/:id/versions creates snapshot (201)');
  const version = createVerRes.data.version || createVerRes.data.data;
  assert(!!version && !!version.id, 'Version snapshot has ID');
  const vName = version?.versionName || version?.name;
  assert(vName === 'v1.0 Milestone Release', 'Snapshot name persisted accurately', `Name: ${vName}`);
  snapshotVersionId = version?.id;

  // 2. Fetch version history list
  const listVerRes = await makeRequest('GET', `/api/documents/${docId}/versions`, null, authToken);
  assert(listVerRes.status === 200, 'GET /api/documents/:id/versions returns 200');
  const versions = listVerRes.data.versions || listVerRes.data.data || [];
  assert(Array.isArray(versions) && versions.length > 0, 'Version list returns non-empty snapshot timeline');

  // 3. Mutate document before restoration
  await makeRequest('PUT', `/api/documents/${docId}`, {
    title: 'Corrupted Draft Title',
    content: 'Experimental unstable content that broke the build.'
  }, authToken);

  // 4. Restore document back to snapshotVersionId
  const restoreRes = await makeRequest('POST', `/api/documents/${docId}/versions/${snapshotVersionId}/restore`, {}, authToken);
  assert(restoreRes.status === 200, 'POST /api/documents/:id/versions/:versionId/restore restores document (200)');
  const restoredDoc = restoreRes.data.document || restoreRes.data.data;
  assert(restoredDoc?.content === 'Stable release candidate content before major refactor.', 'Document content successfully reverted to snapshot');

  // 5. Verify pre-restoration safety backup was created
  const postRestoreListRes = await makeRequest('GET', `/api/documents/${docId}/versions`, null, authToken);
  const updatedVersions = postRestoreListRes.data.versions || postRestoreListRes.data.data || [];
  const hasBackup = updatedVersions.some(v => {
    const label = v.versionName || v.name || '';
    return label.toLowerCase().includes('backup') || label.toLowerCase().includes('restore');
  });
  assert(hasBackup, 'Automatic pre-restoration safety backup generated in history');

  return { snapshotVersionId };
}

module.exports = { runVersionTests };
