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

const CLOUD_PALETTE = [
  '#7c3aed', '#2563eb', '#059669', '#b45309',
  '#0891b2', '#be123c', '#0d9488', '#7c2d12',
  '#1e40af', '#065f46', '#6d28d9', '#92400e',
]

const CY = new Date().getFullYear()
const CM_PAD = String(new Date().getMonth() + 1).padStart(2, '0') // "01"–"12"
const YEARS  = [CY, CY - 1, CY - 2, CY - 3]
const MONTHS = [
  { v: '01', l: 'Janvier' },  { v: '02', l: 'Février' },   { v: '03', l: 'Mars' },
  { v: '04', l: 'Avril' },    { v: '05', l: 'Mai' },        { v: '06', l: 'Juin' },
  { v: '07', l: 'Juillet' },  { v: '08', l: 'Août' },       { v: '09', l: 'Septembre' },
  { v: '10', l: 'Octobre' },  { v: '11', l: 'Novembre' },   { v: '12', l: 'Décembre' },
]
// Valeurs par défaut : du 1er janvier au mois en cours
const DEFAULT_DEBUT = `${CY}-01`
const DEFAULT_FIN   = `${CY}-${CM_PAD}`

// Formate "YYYY-MM" → "Janvier 2026"
function fmtPeriode(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  return `${MONTHS.find(mo => mo.v === m)?.l ?? m} ${y}`
}

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

