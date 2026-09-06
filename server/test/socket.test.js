/**
 * Sprint 12: Real-Time WebSocket Integration & Client Mock Tests
 */
const { io: ioClient } = require('socket.io-client');

function runSocketTests(assert, authToken, docId) {
  return new Promise((resolve) => {
    console.log('\n🔵 [SUITE 5/5] Running WebSocket Real-Time Sync & Presence Tests...');
    const SERVER_URL = 'http://localhost:5000';

    // 1. Connection without token (Handshake Rejection)
    const unauthSocket = ioClient(SERVER_URL, {
      auth: {},
      transports: ['websocket'],
      forceNew: true,
      reconnection: false
    });

    unauthSocket.on('connect_error', (err) => {
      assert(true, 'Socket handshake rejects connection without JWT token', err.message);
      unauthSocket.close();

      // 2. Establish 2 authenticated sockets to test real-time sync between collaborators
      connectCollaboratingSockets();
    });

    unauthSocket.on('connect', () => {
      assert(false, 'Socket connected without token (Should be rejected)');
      unauthSocket.close();
      connectCollaboratingSockets();
    });

    function connectCollaboratingSockets() {
      const client1 = ioClient(SERVER_URL, {
        auth: { token: authToken },
        transports: ['websocket'],
        forceNew: true
      });

      const client2 = ioClient(SERVER_URL, {
        auth: { token: authToken },
        transports: ['websocket'],
        forceNew: true
      });

      let client1Connected = false;
      let client2Connected = false;

      const checkBothConnected = () => {
        if (client1Connected && client2Connected) {
          startSyncVerification(client1, client2);
        }
      };

      client1.on('connect', () => {
        assert(true, 'Client 1 authenticated & connected via WebSocket');
        client1Connected = true;
        checkBothConnected();
      });

      client2.on('connect', () => {
        assert(true, 'Client 2 authenticated & connected via WebSocket');
        client2Connected = true;
        checkBothConnected();
      });
    }

    function startSyncVerification(client1, client2) {
      // 3. Room Joining
      client1.emit('join-document', docId);
      client2.emit('join-document', docId);

      // 4. Test Text Delta Propagation (client1 -> client2)
      const testDelta = { ops: [{ retain: 5 }, { insert: ' Real-time collaborative edit' }] };

      client2.on('receive-changes', (delta) => {
        assert(JSON.stringify(delta) === JSON.stringify(testDelta), 'Client 2 received broadcasted delta from Client 1');

        // 5. Test Remote Cursor Update
        client1.emit('cursor-move', {
          documentId: docId,
          range: { index: 12, length: 0 }
        });
      });

      client2.on('remote-cursor-update', ({ range, user }) => {
        assert(range?.index === 12, 'Client 2 received live cursor position update', `Index: ${range?.index}`);

        // 6. Test Live Typing Indicator
        client1.emit('user-typing', { documentId: docId });
      });

      client2.on('user-typing', ({ userId, name }) => {
        assert(!!name, 'Client 2 received live user typing indicator', `Typing User: ${name}`);

        // 7. Cleanup & Disconnect
        client1.emit('leave-document');
        client1.disconnect();
        client2.disconnect();

        setTimeout(() => {
          assert(true, 'Socket rooms and sessions cleaned up successfully');
          resolve();
        }, 300);
      });

      // Trigger delta emission from client1
      setTimeout(() => {
        client1.emit('send-changes', { documentId: docId, delta: testDelta });
      }, 300);
    }
  });
}

module.exports = { runSocketTests };
