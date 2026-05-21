import { StoreContext } from 'Components/Context/store'
import { ImageLightbox } from 'Components/ImageLightbox'
import { ImageUploader } from 'Components/ImageUploader'
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/20/solid'
import type { DataSnapshot } from 'firebase/database'
import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { trackTaskViewed } from 'services/analytics'
import { databaseRef } from 'services/firebase'
import { getCloudinaryDownloadUrl, getCloudinaryThumb } from 'services/image'
import { getUserRoute } from 'services/routes'
import { ITodo, updateTask } from 'services/task'

interface ITaskPreviewProps {
  onClose: () => void
}

const TaskPreview = ({ onClose }: ITaskPreviewProps) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useContext(StoreContext)
  const [todo, setTodo] = useState<ITodo | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = () => {
    navigate('/')
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !panelRef.current.contains(document.activeElement)
          ) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !panelRef.current.contains(document.activeElement)
          ) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (state?.user?.id && id) {
      const ref = databaseRef.child(`${getUserRoute(state?.user?.id)}/${id}`)
      let wasLoaded = false
      const unsubscribe = ref.on('value', (snapshot: DataSnapshot) => {
        const item = snapshot.val()
        if (item) {
          setTodo({ ...item, id })
          if (!wasLoaded) trackTaskViewed()
          wasLoaded = true
        } else {
          setTodo(null)
          if (wasLoaded) {
            handleClose()
          }
        }
      })

      return unsubscribe
    }
  }, [state.user, id])

  const handleDeleteFile = async (file: string, todo: ITodo) => {
    const newTodo: ITodo = {
      ...todo,
      files: todo?.files?.filter(fileUrl => fileUrl !== file),
    }

    if (state?.user?.id) {
      await updateTask(newTodo, state?.user?.id)
    }
  }

  const handleEditTask = async (todo: ITodo) => {
    if (state?.user?.id) {
      updateTask(todo, state?.user?.id)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      <button
        className="fixed inset-0 bg-overlay z-40 md:hidden"
        onClick={handleClose}
        type="button"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-0 md:relative md:inset-auto w-full md:w-96 md:max-w-md border-l border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-xl z-50 md:z-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-preview-title"
      >
        <div className="flex h-full flex-col overflow-y-scroll">
          <div className="relative px-4 sm:px-6 pt-6 pb-4 border-b border-border dark:border-border-dark">
            <div className="flex items-center justify-between gap-2">
              {todo ? (
                <input
                  id="task-preview-title"
                  className="flex-1 text-lg font-medium leading-6 text-text-primary dark:text-text-dark-primary bg-transparent border-0 outline-none placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:ring-0"
                  type="text"
                  placeholder="Task name"
                  value={todo.task}
                  onChange={({ target }) =>
                    handleEditTask({
                      ...todo,
                      task: target.value,
                    })
                  }
                />
              ) : (
                <div
                  id="task-preview-title"
                  className="flex-1 text-lg font-medium leading-6 text-text-secondary dark:text-text-dark-secondary"
                >
                  Task Preview
                </div>
              )}
              <button
                type="button"
                className="rounded-md p-1.5 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-overlay-hover focus:outline-none focus:ring-2 focus:ring-primary transition-colors shrink-0"
                onClick={handleClose}
              >
                <span className="sr-only">Close panel</span>
                <XMarkIcon className="size-5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>
          {todo && (
            <div className="flex-1 px-4 sm:px-6 py-6">
              <div>
                <div>
                  <textarea
                    className="block w-full rounded-lg border-0 py-3 px-4 text-text-primary dark:text-text-dark-primary bg-surface dark:bg-surface-dark ring-1 ring-inset ring-border dark:ring-border-dark placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-overlay-hover/30 dark:focus:bg-overlay-hover/20 sm:text-base leading-6 mb-6 transition-colors duration-200"
                    rows={8}
                    placeholder="Note"
                    value={todo.note}
                    onChange={({ target }) =>
                      handleEditTask({
                        ...todo,
                        note: target.value,
                      })
                    }
                  />
                </div>
                {Boolean(todo.files?.length) && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-8">
                    {todo.files?.map((file, idx) => (
                      <div
                        key={`${file}?alt=media`}
                        className="relative group block w-full aspect-[10/7] rounded-lg bg-background dark:bg-background-dark focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-surface dark:focus-within:ring-offset-surface-dark focus-within:ring-primary overflow-hidden"
                      >
                        <img
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200 group-hover:opacity-75"
                          src={getCloudinaryThumb(file, { width: 480, height: 320 })}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                        <button
                          type="button"
                          className="absolute inset-0 focus:outline-none cursor-zoom-in"
                          onClick={() => setLightboxIndex(idx)}
                          aria-label="Open image"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                          <a
                            href={getCloudinaryDownloadUrl(file)}
                            download
                            onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
                            aria-label="Download image"
                          >
                            <ArrowDownTrayIcon className="size-4 shrink-0" />
                          </a>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              handleDeleteFile(file, todo)
                            }}
                            className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
                            aria-label="Delete image"
                          >
                            <XMarkIcon className="size-4 shrink-0" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {todo.id && (
                  <ImageUploader
                    onFileUploaded={fileUrl => {
                      const files = todo.files ? [...todo.files, fileUrl] : [fileUrl]

                      handleEditTask({
                        ...todo,
                        files,
                      })
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <ImageLightbox
        open={lightboxIndex !== null}
        images={todo?.files ?? []}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  )
}

export default TaskPreview
