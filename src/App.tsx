import { useCallback, useState } from 'react'
import { InterviewCockpit } from './components/InterviewCockpit.tsx'
import { PersonPicker } from './components/PersonPicker.tsx'
import {
  loadActiveRespondent,
  saveActiveRespondent,
} from './storage/interviewStorage.ts'
import type { RespondentId } from './types.ts'

export default function App() {
  const [personId, setPersonId] = useState<RespondentId | null>(() => loadActiveRespondent())

  const selectPerson = useCallback((id: RespondentId) => {
    saveActiveRespondent(id)
    setPersonId(id)
  }, [])

  const changePerson = useCallback(() => {
    saveActiveRespondent(null)
    setPersonId(null)
  }, [])

  if (!personId) {
    return <PersonPicker onSelect={selectPerson} />
  }

  return <InterviewCockpit key={personId} personId={personId} onChangePerson={changePerson} />
}
