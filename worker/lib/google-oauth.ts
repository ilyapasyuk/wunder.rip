const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

const getEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export const buildGoogleAuthUrl = (redirectUri: string, state?: string): string => {
  const params = new URLSearchParams({
    client_id: getEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope:
      'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    access_type: 'online',
    prompt: 'select_account',
  })
  if (state) {
    params.set('state', state)
  }
  return `${AUTH_URL}?${params.toString()}`
}

export type GoogleUserInfo = {
  email: string
  picture?: string
}

export const exchangeCodeForUserInfo = async (
  code: string,
  redirectUri: string,
): Promise<GoogleUserInfo> => {
  const tokenResponse = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getEnv('GOOGLE_CLIENT_ID'),
      client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${tokenResponse.status}`)
  }

  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token: string }

  const userInfoResponse = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userInfoResponse.ok) {
    throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`)
  }

  const userInfo = (await userInfoResponse.json()) as GoogleUserInfo
  if (!userInfo.email) {
    throw new Error('Google account has no email')
  }
  return userInfo
}
