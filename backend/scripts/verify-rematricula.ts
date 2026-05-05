import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const invites = await prisma.reEnrollmentInvite.count();
  const responses = await prisma.preReEnrollmentResponse.count();
  const exceptions = await prisma.familyPriceException.count();
  const periods = await prisma.reEnrollmentPeriod.count();
  const students = await prisma.student.count();
  console.log(`DB em uso:`);
  console.log(`  Students:                 ${students}`);
  console.log(`  ReEnrollmentPeriod:       ${periods}`);
  console.log(`  ReEnrollmentInvite:       ${invites}`);
  console.log(`  PreReEnrollmentResponse:  ${responses}`);
  console.log(`  FamilyPriceException:     ${exceptions}`);
}
main().finally(() => prisma.$disconnect());
