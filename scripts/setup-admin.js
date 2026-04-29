const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    const email = 'admin@pnc.edu.ph';
    const password = 'admin123';
    const name = 'System Administrator';

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('Admin user already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('Admin user updated successfully!');
    } else {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('Admin user created successfully!');
    }

    console.log('Email: admin@pnc.edu.ph');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
