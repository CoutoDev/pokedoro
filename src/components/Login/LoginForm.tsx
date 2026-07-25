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
      <form className="login-form" onSubmit={handlers.onSubmitCode}>
        <label htmlFor="login-code">Code</label>
        <input
          id="login-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={handlers.onCodeChange}
        />
        <button type="submit" disabled={isSubmitting}>Verify</button>
        <button type="button" onClick={handlers.onBack}>Back</button>
        {error && <p role="alert">{error}</p>}
      </form>
    )
  }

  return (
    <form className="login-form" onSubmit={handlers.onSubmitEmail}>
      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={handlers.onEmailChange}
      />
      <button type="submit" disabled={isSubmitting}>Send code</button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}

export default LoginForm
