import Login from "./components/Login"
import Timer from "./components/Timer"
import TimerSettings from "./components/TimerSettings"
import { AuthContextProvider } from "./contexts/AuthContext"
import { TimerContextProvider } from "./contexts/TimerContext"
import "./index.css"

export function App() {
  return (
    <div className="app">
      <AuthContextProvider>
        <TimerContextProvider>
          <Login />
          <TimerSettings />
          <Timer />
        </TimerContextProvider>
      </AuthContextProvider>
    </div>
  )
}

export default App
