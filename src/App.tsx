import Timer from "./components/Timer"
import { TimerContextProvider } from "./contexts/TimerContext"
import "./index.css"

export function App() {
  return (
    <div className="app">
      <TimerContextProvider>
        <Timer />
      </TimerContextProvider>
    </div>
  )
}

export default App
