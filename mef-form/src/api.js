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
export const fetchUsersByDirection = (directionId) => get(`/keycloak/users?direction_id=${encodeURIComponent(directionId)}`)

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

export function fetchRevues(params = {}, token) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
  return get(`/revues?${qs.toString()}`, token)
}

export const fetchRevue = (id, token) => get(`/revues/${id}`, token)

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

// f = { dir, annee, trim }
function analyticsQuery(f = {}) {
  const qs = new URLSearchParams()
  if (f.dir)   qs.set('direction', f.dir)
  if (f.annee) qs.set('annee', f.annee)
  if (f.trim)  qs.set('trimestre', f.trim)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export async function fetchAuditLogs(params = {}, token) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
  const res = await fetch(`${BASE}/audit?${qs.toString()}`, { headers: authHeaders(token) })
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erreur') }
  return res.json()
}

export const fetchOverview                = (token, f) => get(`/analytics/overview${analyticsQuery(f)}`, token)
export const fetchParDirection            = (token, f) => get(`/analytics/par-direction${analyticsQuery(f)}`, token)
export const fetchParMois                 = (token, f) => get(`/analytics/par-mois${analyticsQuery(f)}`, token)
export const fetchLocaux                  = (token, f) => get(`/analytics/locaux${analyticsQuery(f)}`, token)
export const fetchRapports                = (token, f) => get(`/analytics/rapports${analyticsQuery(f)}`, token)
export const fetchParPeriode              = (token, f) => get(`/analytics/par-periode${analyticsQuery(f)}`, token)
export const fetchEffectifs               = (token, f) => get(`/analytics/effectifs${analyticsQuery(f)}`, token)
export const fetchEquipements             = (token, f) => get(`/analytics/equipements${analyticsQuery(f)}`, token)
export const fetchConformite              = (token, f) => get(`/analytics/conformite${analyticsQuery(f)}`, token)
export const fetchPostesVacants           = (token, f) => get(`/analytics/postes-vacants${analyticsQuery(f)}`, token)
export const fetchBesoinFormation         = (token, f) => get(`/analytics/besoins-formation${analyticsQuery(f)}`, token)
export const fetchActivitesNonRealisees   = (token, f) => get(`/analytics/activites-non-realisees${analyticsQuery(f)}`, token)
export const fetchDifficultesActivites    = (token, f) => get(`/analytics/difficultes-activites${analyticsQuery(f)}`, token)
export const fetchInfraIndicateurs        = (token, f) => get(`/analytics/infra-indicateurs${analyticsQuery(f)}`, token)
export const fetchInsuffisances           = (token, f) => get(`/analytics/insuffisances${analyticsQuery(f)}`, token)
export const fetchInsuffisancesHeatmap    = (token, f) => get(`/analytics/insuffisances-heatmap${analyticsQuery(f)}`, token)
export const fetchContraintes             = (token, f) => get(`/analytics/contraintes${analyticsQuery(f)}`, token)
export const fetchAppuis                  = (token, f) => get(`/analytics/appuis${analyticsQuery(f)}`, token)
export const fetchActions                 = (token, f) => get(`/analytics/actions${analyticsQuery(f)}`, token)
