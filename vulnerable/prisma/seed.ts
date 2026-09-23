import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingCatalog = await prisma.sessionType.count();
  if (existingCatalog === 0) {
    await prisma.sessionType.createMany({
      data: [
        {
          name: "Erstgespräch",
          description: "30 Minuten, kostenloses Kennenlernen.",
          priceCents: 0,
        },
        {
          name: "Coaching Session",
          description: "60 Minuten 1:1 Coaching.",
          priceCents: 9900,
        },
        {
          name: "Intensiv-Workshop",
          description: "3 Stunden, tiefgehende Arbeit an einem Thema.",
          priceCents: 24900,
        },
      ],
    });
  }

  await prisma.user.upsert({
    where: { email: "owner@clientportal.demo" },
    update: {},
    create: {
      email: "owner@clientportal.demo",
      name: "Studio Owner",
      passwordHash: await hashPassword("OwnerPass123!"),
      role: "OWNER",
    },
  });

  await prisma.user.upsert({
    where: { email: "client@clientportal.demo" },
    update: {},
    create: {
      email: "client@clientportal.demo",
      name: "Demo Client",
      passwordHash: await hashPassword("ClientPass123!"),
      role: "CLIENT",
    },
  });

  console.log("Seed complete.");
  console.log("Owner login:  owner@clientportal.demo / OwnerPass123!");
  console.log("Client login: client@clientportal.demo / ClientPass123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
