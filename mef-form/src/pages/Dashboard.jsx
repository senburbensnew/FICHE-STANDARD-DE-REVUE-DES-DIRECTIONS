import { useEffect, useRef, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  fetchOverview, fetchParMois, fetchEffectifs, fetchDirections,
  fetchConformite, fetchPostesVacants, fetchBesoinFormation,
  fetchActivitesNonRealisees, fetchDifficultesActivites, fetchInfraIndicateurs,
  fetchInsuffisancesHeatmap, fetchContraintes, fetchAppuis, fetchActions,
  fetchLocaux, fetchEquipements,
} from '../api'
import { useKeycloak } from '../keycloak'

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  blue:      '#1d4ed8',
  blueLight: '#93c5fd',
  cyan:      '#0891b2',
  green:     '#16a34a',
  red:       '#dc2626',
  amber:     '#d97706',
  slate:     '#64748b',
  purple:    '#7c3aed',
  teal:      '#0d9488',
  orange:    '#ea580c',
}
const PIE_YES_NO   = { Oui: C.green, Non: C.red }
const PIE_COLORS   = [C.blue, C.cyan, C.green, C.amber, C.purple, C.slate, C.red, C.teal, C.orange]
const STATUT_COLOR = { soumis: C.green, valide: C.blue, brouillon: C.red, 'Sans revue': C.amber }
const STATUT_LABEL = { soumis: 'Soumises', valide: 'Validées', brouillon: 'En retard', 'Sans revue': 'En attente' }

const CY = new Date().getFullYear()
const YEARS     = [CY, CY - 1, CY - 2, CY - 3]
const QUARTERS  = [{ v: '1', l: 'T1 (Jan–Mar)' }, { v: '2', l: 'T2 (Avr–Juin)' }, { v: '3', l: 'T3 (Juil–Sep)' }, { v: '4', l: 'T4 (Oct–Déc)' }]