// Tag cloud CSS — garantit l'affichage de TOUS les mots (react-d3-cloud abandonne les mots qui ne tiennent pas)
function ContraintesCloud({ data }) {
  if (!data?.length) return <Empty />

  const maxVal = Math.max(...data.map(d => d.total))
  const minVal = Math.min(...data.map(d => d.total))

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-3 px-4 py-4 justify-center items-baseline">
      {data.map((d, i) => {
        const t    = maxVal === minVal ? 0.5 : Math.sqrt((d.total - minVal) / (maxVal - minVal))
        const size = Math.round(12 + t * 30) // 12 px (rare) → 42 px (très fréquent)
        const color = CLOUD_PALETTE[i % CLOUD_PALETTE.length]
        return (
          <span
            key={d.contrainte}
            title={`${d.contrainte} — cité ${d.total} fois`}
            style={{ fontSize: size, color, fontWeight: 700, lineHeight: 1.3, cursor: 'default' }}
          >
            {d.contrainte}
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

// FilterSelect — select simple pour la direction
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

// MonthYearSelect — sélecteur mois + année (valeur "YYYY-MM" ou "")
function MonthYearSelect({ label, value, onChange }) {
  const [selYear, selMonth] = value ? value.split('-') : ['', '']
  const update = (y, m) => onChange(y && m ? `${y}-${m}` : '')
  const sel = 'text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300'
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap shrink-0">
        {label}
      </label>
      <select value={selMonth || ''} onChange={e => update(selYear || String(CY), e.target.value)} className={`${sel} w-32`}>
        <option value="">Mois…</option>
        {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
      </select>
      <select value={selYear || ''} onChange={e => update(e.target.value, selMonth || '')} className={`${sel} w-20`}>
        <option value="">Année…</option>
        {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
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

  // Filters — default to January → current month of current year
  const [directions, setDirections]   = useState([])
  const [selectedDir,   setSelectedDir]   = useState('')
  const [selectedDebut, setSelectedDebut] = useState(DEFAULT_DEBUT)
  const [selectedFin,   setSelectedFin]   = useState(DEFAULT_FIN)

  useEffect(() => {
    fetchDirections()
      .then(data => setDirections(data.map(d => d.nom_direction).sort()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const f = {
      dir:   selectedDir   || null,
      debut: selectedDebut || null,
      fin:   selectedFin   || null,
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
  }, [token, selectedDir, selectedDebut, selectedFin])

  const tauxConformite = conformite
    ? Math.round((conformite.avecRevue / (conformite.totalDirections || 1)) * 100)
    : null

  // Conformité chart: group soumis+valide → "Soumises", brouillon → "En retard", sansRevue → "En attente"
  const parStatutFull = conformite ? (() => {
    const soumisTotal = conformite.parStatut
      .filter(d => d.statut === 'soumis' || d.statut === 'valide')
      .reduce((s, d) => s + d.total, 0)
    const retardTotal = conformite.parStatut
      .filter(d => d.statut === 'brouillon')
      .reduce((s, d) => s + d.total, 0)
    return [
      ...(soumisTotal > 0  ? [{ label: 'Soumises',   total: soumisTotal,               _statut: 'soumis'     }] : []),
      ...(retardTotal > 0  ? [{ label: 'En retard',  total: retardTotal,               _statut: 'brouillon'  }] : []),
      ...(conformite.sansRevue > 0 ? [{ label: 'En attente', total: conformite.sansRevue, _statut: 'Sans revue' }] : []),
    ]
  })() : []

  const hasActiveFilter = selectedDir || selectedDebut || selectedFin

  const suffix = [
    selectedDebut ? selectedDebut.replace('-', '_') : '',
    selectedFin   ? selectedFin.replace('-', '_')   : '',
    selectedDir   ? selectedDir.slice(0, 10)        : '',
  ].filter(Boolean).join('_') || 'tout'

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

            {/* Période couverte — début */}
            <MonthYearSelect
              label="Du"
              value={selectedDebut}
              onChange={v => { setSelectedDebut(v); if (v && selectedFin && v > selectedFin) setSelectedFin(v) }}
            />
            {/* Période couverte — fin */}
            <MonthYearSelect
              label="Au"
              value={selectedFin}
              onChange={v => { setSelectedFin(v); if (v && selectedDebut && v < selectedDebut) setSelectedDebut(v) }}
            />

            <button
              onClick={() => { setSelectedDir(''); setSelectedDebut(DEFAULT_DEBUT); setSelectedFin(DEFAULT_FIN) }}
              className="text-xs text-gray-400 hover:text-blue-600 transition font-semibold border border-gray-200 rounded px-2 py-1"
              title="Revenir à la période en cours"
            >
              ↺ Période actuelle
            </button>

            <ExportMenu items={exportItems} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-2 flex flex-wrap gap-2">
          {selectedDir && (
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              Direction : {selectedDir}
              <button onClick={() => setSelectedDir('')} className="ml-1 opacity-60 hover:opacity-100">✕</button>
            </span>
          )}
          {(selectedDebut || selectedFin) && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
              Période :&nbsp;
              {selectedDebut && selectedFin
                ? `${fmtPeriode(selectedDebut)} → ${fmtPeriode(selectedFin)}`
                : selectedDebut
                  ? `à partir de ${fmtPeriode(selectedDebut)}`
                  : `jusqu'à ${fmtPeriode(selectedFin)}`}
              <button onClick={() => { setSelectedDebut(DEFAULT_DEBUT); setSelectedFin(DEFAULT_FIN) }} className="ml-1 opacity-60 hover:opacity-100">✕</button>
            </span>
          )}
        </div>
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
            description={`Revues soumises par rapport au nombre total de directions${selectedDebut || selectedFin ? ` — ${selectedDebut && selectedFin ? `${fmtPeriode(selectedDebut)} → ${fmtPeriode(selectedFin)}` : selectedDebut ? `à partir de ${fmtPeriode(selectedDebut)}` : `jusqu'à ${fmtPeriode(selectedFin)}`}` : ''}`}
          />

          {/* Conformité prominente + KPI cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Indicateur principal : ratio soumissions / directions */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Taux de conformité</p>
              {loading ? (
                <div className="h-20 animate-pulse bg-gray-100 rounded-lg" />
              ) : conformite ? (
                <>
                  <div className="flex items-end gap-2">
                    <span className={`text-5xl font-extrabold leading-none ${tauxConformite >= 80 ? 'text-green-700' : tauxConformite >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {tauxConformite}%
                    </span>
                    <span className="text-sm text-gray-500 pb-1">
                      {conformite.avecRevue} / {conformite.totalDirections} directions
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${tauxConformite >= 80 ? 'bg-green-500' : tauxConformite >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${tauxConformite}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      {conformite.avecRevue} soumises
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      {conformite.sansRevue} en attente
                    </span>
                  </div>
                </>
              ) : <Empty />}
            </div>

            {/* KPI secondaires */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total des revues"
                value={overview?.total}
                sub="dans la sélection"
                color="blue"
              />
              <StatCard
                label="Directions actives"
                value={overview?.directionsActives}
                sub="ayant soumis"
                color="green"
              />
              <StatCard
                label="Sans revue"
                value={conformite?.sansRevue}
                sub="directions en attente"
                color={conformite?.sansRevue > 0 ? 'red' : 'green'}
              />
              <StatCard
                label="Soumises ce mois"
                value={overview?.ceMois}
                sub="nouvelles soumissions"
                color="slate"
              />
              <StatCard
                label="Taux disponibilité RH"
                value={overview?.tauxRH != null ? `${overview.tauxRH}%` : null}
                sub="disponible / en poste"
                color="amber"
              />
            </div>
          </div>

          {/* Diagramme à barres : statuts (Soumises / En retard / En attente) + courbe de tendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title={`Statut des soumissions${selectedDebut || selectedFin ? ` — ${selectedDebut && selectedFin ? `${fmtPeriode(selectedDebut)} → ${fmtPeriode(selectedFin)}` : selectedDebut ? `à partir de ${fmtPeriode(selectedDebut)}` : `jusqu'à ${fmtPeriode(selectedFin)}`}` : ''}`}
              loading={loading}
            >
              {parStatutFull.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={parStatutFull} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 13, fontWeight: 600 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v, _, { payload }) => [`${v} direction(s)`, payload._statut === 'soumis' ? 'Soumises / Validées' : payload.label]}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={80}
                      label={{ position: 'top', fontSize: 14, fontWeight: 700, fill: '#374151' }}>
                      {parStatutFull.map((d, i) => (
                        <Cell key={i} fill={STATUT_COLOR[d._statut] ?? C.slate} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <p className="text-sm text-gray-400">Aucune donnée pour cette période</p>
                  <p className="text-xs text-gray-300">Essayez de modifier le filtre "Période couverte"</p>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Tendance des soumissions (12 derniers mois)" loading={loading}>
              {parMois.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={parMois} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} revue(s)`, 'Soumissions']} />
                    <Line type="monotone" dataKey="total" stroke={C.cyan} strokeWidth={2.5}
                      dot={{ r: 4, fill: C.cyan }} activeDot={{ r: 6 }} />
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
            description="Analyse des écarts d'effectifs par direction, besoins prioritaires en formation, postes vacants"
          />

          {/* Graphique 1 — Analyse de l'écart : théorique / disponible / écart */}
          <ChartCard title="Analyse de l'écart de personnel — Effectif théorique vs réellement disponible" loading={loading}>
            {effectifs.length ? (() => {
              const data = effectifs.map(d => ({
                dir:        SHORT_DIR(d.direction),
                fullDir:    d.direction,
                theorique:  d.theorique,
                disponible: d.disponible,
                ecart:      Math.max(0, d.theorique - d.disponible),
                taux:       d.theorique > 0 ? Math.round(d.disponible * 100 / d.theorique) : 0,
              }))
              const maxEcart = Math.max(...data.map(d => d.ecart), 1)
              return (
                <div className="space-y-3">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 90 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="dir" tick={{ fontSize: 10, angle: -40, textAnchor: 'end' }} interval={0} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: 'Agents', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        labelFormatter={(l, p) => p?.[0]?.payload?.fullDir ?? l}
                        formatter={(v, name) => {
                          if (name === 'theorique')  return [`${v} agents`, 'Effectif théorique']
                          if (name === 'disponible') return [`${v} agents`, 'Effectif disponible']
                          if (name === 'ecart')      return [`${v} agents`, 'Écart (manquants)']
                          return [v, name]
                        }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0]?.payload
                          return (
                            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs space-y-1 min-w-[180px]">
                              <p className="font-bold text-gray-800 text-sm mb-2">{d?.fullDir}</p>
                              <div className="flex justify-between gap-4"><span className="text-blue-400">Théorique</span><span className="font-bold">{d?.theorique} agents</span></div>
                              <div className="flex justify-between gap-4"><span className="text-blue-700">Disponible</span><span className="font-bold">{d?.disponible} agents</span></div>
                              <div className="flex justify-between gap-4"><span className="text-red-500">Écart</span><span className="font-bold text-red-600">−{d?.ecart} agents</span></div>
                              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
                                <span className="text-gray-500">Taux de couverture</span>
                                <span className={`font-extrabold ${d?.taux >= 90 ? 'text-green-600' : d?.taux >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{d?.taux}%</span>
                              </div>
                            </div>
                          )
                        }}
                      />
                      <Legend
                        formatter={(v) => v === 'theorique' ? 'Effectif théorique' : v === 'disponible' ? 'Effectif disponible' : 'Écart (postes manquants)'}
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      />
                      <Bar dataKey="theorique"  fill={C.blueLight} radius={[3, 3, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="disponible" fill={C.blue}      radius={[3, 3, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="ecart"      fill={C.red}       radius={[3, 3, 0, 0]} maxBarSize={28} opacity={0.75} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Taux de couverture par direction — mini indicateurs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                    {data.sort((a, b) => a.taux - b.taux).map((d, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500 truncate" title={d.fullDir}>{SHORT_DIR(d.fullDir)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${d.taux >= 90 ? 'bg-green-500' : d.taux >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(d.taux, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${d.taux >= 90 ? 'text-green-600' : d.taux >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                            {d.taux}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })() : <Empty />}
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Graphique 2 — Top 5 besoins prioritaires en formation */}
            <ChartCard title="Top 5 besoins prioritaires en formation" loading={loading}>
              {besoinFormation.length ? (
                <div className="space-y-2.5 py-1">
                  {besoinFormation.map((d, i) => {
                    const max   = besoinFormation[0]?.total || 1
                    const pct   = Math.round(d.total * 100 / max)
                    const RANK_COLORS = ['bg-amber-500', 'bg-blue-500', 'bg-teal-500', 'bg-purple-500', 'bg-slate-400']
                    return (
                      <div key={i} className="group">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${RANK_COLORS[i] ?? 'bg-slate-400'}`}>
                            {i + 1}
                          </span>
                          <p className="text-xs text-gray-700 font-medium flex-1 truncate" title={d.besoin_formation ?? d.besoin}>
                            {d.besoin_formation ?? d.besoin}
                          </p>
                          <span className="text-xs font-bold text-gray-500 shrink-0">{d.total}</span>
                        </div>
                        <div className="ml-8 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${RANK_COLORS[i] ?? 'bg-slate-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <Empty />}
            </ChartCard>

            {/* Liste — Postes vacants par structure */}
            <ChartCard title="Postes vacants par structure" loading={loading}>
              {postesVacants.length ? (() => {
                const maxV = Math.max(...postesVacants.map(d => d.postesVacants), 1)
                const total = postesVacants.reduce((s, d) => s + d.postesVacants, 0)
                return (
                  <div className="flex flex-col gap-0">
                    <div className="overflow-auto" style={{ maxHeight: 260 }}>
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                            <th className="text-left py-2 pr-3 font-semibold">Structure</th>
                            <th className="py-2 font-semibold w-32">Occupation</th>
                            <th className="text-right py-2 font-semibold">Vacants</th>
                          </tr>
                        </thead>
                        <tbody>
                          {postesVacants.map((d, i) => {
                            const sev = d.postesVacants / maxV
                            const color = sev > 0.66 ? 'bg-red-500'  : sev > 0.33 ? 'bg-amber-400' : 'bg-yellow-300'
                            const badge = sev > 0.66 ? 'bg-red-100 text-red-700' : sev > 0.33 ? 'bg-amber-100 text-amber-700' : 'bg-yellow-50 text-yellow-700'
                            return (
                              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-2 pr-3 text-gray-700 text-xs">{d.direction}</td>
                                <td className="py-2 pr-2">
                                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden w-full">
                                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.round(sev * 100)}%` }} />
                                  </div>
                                </td>
                                <td className="py-2 text-right">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>
                                    {d.postesVacants}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-1">
                      <span className="text-xs text-gray-400">{postesVacants.length} structure{postesVacants.length > 1 ? 's' : ''} concernée{postesVacants.length > 1 ? 's' : ''}</span>
                      <span className="text-sm font-extrabold text-red-600">{total} poste{total > 1 ? 's' : ''} vacant{total > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )
              })() : (
                <div className="flex flex-col items-center justify-center py-10 gap-1">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-green-600 font-semibold">Aucun poste vacant signalé</p>
                </div>
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
              <ContraintesCloud data={contraintes} />
            </ChartCard>

            <ChartCard title="Top 10 — Fréquence des contraintes" loading={loading}>
              {contraintes.length ? (
                <div className="space-y-2.5 py-1">
                  {contraintes.slice(0, 10).map((d, i) => {
                    const max   = contraintes[0]?.total || 1
                    const pct   = Math.round((d.total / max) * 100)
                    const color = CLOUD_PALETTE[i % CLOUD_PALETTE.length]
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <span
                          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold shadow-sm"
                          style={{ backgroundColor: color }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2 mb-1">
                            <span className="text-xs text-gray-700 font-medium leading-snug truncate" title={d.contrainte}>
                              {d.contrainte.length > 48 ? d.contrainte.slice(0, 48) + '…' : d.contrainte}
                            </span>
                            <span className="text-xs font-extrabold shrink-0" style={{ color }}>
                              {d.total}×
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
