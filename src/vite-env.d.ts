/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRANSCRIPTION_WEBHOOK_URL?: string
  readonly VITE_TRANSCRIPTION_CALLBACK_URL?: string
  readonly VITE_QUESTIONS_API_URL?: string
  readonly VITE_QUESTIONS_API_KEY?: string
  readonly VITE_ARCHIVE_API_URL?: string
  readonly VITE_ARCHIVE_API_KEY?: string
  readonly VITE_POKE_API_KEY?: string
  readonly VITE_LLM_URL?: string
  readonly VITE_LLM_API_KEY?: string
  readonly VITE_PERSONALIZE_URL?: string
  readonly VITE_PERSONALIZE_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
