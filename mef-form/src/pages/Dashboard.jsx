import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  fetchOverview, fetchParDirection, fetchParMois, fetchLocaux, fetchRapports,
  fetchParPeriode, fetchEffectifs, fetchEquipements, fetchDirections,
  fetchConformite, fetchPostesVacants, fetchBesoinFormation,
  fetchActivitesNonRealisees, fetchDifficultesActivites, fetchInfraIndicateurs,
  fetchInsuffisances, fetchContraintes, fetchAppuis, fetchActions,
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
const PIE_YES_NO = { Oui: C.green, Non: C.red }
const PIE_COLORS = [C.blue, C.cyan, C.green, C.amber, C.purple, C.slate, C.red, C.teal, C.orange]
const STATUT_COLORS = { soumis: C.green, valide: C.blue, brouillon: C.amber }
const SHORT_DIR = (s) =>
  s.replace('Direction ', 'Dir. ')
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
        const opacity = 0.55 + ratio * 0.45
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

// Appuis cards grouped by category
function AppuisCards({ data }) {
  if (!data?.length) return <Empty />
  const categories = [
    { key: 'administratifs', label: 'Administratifs', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { key: 'logistiques',    label: 'Logistiques',    color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { key: 'rh',             label: 'Ressources humaines', color: 'bg-green-50 border-green-200 text-green-800' },
    { key: 'numerique',      label: 'Numérique',      color: 'bg-purple-50 border-purple-200 text-purple-800' },
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

// ── Main ───────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { token } = useKeycloak()
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Section 1
  const [overview, setOverview]         = useState(null)
  const [conformite, setConformite]     = useState(null)
  const [parMois, setParMois]           = useState([])

  // Section 2
  const [effectifs, setEffectifs]             = useState([])
  const [besoinFormation, setBesoinFormation] = useState([])
  const [postesVacants, setPostesVacants]     = useState([])

  // Section 3
  const [activitesNR, setActivitesNR]         = useState([])
  const [difficultesAct, setDifficultesAct]   = useState([])

  // Section 4
  const [infraIndicateurs, setInfraIndicateurs] = useState([])
  const [insuffisances, setInsuffisances]       = useState([])
  const [locaux, setLocaux]                     = useState([])
  const [equipements, setEquipements]           = useState({ internet: [], electricite: [] })

  // Section 5
  const [contraintes, setContraintes] = useState([])
  const [appuis, setAppuis]           = useState([])

  // Section 6
  const [actions, setActions]         = useState([])

  // Filter
  const [directions, setDirections]   = useState([])
  const [selectedDir, setSelectedDir] = useState('')

  useEffect(() => {
    fetchDirections()
      .then(data => setDirections(data.map(d => d.nom_direction).sort()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const dir = selectedDir || null
    Promise.all([
      fetchOverview(token, dir),
      fetchConformite(token, dir),
      fetchParMois(token, dir),
      fetchEffectifs(token, dir),
      fetchBesoinFormation(token, dir),
      fetchPostesVacants(token, dir),
      fetchActivitesNonRealisees(token, dir),
      fetchDifficultesActivites(token, dir),
      fetchInfraIndicateurs(token, dir),
      fetchInsuffisances(token, dir),
      fetchLocaux(token, dir),
      fetchEquipements(token, dir),
      fetchContraintes(token, dir),
      fetchAppuis(token, dir),
      fetchActions(token, dir),
    ])
      .then(([ov, conf, mois, eff, bf, pv, anr, da, ii, ins, loc, eq, cnt, app, act]) => {
        setOverview(ov)
        setConformite(conf)
        setParMois(mois)
        setEffectifs(eff)
        setBesoinFormation(bf)
        setPostesVacants(pv)
        setActivitesNR(anr)
        setDifficultesAct(da)
        setInfraIndicateurs(ii)
        setInsuffisances(ins)
        setLocaux(loc)
        setEquipements(eq)
        setContraintes(cnt)
        setAppuis(app)
        setActions(act)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, selectedDir])

  const tauxConformite = conformite
    ? Math.round((conformite.avecRevue / (conformite.totalDirections || 1)) * 100)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">MEF — Direction Générale</p>
            <h1 className="text-xl font-extrabold text-gray-900">Tableau de bord analytique</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="dir-filter" className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                Direction
              </label>
              <select
                id="dir-filter"
                value={selectedDir}
                onChange={e => setSelectedDir(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 max-w-xs"
              >
                <option value="">Toutes les directions</option>
                {directions.map(nom => (
                  <option key={nom} value={nom}>{nom}</option>
                ))}
              </select>
              {selectedDir && (
                <button onClick={() => setSelectedDir('')} className="text-xs text-gray-400 hover:text-gray-600 transition" title="Réinitialiser">✕</button>
              )}
            </div>

          </div>
        </div>

        {selectedDir && (
          <div className="max-w-7xl mx-auto px-4 pb-2">
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.553.894l-4 2A1 1 0 016 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Filtré : {selectedDir}
            </span>
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
              sub="depuis le début"
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

          {/* Statut des revues + évolution mensuelle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Statut des soumissions" loading={loading}>
              {conformite?.parStatut?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={conformite.parStatut.map(d => ({ ...d, label: d.statut.charAt(0).toUpperCase() + d.statut.slice(1) }))}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} revue(s)`, 'Total']} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {conformite.parStatut.map((d, i) => (
                        <Cell key={i} fill={STATUT_COLORS[d.statut] ?? C.slate} />
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
            description="Écart effectifs, besoins en formation, postes vacants"
          />

          {/* Effectifs chart */}
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
            {/* Top 5 besoins en formation */}
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

            {/* Postes vacants */}
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
            description="Activités non réalisées par direction, fréquence des difficultés"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Activités non réalisées par direction (top 10)" loading={loading}>
              {activitesNR.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={activitesNR.map(d => ({ ...d, dir: SHORT_DIR(d.direction) }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 140, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="dir" tick={{ fontSize: 10 }} width={140} />
                    <Tooltip
                      formatter={(v) => [`${v} activité(s)`, 'Non réalisées']}
                      labelFormatter={(l) => activitesNR.find(d => SHORT_DIR(d.direction) === l)?.direction ?? l}
                    />
                    <Bar dataKey="total" fill={C.red} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
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
            description="Indicateurs clés d'infrastructure, insuffisances matérielles signalées"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insuffisances matérielles */}
            <ChartCard title="Principales insuffisances matérielles et logistiques" loading={loading}>
              {insuffisances.length ? (
                <div className="overflow-auto max-h-64">
                  <div className="flex flex-wrap gap-2 p-1">
                    {insuffisances.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full"
                        title={`${d.total} direction(s) concernée(s)`}
                      >
                        {d.insuffisance}
                        <span className="bg-red-200 text-red-900 font-bold px-1.5 py-0.5 rounded-full text-xs">{d.total}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : <Empty />}
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
            description="Mesures nécessitant l'intervention de la DG ou un arbitrage du Ministre (Sect. XI)"
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
