import { useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import api from '@/lib/api'
import { saveTokens, saveUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AcceptInvitePage() {
  const router = useRouter()
  const { token } = router.query
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', password: '' })

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    try {
      const { data } = await api.post('/team/invite/accept/', { token, ...form })
      saveTokens(data.tokens)
      saveUser(data.user)
      toast.success(`Welcome, ${data.user.full_name}!`)
      router.push('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired invite.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-app">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-text-primary">Accept invite</CardTitle>
          <CardDescription className="text-text-muted">Set up your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>First name</Label>
                <Input placeholder="John" value={form.first_name} onChange={set('first_name')} />
              </div>
              <div className="space-y-1">
                <Label>Last name</Label>
                <Input placeholder="Doe" value={form.last_name} onChange={set('last_name')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            </div>
            <Button type="submit" className="w-full bg-brand hover:bg-brand-hover text-text-on-brand" disabled={loading || !token}>
              {loading ? 'Setting up…' : 'Join workspace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
