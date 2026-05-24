import Timer from "./components/Timer"
import TimerSettings from "./components/TimerSettings"
import { TimerContextProvider } from "./contexts/TimerContext"
import "./index.css"

export function App() {
  return (
    <div className="app">
      <TimerContextProvider>
        <TimerSettings />
        <Timer />
      </TimerContextProvider>
    </div>
  )
}

export default App
