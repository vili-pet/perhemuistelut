import { InterviewCockpit } from './components/InterviewCockpit.tsx'
import { AccessGate } from './telegram/AccessGate.tsx'
import { isTelegramEnabled } from './telegram/enabled.ts'

export default function App() {
  const cockpit = <InterviewCockpit />
  if (!isTelegramEnabled()) return cockpit
  return <AccessGate>{cockpit}</AccessGate>
}
