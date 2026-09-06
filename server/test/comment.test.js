/**
 * Sprint 12: Comments & Highlights Integration Tests
 */
const { makeRequest } = require('./auth.test');

async function runCommentTests(assert, authToken, docId) {
  console.log('\n🔵 [SUITE 3/5] Running Comments & Highlights Threading Tests...');
  let rootCommentId = '';
  let replyCommentId = '';

  // 1. Create a root comment with highlight anchor
  const createCommentRes = await makeRequest('POST', `/api/documents/${docId}/comments`, {
    content: 'Should we add E2E Cypress tests or Vitest mocks?',
    highlightedText: 'Initial architecture requirements'
  }, authToken);

  assert(createCommentRes.status === 201, 'POST /api/documents/:id/comments creates root comment (201)');
  const comment = createCommentRes.data.comment || createCommentRes.data.data;
  assert(!!comment && !!comment.id, 'Comment payload has generated ID');
  assert(comment?.highlightedText === 'Initial architecture requirements', 'Comment anchors highlight text correctly');
  assert(comment?.resolved === false, 'New comment initialized with resolved=false');
  rootCommentId = comment?.id;

  // 2. Add a threaded reply to the comment
  const replyRes = await makeRequest('POST', `/api/documents/${docId}/comments`, {
    content: 'Let us start with Vitest mocks and fast integration suites.',
    parentId: rootCommentId
  }, authToken);

  assert(replyRes.status === 201, 'POST /api/documents/:id/comments creates threaded reply (201)');
  const reply = replyRes.data.comment || replyRes.data.data;
  assert(reply?.parentId === rootCommentId, 'Reply parentId links to root comment');
  replyCommentId = reply?.id;

  // 3. Fetch all comments for document
  const listCommentsRes = await makeRequest('GET', `/api/documents/${docId}/comments`, null, authToken);
  assert(listCommentsRes.status === 200, 'GET /api/documents/:id/comments returns 200');
  const comments = listCommentsRes.data.comments || listCommentsRes.data.data || [];
  assert(Array.isArray(comments) && comments.some(c => c.id === rootCommentId), 'Comments list includes root comment');

  // 4. Resolve comment thread
  const resolveRes = await makeRequest('PATCH', `/api/documents/${docId}/comments/${rootCommentId}/resolve`, {
    resolved: true
  }, authToken);
  assert(resolveRes.status === 200, 'PATCH /api/documents/:id/comments/:commentId/resolve resolves thread (200)');
  const resolvedComment = resolveRes.data.comment || resolveRes.data.data;
  assert(resolvedComment?.resolved === true, 'Comment resolved state flipped to true');

  // 5. Delete reply comment
  const deleteReplyRes = await makeRequest('DELETE', `/api/documents/${docId}/comments/${replyCommentId}`, null, authToken);
  assert(deleteReplyRes.status === 200, 'DELETE /api/documents/:id/comments/:commentId deletes reply (200)');

  return { rootCommentId };
}

module.exports = { runCommentTests };
