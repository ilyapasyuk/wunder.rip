import { Menu, Transition } from '@headlessui/react'
import {
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
} from '@heroicons/react/20/solid'
import React from 'react'
import { Fragment } from 'react'

import { IUser } from 'service/auth'

interface IHeaderProps {
  user: IUser | null
  onLogout: () => void
}

const Header = ({ user, onLogout }: IHeaderProps) => {
  return (
    <div className="w-full relative bg-[#323338] border-b border-[#d0d4e4]">
      <div className="h-14 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="text-white font-medium text-lg">Wunder Rip</div>
        <div className="flex items-center">
          {user?.avatar && (
            <img
              src={user.avatar}
              width={50}
              alt="avatar"
              className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
            />
          )}
          {user && (
            <div className="text-right ml-4">
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex w-full justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-[rgba(103,104,121,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0073ea] focus-visible:ring-opacity-75 transition-colors">
                    {user?.fullName}
                    <ChevronDownIcon
                      className="ml-2 -mr-1 h-5 w-5 text-white/70 hover:text-white"
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
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-[#d0d4e4] rounded-lg bg-white shadow-lg ring-1 ring-[#c3c6d4] focus:outline-none">
                    <div className="px-1 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-[#cce5ff] text-[#323338]' : 'text-[#323338]'
                            } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                          >
                            <Cog6ToothIcon className="mr-2 h-5 w-5 text-[#676879]" aria-hidden="true" />
                            {user?.email}
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
                              active ? 'bg-[#cce5ff] text-[#323338]' : 'text-[#323338]'
                            } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                          >
                            <ArrowRightOnRectangleIcon
                              className="mr-2 h-5 w-5 text-[#676879]"
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
          )}
        </div>
      </div>
    </div>
  )
}

export { Header }
