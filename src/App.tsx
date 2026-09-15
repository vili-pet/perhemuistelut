import { AccessGate } from './telegram/AccessGate.tsx'
import { InterviewCockpit } from './components/InterviewCockpit.tsx'

export default function App() {
  return (
    <AccessGate>
      <InterviewCockpit />
    </AccessGate>
  )
}
