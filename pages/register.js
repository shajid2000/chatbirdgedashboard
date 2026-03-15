import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  })

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      router.push('/dashboard')
    } catch (err) {
      const errors = err.response?.data
      const first = errors && Object.values(errors)[0]
      toast.error(Array.isArray(first) ? first[0] : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-app">
      <Card className="w-full max-w-sm shadow-[var(--shadow-card)]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-text-primary">Create your workspace</CardTitle>
          <CardDescription className="text-text-muted">Start managing all your messages in one place</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Business name</Label>
              <Input placeholder="Acme Corp" value={form.business_name} onChange={set('business_name')} required />
            </div>
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
              <Label>Email</Label>
              <Input type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            </div>
            <Button type="submit" className="w-full bg-brand hover:bg-brand-hover text-text-on-brand" disabled={loading}>
              {loading ? 'Creating workspace…' : 'Create workspace'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-brand underline underline-offset-4">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
