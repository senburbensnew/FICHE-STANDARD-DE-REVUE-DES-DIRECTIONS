const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function submitFiche(data, token) {
  const res = await fetch(`${BASE}/fiches`, {
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

export const fetchOverview       = (token) => get('/analytics/overview', token)
export const fetchParDirection   = (token) => get('/analytics/par-direction', token)
export const fetchParMois        = (token) => get('/analytics/par-mois', token)
export const fetchLocaux         = (token) => get('/analytics/locaux', token)
export const fetchRapports       = (token) => get('/analytics/rapports', token)
