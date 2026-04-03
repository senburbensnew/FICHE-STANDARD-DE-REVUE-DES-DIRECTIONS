const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ─── Revues (remplace fiches) ──────────────────────────────────────────────────
export async function submitRevue(data, token) {
  const res = await fetch(`${BASE}/revues`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Erreur lors de la soumission')
  }
  return res.json()
}

async function get(path, token) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`Erreur ${res.status}`)
  return res.json()
}

export const fetchDirections = () => get('/directions')

export async function updateDirection(id, data, token) {
  const res = await fetch(`${BASE}/directions/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erreur') }
  return res.json()
}

export async function deleteDirection(id, token) {
  const res = await fetch(`${BASE}/directions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erreur') }
  return res.json()
}

export const fetchKeycloakUsers = (token) => get('/keycloak/users', token)

export async function createKeycloakUser(data, token) {
  const res = await fetch(`${BASE}/keycloak/users`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erreur') }
  return res.json()
}

export async function deleteKeycloakUser(id, token) {
  const res = await fetch(`${BASE}/keycloak/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erreur') }
  return res.json()
}

export async function updateKeycloakUser(id, data, token) {
  const res = await fetch(`${BASE}/keycloak/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erreur') }
  return res.json()
}

export const checkDoublon = (direction, periodeDebut, periodeFin) =>
  get(`/revues/check?direction=${encodeURIComponent(direction)}&periode_debut=${encodeURIComponent(periodeDebut)}&periode_fin=${encodeURIComponent(periodeFin)}`)

export async function addDirection(data, token) {
  const res = await fetch(`${BASE}/directions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Erreur lors de l\'ajout')
  }
  return res.json()
}

function dirQuery(direction) {
  return direction ? `?direction=${encodeURIComponent(direction)}` : ''
}

export const fetchOverview              = (token, dir) => get(`/analytics/overview${dirQuery(dir)}`, token)
export const fetchParDirection          = (token, dir) => get(`/analytics/par-direction${dirQuery(dir)}`, token)
export const fetchParMois               = (token, dir) => get(`/analytics/par-mois${dirQuery(dir)}`, token)
export const fetchLocaux                = (token, dir) => get(`/analytics/locaux${dirQuery(dir)}`, token)
export const fetchRapports              = (token, dir) => get(`/analytics/rapports${dirQuery(dir)}`, token)
export const fetchParPeriode            = (token, dir) => get(`/analytics/par-periode${dirQuery(dir)}`, token)
export const fetchEffectifs             = (token, dir) => get(`/analytics/effectifs${dirQuery(dir)}`, token)
export const fetchEquipements           = (token, dir) => get(`/analytics/equipements${dirQuery(dir)}`, token)
export const fetchConformite            = (token, dir) => get(`/analytics/conformite${dirQuery(dir)}`, token)
export const fetchPostesVacants         = (token, dir) => get(`/analytics/postes-vacants${dirQuery(dir)}`, token)
export const fetchBesoinFormation       = (token, dir) => get(`/analytics/besoins-formation${dirQuery(dir)}`, token)
export const fetchActivitesNonRealisees = (token, dir) => get(`/analytics/activites-non-realisees${dirQuery(dir)}`, token)
export const fetchDifficultesActivites  = (token, dir) => get(`/analytics/difficultes-activites${dirQuery(dir)}`, token)
export const fetchInfraIndicateurs      = (token, dir) => get(`/analytics/infra-indicateurs${dirQuery(dir)}`, token)
export const fetchInsuffisances         = (token, dir) => get(`/analytics/insuffisances${dirQuery(dir)}`, token)
export const fetchContraintes           = (token, dir) => get(`/analytics/contraintes${dirQuery(dir)}`, token)
export const fetchAppuis                = (token, dir) => get(`/analytics/appuis${dirQuery(dir)}`, token)
export const fetchActions               = (token, dir) => get(`/analytics/actions${dirQuery(dir)}`, token)
