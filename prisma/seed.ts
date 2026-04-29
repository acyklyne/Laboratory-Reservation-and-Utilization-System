import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const laboratories = [
  { name: 'Ergonomics Laboratory', description: 'Advanced biomechanics and human factors study.', capacity: 30, status: 'Available' as const },
  { name: 'Digital/Embedded Laboratory', description: 'IoT, microcontroller, and circuitry hub.', capacity: 25, status: 'Available' as const },
  { name: 'Network Laboratory', description: 'Networking, servers, and cybersecurity environment.', capacity: 40, status: 'Available' as const },
  { name: 'Microbiology/Parasitology Lab', description: 'Safe biological research and microscopy.', capacity: 20, status: 'Available' as const },
  { name: 'WSM Laboratory', description: 'Web Systems and Multimedia development studio.', capacity: 35, status: 'Available' as const },
  { name: 'Electronics Laboratory', description: 'Hardware prototyping and power electronics.', capacity: 30, status: 'Available' as const },
  { name: 'Computer Laboratory 1', description: 'General computing and programming resources.', capacity: 50, status: 'Available' as const },
  { name: 'Computer Laboratory 2', description: 'General computing and programming resources.', capacity: 50, status: 'Available' as const },
  { name: 'Computer Laboratory 3', description: 'General computing and programming resources.', capacity: 50, status: 'Available' as const },
  { name: 'Computer Laboratory 4', description: 'General computing and programming resources.', capacity: 50, status: 'Available' as const },
  { name: 'Computer Laboratory 5', description: 'General computing and programming resources.', capacity: 50, status: 'Available' as const },
];

async function main() {
  console.log('Seeding laboratories...');
  for (const lab of laboratories) {
    await prisma.laboratory.upsert({
      where: { name: lab.name },
      update: lab,
      create: lab,
    });
  }
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
