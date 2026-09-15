import { useEffect, useRef } from 'react'

export interface InterviewShortcuts {
  onRecord: () => void
  onPause: () => void
  onStopSave: () => void
  onNext: () => void
  onPrevious: () => void
  onRestart: () => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function useKeyboardShortcuts(handlers: InterviewShortcuts): void {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) return

      const key = event.key.toLowerCase()
      const alt = event.altKey
      const editable = isEditableTarget(event.target)
      if (editable && !alt) return

      const actions = handlersRef.current

      if (key === 'r') {
        event.preventDefault()
        actions.onRecord()
        return
      }
      if (key === 'p') {
        event.preventDefault()
        actions.onPause()
        return
      }
      if (key === 's') {
        event.preventDefault()
        actions.onStopSave()
        return
      }
      if (key === 'n' || key === 'arrowright') {
        event.preventDefault()
        actions.onNext()
        return
      }
      if (key === 'b' || key === 'arrowleft') {
        event.preventDefault()
        actions.onPrevious()
        return
      }
      if (alt && (key === 'k' || key === '0')) {
        event.preventDefault()
        actions.onRestart()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
