import { EyeIcon, XMarkIcon } from '@heroicons/react/20/solid'
import React, { Fragment } from 'react'

import { updateTask } from 'Service/task'

import { User } from 'Components/Layout'
import { TodoType } from 'Components/Todo'
import { ImageUploader } from 'Components/ImageUploader'
import { Dialog, Transition } from '@headlessui/react'

interface TaskPreviewProps {
    todo: TodoType | undefined
    onClose: () => void
    user: User
    isShow: boolean
}

const TaskPreview = ({ todo, onClose, user, isShow }: TaskPreviewProps) => {
    const deleteFile = async (file: any, todo: TodoType) => {
        const newTodo: TodoType = {
            ...todo,
            files: todo?.files?.filter(todoFileUrl => todoFileUrl !== file),
        }

        await updateTask(newTodo, user.id)
    }

    return (
        <Transition.Root show={isShow} as={Fragment}>
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
                                                                updateTask(
                                                                    { ...todo, task: target.value },
                                                                    user.id,
                                                                )
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
                                                                updateTask(
                                                                    { ...todo, note: target.value },
                                                                    user.id,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    {Boolean(todo.files?.length) && (
                                                        <div>
                                                            {todo.files?.map(file => (
                                                                <div
                                                                    key={`${file}?alt=media`}
                                                                    className="mb-4"
                                                                >
                                                                    <div className="text-right">
                                                                        <button
                                                                            className="hover:bg-gray-100 rounded-md p-1"
                                                                            onClick={() =>
                                                                                deleteFile(
                                                                                    file,
                                                                                    todo,
                                                                                )
                                                                            }
                                                                        >
                                                                            <XMarkIcon className="w-6 h-6 text-gray-700" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="relative rounded-md overflow-hidden">
                                                                        <div
                                                                            className="absolute top-0 right-0 bottom-0 left-0 cursor-pointer flex justify-center items-center"
                                                                            onClick={() => {
                                                                                window.open(
                                                                                    `${file}?alt=media`,
                                                                                    '_blank',
                                                                                )
                                                                            }}
                                                                        >
                                                                            <EyeIcon className="w-10 h-10 text-gray-700" />
                                                                        </div>
                                                                        <img
                                                                            src={`${file}?alt=media`}
                                                                            alt="avatar"
                                                                            height={100}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {todo.id && (
                                                        <ImageUploader
                                                            userId={user.id}
                                                            todoId={todo.id}
                                                            onFileUploaded={fileUrl => {
                                                                const files = todo.files
                                                                    ? [...todo.files, fileUrl]
                                                                    : [fileUrl]

                                                                updateTask(
                                                                    {
                                                                        ...todo,
                                                                        files,
                                                                    },
                                                                    user.id,
                                                                )
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

export { TaskPreview }
