import prisma from '../config/db';

/**
 * Generates next sequential patient code: P-00001, P-00002, ...
 * Uses DB count to determine next number. Not race-safe for high concurrency —
 * for SaaS scale, replace with a DB sequence or UUID-based code.
 */
export async function generatePatientCode(): Promise<string> {
  const count = await prisma.patient.count();
  const next = count + 1;
  return `P-${String(next).padStart(5, '0')}`;
}
