/**
 * Our own team (docs/product/staff-console.md): which departments a person
 * is in, as a member or its lead, from `staff_departments`. Every staff check
 * in the API asks here, on every request, so taking someone off the team
 * works at once. The super admin passes every check.
 *
 * On the live site, accounts on our test numbers are in no department (as
 * they carry no role there either, `withLiveRole` in routes/me.ts): they
 * sign in with the fixed test code, so anyone could use them.
 */

import type { Department, StaffMembership } from '@snt/core';
import { eq } from 'drizzle-orm';
import { db } from './db/client';
import * as t from './db/schema';

const TEST_PHONE = /^\+263770000\d{3}$/;
const LIVE = process.env.VERCEL_ENV === 'production';

/** Whether this account's phone is one of our test numbers, on the live site. */
export function isLiveTestAccount(phone: string | null): boolean {
  return LIVE && phone !== null && TEST_PHONE.test(phone);
}

interface Who {
  id: string;
  role: string;
  phone: string | null;
}

/** The departments this person is in. */
export async function staffOf(person: Who): Promise<StaffMembership[]> {
  if (isLiveTestAccount(person.phone)) return [];
  return db
    .select({ department: t.staffDepartments.department, lead: t.staffDepartments.lead })
    .from(t.staffDepartments)
    .where(eq(t.staffDepartments.personId, person.id));
}

/** Whether this person may use a department's section: in it (as its lead,
    where the action needs one), or the super admin. */
export async function inDepartment(person: Who, department: Department, lead = false): Promise<boolean> {
  if (person.role === 'super_admin') return true;
  const staff = await staffOf(person);
  return staff.some((row) => row.department === department && (!lead || row.lead));
}
