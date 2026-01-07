import { Menu, Transition } from '@headlessui/react'
import {
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/20/solid'
import React, { Fragment, useEffect, useState } from 'react'

import { IUser } from 'services/auth'
import { getCurrentTheme, toggleTheme } from 'services/theme'

interface IHeaderProps {
  user: IUser | null
  onLogout: () => void
}

const Header = ({ user, onLogout }: IHeaderProps) => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(getCurrentTheme() === 'dark')
    const observer = new MutationObserver(() => {
      setIsDark(getCurrentTheme() === 'dark')
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  const handleToggleTheme = () => {
    const newTheme = toggleTheme()
    setIsDark(newTheme === 'dark')
  }

  return (
    <div className="w-full relative bg-header dark:bg-header-dark border-b border-border-light dark:border-border-dark">
      <div className="h-14 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="text-white dark:text-text-dark-primary font-medium text-lg">Wunder Rip</div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTheme}
            className="p-1.5 rounded-md text-white/80 dark:text-text-dark-secondary hover:text-white dark:hover:text-text-dark-primary hover:bg-overlay-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-header dark:focus:ring-offset-header-dark transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
          >
            {isDark ? (
              <SunIcon className="size-5 shrink-0" />
            ) : (
              <MoonIcon className="size-5 shrink-0" />
            )}
          </button>
          {user?.avatar && (
            <img
              src={user.avatar}
              width={50}
              alt="avatar"
              className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-surface-dark"
            />
          )}
          {user && (
            <div className="text-right ml-4">
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-transparent px-4 py-2 text-sm font-medium text-white dark:text-text-dark-primary hover:bg-overlay-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-75 transition-colors">
                    {user?.fullName}
                    <ChevronDownIcon
                      className="size-4 shrink-0 text-white/70 dark:text-text-dark-secondary"
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
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-border-light dark:divide-border-dark rounded-lg bg-surface dark:bg-surface-dark shadow-lg ring-1 ring-border dark:ring-border-dark focus:outline-none">
                    <div className="px-1 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            className={`${
                              active
                                ? 'bg-primary-light dark:bg-primary/20 text-text-primary dark:text-text-dark-primary'
                                : 'text-text-primary dark:text-text-dark-primary'
                            } group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors`}
                          >
                            <Cog6ToothIcon
                              className="size-5 shrink-0 text-text-secondary dark:text-text-dark-secondary"
                              aria-hidden="true"
                            />
                            {user?.email}
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="px-1 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={onLogout}
                            className={`${
                              active
                                ? 'bg-primary-light dark:bg-primary/20 text-text-primary dark:text-text-dark-primary'
                                : 'text-text-primary dark:text-text-dark-primary'
                            } group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors`}
                          >
                            <ArrowRightOnRectangleIcon
                              className="size-5 shrink-0 text-text-secondary dark:text-text-dark-secondary"
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
