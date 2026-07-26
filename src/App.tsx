import Login from "./components/Login"
import Timer from "./components/Timer"
import TimerSettings from "./components/TimerSettings"
import { AuthContextProvider } from "./contexts/AuthContext"
import { TimerContextProvider } from "./contexts/TimerContext"
import "./index.css"

export function App() {
  return (
    <div className="app min-h-screen bg-gradient-to-br from-pink-50 via-indigo-50 to-sky-50 px-4 py-8 font-body text-ink sm:py-12 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-16">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 lg:max-w-xl lg:gap-8">
        <header className="text-center">
          <h1 className="font-heading text-3xl font-extrabold text-ink-soft lg:text-4xl">Pokédoro</h1>
          <p className="mt-1 text-sm font-semibold text-muted lg:text-base">a pomodoro companion</p>
        </header>

        <AuthContextProvider>
          <TimerContextProvider>
            <div className="flex flex-col items-center gap-5 rounded-3xl bg-white/50 p-6 shadow-lg shadow-ink/5 backdrop-blur-sm lg:gap-6 lg:p-10">
              <div className="flex w-full justify-end gap-2">
                <Login />
                <TimerSettings />
              </div>
              <Timer />
            </div>
          </TimerContextProvider>
        </AuthContextProvider>
      </div>
    </div>
  )
}

export default App
