import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { auth } from 'services/firebase'

type Status =
  | { kind: 'loading' }
  | { kind: 'ready'; redirectHost: string }
  | { kind: 'approving' }
  | { kind: 'error'; message: string }

/**
 * Consent screen for connecting an MCP client (Claude Code, Claude Desktop…). Reached from
 * /api/oauth/authorize; rendered inside <Auth>, so the user is already signed in (Google or Apple).
 */
const Connect = () => {
  const [params] = useSearchParams()
  const request = params.get('request') ?? ''
  const [status, setStatus] = useState<Status>({ kind: 'loading' })

  useEffect(() => {
    fetch(`/api/oauth/complete?request=${encodeURIComponent(request)}`)
      .then(async response => {
        const body = (await response.json()) as { redirectHost?: string }
        setStatus(
          response.ok && body.redirectHost
            ? { kind: 'ready', redirectHost: body.redirectHost }
            : {
                kind: 'error',
                message: 'This link has expired. Start connecting again from your MCP client.',
              },
        )
      })
      .catch(() => setStatus({ kind: 'error', message: 'Network error. Reload the page.' }))
  }, [request])

  const approve = async () => {
    const user = auth.currentUser
    if (!user) return
    setStatus({ kind: 'approving' })
    try {
      const response = await fetch('/api/oauth/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, idToken: await user.getIdToken() }),
      })
      const body = (await response.json()) as { redirect?: string; error_description?: string }
      if (!response.ok || !body.redirect) {
        setStatus({ kind: 'error', message: body.error_description ?? 'Could not connect.' })
        return
      }
      window.location.assign(body.redirect)
    } catch {
      setStatus({ kind: 'error', message: 'Network error. Reload the page.' })
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16 text-text-primary dark:text-text-dark-primary">
      <h1 className="text-2xl font-semibold tracking-tight">Connect an AI assistant</h1>
      {status.kind === 'loading' && (
        <p className="mt-4 text-text-secondary">Checking the request…</p>
      )}
      {status.kind === 'error' && <p className="mt-4 text-danger">{status.message}</p>}
      {(status.kind === 'ready' || status.kind === 'approving') && (
        <>
          <p className="mt-4 leading-relaxed">
            An MCP client at{' '}
            <strong className="font-semibold">
              {status.kind === 'ready' ? status.redirectHost : '…'}
            </strong>{' '}
            wants to read and change your tasks and lists as{' '}
            <strong className="font-semibold">
              {auth.currentUser?.email || auth.currentUser?.displayName}
            </strong>
            .
          </p>
          <p className="mt-2 text-sm text-text-secondary dark:text-text-dark-secondary">
            Only allow this if you just started connecting it yourself.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={approve}
              disabled={status.kind === 'approving'}
              className="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold disabled:opacity-60"
            >
              {status.kind === 'approving' ? 'Connecting…' : 'Allow'}
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl ring-1 ring-border dark:ring-border-dark font-semibold"
            >
              Cancel
            </a>
          </div>
        </>
      )}
    </main>
  )
}

export { Connect }
