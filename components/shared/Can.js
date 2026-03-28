import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/permissions'

/**
 * Renders children only if the current user has the given permission.
 * Optionally renders `fallback` when access is denied.
 *
 * @example
 * <Can permission="channels.modify">
 *   <Button>Connect</Button>
 * </Can>
 *
 * @example
 * <Can permission="ai.configure" fallback={<p>No access.</p>}>
 *   <ConfigForm />
 * </Can>
 */
export default function Can({ permission, fallback = null, children }) {
  const { user } = useAuth()
  if (!can(user?.role, permission)) return fallback
  return children
}
