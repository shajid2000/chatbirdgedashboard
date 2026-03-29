import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { usePermission } from '@/hooks/usePermission'
import api from '@/lib/api'

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data } = await api.get('/team/members/')
      return data
    },
  })
}

export default function TeamPage() {
  const { user } = useAuth()
  const isAdmin = usePermission('team.invite')
  const { data: members = [], isLoading } = useTeamMembers()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const [inviteResult, setInviteResult] = useState(null)

  const invite = useMutation({
    mutationFn: (payload) => api.post('/team/invite/', payload),
    onSuccess: ({ data }) => {
      setInviteResult(data)
      setEmail('')
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      toast.success(`Invite created for ${data.email}`)
    },
    onError: (err) => {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.detail || 'Failed to send invite.'
      toast.error(msg)
    },
  })

  const handleInvite = (e) => {
    e.preventDefault()
    invite.mutate({ email, role })
  }

  const inviteLink = inviteResult
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/accept?token=${inviteResult.token}`
    : null

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-surface-app">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Team</h1>
            <p className="text-sm text-text-muted mt-1">Manage your workspace members.</p>
          </div>

          {/* Team members list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members</CardTitle>
              <CardDescription>{members.length} member{members.length !== 1 ? 's' : ''} in this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-text-muted py-2">Loading…</p>
              ) : (
                <div className="divide-y divide-border-default">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 py-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-brand/20 text-brand text-xs font-medium">
                          {initials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary truncate">{member.full_name}</p>
                          {member.id === user?.id && (
                            <span className="text-[10px] text-text-muted">(you)</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted truncate">{member.email}</p>
                      </div>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                        style={{
                          color: member.role === 'admin' ? 'hsl(var(--brand-secondary))' : 'hsl(var(--text-muted))',
                          backgroundColor: member.role === 'admin' ? 'hsl(var(--brand-secondary) / 0.1)' : 'hsl(var(--border-default))',
                        }}
                      >
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite — admin only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invite Member</CardTitle>
                <CardDescription>Send an invite link to add a new team member.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Email address</Label>
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-sm bg-surface-app border border-border-default rounded-[var(--radius-sm)] px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand/30"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand hover:bg-brand-hover text-text-on-brand"
                    disabled={invite.isPending}
                  >
                    {invite.isPending ? 'Sending…' : 'Generate invite link'}
                  </Button>
                </form>

                {/* Invite link result */}
                {inviteLink && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-text-secondary">
                        Share this link with <strong>{inviteResult.email}</strong>. Expires in 48 hours.
                      </p>
                      <div className="flex items-center gap-2 bg-surface-app border border-border-default rounded-[var(--radius-sm)] px-3 py-2">
                        <code className="text-xs text-text-secondary flex-1 truncate">{inviteLink}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inviteLink)
                            toast.success('Link copied!')
                          }}
                          className="text-xs text-brand hover:text-brand-hover shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
