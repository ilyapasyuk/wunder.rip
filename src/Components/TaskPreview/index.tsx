import { XMarkIcon } from '@heroicons/react/20/solid'
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { DataSnapshot } from 'firebase/database'

import { databaseRef } from 'service/firebase'
import { getCloudinaryImage } from 'service/image'
import { getUserRoute } from 'service/routes'
import { ITodo, deleteTodo, updateTask } from 'service/task'

import { StoreContext } from 'Components/Context/store'
import { ImageUploader } from 'Components/ImageUploader'

interface TaskPreviewProps {
  onClose: () => void
}

const TaskPreview = ({ onClose }: TaskPreviewProps) => {
  const navigate = useNavigate()
  let { id } = useParams()
  const { state } = useContext(StoreContext)
  const [todo, setTodo] = useState<ITodo | null>(null)

  const handleClose = () => {
    navigate('/')
    onClose()
  }

  useEffect(() => {
    if (state?.user?.id && id) {
      const ref = databaseRef.child(`${getUserRoute(state?.user?.id)}/${id}`)
      const unsubscribe = ref.on('value', (snapshot: DataSnapshot) => {
        let item = snapshot.val()
        if (item) {
          setTodo({ ...item, id })
        } else {
          setTodo(null)
        }
      })
      return unsubscribe
    }
  }, [state.user, id])

  const deleteFile = async (file: any, todo: ITodo) => {
    const newTodo: ITodo = {
      ...todo,
      files: todo?.files?.filter(todoFileUrl => todoFileUrl !== file),
    }

    if (state?.user?.id) {
      await deleteTodo(newTodo, state?.user?.id)
    }
  }

  const editTask = async (todo: ITodo) => {
    if (state?.user?.id) {
      updateTask(todo, state?.user?.id)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      <div className="fixed inset-0 bg-overlay z-40 md:hidden" onClick={handleClose} />
      {/* Panel */}
      <div className="fixed inset-0 md:relative md:inset-auto w-full md:w-96 md:max-w-md border-l border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-xl z-50 md:z-auto">
        <div className="flex h-full flex-col overflow-y-scroll">
          <div className="relative px-4 sm:px-6 pt-6 pb-4 border-b border-border dark:border-border-dark">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium leading-6 text-text-primary dark:text-text-dark-primary">
                Task Preview
              </h2>
              <button
                type="button"
                className="rounded-md p-1.5 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-overlay-hover focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
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
                  <input
                    className="block w-full rounded-lg border-0 py-3 px-4 text-text-primary dark:text-text-dark-primary bg-surface dark:bg-surface-dark ring-1 ring-inset ring-border dark:ring-border-dark placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:ring-2 focus:ring-inset focus:ring-primary sm:text-base leading-6 mb-6 transition-all"
                    type="text"
                    placeholder="Name"
                    value={todo.task}
                    onChange={({ target }) =>
                      editTask({
                        ...todo,
                        task: target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <textarea
                    className="block w-full rounded-lg border-0 py-3 px-4 text-text-primary dark:text-text-dark-primary bg-surface dark:bg-surface-dark ring-1 ring-inset ring-border dark:ring-border-dark placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:ring-2 focus:ring-inset focus:ring-primary sm:text-base leading-6 mb-6 transition-all"
                    rows={8}
                    placeholder="Note"
                    value={todo.note}
                    onChange={({ target }) =>
                      editTask({
                        ...todo,
                        note: target.value,
                      })
                    }
                  />
                </div>
                {Boolean(todo.files?.length) && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-8">
                    {todo.files?.map(file => (
                      <div key={`${file}?alt=media`} className="relative">
                        <div className="text-right">
                          <button
                            className="p-1.5 rounded-md text-text-secondary dark:text-text-dark-secondary hover:bg-overlay-hover hover:text-text-primary dark:hover:text-text-dark-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                            onClick={() => deleteFile(file, todo)}
                            aria-label="Delete image"
                          >
                            <XMarkIcon className="size-5 shrink-0" />
                          </button>
                        </div>
                        <div className="relative group block w-full aspect-[10/7] rounded-lg bg-background dark:bg-background-dark focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-surface dark:focus-within:ring-offset-surface-dark focus-within:ring-primary overflow-hidden">
                          <img
                            className="object-cover pointer-events-none group-hover:opacity-75"
                            src={`${getCloudinaryImage(file, 240, 160, false, true)}`}
                            alt="avatar"
                            height={100}
                          />
                          <button
                            type="button"
                            className="absolute inset-0 focus:outline-none"
                            onClick={() => {
                              window.open(`${getCloudinaryImage(file)}`, '_blank')
                            }}
                          >
                            <span className="sr-only">View details</span>
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

                      editTask({
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
    </>
  )
}

export default TaskPreview
