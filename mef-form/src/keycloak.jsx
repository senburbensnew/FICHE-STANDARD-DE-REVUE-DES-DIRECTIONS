import Keycloak from 'keycloak-js'
import { createContext, useContext, useEffect, useState, createElement } from 'react'

const keycloak = new Keycloak({
  url:    import.meta.env.VITE_KEYCLOAK_URL   || 'http://localhost:8080',
  realm:  import.meta.env.VITE_KEYCLOAK_REALM || 'mef',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT || 'mef-form',
})

const KeycloakContext = createContext(null)

export function KeycloakProvider({ children }) {
  const [state, setState] = useState({
    authenticated: false,
    token: null,
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    keycloak
      .init({ onLoad: 'check-sso', checkLoginIframe: false, silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html', locale: 'fr' })
      .then(authenticated => {
        setState({
          authenticated,
          token: keycloak.token,
          user: keycloak.tokenParsed,
          loading: false,
          error: null,
        })

        // Auto-refresh token 60 s before expiry
        const intervalId = setInterval(() => {
          keycloak.updateToken(60)
            .then(refreshed => {
              if (refreshed) {
                setState(s => ({ ...s, token: keycloak.token }))
              }
            })
            .catch(() => {
              // Refresh token expired or invalid — force re-login
              clearInterval(intervalId)
              setState({ authenticated: false, token: null, user: null, loading: false, error: null })
              keycloak.login()
            })
        }, 30_000)
      })
      .catch(err => {
        setState({ authenticated: false, token: null, user: null, loading: false, error: String(err) })
      })
  }, [])

  const logout = () => keycloak.logout()
  const login  = () => keycloak.login({ locale: 'fr' })

  return createElement(KeycloakContext.Provider, { value: { ...state, logout, login } }, children)
}

export function useKeycloak() {
  return useContext(KeycloakContext)
}
