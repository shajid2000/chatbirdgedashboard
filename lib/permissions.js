/**
 * Central permission matrix.
 * Key: permission name  Value: roles that have it
 *
 * Roles (lowest → highest): staff < admin < superadmin
 */
export const PERMISSIONS = {
  // Channels
  'channels.view':        ['staff', 'admin', 'superadmin'],
  'channels.modify':      ['superadmin'],

  // AI Agent
  'ai.view':              ['admin', 'superadmin'],
  'ai.toggle':            ['admin', 'superadmin'],
  'ai.configure':         ['superadmin'],

  // Team
  'team.view':            ['admin', 'superadmin'],
  'team.invite':          ['admin', 'superadmin'],
  'team.remove':          ['admin', 'superadmin'],

  // Customers
  'customers.view':       ['staff', 'admin', 'superadmin'],
  'customers.assign':     ['staff', 'admin', 'superadmin'],
  'customers.edit':       ['staff', 'admin', 'superadmin'],
  'customers.merge':      ['staff', 'admin', 'superadmin'],

  // Conversations
  'conversations.reply':  ['staff', 'admin', 'superadmin'],
}

/**
 * Returns true if the given role has the given permission.
 * @param {string|undefined} role
 * @param {string} permission
 */
export function can(role, permission) {
  return PERMISSIONS[permission]?.includes(role) ?? false
}
