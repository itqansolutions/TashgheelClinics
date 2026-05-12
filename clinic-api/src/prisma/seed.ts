import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database...\n');

  // ── Countries ───────────────────────────────────────────────────────────
  const countries = [
    { name: 'Egypt', code: 'EGY' },
    { name: 'Saudi Arabia', code: 'SAU' },
    { name: 'United Arab Emirates', code: 'ARE' },
    { name: 'Kuwait', code: 'KWT' },
    { name: 'Qatar', code: 'QAT' },
    { name: 'Jordan', code: 'JOR' },
    { name: 'Lebanon', code: 'LBN' },
    { name: 'Libya', code: 'LBY' },
    { name: 'United Kingdom', code: 'GBR' },
    { name: 'United States', code: 'USA' },
    { name: 'Other', code: 'OTH' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { id: countries.indexOf(country) + 1 },
      update: {},
      create: country,
    });
  }
  console.log(`✅  ${countries.length} countries seeded`);

  // ── Lead Sources ────────────────────────────────────────────────────────
  const leadSources = [
    { name: 'Social Media (Instagram)' },
    { name: 'Social Media (Facebook)' },
    { name: 'Social Media (TikTok)' },
    { name: 'Google Search' },
    { name: 'Friend Referral' },
    { name: 'Doctor Referral' },
    { name: 'Walk-in' },
    { name: 'Phone Call' },
    { name: 'Website' },
    { name: 'Other' },
  ];

  for (const ls of leadSources) {
    await prisma.leadSource.upsert({
      where: { id: leadSources.indexOf(ls) + 1 },
      update: {},
      create: ls,
    });
  }
  console.log(`✅  ${leadSources.length} lead sources seeded`);

  // ── Body Areas ──────────────────────────────────────────────────────────
  const bodyAreas = [
    // Front
    { name: 'Forehead', zone: 'front', svgId: 'area-forehead' },
    { name: 'Around Eyes', zone: 'front', svgId: 'area-eyes' },
    { name: 'Nose', zone: 'front', svgId: 'area-nose' },
    { name: 'Cheeks', zone: 'front', svgId: 'area-cheeks' },
    { name: 'Lips', zone: 'front', svgId: 'area-lips' },
    { name: 'Chin', zone: 'front', svgId: 'area-chin' },
    { name: 'Neck (front)', zone: 'front', svgId: 'area-neck-front' },
    { name: 'Chest', zone: 'front', svgId: 'area-chest' },
    { name: 'Abdomen', zone: 'front', svgId: 'area-abdomen' },
    { name: 'Arms (front)', zone: 'front', svgId: 'area-arms-front' },
    { name: 'Thighs (front)', zone: 'front', svgId: 'area-thighs-front' },
    { name: 'Legs (front)', zone: 'front', svgId: 'area-legs-front' },
    // Back
    { name: 'Scalp', zone: 'back', svgId: 'area-scalp' },
    { name: 'Neck (back)', zone: 'back', svgId: 'area-neck-back' },
    { name: 'Upper Back', zone: 'back', svgId: 'area-upper-back' },
    { name: 'Lower Back', zone: 'back', svgId: 'area-lower-back' },
    { name: 'Buttocks', zone: 'back', svgId: 'area-buttocks' },
    { name: 'Arms (back)', zone: 'back', svgId: 'area-arms-back' },
    { name: 'Thighs (back)', zone: 'back', svgId: 'area-thighs-back' },
    { name: 'Legs (back)', zone: 'back', svgId: 'area-legs-back' },
  ];

  for (const area of bodyAreas) {
    await prisma.bodyArea.upsert({
      where: { id: bodyAreas.indexOf(area) + 1 },
      update: {},
      create: area,
    });
  }
  console.log(`✅  ${bodyAreas.length} body areas seeded`);

  // ── Default Clinic Settings ─────────────────────────────────────────────
  const settings: { key: string; value: string }[] = [
    { key: 'clinic_name', value: 'My Cosmetic Clinic' },
    { key: 'clinic_phone', value: '' },
    { key: 'clinic_email', value: '' },
    { key: 'clinic_address', value: '' },
    { key: 'clinic_logo', value: '' },
    { key: 'currency', value: 'EGP' },
    { key: 'currency_symbol', value: 'ج.م' },
    { key: 'appointment_slot_minutes', value: '30' },
    { key: 'working_hours_start', value: '09:00' },
    { key: 'working_hours_end', value: '21:00' },
    { key: 'booking_advance_days', value: '30' },
  ];

  for (const setting of settings) {
    await prisma.clinicSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅  ${settings.length} clinic settings seeded`);

  // ── Default Admin User ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {},
    create: {
      fullName: 'System Administrator',
      email: 'admin@clinic.com',
      passwordHash: adminPassword,
      role: 'Admin',
      isActive: true,
    },
  });
  console.log(`✅  Admin user: ${admin.email} (password: Admin@123) — change immediately!`);

  // ── Sample Specialty + Service (for testing) ────────────────────────────
  const dermatology = await prisma.specialty.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Dermatology' },
  });

  await prisma.service.upsert({
    where: { id: 1 },
    update: {},
    create: {
      specialtyId: dermatology.id,
      name: 'Botox Injection',
      price: 2500,
      durationMin: 30,
    },
  });

  await prisma.service.upsert({
    where: { id: 2 },
    update: {},
    create: {
      specialtyId: dermatology.id,
      name: 'PRP Treatment',
      price: 3500,
      durationMin: 60,
    },
  });

  console.log('✅  Sample specialty and services seeded');

  console.log('\n🎉  Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
