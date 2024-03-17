/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_DB_TASK_NAME: string
  readonly VITE_CLOUDINARY_ORG_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
