import { useState, useEffect, useCallback } from 'react'
import { format, parseISO, isValid, isPast, differenceInCalendarDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { fetchReunions, createReunion, updateReunion, annulerReunion, deleteReunion } from '../api'
import { useKeycloak } from '../keycloak'

function fmtDate(iso) {
  if (!iso) return '—'
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'dd MMMM yyyy', { locale: fr }) : iso
}

const EMPTY_FORM = {
  titre: '', description: '', date_reunion: '', heure_debut: '', heure_fin: '',
  lieu: '', periode_debut: '', periode_fin: '',
}

function StatusPill({ r }) {
  if (r.est_annulee) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Annulée
    </span>
  )
  if (!r.date_reunion) return null
  const days = differenceInCalendarDays(parseISO(r.date_reunion), new Date())
  if (days < 0) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
      Passée
    </span>
  )
  if (days === 0) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" /> Aujourd'hui
    </span>
  )
  if (days <= 7) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
      Dans {days}j
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
      À venir
    </span>
  )
}

function FormModal({ initial, onSave, onClose, saving, error }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-blue-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-base font-bold">
            {initial ? 'Modifier la réunion' : 'Planifier une réunion'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Titre <span className="text-red-500">*</span></label>
            <input
              value={form.titre}
              onChange={e => set('titre', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Titre de la réunion"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              placeholder="Ordre du jour, objectifs…"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.date_reunion}
                onChange={e => set('date_reunion', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Début</label>
              <input
                type="time"
                value={form.heure_debut}
                onChange={e => set('heure_debut', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fin</label>
              <input
                type="time"
                value={form.heure_fin}
                onChange={e => set('heure_fin', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Lieu</label>
            <input
              value={form.lieu}
              onChange={e => set('lieu', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Salle de réunion, adresse…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Période début</label>
              <input
                type="date"
                value={form.periode_debut}
                onChange={e => set('periode_debut', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Période fin</label>
              <input
                type="date"
                value={form.periode_fin}
                onChange={e => set('periode_fin', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.titre.trim() || !form.date_reunion}
            className="text-sm px-5 py-2 rounded-lg bg-blue-800 text-white font-medium hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {initial ? 'Enregistrer' : 'Planifier et notifier'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Reunions({ user }) {
  const { token } = useKeycloak()
  const isDG = user?.realm_access?.roles?.includes('direction-generale') ?? false

  const [reunions, setReunions]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)   // reunion object being edited
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmId, setConfirmId] = useState(null)   // id to cancel/delete
  const [confirmAction, setConfirmAction] = useState(null)
  const [filterPast, setFilterPast] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchReunions(token)
      setReunions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    setSaving(true)
    setSaveError('')
    try {
      if (editing) {
        await updateReunion(editing.reunion_id, form, token)
      } else {
        await createReunion({ ...form, creee_par: user?.sub || user?.preferred_username }, token)
      }
      setShowModal(false)
      setEditing(null)
      await load()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAnnuler(id) {
    try {
      await annulerReunion(id, token)
      setConfirmId(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteReunion(id, token)
      setConfirmId(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const visible = filterPast
    ? reunions
    : reunions.filter(r => !r.est_annulee && !isPast(parseISO(r.date_reunion)))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800">Réunions</h1>
            <p className="text-xs text-gray-400">Calendrier des réunions de direction</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={filterPast}
              onChange={e => setFilterPast(e.target.checked)}
              className="rounded"
            />
            Afficher passées / annulées
          </label>
          {isDG && (
            <button
              onClick={() => { setEditing(null); setSaveError(''); setShowModal(true) }}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-blue-800 text-white font-medium hover:bg-blue-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Planifier
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-16">Chargement…</p>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400 text-sm">
          {filterPast ? 'Aucune réunion trouvée.' : 'Aucune réunion à venir.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(r => (
            <div
              key={r.reunion_id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all
                ${r.est_annulee ? 'border-red-100 opacity-60' : 'border-gray-200 hover:shadow-md'}`}
            >
              <div className="flex items-stretch">
                {/* Date block */}
                <div className={`shrink-0 w-20 flex flex-col items-center justify-center py-4
                  ${r.est_annulee ? 'bg-gray-50' : 'bg-blue-50'}`}>
                  {r.date_reunion && (() => {
                    const d = parseISO(r.date_reunion)
                    return isValid(d) ? (
                      <>
                        <span className="text-2xl font-bold text-blue-800 leading-none">
                          {format(d, 'dd')}
                        </span>
                        <span className="text-xs text-blue-600 font-medium capitalize">
                          {format(d, 'MMM', { locale: fr })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(d, 'yyyy')}
                        </span>
                      </>
                    ) : <span className="text-xs text-gray-400">—</span>
                  })()}
                </div>

                {/* Content */}
                <div className="flex-1 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-bold ${r.est_annulee ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {r.titre}
                        </h3>
                        <StatusPill r={r} />
                      </div>
                      {r.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {(r.heure_debut || r.heure_fin) && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {r.heure_debut}{r.heure_fin ? ` – ${r.heure_fin}` : ''}
                      </span>
                    )}
                    {r.lieu && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {r.lieu}
                      </span>
                    )}
                    {r.periode_debut && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Période : {fmtDate(r.periode_debut)} → {fmtDate(r.periode_fin)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions — DG only */}
                {isDG && !r.est_annulee && (
                  <div className="shrink-0 flex flex-col border-l border-gray-100 divide-y divide-gray-100">
                    <button
                      onClick={() => { setEditing(r); setSaveError(''); setShowModal(true) }}
                      className="flex-1 px-4 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setConfirmId(r.reunion_id); setConfirmAction('annuler') }}
                      className="flex-1 px-4 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Annuler la réunion"
                    >
                      <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setConfirmId(r.reunion_id); setConfirmAction('supprimer') }}
                      className="flex-1 px-4 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <FormModal
          initial={editing ? {
            titre:         editing.titre         || '',
            description:   editing.description   || '',
            date_reunion:  editing.date_reunion   || '',
            heure_debut:   editing.heure_debut    || '',
            heure_fin:     editing.heure_fin      || '',
            lieu:          editing.lieu           || '',
            periode_debut: editing.periode_debut  || '',
            periode_fin:   editing.periode_fin    || '',
          } : null}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
          saving={saving}
          error={saveError}
        />
      )}

      {/* Confirm dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center
              ${confirmAction === 'supprimer' ? 'bg-red-100' : 'bg-amber-100'}`}>
              <svg className={`w-6 h-6 ${confirmAction === 'supprimer' ? 'text-red-600' : 'text-amber-600'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              {confirmAction === 'supprimer' ? 'Supprimer la réunion ?' : 'Annuler la réunion ?'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              {confirmAction === 'supprimer'
                ? 'Cette action est irréversible.'
                : 'La réunion sera marquée comme annulée.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmId(null)}
                className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={() => confirmAction === 'supprimer'
                  ? handleDelete(confirmId)
                  : handleAnnuler(confirmId)}
                className={`text-sm px-4 py-2 rounded-lg text-white font-medium
                  ${confirmAction === 'supprimer' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
