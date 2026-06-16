import prisma from "./prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hashedPassword = await bcrypt.hash("staff@123", 10);

  await prisma.user.upsert({
    where: {
      email: "staff@courier.com",
    },
    update: {},
    create: {
      email: "staff@courier.com",
      password_hash: hashedPassword,
      role: "staff",
    },
  });

  console.log("Test user created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
