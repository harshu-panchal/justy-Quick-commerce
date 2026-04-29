import Admin from '../models/Admin';

const DEFAULT_ADMIN_MOBILE   = process.env.DEFAULT_ADMIN_MOBILE   || '9111966732';
const DEFAULT_ADMIN_EMAIL    = process.env.DEFAULT_ADMIN_EMAIL    || 'admin@jyasti.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
const DEFAULT_ADMIN_FIRST    = process.env.DEFAULT_ADMIN_FIRST    || 'Default';
const DEFAULT_ADMIN_LAST     = process.env.DEFAULT_ADMIN_LAST     || 'Admin';
const DEFAULT_ADMIN_ROLE     = (process.env.DEFAULT_ADMIN_ROLE as 'Super Admin' | 'Admin') || 'Super Admin';

/**
 * Creates the initial admin account on first startup if one doesn't exist.
 * Falls back to hardcoded dev credentials when env vars are not set.
 */
export async function ensureDefaultAdmin() {
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
