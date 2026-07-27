import { ArrowLeft, KeyRound, Mail } from "lucide-react"

import { Button } from "@/client/ui/Button"
import { Input } from "@/client/ui/Input"
import { Label } from "@/client/ui/Label"

type LoginFormProps = {
  step: 'email' | 'code'
  email: string
  code: string
  error: string | null
  isSubmitting: boolean
  handlers: {
    onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onSubmitEmail: (e: React.SubmitEvent<HTMLFormElement>) => void
    onSubmitCode: (e: React.SubmitEvent<HTMLFormElement>) => void
    onBack: () => void
  }
}

const LoginForm = ({ step, email, code, error, isSubmitting, handlers }: LoginFormProps) => {
  if (step === 'code') {
    return (
      <form className="login-form flex flex-col gap-3" onSubmit={handlers.onSubmitCode}>
        <Label htmlFor="login-code">Code</Label>
        <Input
          id="login-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={handlers.onCodeChange}
        />
        <div className="flex gap-3">
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Verify
          </Button>
          <Button type="button" variant="ghost" onClick={handlers.onBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>
        </div>
        {error && <p role="alert" className="text-base font-bold text-red-700">{error}</p>}
      </form>
    )
  }

  return (
    <form className="login-form flex flex-col gap-3" onSubmit={handlers.onSubmitEmail}>
      <Label htmlFor="login-email">Email</Label>
      <Input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={handlers.onEmailChange}
      />
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        <Mail className="h-4 w-4" aria-hidden="true" />
        Send code
      </Button>
      {error && <p role="alert" className="text-base font-bold text-red-700">{error}</p>}
    </form>
  )
}

export default LoginForm
