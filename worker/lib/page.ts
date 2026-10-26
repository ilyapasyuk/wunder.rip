export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, char => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })

// Mirrors the app's palette and type (src/index.css) for pages the Worker renders itself.
const STYLES = `
  :root {
    color-scheme: light dark;
    --bg: #ffffff; --muted: #f3f4f6; --surface: #ffffff; --text: #111114; --text-2: #9ca3af;
    --text-3: #64748b; --line: #e5e7eb; --accent: #f04a2c;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b0b0e; --muted: #1c1c21; --surface: #18181d; --text: #f4f4f6; --text-2: #6e7380;
      --text-3: #969eaf; --line: #26262d; --accent: #ff6347;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 7vh 20px 64px; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif; -webkit-font-smoothing: antialiased;
  }
  main { max-width: 680px; margin: 0 auto; }
  .brand { text-decoration: none; font-size: 1.375rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text); }
  .brand span { color: var(--accent); }
  h1 { margin: 48px 0 8px; font-size: clamp(2.5rem, 7vw, 3rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; }
  .lead { margin: 0 0 32px; font-size: 1.15rem; font-weight: 500; line-height: 1.5; color: var(--text-2); }
  .card { background: var(--muted); border-radius: 16px; padding: 18px 20px; margin: 10px 0; box-shadow: inset 0 -1px 0 rgb(0 0 0 / 0.05); }
  .card h2 { margin: 0 0 12px; font-size: 1.1rem; font-weight: 600; }
  .row { display: flex; align-items: center; gap: 8px; }
  code {
    flex: 1; min-width: 0; background: var(--surface); color: var(--text); border-radius: 12px; padding: 12px 14px; box-shadow: 0 1px 2px rgb(16 24 40 / 0.06);
    font: 0.8rem/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; word-break: break-all;
  }
  code.path { display: inline; padding: 2px 8px; border-radius: 8px; font-size: 0.85em; white-space: nowrap; }
  .copy {
    flex-shrink: 0; height: 44px; padding: 0 18px; border: 0; border-radius: 12px; cursor: pointer;
    background: var(--accent); color: #fff; font: 600 0.9rem -apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif;
  }
  .copy:active { transform: scale(0.97); }
  .step { margin: 10px 0 0; font-size: 0.9rem; line-height: 1.55; color: var(--text-3); }
  details { margin-top: 20px; }
  summary { cursor: pointer; font-size: 0.95rem; color: var(--text-2); }
  a { color: var(--text); text-decoration-color: var(--accent); text-decoration-thickness: 2px; text-underline-offset: 4px; }
`

export const renderPage = (title: string, body: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${STYLES}</style>
  </head>
  <body>
    <main>
      <a class="brand" href="/">Wunder<span>.rip</span></a>
      ${body}
    </main>
  </body>
</html>`

/** A titled message page: big heading, one line of explanation. */
export const renderMessage = (title: string, description: string): string =>
  renderPage(title, `<h1>${escapeHtml(title)}</h1><p class="lead">${description}</p>`)
