/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRANSCRIPTION_WEBHOOK_URL?: string
  readonly VITE_TRANSCRIPTION_CALLBACK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
