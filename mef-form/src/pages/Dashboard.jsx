import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  fetchOverview, fetchParDirection, fetchParMois, fetchLocaux, fetchRapports,
  fetchParPeriode, fetchEffectifs, fetchEquipements,
} from '../api'
import { useKeycloak } from '../keycloak'

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  blue:       '#1d4ed8',
  blueLight:  '#93c5fd',
  cyan:       '#0891b2',
  green:      '#16a34a',
  red:        '#dc2626',
  amber:      '#d97706',
  slate:      '#64748b',
  purple:     '#7c3aed',
}
const PIE_YES_NO  = { Oui: C.green, Non: C.red }
const PIE_COLORS  = [C.blue, C.cyan, C.green, C.amber, C.purple, C.slate, C.red]
const SHORT_DIR   = (s) => s.replace('Direction ', 'Dir. ').replace('Générale', 'Gén.').replace(' et de la ', ' & ').replace("l'Information et de la Communication", "TIC")

// ── Shared components ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue' }) {
  const ring = { blue: 'border-blue-200 bg-blue-50', green: 'border-green-200 bg-green-50', amber: 'border-amber-200 bg-amber-50' }
  const text = { blue: 'text-blue-800', green: 'text-green-800', amber: 'text-amber-800' }
  return (
    <div className={`rounded-xl border shadow-sm p-5 flex flex-col gap-1 ${ring[color]}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-extrabold ${text[color]}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
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

function Empty() {
  return <p className="text-sm text-gray-400 text-center py-10">Aucune donnée disponible</p>
}

function OuiNonPie({ data }) {
  if (!data?.length) return <Empty />
  const total = data.reduce((s, d) => s + d.total, 0)
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="statut" cx="50%" cy="50%" innerRadius={50} outerRadius={80}
          label={({ statut, percent }) => `${statut} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}>
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
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey={nameKey} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Legend />
        <Tooltip formatter={(v) => [`${v} fiche(s)`, '']} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Dashboard({ onBack }) {
  const { token } = useKeycloak()
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [overview, setOverview]         = useState(null)
  const [parDirection, setParDirection] = useState([])
  const [parMois, setParMois]           = useState([])
  const [parPeriode, setParPeriode]     = useState([])
  const [locaux, setLocaux]             = useState([])
  const [rapports, setRapports]         = useState([])
  const [effectifs, setEffectifs]       = useState([])
  const [equipements, setEquipements]   = useState({ internet: [], electricite: [] })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchOverview(token),
      fetchParDirection(token),
      fetchParMois(token),
      fetchParPeriode(token),
      fetchLocaux(token),
      fetchRapports(token),
      fetchEffectifs(token),
      fetchEquipements(token),
    ])
      .then(([ov, dir, mois, per, loc, rap, eff, eq]) => {
        setOverview(ov)
        setParDirection(dir)
        setParMois(mois)
        setParPeriode(per)
        setLocaux(loc)
        setRapports(rap)
        setEffectifs(eff)
        setEquipements(eq)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const tauxDisponibilite = overview
    ? Math.round(
        effectifs.reduce((s, d) => s + (d.disponible / d.theorique), 0) /
        (effectifs.length || 1) * 100
      )
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">MEF — Direction Générale</p>
            <h1 className="text-xl font-extrabold text-gray-900">Tableau de bord analytique</h1>
          </div>
          <button onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 text-sm font-medium transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            Erreur de chargement : {error}
          </div>
        )}

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total des fiches" value={overview?.total} sub="depuis le début" color="blue" />
          <StatCard label="Fiches ce mois" value={overview?.ceMois} sub="soumissions du mois" color="green" />
          <StatCard label="Directions actives" value={overview?.directionsActives} sub="au moins une fiche soumise" color="blue" />
          <StatCard label="Taux disponibilité RH" value={tauxDisponibilite != null ? `${tauxDisponibilite}%` : null} sub="effectif disponible / théorique" color="amber" />
        </div>

        {/* ── Row 1: Soumissions par mois ── */}
        <ChartCard title="Soumissions par mois (12 derniers mois)" loading={loading}>
          {parMois.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={parMois} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} fiche(s)`, 'Soumissions']} />
                <Line type="monotone" dataKey="total" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 4, fill: C.cyan }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>

        {/* ── Row 2: par direction + par période ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Fiches soumises par direction (top 12)" loading={loading}>
            {parDirection.length ? (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={parDirection.map(d => ({ ...d, dir: SHORT_DIR(d.direction) }))}
                  layout="vertical" margin={{ top: 5, right: 30, left: 140, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="dir" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip formatter={(v) => [`${v} fiche(s)`, 'Total']} labelFormatter={(l) => parDirection.find(d => SHORT_DIR(d.direction) === l)?.direction ?? l} />
                  <Bar dataKey="total" fill={C.blue} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>

          <ChartCard title="Fiches par période couverte" loading={loading}>
            {parPeriode.length ? (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={parPeriode} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="periode" tick={{ fontSize: 10, angle: -40, textAnchor: 'end' }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} fiche(s)`, 'Total']} />
                  <Bar dataKey="total" fill={C.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </ChartCard>
        </div>

        {/* ── Row 3: Effectifs ── */}
        <ChartCard title="Effectifs par direction — théorique vs disponible" loading={loading}>
          {effectifs.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={effectifs.map(d => ({ ...d, dir: SHORT_DIR(d.direction) }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dir" tick={{ fontSize: 10, angle: -40, textAnchor: 'end' }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(l) => effectifs.find(d => SHORT_DIR(d.direction) === l)?.direction ?? l} formatter={(v, n) => [`${v} agents`, n === 'theorique' ? 'Théorique' : 'Disponible']} />
                <Legend formatter={(v) => v === 'theorique' ? 'Effectif théorique' : 'Effectif disponible'} />
                <Bar dataKey="theorique"  fill={C.blueLight} radius={[3, 3, 0, 0]} />
                <Bar dataKey="disponible" fill={C.blue}      radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>

        {/* ── Row 4: Pie charts ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ChartCard title="Locaux adaptés ?" loading={loading}>
            <OuiNonPie data={locaux} />
          </ChartCard>
          <ChartCard title="Rapports périodiques ?" loading={loading}>
            <OuiNonPie data={rapports} />
          </ChartCard>
          <ChartCard title="Qualité internet" loading={loading}>
            <MultiPie data={equipements.internet} />
          </ChartCard>
          <ChartCard title="Électricité" loading={loading}>
            <MultiPie data={equipements.electricite} />
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
