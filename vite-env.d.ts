/// <reference types="vite/client" />


interface ImportMetaEnv {
  readonly VITE_APP_DB_TASK_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

