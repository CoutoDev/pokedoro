import { useCallback, useState } from "react"

import { useAuth } from "@/hooks/useAuth"

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
      <div className="login">
        <span>Signed in as {user.email}</span>
        <button onClick={logout}>Sign out</button>
      </div>
    )
  }

  return (
    <div className="login">
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
    </div>
  )
}

export default Login
