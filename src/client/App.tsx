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
    <div className="app relative min-h-screen bg-gradient-to-br from-pink-50 via-indigo-50 to-sky-50 px-4 py-8 font-body text-ink sm:py-12 lg:flex lg:items-center lg:justify-center lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 lg:contents">
        <header className="text-center lg:absolute lg:left-10 lg:top-10 lg:text-left">
          <h1 className="font-heading text-3xl font-extrabold text-ink-soft lg:text-4xl">Pokédoro</h1>
          <p className="mt-1 text-base font-semibold text-muted lg:text-lg">a pomodoro companion</p>
        </header>

        <AuthContextProvider>
          <TimerContextProvider>
            <div className="flex flex-col items-center gap-5 rounded-3xl bg-white/50 p-6 shadow-lg shadow-ink/5 backdrop-blur-sm lg:contents">
              <div className="flex w-full justify-end gap-2 lg:absolute lg:right-10 lg:top-10 lg:w-auto">
                <Login />
                <TimerSettings />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView(view === 'timer' ? 'collection' : 'timer')}
                >
                  {view === 'timer' ? (
                    <>
                      <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                      Collection
                    </>
                  ) : (
                    <>
                      <TimerIcon className="h-4 w-4" aria-hidden="true" />
                      Timer
                    </>
                  )}
                </Button>
              </div>
              {view === 'timer' ? <Timer /> : <Collection />}
            </div>
            <CatchRevealOverlay />
          </TimerContextProvider>
        </AuthContextProvider>
      </div>
    </div>
  )
}

export default App
