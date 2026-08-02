import { useCallback, useState } from "react"
import { LogIn, LogOut, User, X } from "lucide-react"

import { useAuth } from "@/client/features/auth/useAuth"
import { Button } from "@/client/ui/Button"
import { Dialog } from "@/client/ui/Dialog"

import LoginForm from "./LoginForm"

const Login = () => {
  const { user, status, error, requestOtp, verifyOtp, logout } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenLogin = useCallback(() => {
    setIsLoginOpen(true)
  }, [])

  const handleCloseLogin = useCallback(() => {
    setIsLoginOpen(false)
    setStep('email')
    setEmail('')
    setCode('')
  }, [])

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
      setIsLoginOpen(false)
      setStep('email')
      setEmail('')
      setCode('')
    }
  }, [email, code, verifyOtp])

  const handleBack = useCallback(() => {
    setStep('email')
    setCode('')
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    handleCloseLogin()
  }, [logout, handleCloseLogin])

  const isAuthenticated = status === 'authenticated' && !!user

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleOpenLogin}>
        {isAuthenticated ? (
          <User className="h-4 w-4" aria-hidden="true" />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden="true" />
        )}
        {isAuthenticated ? 'Account' : 'Sign in'}
      </Button>
      <Dialog open={isLoginOpen} onClose={handleCloseLogin} id="login-modal" className="login">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-base font-normal text-ink-soft">
            {isAuthenticated ? 'Account' : 'Sign in'}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleCloseLogin} aria-label="Close">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        {isAuthenticated ? (
          <div className="flex flex-col gap-4">
            <p className="text-base font-bold text-ink-soft">Signed in as {user.email}</p>
            <Button variant="primary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        ) : (
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
        )}
      </Dialog>
    </>
  )
}

export default Login
