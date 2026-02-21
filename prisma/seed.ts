import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.movie.count();
  if (count > 0) {
    console.log('Movies already exist, skipping seed');
    return;
  }

  const filePath = path.join(process.cwd(), 'movies.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const movies = JSON.parse(raw) as Array<{
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    genre: string;
    duration: string;
  }>;

  await prisma.movie.createMany({ data: movies });
  console.log(`Seeded ${movies.length} movies`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

