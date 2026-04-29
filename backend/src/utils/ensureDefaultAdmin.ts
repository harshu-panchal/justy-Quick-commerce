import Admin from '../models/Admin';

const DEFAULT_ADMIN_MOBILE = process.env.DEFAULT_ADMIN_MOBILE;
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL;
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;
const DEFAULT_ADMIN_FIRST = process.env.DEFAULT_ADMIN_FIRST || 'Default';
const DEFAULT_ADMIN_LAST = process.env.DEFAULT_ADMIN_LAST || 'Admin';
const DEFAULT_ADMIN_ROLE = (process.env.DEFAULT_ADMIN_ROLE as 'Super Admin' | 'Admin') || 'Super Admin';

/**
 * Creates the initial admin account on first startup.
 * Requires DEFAULT_ADMIN_MOBILE, DEFAULT_ADMIN_EMAIL, and DEFAULT_ADMIN_PASSWORD
 * to be explicitly set in the environment — will not run with unset credentials.
 */
export async function ensureDefaultAdmin() {
  if (!DEFAULT_ADMIN_MOBILE || !DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
    console.warn('[Admin] DEFAULT_ADMIN_MOBILE / EMAIL / PASSWORD not set — skipping admin seed.');
    return null;
  }

  const existing = await Admin.findOne({
    $or: [{ mobile: DEFAULT_ADMIN_MOBILE }, { email: DEFAULT_ADMIN_EMAIL }],
  });

  if (existing) {
    return existing;
  }

  const admin = await Admin.create({
    firstName: DEFAULT_ADMIN_FIRST,
    lastName: DEFAULT_ADMIN_LAST,
    mobile: DEFAULT_ADMIN_MOBILE,
    email: DEFAULT_ADMIN_EMAIL,
    role: DEFAULT_ADMIN_ROLE,
    password: DEFAULT_ADMIN_PASSWORD,
  });

  console.log(`[Admin] Default admin created (mobile: ${admin.mobile}, role: ${admin.role})`);
  return admin;
}

export default ensureDefaultAdmin;
