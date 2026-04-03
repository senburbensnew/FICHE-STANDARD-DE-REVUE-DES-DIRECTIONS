import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchDirections, addDirection, updateDirection, deleteDirection,
  fetchKeycloakUsers, createKeycloakUser, updateKeycloakUser, deleteKeycloakUser,
} from '../api'
import { useKeycloak } from '../keycloak'

const EMPTY_DIR = {
  nom_direction: '', sigle: '', localisation_siege: '', email_officiel: '',
  effectif_theorique: '', statut: 'Actif',
  mission_principale: '', principales_attributions: '', principaux_services_rendus: '',
}
const DIR_REQUIRED = ['nom_direction', 'localisation_siege', 'mission_principale', 'principales_attributions', 'principaux_services_rendus']

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Alert({ type, msg, onClose }) {
  if (!msg) return null
  const cls = type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm mb-4 ${cls}`}>
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="ml-2 font-bold opacity-60 hover:opacity-100">&times;</button>
    </div>
  )
}

function SectionHeader({ title, icon, count }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <h2 className="text-base font-bold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-400">{count} enregistrement{count !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-blue-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputCls(hasError) {
  return `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
    hasError ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
  }`
}

// ─── Modal Direction (Add / Edit) ────────────────────────────────────────────
function DirectionModal({ onClose, onSaved, token, direction }) {
  const isEdit = !!direction
  const [form, setForm]           = useState(isEdit ? {
    nom_direction:              direction.nom_direction              || '',
    sigle:                      direction.sigle                      || '',
    localisation_siege:         direction.localisation_siege         || '',
    email_officiel:             direction.email_officiel             || '',
    effectif_theorique:         direction.effectif_theorique != null ? String(direction.effectif_theorique) : '',
    statut:                     direction.statut                     || 'Actif',
    mission_principale:         direction.mission_principale         || '',
    principales_attributions:   direction.principales_attributions   || '',
    principaux_services_rendus: direction.principaux_services_rendus || '',
  } : EMPTY_DIR)
  const [attempted, setAttempted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const firstRef = useRef(null)

  useEffect(() => { setTimeout(() => firstRef.current?.focus(), 50) }, [])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }
  const err = (k) => attempted && DIR_REQUIRED.includes(k) && !form[k]?.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAttempted(true)
    const missing = DIR_REQUIRED.filter(k => !form[k]?.trim())
    if (missing.length) { setError('Veuillez remplir tous les champs obligatoires.'); return }
    setLoading(true)
    const payload = {
      nom_direction:              form.nom_direction.trim(),
      sigle:                      form.sigle.trim() || null,
      localisation_siege:         form.localisation_siege.trim(),
      email_officiel:             form.email_officiel.trim(),
      effectif_theorique:         form.effectif_theorique ? Number(form.effectif_theorique) : null,
      statut:                     form.statut,
      mission_principale:         form.mission_principale.trim(),
      principales_attributions:   form.principales_attributions.trim(),
      principaux_services_rendus: form.principaux_services_rendus.trim(),
    }
    try {
      if (isEdit) {
        await updateDirection(direction.direction_id, payload, token)
      } else {
        await addDirection(payload, token)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement.")
    } finally { setLoading(false) }
  }

  return (
    <ModalShell title={isEdit ? 'Modifier la direction' : 'Ajouter une direction / unité'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <Field label="Intitulé officiel" required error={err('nom_direction') ? 'Champ obligatoire' : ''}>
          <input ref={firstRef} value={form.nom_direction} onChange={e => set('nom_direction', e.target.value)}
            placeholder="ex. Direction des Ressources Humaines" className={inputCls(err('nom_direction'))} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sigle">
            <input value={form.sigle} onChange={e => set('sigle', e.target.value)}
              placeholder="ex. DRH" className={inputCls(false)} />
          </Field>
          <Field label="Statut">
            <select value={form.statut} onChange={e => set('statut', e.target.value)}
              className={inputCls(false) + ' bg-white'}>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </select>
          </Field>
        </div>

        <Field label="Localisation siège" required error={err('localisation_siege') ? 'Champ obligatoire' : ''}>
          <input value={form.localisation_siege} onChange={e => set('localisation_siege', e.target.value)}
            placeholder="ex. Port-au-Prince, Bâtiment A" className={inputCls(err('localisation_siege'))} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email officiel">
            <input type="email" value={form.email_officiel} onChange={e => set('email_officiel', e.target.value)}
              placeholder="ex. drh@mef.gouv.ht" className={inputCls(false)} />
          </Field>
          <Field label="Effectif théorique">
            <input type="number" min="0" value={form.effectif_theorique} onChange={e => set('effectif_theorique', e.target.value)}
              placeholder="0" className={inputCls(false)} />
          </Field>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mission et Attributions</p>
          <div className="space-y-3">
            {[
              { k: 'mission_principale',         label: 'Mission principale',         ph: 'Mission principale de la structure…' },
              { k: 'principales_attributions',   label: 'Principales attributions',   ph: 'Principales attributions…' },
              { k: 'principaux_services_rendus', label: 'Principaux services rendus', ph: 'Principaux services rendus…' },
            ].map(({ k, label, ph }) => (
              <Field key={k} label={label} required error={err(k) ? 'Champ obligatoire' : ''}>
                <textarea rows={3} value={form[k]} onChange={e => set(k, e.target.value)}
                  placeholder={ph} className={inputCls(err(k)) + ' resize-y'} />
              </Field>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className="text-sm px-5 py-2 rounded-lg bg-blue-800 text-white hover:bg-blue-900 font-medium disabled:opacity-60">
            {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ─── Section Directions ───────────────────────────────────────────────────────
function DirectionsSection({ token }) {
  const [directions, setDirections] = useState([])
  const [modal, setModal]           = useState(null) // null | 'add' | direction object
  const [alert, setAlert]           = useState(null)
  const [search, setSearch]         = useState('')

  const load = useCallback(async () => {
    try { setDirections(await fetchDirections()) } catch { /* ignore */ }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer "${nom}" ? Cette action supprimera aussi les utilisateurs et fiches associés.`)) return
    try {
      await deleteDirection(id, token)
      setAlert({ type: 'success', msg: 'Direction supprimée.' })
      await load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    }
  }

  const filtered = directions.filter(d =>
    d.nom_direction.toLowerCase().includes(search.toLowerCase()) ||
    (d.sigle || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <SectionHeader
        title="Directions"
        count={directions.length}
        icon={
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      />

      <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher une direction..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 py-2 pr-4">Nom</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-2 pr-4 hidden sm:table-cell">Sigle</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-2 pr-4 hidden md:table-cell">Localisation</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-2 pr-4 hidden lg:table-cell">Email</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-2">Statut</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-gray-400 text-xs">Aucune direction trouvée</td></tr>
            )}
            {filtered.map(d => (
              <tr key={d.direction_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2.5 pr-4 font-medium text-gray-800">{d.nom_direction}</td>
                <td className="py-2.5 pr-4 text-gray-500 hidden sm:table-cell">{d.sigle || '—'}</td>
                <td className="py-2.5 pr-4 text-gray-500 hidden md:table-cell">{d.localisation_siege || '—'}</td>
                <td className="py-2.5 pr-4 text-gray-400 text-xs hidden lg:table-cell">{d.email_officiel || '—'}</td>
                <td className="py-2.5">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${d.statut === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {d.statut || 'Actif'}
                  </span>
                </td>
                <td className="py-2.5 pl-2 text-right flex items-center justify-end gap-2">
                  <button
                    onClick={() => setModal(d)}
                    className="text-blue-400 hover:text-blue-600 transition-colors"
                    title="Modifier"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(d.direction_id, d.nom_direction)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <DirectionModal
          token={token}
          direction={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            load()
            setAlert({ type: 'success', msg: modal === 'add' ? 'Direction ajoutée avec succès.' : 'Direction mise à jour.' })
          }}
        />
      )}
    </div>
  )
}

// ─── Direction searchable dropdown ───────────────────────────────────────────
function DirectionSelect({ value, onChange, directions, hasError, onReload }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [reloading, setReloading] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selected = directions.find(d => String(d.direction_id) === String(value))
  const filtered = directions.filter(d =>
    d.nom_direction.toLowerCase().includes(query.toLowerCase()) ||
    (d.sigle || '').toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50) }}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between transition focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer bg-white ${
          hasError ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
        }`}
      >
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected
            ? `${selected.nom_direction}${selected.sigle ? ` (${selected.sigle})` : ''}`
            : '— Sélectionner une direction —'}
        </span>
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col">
          <div className="p-2 border-b border-gray-100 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher une direction…"
              className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              title="Actualiser la liste"
              disabled={reloading}
              onClick={async () => {
                setReloading(true)
                await onReload?.()
                setReloading(false)
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400 italic">Aucun résultat</li>
            )}
            {filtered.map(d => (
              <li
                key={d.direction_id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-900 ${
                  String(d.direction_id) === String(value) ? 'bg-blue-100 font-semibold text-blue-900' : 'text-gray-700'
                }`}
                onMouseDown={() => { onChange(String(d.direction_id)); setOpen(false); setQuery('') }}
              >
                {d.nom_direction}{d.sigle ? ` (${d.sigle})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const ROLES = [
  { value: 'admin',              label: 'Administrateur' },
  { value: 'responsable',        label: 'Responsable' },
  { value: 'direction-generale', label: 'Direction Générale' },
]

// ─── Modal Keycloak User (Add / Edit) ────────────────────────────────────────
const EMPTY_KC = {
  username: '', firstName: '', lastName: '', email: '',
  enabled: true, password: 'password123',
  role: 'responsable', fonction: '', telephone: '', direction_id: '',
}

function buildFormFromUser(user) {
  return {
    username:     user.username     || '',
    firstName:    user.firstName    || '',
    lastName:     user.lastName     || '',
    email:        user.email        || '',
    enabled:      user.enabled      ?? true,
    password:     '',
    role:         user.realmRoles?.[0] || 'responsable',
    fonction:     user.attributes?.fonction?.[0]     || '',
    telephone:    user.attributes?.telephone?.[0]    || '',
    direction_id: user.attributes?.direction_id?.[0] || '',
  }
}

function KeycloakUserModal({ onClose, onSaved, token, user, directions, onReloadDirections }) {
  const isEdit = !!user
  const [form, setForm]       = useState(isEdit ? buildFormFromUser(user) : EMPTY_KC)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const firstRef              = useRef(null)

  useEffect(() => { setTimeout(() => firstRef.current?.focus(), 50) }, [])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username.trim()) { setError("Le nom d'utilisateur est requis."); return }
    if (!form.direction_id) { setError('La direction est requise.'); return }
    if (!isEdit && !form.password.trim()) { setError('Le mot de passe est requis pour un nouvel utilisateur.'); return }
    setLoading(true)
    try {
      if (isEdit) {
        await updateKeycloakUser(user.id, form, token)
      } else {
        await createKeycloakUser(form, token)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <ModalShell title={isEdit ? 'Modifier le compte' : 'Ajouter un compte Keycloak'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom">
            <input ref={firstRef} value={form.firstName} onChange={e => set('firstName', e.target.value)}
              placeholder="Prénom" className={inputCls(false)} />
          </Field>
          <Field label="Nom">
            <input value={form.lastName} onChange={e => set('lastName', e.target.value)}
              placeholder="Nom" className={inputCls(false)} />
          </Field>
        </div>

        <Field label="Nom d'utilisateur" required>
          <input value={form.username} onChange={e => set('username', e.target.value)}
            placeholder="ex. jdupont" className={inputCls(!form.username && !!error)} />
        </Field>

        <Field label="Email">
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="ex. jdupont@mef.gouv.ht" className={inputCls(false)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fonction">
            <input value={form.fonction} onChange={e => set('fonction', e.target.value)}
              placeholder="ex. Directeur" className={inputCls(false)} />
          </Field>
          <Field label="Téléphone">
            <input value={form.telephone} onChange={e => set('telephone', e.target.value)}
              placeholder="ex. +509 3700-0000" className={inputCls(false)} />
          </Field>
        </div>

        <Field label="Direction" required error={!form.direction_id && !!error ? 'Champ obligatoire' : ''}>
          <DirectionSelect
            value={form.direction_id}
            onChange={v => set('direction_id', v)}
            directions={directions}
            hasError={!form.direction_id && !!error}
            onReload={onReloadDirections}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Rôle">
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className={inputCls(false) + ' bg-white'}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Statut">
            <select value={form.enabled ? 'true' : 'false'} onChange={e => set('enabled', e.target.value === 'true')}
              className={inputCls(false) + ' bg-white'}>
              <option value="true">Actif</option>
              <option value="false">Désactivé</option>
            </select>
          </Field>
        </div>

        <Field label={isEdit ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'} required={!isEdit}>
          <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
            placeholder={isEdit ? 'Laisser vide pour ne pas modifier' : 'Mot de passe initial'}
            className={inputCls(!isEdit && !form.password && !!error)} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className="text-sm px-5 py-2 rounded-lg bg-blue-800 text-white hover:bg-blue-900 font-medium disabled:opacity-60">
            {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ─── Section Comptes Keycloak ─────────────────────────────────────────────────
function KeycloakUsersSection({ token }) {
  const [users, setUsers]       = useState([])
  const [directions, setDirections] = useState([])
  const [loading, setLoading]   = useState(true)
  const [alert, setAlert]       = useState(null)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null) // null | 'add' | user object

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([fetchKeycloakUsers(token), fetchDirections()])
      .then(([users, dirs]) => { setUsers(users); setDirections(dirs); setLoading(false) })
      .catch(err => { setAlert({ type: 'error', msg: err.message }); setLoading(false) })
  }, [token])

  const reloadDirections = useCallback(() =>
    fetchDirections().then(setDirections).catch(() => {}), [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer le compte "${u.username}" ? Cette action est irréversible.`)) return
    try {
      await deleteKeycloakUser(u.id, token)
      setAlert({ type: 'success', msg: 'Compte supprimé.' })
      load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.lastName || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <SectionHeader
        title="Comptes Keycloak"
        count={users.length}
        icon={
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        }
      />

      <Alert type={alert?.type} msg={alert?.msg} onClose={() => setAlert(null)} />

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher un compte..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-6">Chargement…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 py-2 pr-4">Nom d'utilisateur</th>
                <th className="text-left text-xs font-semibold text-gray-500 py-2 pr-4 hidden sm:table-cell">Prénom Nom</th>
                <th className="text-left text-xs font-semibold text-gray-500 py-2 pr-4 hidden md:table-cell">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 py-2 pr-4 hidden lg:table-cell">Rôle</th>
                <th className="text-left text-xs font-semibold text-gray-500 py-2">Statut</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-gray-400 text-xs">Aucun compte trouvé</td></tr>
              )}
              {filtered.map(u => {
                const roleLabel = ROLES.find(r => u.realmRoles?.includes(r.value))?.label || '—'
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{u.username}</td>
                    <td className="py-2.5 pr-4 text-gray-500 hidden sm:table-cell">
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400 text-xs hidden md:table-cell">{u.email || '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-500 text-xs hidden lg:table-cell">{roleLabel}</td>
                    <td className="py-2.5">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {u.enabled ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal(u)}
                        className="text-blue-400 hover:text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <KeycloakUserModal
          token={token}
          user={modal === 'add' ? null : modal}
          directions={directions}
          onReloadDirections={reloadDirections}
          onClose={() => setModal(null)}
          onSaved={() => {
            load()
            setAlert({ type: 'success', msg: modal === 'add' ? 'Compte créé avec succès.' : 'Compte mis à jour.' })
          }}
        />
      )}
    </div>
  )
}

// ─── Page Administration ──────────────────────────────────────────────────────
export default function Admin() {
  const { token } = useKeycloak()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 text-center">
          <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">
            Ministère de l&apos;Économie et des Finances — Direction Générale
          </p>
          <h1 className="text-lg font-extrabold text-gray-900">Administration</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <DirectionsSection token={token} />
        <KeycloakUsersSection token={token} />
      </div>
    </div>
  )
}
