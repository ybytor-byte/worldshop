import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.offer.deleteMany();
  await prisma.productScan.deleteMany();
  await prisma.product.deleteMany();
  console.log('Cleaned');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
