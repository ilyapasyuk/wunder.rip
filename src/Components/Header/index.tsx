import {
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
    Cog6ToothIcon,
} from '@heroicons/react/20/solid'
import React from 'react'
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'

interface Props {
    avatar: string
    email: string
    fullName: string
    onLogout: () => void
}

const Header = ({ avatar, email, fullName, onLogout }: Props) => {
    return (
        <div className="w-full relative bg-gray-800">
            <div className="h-14 mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="text-white font-semibold">Wunder Rip</div>
                <div className="flex items-center">
                    <img
                        src={avatar}
                        width={50}
                        alt="avatar"
                        className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
                    />

                    <div className="text-right ml-4">
                        <Menu as="div" className="relative inline-block text-left">
                            <div>
                                <Menu.Button className="inline-flex w-full justify-center rounded-md bg-black bg-opacity-20 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                                    {fullName}
                                    <ChevronDownIcon
                                        className="ml-2 -mr-1 h-5 w-5 text-violet-200 hover:text-violet-100"
                                        aria-hidden="true"
                                    />
                                </Menu.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-1 py-1 ">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    className={`${
                                                        active
                                                            ? 'bg-violet-500 text-white'
                                                            : 'text-gray-900'
                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                >
                                                    <Cog6ToothIcon
                                                        className="mr-2 h-5 w-5"
                                                        aria-hidden="true"
                                                    />
                                                    {email}
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </div>
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={onLogout}
                                                    className={`${
                                                        active
                                                            ? 'bg-violet-500 text-white'
                                                            : 'text-gray-900'
                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                >
                                                    <ArrowRightOnRectangleIcon
                                                        className="mr-2 h-5 w-5"
                                                        aria-hidden="true"
                                                    />
                                                    Log out
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>

                    {/*{isShowMenu && (*/}
                    {/*    <StyledDropdown>*/}
                    {/*        <StyledDropdownItem>*/}
                    {/*            <StyledFullName>{fullName}</StyledFullName>*/}
                    {/*            <StyledEmail>{email}</StyledEmail>*/}
                    {/*        </StyledDropdownItem>*/}
                    {/*        <StyledDropdownItem type="isDanger" onClick={onLogout}>*/}
                    {/*            Sign Out*/}
                    {/*        </StyledDropdownItem>*/}
                    {/*    </StyledDropdown>*/}
                    {/*)}*/}
                </div>
            </div>
        </div>
    )
}

export { Header }
