import { useCallback, useState } from "react"
import { LogOut } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"

import LoginForm from "./LoginForm"

const Login = () => {
  const { user, status, error, requestOtp, verifyOtp, logout } = useAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value)
  }, [])

  const handleSubmitEmail = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const ok = await requestOtp(email)
    setIsSubmitting(false)
    if (ok) setStep('code')
  }, [email, requestOtp])

  const handleSubmitCode = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const ok = await verifyOtp(email, code)
    setIsSubmitting(false)
    if (ok) {
      setStep('email')
      setEmail('')
      setCode('')
    }
  }, [email, code, verifyOtp])

  const handleBack = useCallback(() => {
    setStep('email')
    setCode('')
  }, [])

  if (status === 'authenticated' && user) {
    return (
      <Card className="login flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-ink-soft">Signed in as {user.email}</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </Card>
    )
  }

  return (
    <Card className="login">
      <LoginForm
        step={step}
        email={email}
        code={code}
        error={error}
        isSubmitting={isSubmitting}
        handlers={{
          onEmailChange: handleEmailChange,
          onCodeChange: handleCodeChange,
          onSubmitEmail: handleSubmitEmail,
          onSubmitCode: handleSubmitCode,
          onBack: handleBack,
        }}
      />
    </Card>
  )
}

export default Login
