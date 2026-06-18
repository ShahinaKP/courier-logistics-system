import prisma from "./prisma";
import bcrypt from "bcryptjs";

const REGIONS = [
  { region_code: "RG-N", region_name: "North Region" },
  { region_code: "RG-S", region_name: "South Region" },
  { region_code: "RG-E", region_name: "East Region" },
  { region_code: "RG-W", region_name: "West Region" },
  { region_code: "RG-C", region_name: "Central Region" },
];

const PINCODES = [
  // North — Delhi, Haryana, Punjab, UP, Uttarakhand
  { pincode: "110001", city: "Delhi (Connaught Place)", region_code: "RG-N" },
  { pincode: "110011", city: "Delhi (Lodi Road)", region_code: "RG-N" },
  { pincode: "122001", city: "Gurgaon", region_code: "RG-N" },
  { pincode: "201301", city: "Noida", region_code: "RG-N" },
  { pincode: "160017", city: "Chandigarh", region_code: "RG-N" },
  { pincode: "226001", city: "Lucknow", region_code: "RG-N" },
  { pincode: "208001", city: "Kanpur", region_code: "RG-N" },
  { pincode: "248001", city: "Dehradun", region_code: "RG-N" },
  { pincode: "250001", city: "Meerut", region_code: "RG-N" },
  { pincode: "141001", city: "Ludhiana", region_code: "RG-N" },

  // South — Karnataka, Tamil Nadu, Kerala, Andhra, Telangana
  { pincode: "560001", city: "Bangalore (MG Road)", region_code: "RG-S" },
  { pincode: "560034", city: "Bangalore (Indiranagar)", region_code: "RG-S" },
  { pincode: "600001", city: "Chennai (George Town)", region_code: "RG-S" },
  { pincode: "600020", city: "Chennai (Anna Nagar)", region_code: "RG-S" },
  { pincode: "682001", city: "Kochi", region_code: "RG-S" },
  { pincode: "695001", city: "Thiruvananthapuram", region_code: "RG-S" },
  { pincode: "500001", city: "Hyderabad", region_code: "RG-S" },
  { pincode: "530001", city: "Visakhapatnam", region_code: "RG-S" },
  { pincode: "625001", city: "Madurai", region_code: "RG-S" },
  { pincode: "641001", city: "Coimbatore", region_code: "RG-S" },

  // East — West Bengal, Odisha, Assam, Bihar, Jharkhand
  { pincode: "700001", city: "Kolkata (BBD Bagh)", region_code: "RG-E" },
  { pincode: "700019", city: "Kolkata (Ballygunge)", region_code: "RG-E" },
  { pincode: "751001", city: "Bhubaneswar", region_code: "RG-E" },
  { pincode: "781001", city: "Guwahati", region_code: "RG-E" },
  { pincode: "800001", city: "Patna", region_code: "RG-E" },
  { pincode: "834001", city: "Ranchi", region_code: "RG-E" },
  { pincode: "744101", city: "Port Blair", region_code: "RG-E" },

  // West — Maharashtra, Gujarat, Goa, Rajasthan
  { pincode: "400001", city: "Mumbai (Fort)", region_code: "RG-W" },
  { pincode: "400069", city: "Mumbai (Andheri)", region_code: "RG-W" },
  { pincode: "411001", city: "Pune", region_code: "RG-W" },
  { pincode: "380001", city: "Ahmedabad", region_code: "RG-W" },
  { pincode: "395001", city: "Surat", region_code: "RG-W" },
  { pincode: "302001", city: "Jaipur", region_code: "RG-W" },
  { pincode: "403001", city: "Goa (Panaji)", region_code: "RG-W" },
  { pincode: "360001", city: "Rajkot", region_code: "RG-W" },

  // Central — MP, Chhattisgarh
  { pincode: "462001", city: "Bhopal", region_code: "RG-C" },
  { pincode: "452001", city: "Indore", region_code: "RG-C" },
  { pincode: "492001", city: "Raipur", region_code: "RG-C" },
  { pincode: "474001", city: "Gwalior", region_code: "RG-C" },
  { pincode: "440001", city: "Nagpur", region_code: "RG-C" },
  { pincode: "482001", city: "Jabalpur", region_code: "RG-C" },
];

async function main() {
  console.log("Seeding collection database...");

  // Staff user
  const hashedPassword = await bcrypt.hash("staff@123", 10);
  await prisma.user.upsert({
    where: { email: "staff@courier.com" },
    update: {},
    create: {
      email: "staff@courier.com",
      password_hash: hashedPassword,
      role: "staff",
    },
  });

  // Regions
  for (const r of REGIONS) {
    await prisma.region.upsert({
      where: { region_code: r.region_code },
      update: {},
      create: r,
    });
  }

  // Pincodes
  for (const p of PINCODES) {
    const region = await prisma.region.findUnique({
      where: { region_code: p.region_code },
    });
    if (!region) continue;
    await prisma.pincode.upsert({
      where: { pincode: p.pincode },
      update: {},
      create: { pincode: p.pincode, city: p.city, region_id: region.id },
    });
  }

  console.log("Seed completed.");
  console.log("  Login: staff@courier.com / staff@123");
  console.log(`  Regions: ${REGIONS.length}, Pincodes: ${PINCODES.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
