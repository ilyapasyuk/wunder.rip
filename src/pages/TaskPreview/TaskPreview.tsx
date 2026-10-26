import { ArrowDownTrayIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { ImageLightbox } from 'components/image/ImageLightbox'
import { ImageUploader } from 'components/image/ImageUploader'
import { Skeleton } from 'components/ui/Skeleton'
import { onValue, ref } from 'firebase/database'
import { trackTaskViewed } from 'lib/analytics'
import { notify } from 'lib/notify'
import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUserRoute } from 'services/db-paths'
import { db } from 'services/firebase'
import { getCloudinaryDownloadUrl, getCloudinaryThumb } from 'services/image'
import { Todo, updateTask } from 'services/task'
import { StoreContext } from 'store/store'

interface TaskPreviewProps {
  onClose: () => void
}

const PANEL_TRANSITION_MS = 280

const TaskPreview = ({ onClose }: TaskPreviewProps) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useContext(StoreContext)
  const [todo, setTodo] = useState<Todo | null>(null)
  // 'missing' = the first snapshot came back empty: a stale link or a task deleted elsewhere.
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')
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
          setStatus('ready')
          if (!wasLoaded) trackTaskViewed()
          wasLoaded = true
        } else {
          setTodo(null)
          if (wasLoaded) {
            handleClose()
          } else {
            setStatus('missing')
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
        className={`fixed inset-0 z-40 bg-overlay backdrop-blur-[2px] md:hidden transition-opacity duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Panel — a bottom sheet on mobile, a floating card on the right on desktop. */}
      <div
        ref={panelRef}
        className={`fixed z-50 inset-x-0 bottom-0 top-10 rounded-t-4xl md:inset-x-auto md:top-20 md:right-4 md:bottom-4 md:rounded-4xl md:w-[30rem] md:max-w-[min(30rem,calc(100vw-var(--sidebar-w)-2rem))] bg-surface md:ring-1 md:ring-border shadow-lift will-change-transform transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-[calc(100%+2rem)]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-preview-title"
      >
        <div className="flex h-full flex-col overflow-y-auto overscroll-contain">
          <div
            aria-hidden="true"
            className="md:hidden mx-auto mt-3 h-1 w-10 rounded-full bg-muted-strong"
          />
          <div className="flex items-center justify-between px-5 sm:px-7 pt-4 md:pt-6">
            <button
              type="button"
              className="size-12 inline-flex items-center justify-center rounded-full bg-muted text-text-primary hover:bg-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
              onClick={handleClose}
            >
              <span className="sr-only">Close panel</span>
              <XMarkIcon className="size-5 shrink-0" aria-hidden="true" />
            </button>
            {todo?.createdAt ? (
              <span className="inline-flex h-10 items-center gap-2 rounded-full bg-muted px-4 text-sm font-semibold tabular-nums text-text-primary">
                <CalendarIcon className="size-4 text-text-tertiary" aria-hidden="true" />
                {new Date(todo.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            ) : null}
          </div>
          <div className="px-5 sm:px-7 pt-6 pb-2">
            {todo ? (
              <textarea
                id="task-preview-title"
                rows={1}
                className="block w-full resize-none [field-sizing:content] font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-text-primary bg-transparent border-0 p-0 outline-none placeholder:text-text-secondary focus:ring-0"
                placeholder="Task name"
                value={todo.task}
                onChange={({ target }) =>
                  handleEditTask({
                    ...todo,
                    task: target.value,
                  })
                }
              />
            ) : status === 'missing' ? (
              <div className="motion-safe:animate-fade-in">
                <div
                  id="task-preview-title"
                  className="font-display text-3xl font-bold tracking-[-0.02em] text-text-primary"
                >
                  Task not found
                </div>
                <p className="mt-2 text-base font-medium text-text-secondary">
                  It may have been deleted on another device.
                </p>
              </div>
            ) : (
              <div role="status" aria-label="Loading task">
                <span id="task-preview-title" className="sr-only">
                  Loading task
                </span>
                <Skeleton className="h-8 w-4/5 rounded-lg" />
                <Skeleton className="mt-3 h-4 w-28 rounded-md" />
                <Skeleton className="mt-8 h-44 w-full rounded-2xl" />
              </div>
            )}
            {todo && (
              <p className="mt-2 text-base font-medium text-text-secondary">
                {todo.done ? 'Done' : 'In progress'}
                {todo.files?.length ? ` · ${todo.files.length} attached` : ''}
              </p>
            )}
          </div>
          {todo && (
            <div className="flex-1 px-5 sm:px-7 pt-4 pb-8">
              <textarea
                className="block w-full rounded-2xl border-0 py-4 px-5 text-[17px] leading-relaxed text-text-primary bg-muted shadow-card placeholder:text-text-secondary focus:ring-0 focus:bg-surface focus:shadow-tile mb-6 transition-colors duration-200"
                rows={7}
                placeholder="Add a note…"
                value={todo.note}
                onChange={({ target }) =>
                  handleEditTask({
                    ...todo,
                    note: target.value,
                  })
                }
              />
              {Boolean(todo.files?.length) && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {todo.files?.map((file, idx) => (
                    <div
                      key={`${file}?alt=media`}
                      className="relative group block w-full aspect-[4/3] rounded-2xl bg-muted focus-within:ring-2 focus-within:ring-accent/40 overflow-hidden"
                    >
                      <img
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-[1.03]"
                        src={getCloudinaryThumb(file, { width: 320, height: 240 })}
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
                          className="size-8 inline-flex items-center justify-center rounded-full bg-black/55 backdrop-blur-md hover:bg-black/75 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
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
                          className="size-8 inline-flex items-center justify-center rounded-full bg-black/55 backdrop-blur-md hover:bg-black/75 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
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
