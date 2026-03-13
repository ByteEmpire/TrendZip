import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import { supabase }            from '@/lib/supabase'
import useAuthStore            from '@/store/authStore'

export default function AuthCallback() {
  const navigate     = useNavigate()
  const fetchProfile = useAuthStore(s => s.fetchProfile)  // ← now exists
  const [status, setStatus] = useState('Signing you in…')

  useEffect(() => {
    async function handle() {
      try {
        // Let Supabase parse the URL hash / code
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        // Password recovery redirect
        const params = new URLSearchParams(window.location.search)
        if (params.get('type') === 'recovery') {
          setStatus('Redirecting to password reset…')
          navigate('/reset-password', { replace: true })
          return
        }

        if (session?.user) {
          setStatus('Loading your profile…')
          await fetchProfile(session.user.id)
          setStatus('Redirecting home…')
          const returnTo = sessionStorage.getItem('returnTo') ?? '/'
          sessionStorage.removeItem('returnTo')
          navigate(returnTo, { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch (err) {
        console.error('AuthCallback error:', err)
        setStatus('Something went wrong. Redirecting…')
        setTimeout(() => navigate('/'), 2000)
      }
    }
    handle()
  }, [])

  return (
    <div className="min-h-screen bg-tz-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-tz-border border-t-tz-gold rounded-full animate-spin" />
        <p className="text-sm text-tz-muted font-body">{status}</p>
      </div>
    </div>
  )
}