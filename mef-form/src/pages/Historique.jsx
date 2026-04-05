import { useState, useEffect, useCallback } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr } from 'date-fns/locale'
import { parseISO, format, isValid } from 'date-fns'
import { fetchAuditLogs } from '../api'
import { useKeycloak } from '../keycloak'

registerLocale('fr', fr)

function toDate(iso) {
  if (!iso) return null
  const d = parseISO(iso)
  return isValid(d) ? d : null
}

function toISO(date) {
  return date ? format(date, 'yyyy-MM-dd') : ''
}

const ACTION_LABELS = { CREATE: 'Création', UPDATE: 'Modification', DELETE: 'Suppression' }
const ACTION_COLORS = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-600',
}
const ENTITY_LABELS = { revue: 'Revue', direction: 'Direction', utilisateur: 'Utilisateur' }

const PAGE_SIZE = 50

function Badge({ value, colorMap, labelMap }) {
  const cls = colorMap[value] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {labelMap[value] || value}
    </span>
  )
}

export default function Historique() {
  const { token } = useKeycloak()

  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [offset, setOffset]     = useState(0)

  const [filterAction,      setFilterAction]      = useState('')
  const [filterEntity,      setFilterEntity]      = useState('')
  const [filterPerformedBy, setFilterPerformedBy] = useState('')
  const [filterFrom,        setFilterFrom]        = useState('')
  const [filterTo,          setFilterTo]          = useState('')

  const load = useCallback(async (off = 0) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAuditLogs({
        action:       filterAction,
        entity_type:  filterEntity,
        performed_by: filterPerformedBy,
        from:         filterFrom,
        to:           filterTo,
        limit:        PAGE_SIZE,
        offset:       off,
      }, token)
      setRows(data.rows)
      setTotal(data.total)
      setOffset(off)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, filterAction, filterEntity, filterPerformedBy, filterFrom, filterTo])

  useEffect(() => { load(0) }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const resetFilters = () => {
    setFilterAction('')
    setFilterEntity('')
    setFilterPerformedBy('')
    setFilterFrom('')
    setFilterTo('')
  }

  const hasFilters = filterAction || filterEntity || filterPerformedBy || filterFrom || filterTo

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-800">Historique des actions</h1>
          <p className="text-xs text-gray-400">{total} entrée{total !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Action</label>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="">Toutes</option>
              <option value="CREATE">Création</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Entité</label>
            <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="">Toutes</option>
              <option value="revue">Revue</option>
              <option value="direction">Direction</option>
              <option value="utilisateur">Utilisateur</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Utilisateur</label>
            <input value={filterPerformedBy} onChange={e => setFilterPerformedBy(e.target.value)}
              placeholder="Nom d'utilisateur…"
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Du</label>
            <DatePicker
              locale="fr"
              dateFormat="dd/MM/yyyy"
              selected={toDate(filterFrom)}
              onChange={date => setFilterFrom(toISO(date))}
              placeholderText="jj/mm/aaaa"
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
              wrapperClassName="w-full"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              isClearable
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Au</label>
            <DatePicker
              locale="fr"
              dateFormat="dd/MM/yyyy"
              selected={toDate(filterTo)}
              onChange={date => setFilterTo(toISO(date))}
              placeholderText="jj/mm/aaaa"
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
              wrapperClassName="w-full"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              isClearable
            />
          </div>
          {hasFilters && (
            <button onClick={resetFilters}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-2 self-end">
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {error && (
          <div className="px-6 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
        )}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-10">Chargement…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Date / Heure</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Action</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Entité</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Libellé</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Effectué par</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden xl:table-cell">Détails</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400 text-xs">Aucune entrée trouvée</td>
                  </tr>
                )}
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={row.action} colorMap={ACTION_COLORS} labelMap={ACTION_LABELS} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs capitalize">
                      {ENTITY_LABELS[row.entity_type] || row.entity_type}
                    </td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={row.entity_label}>
                      {row.entity_label || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">
                      {row.performed_by || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden xl:table-cell max-w-xs truncate">
                      {row.details ? JSON.stringify(row.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Page {currentPage} / {totalPages} — {total} entrée{total !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => load(offset - PAGE_SIZE)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Précédent
              </button>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => load(offset + PAGE_SIZE)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