// ── CSV export utility ─────────────────────────────────────────────────────
function downloadCSV(columns, rows, filename) {
  const esc = v => {
    const s = String(v ?? '').replace(/"/g, '""')
    return /[,\n"]/.test(s) ? `"${s}"` : s
  }
  const lines = [
    columns.map(c => esc(c.label)).join(','),
    ...rows.map(r => columns.map(c => esc(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(',')),
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename })
  a.click()
  URL.revokeObjectURL(a.href)
}

const SHORT_DIR = (s) =>
  (s || '')
    .replace('Direction ', 'Dir. ')
    .replace('Générale', 'Gén.')
    .replace(' et de la ', ' & ')
    .replace("l'Information et de la Communication", 'TIC')

// ── Shared components ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue', badge }) {
  const ring = { blue: 'border-blue-200 bg-blue-50', green: 'border-green-200 bg-green-50', amber: 'border-amber-200 bg-amber-50', red: 'border-red-200 bg-red-50', slate: 'border-slate-200 bg-slate-50' }
  const text = { blue: 'text-blue-800', green: 'text-green-800', amber: 'text-amber-800', red: 'text-red-700', slate: 'text-slate-700' }
  return (
    <div className={`rounded-xl border shadow-sm p-5 flex flex-col gap-1 ${ring[color]}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-extrabold ${text[color]}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
      {badge && <span className={`mt-1 self-start text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>}
    </div>
  )
}

function ChartCard({ title, children, loading, span = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${span}`}>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{title}</h3>
      {loading
        ? <div className="h-48 flex items-center justify-center text-gray-300 text-sm animate-pulse">Chargement…</div>
        : children}
    </div>
  )
}

function SectionHeader({ number, title, description }) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b-2 border-blue-100 mt-2">
      <div className="flex-shrink-0 w-9 h-9 bg-blue-700 text-white rounded-lg flex items-center justify-center text-sm font-extrabold shadow">
        {number}
      </div>
      <div>
        <h2 className="text-base font-extrabold text-gray-800 leading-tight">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

function Empty() {
  return <p className="text-sm text-gray-400 text-center py-10">Aucune donnée disponible</p>
}

function OuiNonPie({ data }) {
  if (!data?.length) return <Empty />
  const total = data.reduce((s, d) => s + d.total, 0)
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="statut" cx="50%" cy="50%" innerRadius={45} outerRadius={72}
          label={({ statut, percent }) => `${statut} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((e) => <Cell key={e.statut} fill={PIE_YES_NO[e.statut] ?? C.slate} />)}
        </Pie>
        <Legend formatter={(v) => `${v} (${data.find(d => d.statut === v)?.total ?? 0} / ${total})`} />
        <Tooltip formatter={(v) => [`${v} fiche(s)`, '']} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function MultiPie({ data, nameKey = 'statut' }) {
  if (!data?.length) return <Empty />
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey={nameKey} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Legend />
        <Tooltip formatter={(v) => [`${v} fiche(s)`, '']} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Tag cloud for constraints (size proportional to frequency)
function TagCloud({ data, textKey = 'contrainte' }) {
  if (!data?.length) return <Empty />
  const max = Math.max(...data.map(d => d.total))
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {data.map((d, i) => {
        const ratio = d.total / max
        const fontSize = `${0.72 + ratio * 0.9}rem`
        const opacity  = 0.55 + ratio * 0.45
        return (
          <span
            key={i}
            style={{ fontSize, opacity }}
            className="inline-block bg-purple-100 text-purple-800 font-semibold px-2 py-1 rounded-full cursor-default hover:opacity-100 transition-opacity"
            title={`${d.total} mention(s)`}
          >
            {d[textKey]}
          </span>
        )
      })}
    </div>
  )
}

// Heat map: rows = directions, columns = insuffisance types
function HeatMap({ data }) {
  if (!data?.length) return <Empty />

  // Top 8 insuffisance types by total mentions
  const totByInsuff = {}
  data.forEach(d => { totByInsuff[d.insuffisance] = (totByInsuff[d.insuffisance] || 0) + d.total })
  const types = Object.keys(totByInsuff).sort((a, b) => totByInsuff[b] - totByInsuff[a]).slice(0, 8)

  // Top 12 directions by number of distinct insuffisances reported
  const totByDir = {}
  data.forEach(d => { totByDir[d.direction] = (totByDir[d.direction] || 0) + d.total })
  const dirs = Object.keys(totByDir).sort((a, b) => totByDir[b] - totByDir[a]).slice(0, 12)

  if (!dirs.length || !types.length) return <Empty />

  const lookup = {}
  data.forEach(d => { lookup[`${d.direction}|||${d.insuffisance}`] = d.total })
  const maxVal = Math.max(...data.map(d => d.total), 1)

  const cellBg = (count) => {
    if (!count) return '#f8fafc'
    const t = Math.min(count / maxVal, 1)
    return `rgba(185, 28, 28, ${0.12 + t * 0.88})`
  }
  const cellTxt = (count) => {
    if (!count) return 'transparent'
    return count / maxVal > 0.45 ? 'white' : '#7f1d1d'
  }

  return (
    <div className="overflow-auto">
      <table className="text-xs min-w-max border-separate" style={{ borderSpacing: '3px' }}>
        <thead>
          <tr>
            <th className="text-left align-bottom pb-2 pr-4 text-gray-400 font-normal min-w-[130px]">Direction</th>
            {types.map(t => (
              <th key={t} className="text-center align-bottom pb-2 px-0.5 min-w-[56px]">
                <div
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 90, fontSize: '0.65rem', overflow: 'hidden' }}
                  className="font-semibold text-gray-600 mx-auto"
                  title={t}
                >
                  {t.length > 20 ? t.slice(0, 20) + '…' : t}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dirs.map(dir => (
            <tr key={dir}>
              <td className="pr-4 py-0.5 text-gray-700 font-medium whitespace-nowrap">{SHORT_DIR(dir)}</td>
              {types.map(t => {
                const count = lookup[`${dir}|||${t}`] || 0
                return (
                  <td key={t} className="py-0.5 text-center">
                    <div
                      className="w-12 h-7 rounded flex items-center justify-center font-bold mx-auto"
                      style={{ backgroundColor: cellBg(count), color: cellTxt(count), fontSize: '0.65rem' }}
                      title={`${dir} — ${t}: ${count || 'aucune'} mention(s)`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <span>Faible</span>
        <div className="flex gap-1">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
            <div key={i} className="w-6 h-4 rounded-sm" style={{ backgroundColor: `rgba(185, 28, 28, ${0.12 + v * 0.88})` }} />
          ))}
        </div>
        <span>Élevé</span>
        <span className="ml-3 text-gray-300">|</span>
        <div className="w-6 h-4 rounded-sm bg-slate-100 border border-slate-200" />
        <span>Aucune mention</span>
      </div>
    </div>
  )
}

// Appuis cards grouped by category
function AppuisCards({ data }) {
  if (!data?.length) return <Empty />
  const categories = [
    { key: 'administratifs', label: 'Administratifs',      color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { key: 'logistiques',    label: 'Logistiques',         color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { key: 'rh',             label: 'Ressources humaines', color: 'bg-green-50 border-green-200 text-green-800' },
    { key: 'numerique',      label: 'Numérique',           color: 'bg-purple-50 border-purple-200 text-purple-800' },
    { key: 'decisions',      label: 'Décisions souhaitées', color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {categories.map(({ key, label, color }) => {
        const entries = data.filter(d => d[key] && d[key].trim())
        if (!entries.length) return null
        return (
          <div key={key} className={`rounded-lg border p-3 ${color}`}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2">{label}</p>
            <ul className="space-y-1.5">
              {entries.map((e, i) => (
                <li key={i} className="text-xs leading-snug">
                  <span className="font-semibold">{SHORT_DIR(e.direction)} :</span>{' '}
                  {e[key]}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

// Export dropdown menu
function ExportMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="relative print:hidden" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm font-semibold bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exporter
        <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white shadow-xl rounded-xl border border-gray-200 z-30 min-w-56 py-1 overflow-hidden">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${item.divider ? 'border-t border-gray-100 mt-1 pt-3' : ''}`}
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span className={item.primary ? 'font-semibold text-gray-800' : 'text-gray-600'}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// FilterSelect — petit composant réutilisable pour les selects du header
function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {children}
      </select>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { token } = useKeycloak()
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Section 1
  const [overview, setOverview]     = useState(null)
  const [conformite, setConformite] = useState(null)
  const [parMois, setParMois]       = useState([])

  // Section 2
  const [effectifs, setEffectifs]             = useState([])
  const [besoinFormation, setBesoinFormation] = useState([])
  const [postesVacants, setPostesVacants]     = useState([])

  // Section 3
  const [activitesNR, setActivitesNR]       = useState([])
  const [difficultesAct, setDifficultesAct] = useState([])

  // Section 4
  const [infraIndicateurs, setInfraIndicateurs]   = useState([])
  const [insHeatmap, setInsHeatmap]               = useState([])
  const [locaux, setLocaux]                       = useState([])
  const [equipements, setEquipements]             = useState({ internet: [], electricite: [] })

  // Section 5
  const [contraintes, setContraintes] = useState([])
  const [appuis, setAppuis]           = useState([])

  // Section 6
  const [actions, setActions] = useState([])

  // Filters
  const [directions, setDirections]   = useState([])
  const [selectedDir, setSelectedDir] = useState('')
  const [selectedAnnee, setSelectedAnnee] = useState('')
  const [selectedTrim, setSelectedTrim]   = useState('')

  useEffect(() => {
    fetchDirections()
      .then(data => setDirections(data.map(d => d.nom_direction).sort()))
      .catch(() => {})
  }, [])

  // Reset trimestre if année is cleared
  useEffect(() => {
    if (!selectedAnnee) setSelectedTrim('')
  }, [selectedAnnee])

  useEffect(() => {
    setLoading(true)
    const f = {
      dir:   selectedDir   || null,
      annee: selectedAnnee || null,
      trim:  selectedTrim  || null,
    }
    Promise.all([
      fetchOverview(token, f),
      fetchConformite(token, f),
      fetchParMois(token, f),
      fetchEffectifs(token, f),
      fetchBesoinFormation(token, f),
      fetchPostesVacants(token, f),
      fetchActivitesNonRealisees(token, f),
      fetchDifficultesActivites(token, f),
      fetchInfraIndicateurs(token, f),
      fetchInsuffisancesHeatmap(token, f),
      fetchLocaux(token, f),
      fetchEquipements(token, f),
      fetchContraintes(token, f),
      fetchAppuis(token, f),
      fetchActions(token, f),
    ])
      .then(([ov, conf, mois, eff, bf, pv, anr, da, ii, hm, loc, eq, cnt, app, act]) => {
        setOverview(ov)
        setConformite(conf)
        setParMois(mois)
        setEffectifs(eff)
        setBesoinFormation(bf)
        setPostesVacants(pv)
        setActivitesNR(anr)
        setDifficultesAct(da)
        setInfraIndicateurs(ii)
        setInsHeatmap(hm)
        setLocaux(loc)
        setEquipements(eq)
        setContraintes(cnt)
        setAppuis(app)
        setActions(act)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, selectedDir, selectedAnnee, selectedTrim])

  const tauxConformite = conformite
    ? Math.round((conformite.avecRevue / (conformite.totalDirections || 1)) * 100)
    : null

  // Conformité chart data: statuts from DB + synthetic "Sans revue" bar
  const parStatutFull = conformite ? [
    ...conformite.parStatut.map(d => ({
      label: STATUT_LABEL[d.statut] ?? d.statut.charAt(0).toUpperCase() + d.statut.slice(1),
      total: d.total,
      _statut: d.statut,
    })),
    ...(conformite.sansRevue > 0 ? [{
      label: 'En attente',
      total: conformite.sansRevue,
      _statut: 'Sans revue',
    }] : []),
  ] : []

  const hasActiveFilter = selectedDir || selectedAnnee

  const suffix = [selectedAnnee, selectedTrim ? `T${selectedTrim}` : '', selectedDir ? selectedDir.slice(0, 10) : '']
    .filter(Boolean).join('_') || 'tout'

  const exportItems = [
    {
      label: 'Imprimer / Exporter PDF',
      icon: '🖨',
      primary: true,
      action: () => window.print(),
    },
    {
      label: 'Conformité — statuts (CSV)',
      icon: '📊',
      divider: true,
      action: () => downloadCSV(
        [{ label: 'Statut', key: 'label' }, { label: 'Total', key: 'total' }],
        parStatutFull,
        `conformite_${suffix}.csv`
      ),
    },
    {
      label: 'Effectifs par direction (CSV)',
      icon: '👥',
      action: () => downloadCSV(
        [
          { label: 'Direction', key: 'direction' },
          { label: 'Effectif théorique', key: 'theorique' },
          { label: 'Effectif disponible', key: 'disponible' },
          { label: 'Écart', value: r => r.theorique - r.disponible },
        ],
        effectifs,
        `effectifs_${suffix}.csv`
      ),
    },
    {
      label: 'Postes vacants (CSV)',
      icon: '🏢',
      action: () => downloadCSV(
        [{ label: 'Direction', key: 'direction' }, { label: 'Postes vacants', key: 'postesVacants' }],
        postesVacants,
        `postes_vacants_${suffix}.csv`
      ),
    },
    {
      label: 'Activités non réalisées (CSV)',
      icon: '📉',
      action: () => downloadCSV(
        [{ label: 'Direction', key: 'direction' }, { label: 'Nb activités', key: 'total' }],
        activitesNR,
        `activites_non_realisees_${suffix}.csv`
      ),
    },
    {
      label: 'Contraintes majeures (CSV)',
      icon: '⚠️',
      action: () => downloadCSV(
        [{ label: 'Contrainte', key: 'contrainte' }, { label: 'Fréquence', key: 'total' }],
        contraintes,
        `contraintes_${suffix}.csv`
      ),
    },
    {
      label: 'Actions & mesures DG/Ministre (CSV)',
      icon: '📋',
      action: () => downloadCSV(
        [
          { label: 'Direction', key: 'direction' },
          { label: 'Date réunion', value: r => r.dateReunion ? new Date(r.dateReunion).toLocaleDateString('fr-FR') : '' },
          { label: 'Mesures — DG', key: 'mesuresDG' },
          { label: 'Mesures — Ministre', key: 'mesuresMinistre' },
        ],
        actions,
        `actions_mesures_${suffix}.csv`
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          aside, nav, .print\\:hidden { display: none !important; }
          header { position: static !important; box-shadow: none !important; border-bottom: 1px solid #e5e7eb !important; }
          body { background: white !important; }
          .bg-gray-50 { background: white !important; }
          section { page-break-inside: avoid; }
        }
      `}</style>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">MEF — Direction Générale</p>
            <h1 className="text-xl font-extrabold text-gray-900">Tableau de bord analytique</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap print:hidden">
            {/* Direction filter */}
            <FilterSelect id="dir-filter" label="Direction" value={selectedDir} onChange={setSelectedDir}>
              <option value="">Toutes les directions</option>
              {directions.map(nom => (
                <option key={nom} value={nom}>{nom}</option>
              ))}
            </FilterSelect>

            {/* Année filter */}
            <FilterSelect id="annee-filter" label="Année" value={selectedAnnee} onChange={setSelectedAnnee}>
              <option value="">Toutes les années</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </FilterSelect>

            {/* Trimestre filter (only when année selected) */}
            {selectedAnnee && (
              <FilterSelect id="trim-filter" label="Trimestre" value={selectedTrim} onChange={setSelectedTrim}>
                <option value="">Tous les trimestres</option>
                {QUARTERS.map(q => <option key={q.v} value={q.v}>{q.l}</option>)}
              </FilterSelect>
            )}

            {hasActiveFilter && (
              <button
                onClick={() => { setSelectedDir(''); setSelectedAnnee(''); setSelectedTrim('') }}
                className="text-xs text-gray-400 hover:text-red-500 transition font-semibold border border-gray-200 rounded px-2 py-1"
                title="Effacer tous les filtres"
              >
                ✕ Réinitialiser
              </button>
            )}

            <ExportMenu items={exportItems} />
          </div>
        </div>

        {hasActiveFilter && (
          <div className="max-w-7xl mx-auto px-4 pb-2 flex flex-wrap gap-2">
            {selectedDir && (
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                Direction : {selectedDir}
              </span>
            )}
            {selectedAnnee && (
              <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
                Année : {selectedAnnee}
                {selectedTrim && ` — ${QUARTERS.find(q => q.v === selectedTrim)?.l}`}
              </span>
            )}
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            Erreur de chargement : {error}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — Vue d'ensemble et conformité des soumissions
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <SectionHeader
            number="1"
            title="Vue d'ensemble et conformité des soumissions"
            description="Nombre de revues soumises, statut par direction, évolution mensuelle"
          />

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total des revues"
              value={overview?.total}
              sub="dans la sélection"
              color="blue"
            />
            <StatCard
              label="Directions ayant soumis"
              value={conformite ? `${conformite.avecRevue} / ${conformite.totalDirections}` : null}
              sub={tauxConformite != null ? `${tauxConformite}% de conformité` : undefined}
              color="green"
              badge={tauxConformite != null
                ? { text: `${tauxConformite}%`, cls: tauxConformite >= 80 ? 'bg-green-200 text-green-900' : tauxConformite >= 50 ? 'bg-amber-200 text-amber-900' : 'bg-red-200 text-red-900' }
                : undefined}
            />
            <StatCard
              label="Sans revue soumise"
              value={conformite?.sansRevue}
              sub="directions en attente"
              color={conformite?.sansRevue > 0 ? 'red' : 'green'}
            />
            <StatCard
              label="Taux disponibilité RH"
              value={overview?.tauxRH != null ? `${overview.tauxRH}%` : null}
              sub="disponible / en poste"
              color="amber"
            />
          </div>

          {/* Statut des soumissions (Soumises / Validées / Brouillons / Sans revue) + évolution mensuelle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Statut des soumissions" loading={loading}>
              {parStatutFull.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={parStatutFull} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} revue(s) / direction(s)`, 'Total']} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {parStatutFull.map((d, i) => (
                        <Cell key={i} fill={STATUT_COLOR[d._statut] ?? C.slate} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            <ChartCard title="Soumissions par mois (12 derniers mois)" loading={loading}>
              {parMois.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={parMois} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} revue(s)`, 'Soumissions']} />
                    <Line type="monotone" dataKey="total" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 4, fill: C.cyan }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — Vue d'ensemble des ressources humaines
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <SectionHeader
            number="2"
            title="Ressources humaines"
            description="Écart effectifs théorique / disponible, top 5 besoins en formation, postes vacants"
          />

          <ChartCard title="Effectif théorique vs réellement disponible par direction" loading={loading}>
            {effectifs.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={effectifs.map(d => ({ ...d, dir: SHORT_DIR(d.direction) }))}
                  margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="dir" tick={{ fontSize: 10, angle: -40, textAnchor: 'end' }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(l) => effectifs.find(d => SHORT_DIR(d.direction) === l)?.direction ?? l}
                    formatter={(v, n) => [`${v} agents`, n === 'theorique' ? 'Théorique' : 'Disponible']}
                  />
                  <Legend formatter={(v) => v === 'theorique' ? 'Effectif théorique' : 'Effectif disponible'} />
                  <Bar dataKey="theorique"  fill={C.blueLight} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="disponible" fill={C.blue}      radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Top 5 besoins en formation" loading={loading}>
              {besoinFormation.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={besoinFormation}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 180, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="besoin" tick={{ fontSize: 10 }} width={180} />
                    <Tooltip formatter={(v) => [`${v} mention(s)`, 'Fréquence']} />
                    <Bar dataKey="total" fill={C.teal} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            <ChartCard title="Postes vacants par direction" loading={loading}>
              {postesVacants.length ? (
                <div className="overflow-auto max-h-56">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                        <th className="text-left py-1.5 pr-4 font-semibold">Direction</th>
                        <th className="text-right py-1.5 font-semibold">Postes vacants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {postesVacants.map((d, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-1.5 pr-4 text-gray-700">{d.direction}</td>
                          <td className="py-1.5 text-right font-bold text-red-600">{d.postesVacants}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-green-600 text-center py-10 font-medium">Aucun poste vacant signalé</p>
              )}
            </ChartCard>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — Suivi des activités et des performances
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <SectionHeader
            number="3"
            title="Suivi des activités et des performances"
            description="Activités non réalisées par direction, fréquence des difficultés signalées"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Activités non réalisées ou partiellement réalisées — par direction (top 10)" loading={loading}>
              {activitesNR.length ? (
                <div className="overflow-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                        <th className="text-left py-2 px-3 font-semibold">Direction</th>
                        <th className="text-right py-2 px-3 font-semibold">Activités concernées</th>
                        <th className="py-2 px-3 font-semibold w-32">Niveau</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activitesNR.map((d, i) => {
                        const max = activitesNR[0]?.total || 1
                        const pct = Math.round((d.total / max) * 100)
                        return (
                          <tr key={i} className="border-b border-gray-50 hover:bg-red-50/40">
                            <td className="py-2 px-3 text-gray-700 text-xs" title={d.direction}>{d.direction}</td>
                            <td className="py-2 px-3 text-right font-bold text-red-600 text-xs">{d.total}</td>
                            <td className="py-2 px-3">
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-green-600 text-center py-10 font-medium">Aucune activité non réalisée signalée</p>
              )}
            </ChartCard>

            <ChartCard title="Difficultés affectant l'exécution des activités" loading={loading}>
              {difficultesAct.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={difficultesAct}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="difficulte" tick={{ fontSize: 10 }} width={200} />
                    <Tooltip formatter={(v) => [`${v} mention(s)`, 'Fréquence']} />
                    <Bar dataKey="total" fill={C.orange} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4 — État des infrastructures et de la logistique
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <SectionHeader
            number="4"
            title="État des infrastructures et de la logistique"
            description="Indicateurs clés d'infrastructure, carte de chaleur des insuffisances signalées par direction"
          />

          {/* Infra indicators horizontal bar */}
          <ChartCard title="% de directions répondant favorablement aux indicateurs clés" loading={loading}>
            {infraIndicateurs.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={infraIndicateurs}
                  layout="vertical"
                  margin={{ top: 5, right: 60, left: 160, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="indicateur" tick={{ fontSize: 11 }} width={160} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Taux favorable']} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                    {infraIndicateurs.map((d, i) => (
                      <Cell key={i} fill={d.pct >= 70 ? C.green : d.pct >= 40 ? C.amber : C.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>

          {/* Heat map insuffisances */}
          <ChartCard title="Carte de chaleur — Insuffisances matérielles et logistiques par direction" loading={loading}>
            <HeatMap data={insHeatmap} />
          </ChartCard>

          {/* Pies: locaux, internet, électricité */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ChartCard title="Locaux adaptés ?" loading={loading}>
              <OuiNonPie data={locaux} />
            </ChartCard>
            <ChartCard title="Qualité internet" loading={loading}>
              <MultiPie data={equipements.internet} />
            </ChartCard>
            <ChartCard title="Électricité" loading={loading}>
              <MultiPie data={equipements.electricite} />
            </ChartCard>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5 — Matrice des contraintes et des appuis
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <SectionHeader
            number="5"
            title="Contraintes et appuis sollicités"
            description="Contraintes majeures les plus fréquentes (Sect. IX), appuis attendus par catégorie (Sect. XII)"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Contraintes majeures les plus fréquemment citées" loading={loading}>
              <TagCloud data={contraintes} textKey="contrainte" />
            </ChartCard>

            <ChartCard title="Fréquence des contraintes (top 10)" loading={loading}>
              {contraintes.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={contraintes.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="contrainte" tick={{ fontSize: 10 }} width={200} />
                    <Tooltip formatter={(v) => [`${v} direction(s)`, 'Fréquence']} />
                    <Bar dataKey="total" fill={C.purple} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>

          <ChartCard title="Appuis et décisions sollicités — par catégorie" loading={loading}>
            <AppuisCards data={appuis} />
          </ChartCard>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 6 — Suivi des actions et des décisions
        ══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <SectionHeader
            number="6"
            title="Suivi des actions et des décisions"
            description="Journal chronologique des mesures nécessitant l'intervention de la DG ou un arbitrage du Ministre (Sect. XI)"
          />

          <ChartCard title="Journal des mesures — DG et Ministre" loading={loading}>
            {actions.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3 font-semibold w-40">Direction</th>
                      <th className="text-left py-2 px-3 font-semibold w-24">Date réunion</th>
                      <th className="text-left py-2 px-3 font-semibold">Mesures — Direction Générale</th>
                      <th className="text-left py-2 px-3 font-semibold">Mesures — Arbitrage Ministre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((a, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 align-top">
                        <td className="py-2 px-3 font-medium text-gray-800 text-xs">{a.direction}</td>
                        <td className="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">
                          {a.dateReunion ? new Date(a.dateReunion).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="py-2 px-3 text-gray-700 text-xs max-w-xs">
                          {a.mesuresDG || <span className="text-gray-300 italic">—</span>}
                        </td>
                        <td className="py-2 px-3 text-xs max-w-xs">
                          {a.mesuresMinistre
                            ? <span className="text-amber-800 font-medium">{a.mesuresMinistre}</span>
                            : <span className="text-gray-300 italic">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">Aucune mesure DG ou Ministre enregistrée</p>
            )}
          </ChartCard>
        </section>
      </div>

      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-gray-400">
          <span className="font-semibold text-gray-500">Contact administrateur</span>
          <a href="mailto:admin.revue@finances.gov.mg" className="flex items-center gap-1 hover:text-blue-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            admin.revue@finances.gov.mg
          </a>
          <a href="tel:+261200000000" className="flex items-center gap-1 hover:text-blue-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            +261 20 00 000 00
          </a>
          <span className="text-gray-300">|</span>
          <span>MEF — Direction Générale &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
