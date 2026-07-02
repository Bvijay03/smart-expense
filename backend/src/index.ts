import "dotenv/config";
import { createApp } from "@/app";
import { env } from "@/config/env";
import { prisma } from "@/database/prisma";

const app = createApp();

async function main() {
  await prisma.$connect();
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Smart Expense API running on http://0.0.0.0:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
