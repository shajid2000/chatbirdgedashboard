import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/permissions'

/**
 * Returns true if the current user has the given permission.
 * @param {string} permission
 */
export function usePermission(permission) {
  const { user } = useAuth()
  return can(user?.role, permission)
}

/**
 * Returns an object mapping each permission name to a boolean.
 * @param {string[]} permissions
 */
export function usePermissions(permissions) {
  const { user } = useAuth()
  return Object.fromEntries(permissions.map((p) => [p, can(user?.role, p)]))
}
