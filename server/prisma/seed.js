const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting CollabSpace Database Seeding...');

  // Hash demo password
  const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);

  // 1. Seed Users
  console.log('👤 Seeding Users...');
  const alex = await prisma.user.upsert({
    where: { email: 'alex@collabspace.com' },
    update: {},
    create: {
      name: 'Alex Mercer',
      email: 'alex@collabspace.com',
      password: hashedPassword
    }
  });

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@collabspace.com' },
    update: {},
    create: {
      name: 'Sarah Connor',
      email: 'sarah@collabspace.com',
      password: hashedPassword
    }
  });

  console.log(`✅ Users created: ${alex.name} (${alex.email}), ${sarah.name} (${sarah.email})`);

  // 2. Seed Documents for Alex
  console.log('📄 Seeding Documents...');
  
  const archDocContent = `
    <h1>CollabSpace System Architecture</h1>
    <p>CollabSpace is a high-performance, real-time collaborative document platform.</p>
    <h2>Core Tech Stack</h2>
    <ul>
      <li><strong>Frontend:</strong> React 19, Tailwind CSS, React Quill</li>
      <li><strong>Backend:</strong> Node.js, Express, Prisma ORM</li>
      <li><strong>Database:</strong> PostgreSQL with B-Tree Indexing</li>
      <li><strong>Real-time Layer:</strong> Socket.IO & Redis Pub/Sub</li>
    </ul>
    <blockquote>"Built for high scalability and instant sub-100ms collaborative latency."</blockquote>
    <pre class="ql-syntax">const engine = new CollabSpaceEngine({ adapter: 'redis' });</pre>
  `;

  const doc1 = await prisma.document.create({
    data: {
      title: 'CollabSpace System Architecture',
      icon: '🚀',
      content: archDocContent.trim(),
      ownerId: alex.id
    }
  });

  const doc2 = await prisma.document.create({
    data: {
      title: 'Sprint 4 Database & Indexing Plan',
      icon: '💾',
      content: '<h2>Database Optimization Plan</h2><p>Indexes created on ownerId, email, and updatedAt.</p>',
      ownerId: alex.id
    }
  });

  const doc3 = await prisma.document.create({
    data: {
      title: 'Engineering Best Practices',
      icon: '📚',
      content: '<h2>Clean Architecture Guidelines</h2><p>Follow modular structure and defensive validation.</p>',
      ownerId: sarah.id
    }
  });

  console.log(`✅ Documents created: "${doc1.title}", "${doc2.title}", "${doc3.title}"`);

  // 3. Seed Collaborator (Share doc2 with Sarah as EDITOR)
  console.log('👥 Seeding Collaborations...');
  await prisma.collaborator.upsert({
    where: {
      userId_documentId: {
        userId: sarah.id,
        documentId: doc2.id
      }
    },
    update: {},
    create: {
      userId: sarah.id,
      documentId: doc2.id,
      role: 'EDITOR'
    }
  });

  console.log(`✅ Assigned Sarah as EDITOR on "${doc2.title}"`);

  // 4. Seed Document Version History
  console.log('📜 Seeding Version History...');
  await prisma.documentVersion.create({
    data: {
      title: 'CollabSpace System Architecture (v1.0 Snapshot)',
      content: '<h1>Initial Architecture Draft</h1><p>Basic client-server setup.</p>',
      documentId: doc1.id
    }
  });

  console.log(`✅ Created Version 1 snapshot for "${doc1.title}"`);
  console.log('🎉 Database seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
