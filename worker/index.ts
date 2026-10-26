import googleCallback from './routes/google-callback.js'
import mcp from './routes/mcp.js'
import oauthAuthorize from './routes/oauth-authorize.js'
import oauthRegister from './routes/oauth-register.js'
import oauthToken from './routes/oauth-token.js'
import { authorizationServer, protectedResource } from './routes/well-known.js'

type Handler = (req: Request) => Response | Promise<Response>

const routes: Record<string, Handler> = {
  '/api/mcp': mcp,
  '/api/oauth/authorize': oauthAuthorize,
  '/api/oauth/register': oauthRegister,
  '/api/oauth/token': oauthToken,
  '/api/auth/google/callback': googleCallback,
  '/.well-known/oauth-authorization-server': authorizationServer,
  '/.well-known/oauth-protected-resource': protectedResource,
}

type Env = { ASSETS: Fetcher }

// Only /api/* and /.well-known/* reach the Worker (see run_worker_first in wrangler.jsonc);
// everything else is served from dist/ with SPA fallback to index.html.
export default {
  async fetch(req, env) {
    const route = routes[new URL(req.url).pathname.replace(/\/$/, '')]
    if (route) {
      return route(req)
    }
    return env.ASSETS.fetch(req)
  },
} satisfies ExportedHandler<Env>
