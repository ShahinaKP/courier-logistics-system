import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.region.createMany({
    data: [
      { region_code: "RG-N", region_name: "North Region" },
      { region_code: "RG-S", region_name: "South Region" },
      { region_code: "RG-E", region_name: "East Region" },
      { region_code: "RG-W", region_name: "West Region" },
      { region_code: "RG-C", region_name: "Central Region" },
    ],
  });

  await prisma.truck.createMany({
    data: [
      { truck_code: "TRK-001", capacity: 20 },
      { truck_code: "TRK-002", capacity: 15 },
      { truck_code: "TRK-003", capacity: 10 },
    ],
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
