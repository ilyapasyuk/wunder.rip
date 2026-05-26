import { StoreContext } from 'Components/Context/store'
import { ImageLightbox } from 'Components/ImageLightbox'
import { ImageUploader } from 'Components/ImageUploader'
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { onValue, ref } from 'firebase/database'
import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { trackTaskViewed } from 'services/analytics'
import { db } from 'services/firebase'
import { getCloudinaryDownloadUrl, getCloudinaryThumb } from 'services/image'
import { notify } from 'services/notify'
import { getUserRoute } from 'services/routes'
import { Todo, updateTask } from 'services/task'

interface TaskPreviewProps {
  onClose: () => void
}

const PANEL_TRANSITION_MS = 280

const TaskPreview = ({ onClose }: TaskPreviewProps) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useContext(StoreContext)
  const [todo, setTodo] = useState<Todo | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Trigger enter transition on first paint.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsOpen(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    window.setTimeout(() => {
      navigate('/')
      onClose()
    }, PANEL_TRANSITION_MS)
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
      const taskRef = ref(db, `${getUserRoute(state?.user?.id)}/${id}`)
      let wasLoaded = false
      const unsubscribe = onValue(taskRef, snapshot => {
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

  const handleDeleteFile = async (file: string, todo: Todo) => {
    const newTodo: Todo = {
      ...todo,
      files: todo?.files?.filter(fileUrl => fileUrl !== file),
    }

    if (state?.user?.id) {
      await updateTask(newTodo, state?.user?.id)
      notify.success('Image removed')
    }
  }

  const handleEditTask = async (todo: Todo) => {
    if (state?.user?.id) {
      updateTask(todo, state?.user?.id)
    }
  }

  return (
    <>
      {/* Mobile-only backdrop — fades in/out, captures taps to close. */}
      <button
        type="button"
        aria-label="Close panel"
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-overlay md:hidden transition-opacity duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Panel — fixed overlay (not in flex flow), slides in from the right.
          Sits below the header on desktop; covers the whole screen on mobile. */}
      <div
        ref={panelRef}
        className={`fixed top-0 md:top-14 right-0 bottom-0 z-50 w-full md:w-[28rem] md:max-w-[min(28rem,calc(100vw-var(--sidebar-w)-2rem))] bg-surface dark:bg-surface-dark md:border-l border-border dark:border-border-dark shadow-2xl will-change-transform transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
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
                          src={getCloudinaryThumb(file, { width: 240, height: 160 })}
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

export { TaskPreview }
