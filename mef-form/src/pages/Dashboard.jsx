import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  fetchOverview, fetchParDirection, fetchParMois, fetchLocaux, fetchRapports,
} from '../api'
import { useKeycloak } from '../keycloak'

const PIE_COLORS = { Oui: '#16a34a', Non: '#dc2626' }
const BAR_COLOR = '#1d4ed8'
const LINE_COLOR = '#0891b2'

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

function ChartCard({ title, children, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">{title}</h3>
      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Chargement…</div>
      ) : children}
    </div>
  )
}

function OuiNonPie({ data }) {
  if (!data?.length) return <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="statut" cx="50%" cy="50%" outerRadius={70} label={({ statut, percent }) => `${statut} ${(percent * 100).toFixed(0)}%`}>
          {data.map((entry) => (
            <Cell key={entry.statut} fill={PIE_COLORS[entry.statut] || '#94a3b8'} />
          ))}
        </Pie>
        <Legend />
        <Tooltip formatter={(v) => [`${v} fiche(s)`, '']} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default function Dashboard({ onBack }) {
  const { token } = useKeycloak()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [overview, setOverview] = useState(null)
  const [parDirection, setParDirection] = useState([])
  const [parMois, setParMois] = useState([])
  const [locaux, setLocaux] = useState([])
  const [rapports, setRapports] = useState([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchOverview(token),
      fetchParDirection(token),
      fetchParMois(token),
      fetchLocaux(token),
      fetchRapports(token),
    ])
      .then(([ov, dir, mois, loc, rap]) => {
        setOverview(ov)
        setParDirection(dir)
        setParMois(mois)
        setLocaux(loc)
        setRapports(rap)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">MEF — Direction Générale</p>
            <h1 className="text-xl font-extrabold text-gray-900">Tableau de bord analytique</h1>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au formulaire
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            Erreur de chargement : {error}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total des fiches" value={overview?.total} sub="depuis le début" />
          <StatCard label="Fiches ce mois" value={overview?.ceMois} sub="soumissions du mois en cours" />
          <StatCard label="Directions actives" value={overview?.directionsActives} sub="directions ayant soumis au moins une fiche" />
        </div>

        {/* Fiches par mois — line chart */}
        <ChartCard title="Soumissions par mois (12 derniers mois)" loading={loading}>
          {parMois.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={parMois} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} fiche(s)`, 'Soumissions']} />
                <Line type="monotone" dataKey="total" stroke={LINE_COLOR} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>}
        </ChartCard>

        {/* Fiches par direction — bar chart */}
        <ChartCard title="Fiches soumises par direction" loading={loading}>
          {parDirection.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={parDirection} layout="vertical" margin={{ top: 5, right: 30, left: 130, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="direction" tick={{ fontSize: 11 }} width={130} />
                <Tooltip formatter={(v) => [`${v} fiche(s)`, 'Total']} />
                <Bar dataKey="total" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>}
        </ChartCard>

        {/* Pie charts side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Locaux adaptés aux missions ?" loading={loading}>
            <OuiNonPie data={locaux} />
          </ChartCard>
          <ChartCard title="Rapports périodiques produits ?" loading={loading}>
            <OuiNonPie data={rapports} />
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
