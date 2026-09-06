/**
 * Sprint 12: Master Automated Test Runner
 * Executes Auth, Document, Comments, Version History, and WebSocket test suites.
 */
const { server } = require('../src/server');
const { runAuthTests } = require('./auth.test');
const { runDocumentTests } = require('./document.test');
const { runCommentTests } = require('./comment.test');
const { runVersionTests } = require('./version.test');
const { runSocketTests } = require('./socket.test');

async function runMasterTestSuite() {
  // Allow server initialization
  await new Promise(r => setTimeout(r, 600));

  console.log(`\n========================================================`);
  console.log(`🧪 CollabSpace Master Automated Test Suite (Sprint 12)`);
  console.log(`========================================================`);

  const startTime = Date.now();
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, description, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${description} ${details ? `(${details})` : ''}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${description} ${details ? `(${details})` : ''}`);
      failedCount++;
    }
  };

  try {
    // Suite 1: Authentication & Authorization
    const authResult = await runAuthTests(assert);

    // Suite 2: Document Management & Cache-Aside
    const docResult = await runDocumentTests(assert, authResult.token);

    // Suite 3: Comments & Highlighting Threading
    await runCommentTests(assert, authResult.token, docResult.docId);

    // Suite 4: Version History & Point-in-Time Restoration
    await runVersionTests(assert, authResult.token, docResult.docId);

    // Suite 5: WebSocket Real-Time Sync & Presence
    await runSocketTests(assert, authResult.token, docResult.docId);

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n========================================================`);
    console.log(`📊 MASTER TEST RESULTS SCORECARD:`);
    console.log(`   Total Tests Run:  ${passedCount + failedCount}`);
    console.log(`   Passed:           ${passedCount}`);
    console.log(`   Failed:           ${failedCount}`);
    console.log(`   Execution Time:   ${totalDuration}s`);
    console.log(`   Pass Rate:        ${((passedCount / (passedCount + failedCount)) * 100).toFixed(1)}%`);
    console.log(`========================================================\n`);

    if (failedCount > 0) {
      console.error(`❌ Some tests failed. Please review logs above.`);
      process.exit(1);
    } else {
      console.log(`🏆 ALL TEST SUITES PASSED PERFECTLY (100% QA SUCCESS)!\n`);
      process.exit(0);
    }
  } catch (err) {
    console.error(`💥 Unhandled Test Runner Exception:`, err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runMasterTestSuite();
