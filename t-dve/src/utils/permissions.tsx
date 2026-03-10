export type Permission =
  | 'User View'
  | 'User Edit'
  | 'Report View'
  | 'Configure View'
  | 'Configure Edit'
  | 'Super Admin'
  | 'One Way Trip'
  | 'Trips'
  | 'Admin';

export const hasPermission = (
  user: any,
  required?: Permission | Permission[]
): boolean => {
  if (!user) return false;

  const perms: Permission[] = Array.isArray(user?.access) ? user?.access : user?.access ? [user?.access] : [];

  const role = user?.role as string | undefined;

  // ONLY Super Admin has full access
  const isSuperAdmin = role === 'Super Admin' || perms.includes('Super Admin');
  if (isSuperAdmin) return true;

  // If nothing required, allow
  if (!required) return true;

  const requiredArr = Array.isArray(required) ? required : [required];

  if (requiredArr.length === 0) return true;

  // User must have at least one of the required permissions
  return requiredArr.some(req => perms.includes(req));
};