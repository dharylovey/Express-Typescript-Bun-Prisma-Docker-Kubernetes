import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter: pool });

const BATCH_SIZE = 10000;
const TOTAL_RECORDS = 2000000;

async function main() {
  console.log("🌱 Starting seed for 2 million records...");
  const startTime = Date.now();

  // Clear existing products
  console.log("Emptying product table...");
  await prisma.product.deleteMany();
  console.log("✓ Cleared existing products");

  let totalCreated = 0;

  for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
    const products: any[] = [];
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_RECORDS - i);

    for (let j = 0; j < currentBatchSize; j++) {
      products.push({
        name: `Product ${i + j + 1}`,
        description: `Description for product ${i + j + 1} - ${Math.random()
          .toString(36)
          .substring(7)}`,
        price: parseFloat((Math.random() * 1000).toFixed(2)),
        stock: Math.floor(Math.random() * 1000),
      });
    }

    await prisma.product.createMany({
      data: products,
    });

    totalCreated += currentBatchSize;
    const progress = ((totalCreated / TOTAL_RECORDS) * 100).toFixed(1);
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    // Log every 100k or on completion
    if (totalCreated % 100000 === 0 || totalCreated === TOTAL_RECORDS) {
      console.log(
        `✓ Created ${totalCreated.toLocaleString()} / ${TOTAL_RECORDS.toLocaleString()} products (${progress}%) - ${elapsedSeconds}s elapsed`
      );
    } else {
      // Optional: lighter logging for smaller batches if needed, but keeping it clean for now
    }
  }

  const finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🌱 Seed completed in ${finalTime}s!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
