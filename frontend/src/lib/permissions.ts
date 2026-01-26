/**
 * Role-Based Access Control (RBAC) System
 */

export type Permission = 
  // Invoice permissions
  | 'invoices.read'
  | 'invoices.create'
  | 'invoices.update'
  | 'invoices.delete'
  | 'invoices.send'
  // Bill permissions
  | 'bills.read'
  | 'bills.create'
  | 'bills.update'
  | 'bills.delete'
  | 'bills.approve'
  // Report permissions
  | 'reports.read'
  | 'reports.export'
  // Customer/Supplier permissions
  | 'customers.read'
  | 'customers.manage'
  | 'suppliers.read'
  | 'suppliers.manage'
  // Journal Entry permissions
  | 'journal.read'
  | 'journal.create'
  | 'journal.update'
  | 'journal.delete'
  // Admin permissions
  | 'users.read'
  | 'users.manage'
  | 'roles.manage'
  | 'settings.manage'
  | 'audit.read'
  | 'companies.manage'
  | 'system.manage'
  // Wildcard
  | '*';

export type Role = 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: ['*'], // Admin has all permissions
  ACCOUNTANT: [
    'invoices.read',
    'invoices.create',
    'invoices.update',
    'invoices.delete',
    'invoices.send',
    'bills.read',
    'bills.create',
    'bills.update',
    'bills.delete',
    'bills.approve',
    'reports.read',
    'reports.export',
    'customers.read',
    'customers.manage',
    'suppliers.read',
    'suppliers.manage',
    'journal.read',
    'journal.create',
    'journal.update',
    'journal.delete',
  ],
  VIEWER: [
    'invoices.read',
    'bills.read',
    'reports.read',
    'customers.read',
    'suppliers.read',
    'journal.read',
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const permissions = rolePermissions[userRole];
  
  // Check for wildcard permission
  if (permissions.includes('*')) {
    return true;
  }
  
  // Check for specific permission
  if (permissions.includes(permission)) {
    return true;
  }
  
  // Check for wildcard category permission (e.g., 'invoices.*')
  const [category] = permission.split('.');
  if (permissions.includes(`${category}.*` as Permission)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user is an admin
 */
export function isAdmin(userRole: Role): boolean {
  return userRole === 'ADMIN';
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role];
}
