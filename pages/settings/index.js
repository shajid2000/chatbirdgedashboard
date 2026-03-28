import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function SettingsIndex() {
  const router = useRouter()
  useEffect(() => { router.replace('/settings/channels') }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
