import { useState } from "react"
import { LayoutGrid, Timer as TimerIcon } from "lucide-react"

import Login from "./features/auth/components/Login"
import Timer from "./features/timer/components/Timer"
import TimerSettings from "./features/timer/components/TimerSettings"
import CatchReveal from "./features/pokemon/components/CatchReveal"
import Collection from "./features/pokemon/components/Collection"
import { AuthContextProvider } from "./features/auth/AuthContext"
import { TimerContextProvider, useTimerContext } from "./features/timer/TimerContext"
import { Button } from "./ui/Button"
import { cn } from "./lib/cn"
import "./index.css"

type View = 'timer' | 'collection'

/** Reads the catch-reveal state from TimerContext and renders it as an overlay above either view. */
function CatchRevealOverlay() {
  const { caughtPokemon, showLoginNudge, catchError, dismissCatchReveal } = useTimerContext()

  return (
    <CatchReveal
      caughtPokemon={caughtPokemon}
      showLoginNudge={showLoginNudge}
      error={catchError}
      onDismiss={dismissCatchReveal}
    />
  )
}

export function App() {
  const [view, setView] = useState<View>('timer')

  return (
    <div className="app relative flex min-h-screen flex-col bg-paper-texture px-4 pb-24 pt-4 font-body text-ink-soft sm:pt-6 lg:items-center lg:px-10 lg:pt-10">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 lg:max-w-2xl">
        <AuthContextProvider>
          <TimerContextProvider>
            <header className="flex items-center justify-between gap-2">
              <div>
                <h1 className="font-heading text-base font-normal leading-relaxed text-ink-soft [text-shadow:2px_2px_0_var(--color-focus),3px_3px_0_var(--color-ink)] sm:text-lg">
                  Pokédoro
                </h1>
                <p className="mt-1 text-sm font-bold text-muted">a pomodoro companion</p>
              </div>

              <div className="flex gap-2">
                <Login />
                <TimerSettings />
              </div>
            </header>

            <main className="flex flex-1 flex-col items-center gap-6">
              {view === 'timer' ? <Timer /> : <Collection />}
            </main>
            <CatchRevealOverlay />
          </TimerContextProvider>
        </AuthContextProvider>
      </div>

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t-4 border-ink-soft bg-card p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <Button
          variant="ghost"
          className={cn(
            "flex-1 flex-col gap-1 border-none shadow-none",
            view === 'timer' ? "bg-focus text-card" : "bg-transparent text-muted",
          )}
          aria-current={view === 'timer'}
          onClick={() => setView('timer')}
        >
          <TimerIcon className="h-5 w-5" aria-hidden="true" />
          Timer
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "flex-1 flex-col gap-1 border-none shadow-none",
            view === 'collection' ? "bg-focus text-card" : "bg-transparent text-muted",
          )}
          aria-current={view === 'collection'}
          onClick={() => setView('collection')}
        >
          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          Collection
        </Button>
      </nav>
    </div>
  )
}

export default App
