import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { databaseRef } from 'service/firebase'
import { getCloudinaryImage } from 'service/image'
import { getUserRoute } from 'service/routes'
import { ITodo, deleteTodo, updateTask } from 'service/task'

import { StoreContext } from 'Components/Context/store'
import { ImageUploader } from 'Components/ImageUploader'

const TaskPreview = () => {
  const navigate = useNavigate()
  let { id } = useParams()
  const { state } = useContext(StoreContext)
  const [todo, setTodo] = useState<ITodo | null>(null)

  useEffect(() => {
    if (state?.user?.id) {
      databaseRef.child(`${getUserRoute(state?.user?.id)}/${id}`).on('value', snapshot => {
        let item = snapshot.val() || null
        setTodo(item)
      })
    }
  }, [state.user])

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

  const onClose = () => {
    navigate(-1)
  }

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                      <button
                        type="button"
                        className="rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                        Task Preview
                      </Dialog.Title>
                    </div>
                    {todo && (
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        <div>
                          <div>
                            <input
                              className="block w-full rounded-md border-0 py-2 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mb-6"
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
                              className="block w-full rounded-md border-0 py-2 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mb-6"
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
                                      className="hover:bg-gray-100 rounded-md p-1"
                                      onClick={() => deleteFile(file, todo)}
                                    >
                                      <XMarkIcon className="w-6 h-6 text-gray-700" />
                                    </button>
                                  </div>
                                  <div className="relative group block w-full aspect-w-10 aspect-h-7 rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-indigo-500 overflow-hidden">
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
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default TaskPreview
