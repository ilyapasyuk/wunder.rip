import { Menu, Transition } from '@headlessui/react'
import {
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  DevicePhoneMobileIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/20/solid'
import { getCurrentTheme, toggleTheme } from 'lib/theme'
import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTE } from 'routes'
import { User } from 'services/auth'

interface IHeaderProps {
  user: User | null
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

  const menuItemClass = (active: boolean) =>
    `${
      active ? 'bg-muted' : ''
    } group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-primary transition-colors`

  return (
    <div className="w-full md:shrink-0 sticky top-0 z-30 bg-background/85 backdrop-blur-xl">
      <div className="h-16 flex items-stretch">
        <div className="md:w-[var(--sidebar-w)] md:shrink-0 flex items-center px-4 sm:px-6">
          <a
            href="/"
            className="group flex items-baseline rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <span className="font-display text-[1.375rem] font-bold tracking-[-0.03em] text-text-primary leading-none">
              Wunder
            </span>
            <span className="font-display text-[1.375rem] font-bold tracking-[-0.03em] text-accent leading-none">
              .rip
            </span>
          </a>
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-end px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Link
              to={ROUTE.IOS}
              aria-label="Get the iOS app"
              className="sm:hidden size-10 inline-flex items-center justify-center rounded-full bg-muted text-text-primary hover:bg-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
            >
              <DevicePhoneMobileIcon className="size-5 shrink-0" aria-hidden="true" />
            </Link>
            <Link
              to={ROUTE.IOS}
              className="hidden sm:inline-flex h-10 items-center gap-2 px-4 rounded-full text-sm font-semibold text-text-primary bg-muted hover:bg-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors whitespace-nowrap"
            >
              <DevicePhoneMobileIcon className="size-4 shrink-0" aria-hidden="true" />
              iOS app
            </Link>
            <button
              onClick={handleToggleTheme}
              className="size-10 inline-flex items-center justify-center rounded-full bg-muted text-text-primary hover:bg-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              type="button"
            >
              {isDark ? (
                <SunIcon className="size-5 shrink-0" />
              ) : (
                <MoonIcon className="size-5 shrink-0" />
              )}
            </button>
            {user && (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="inline-flex h-10 items-center gap-2 rounded-full bg-muted pl-1 pr-3 text-sm font-semibold text-text-primary hover:bg-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      width={32}
                      height={32}
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="size-8 rounded-full bg-muted-strong" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline max-w-[10rem] truncate">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <ChevronDownIcon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-150"
                  enterFrom="transform opacity-0 scale-95 -translate-y-1"
                  enterTo="transform opacity-100 scale-100 translate-y-0"
                  leave="transition ease-in duration-100"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl bg-surface p-1.5 shadow-lift ring-1 ring-border focus:outline-none">
                    <div className="px-3 pt-2 pb-3">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-text-secondary truncate">{user.email}</div>
                    </div>
                    <Menu.Item>
                      {({ active }) => (
                        <Link to="/account" className={menuItemClass(active)}>
                          <Cog6ToothIcon
                            className="size-5 shrink-0 text-text-secondary"
                            aria-hidden="true"
                          />
                          <span className="truncate">Account</span>
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="/api/mcp"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={menuItemClass(active)}
                        >
                          <CommandLineIcon
                            className="size-5 shrink-0 text-text-secondary"
                            aria-hidden="true"
                          />
                          <span className="truncate">Connect via MCP</span>
                        </a>
                      )}
                    </Menu.Item>
                    <div className="my-1 h-px bg-border" />
                    <Menu.Item>
                      {({ active }) => (
                        <button type="button" onClick={onLogout} className={menuItemClass(active)}>
                          <ArrowRightOnRectangleIcon
                            className="size-5 shrink-0 text-text-secondary"
                            aria-hidden="true"
                          />
                          Log out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Header }
