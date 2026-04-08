import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fetchRevues, fetchRevue } from '../api'
import { useKeycloak } from '../keycloak'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'

registerLocale('fr', fr)

function fmtDate(iso) {
  if (!iso) return '—'
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'dd/MM/yyyy', { locale: fr }) : iso
}

const STATUS_COLORS = {
  soumis:   'bg-blue-100 text-blue-700',
  validé:   'bg-green-100 text-green-700',
  rejeté:   'bg-red-100 text-red-600',
  en_cours: 'bg-amber-100 text-amber-700',
}

function StatusBadge({ statut }) {
  const cls = STATUS_COLORS[statut] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cls}`}>
      {statut || '—'}
    </span>
  )
}

// ── Detail panel ─────────────────────────────────────────────────────────────

function Section({ number, title }) {
  return (
    <div className="bg-blue-800 text-white px-3 py-1.5 rounded-t-md mt-4 first:mt-0">
      <p className="text-xs font-bold uppercase tracking-widest">{number}. {title}</p>
    </div>
  )
}

function DRow({ label, value }) {
  const empty = !value || String(value).trim() === ''
  return (
    <div className="grid grid-cols-5 gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="col-span-2 text-xs font-semibold text-gray-500 leading-snug">{label}</span>
      <span className={`col-span-3 text-xs ${empty ? 'text-gray-300 italic' : 'text-gray-800'}`}>
        {empty ? '—' : String(value)}
      </span>
    </div>
  )
}

function ListRows({ label, items = [] }) {
  const filtered = items.filter(Boolean)
  return (
    <div className="grid grid-cols-5 gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="col-span-2 text-xs font-semibold text-gray-500 leading-snug">{label}</span>
      <div className="col-span-3">
        {filtered.length === 0
          ? <span className="text-xs text-gray-300 italic">—</span>
          : <ul className="space-y-0.5">{filtered.map((item, i) => (
              <li key={i} className="text-xs text-gray-800 flex gap-1.5">
                <span className="text-blue-400 shrink-0">▸</span>{item}
              </li>
            ))}</ul>
        }
      </div>
    </div>
  )
}

function RevueDetail({ revue, onClose, t }) {
  if (!revue) return null

  const d = revue
  const dir = d.direction || {}

  // helpers to extract from nested model arrays
  const rh   = d.rh?.[0] || {}
  const infra = d.infrastructures?.[0] || {}
  const equip = d.equipements?.[0] || {}
  const comm  = d.communication?.[0] || {}
  const rapport = d.rapports?.[0] || {}
  const action  = d.actions?.[0] || {}
  const appui   = d.appuis?.[0] || {}
  const sig     = d.signature?.[0] || {}

  const activitesRealisees    = (d.activites || []).filter(a => a.type_activite === 'principale_realisee').map(a => a.description)
  const activitesEnCours      = (d.activites || []).filter(a => a.type_activite === 'en_cours').map(a => a.description)
  const activitesNonRealisees = (d.activites || []).filter(a => a.type_activite === 'non_realisee').map(a => a.description)

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 text-white px-5 py-4 flex items-start justify-between shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{t('submissions.detailTitle')}</p>
            <p className="text-base font-bold mt-0.5">{dir.nom_direction || '—'}</p>
            <p className="text-xs opacity-70 mt-0.5">
              {fmtDate(d.periode_debut)} → {fmtDate(d.periode_fin)}
              {' · '}{t('submissions.reunion')} {fmtDate(d.date_reunion)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-2 flex items-center gap-3">
          <StatusBadge statut={d.statut} />
          <span className="text-xs text-gray-400">{t('submissions.submitted')} {fmtDate(d.date_soumission)}</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">

          <Section number="I" title={t('steps.s1.title')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s1.localisation')} value={dir.localisation_siege} />
            <DRow label={t('steps.s1.dateReunion')} value={fmtDate(d.date_reunion)} />
          </div>

          <Section number="II" title={t('steps.s2.title')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s2.missionPrincipale')} value={dir.mission_principale} />
            <DRow label={t('steps.s2.principalesAttributions')} value={dir.principales_attributions} />
            <DRow label={t('steps.s2.principauxServices')} value={dir.principaux_services_rendus} />
          </div>

          <Section number="III" title={t('steps.s3.title')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s3.effectifTheorique')} value={dir.effectif_theorique} />
            <DRow label={t('steps.s3.effectifPoste')} value={rh.effectif_en_poste} />
            <DRow label={t('steps.s3.effectifDisponible')} value={rh.effectif_reellement_disponible} />
            <DRow label={t('steps.s3.postesVacants')} value={rh.postes_vacants} />
            <DRow label={t('steps.s3.difficultesRH')} value={rh.difficultes_rh} />
            <ListRows label={t('steps.s3.repartition')} items={(d.repartition_personnel || []).map(r => `${r.categorie} : ${r.nombre}`)} />
            <ListRows label={t('steps.s3.besoinsPrio')} items={(d.besoins_personnel || []).map(b => b.besoin)} />
            <ListRows label={t('steps.s3.besoinsFormation')} items={(d.besoins_formation || []).map(b => b.besoin_formation)} />
          </div>

          <Section number="IV" title={t('steps.s4.title')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <ListRows label={t('steps.s4.activitesRealisees')} items={activitesRealisees} />
            <ListRows label={t('steps.s4.activitesEnCours')} items={activitesEnCours} />
            <ListRows label={t('steps.s4.activitesNonRealisees')} items={activitesNonRealisees} />
            <ListRows label={t('steps.s4.resultatsObtenus')} items={(d.resultats || []).map(r => r.resultat)} />
            <ListRows label={t('steps.s4.difficultesExecution')} items={(d.difficultes_activites || []).map(r => r.difficulte)} />
          </div>

          <Section number="V" title={t('steps.s5.title')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s5.locauxAdaptes')} value={infra.locaux_adaptes == null ? null : infra.locaux_adaptes ? 'Oui' : 'Non'} />
            <DRow label={t('steps.s5.etatBatiments')} value={infra.etat_general_batiments} />
            <DRow label={t('steps.s5.niveauExiguite')} value={infra.niveau_exiguite} />
            <DRow label={t('steps.s5.etatProprete')} value={infra.etat_proprete} />
            <DRow label={t('steps.s5.signaletique')} value={infra.signaletique_visible == null ? null : infra.signaletique_visible ? 'Oui' : 'Non'} />
            <DRow label={t('steps.s5.conditionsAccueil')} value={infra.conditions_accueil} />
            <ListRows label={t('steps.s5.travauxPrioritaires')} items={(d.travaux_prioritaires || []).map(t => t.travail)} />
          </div>

          <Section number="VI" title={t('steps.s6.title')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s6.mobilierBureau')} value={equip.mobilier_bureau} />
            <DRow label={t('steps.s6.materielInformatique')} value={equip.materiel_informatique} />
            <DRow label={t('steps.s6.etatOrdinateurs')} value={equip.etat_informatique} />
            <DRow label={t('steps.s6.electricite')} value={equip.disponibilite_electricite} />
            <DRow label={t('steps.s6.internet')} value={equip.disponibilite_internet} />
            <DRow label={t('steps.s6.vehicules')} value={equip.disponibilite_vehicules} />
            <DRow label={t('steps.s6.autresEquipements')} value={equip.autres_equipements} />
            <ListRows label={t('steps.s6.insuffisancesMaterielles')} items={(d.insuffisances_materielles || []).map(i => i.insuffisance)} />
          </div>

          <Section number="VII" title={t('steps.s7.title')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s7.circulationInfo')} value={comm.circulation_information} />
            <DRow label={t('steps.s7.relationsAutresStructures')} value={comm.relations_autres_structures} />
            <DRow label={t('steps.s7.difficultesInternet')} value={comm.difficultes_informatiques} />
            <ListRows label={t('steps.s7.outilsNumeriques')} items={(d.outils_numeriques || []).map(o => o.outil)} />
            <ListRows label={t('steps.s7.proceduresDematerialisees')} items={(d.procedures_dematerialisees || []).map(p => p.procedure)} />
            <ListRows label={t('steps.s7.proceduresManuelles')} items={(d.procedures_manuelles || []).map(p => p.procedure)} />
            <ListRows label={t('steps.s7.besoinsDig')} items={(d.besoins_digitalisation || []).map(b => b.besoin)} />
          </div>

          <Section number="VIII" title={t('steps.s8.title')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s8.rapportsPeriodiques')} value={rapport.rapports_produits == null ? null : rapport.rapports_produits ? 'Oui' : 'Non'} />
            <DRow label={t('steps.s8.frequenceProduction')} value={rapport.frequence_production} />
            <DRow label={t('steps.s8.tableauxBord')} value={rapport.tableaux_bord_disponibles == null ? null : rapport.tableaux_bord_disponibles ? 'Oui' : 'Non'} />
            <DRow label={t('steps.s8.statistiquesDisponibles')} value={rapport.statistiques_disponibles == null ? null : rapport.statistiques_disponibles ? 'Oui' : 'Non'} />
            <DRow label={t('steps.s8.retardsRapports')} value={rapport.retards_insuffisances} />
            <ListRows label={t('steps.s8.derniersRapports')} items={(d.derniers_rapports || []).map(r => r.rapport)} />
            <ListRows label={t('steps.s8.principauxLivrables')} items={(d.livrables || []).map(l => l.livrable)} />
            <ListRows label={t('steps.s8.causesRapports')} items={(d.causes_difficultes_rapports || []).map(c => c.cause)} />
          </div>

          <Section number="IX" title={t('steps.s9.titleContraintes')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            {(d.contraintes || []).map((c, i) => (
              <DRow key={i} label={t('steps.s9.contrainte', { n: c.ordre })} value={c.contrainte} />
            ))}
          </div>

          <Section number="X" title={t('steps.s9.titleBesoins')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            {(d.besoins_prioritaires || []).map((b, i) => (
              <DRow key={i} label={t('steps.s9.besoin', { n: b.ordre })} value={b.besoin} />
            ))}
          </div>

          <Section number="XI" title={t('steps.s10.titleMesures')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s10.mesuresStructure')} value={action.mesures_internes} />
            <DRow label={t('steps.s10.mesuresDG')} value={action.mesures_dg} />
            <DRow label={t('steps.s10.mesuresMinistre')} value={action.mesures_ministre} />
          </div>

          <Section number="XII" title={t('steps.s10.titleAppui')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s10.decisionsOuhaitees')} value={appui.decisions_souhaitees} />
            <DRow label={t('steps.s10.appuisAdmin')} value={appui.appuis_administratifs} />
            <DRow label={t('steps.s10.appuisLogistiques')} value={appui.appuis_logistiques} />
            <DRow label={t('steps.s10.appuisRH')} value={appui.appuis_rh} />
            <DRow label={t('steps.s10.appuisNumerique')} value={appui.appuis_numerique} />
          </div>

          <Section number="XIII" title={t('steps.s11.titleObservations')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <ListRows label={t('steps.s11.observations')} items={(d.observations || []).map(o => o.observation)} />
          </div>

          <Section number="XIV" title={t('steps.s11.titleSignature')} />
          <div className="bg-white border border-gray-100 rounded-b-md px-3 pb-1">
            <DRow label={t('steps.s11.nomResponsable')} value={sig.nom_signataire} />
            <DRow label={t('steps.s11.fonctionSignature')} value={sig.fonction_signataire} />
            <DRow label={t('steps.s11.dateSignature')} value={fmtDate(sig.date_signature)} />
            {sig.signature_image && (
              <div className="grid grid-cols-5 gap-2 py-1.5">
                <span className="col-span-2 text-xs font-semibold text-gray-500">{t('steps.s11.signatureLabel')}</span>
                <div className="col-span-3">
                  <img src={sig.signature_image} alt="Signature" className="h-16 border border-gray-200 rounded-lg bg-white p-1" />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Soumissions({ user }) {
  const { t } = useTranslation()
  const { token } = useKeycloak()

  const isDG          = user?.realm_access?.roles?.includes('direction-generale') ?? false
  const directionId   = user?.direction_id || null

  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filterDir, setFilterDir] = useState('')
  const [filterMois, setFilterMois] = useState('')

  const [selectedId, setSelectedId]   = useState(null)
  const [detail, setDetail]           = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (!isDG && directionId) params.direction_id = directionId
      if (isDG && filterDir)    params.direction    = filterDir
      if (filterMois)           params.mois         = filterMois
      const data = await fetchRevues(params, token)
      setRows(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, isDG, directionId, filterDir, filterMois])

  useEffect(() => { load() }, [load])

  async function openDetail(id) {
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    try {
      const data = await fetchRevue(id, token)
      setDetail(data)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  function closeDetail() {
    setSelectedId(null)
    setDetail(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-800">{t('submissions.title')}</h1>
          <p className="text-xs text-gray-400">
            {!isDG && directionId ? t('submissions.scopeOwn') : t('submissions.scopeAll')}
          </p>
        </div>
      </div>

      {/* Filters — DG only gets direction search, both get period filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        {isDG && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">{t('submissions.filterDirection')}</label>
            <input
              value={filterDir}
              onChange={e => setFilterDir(e.target.value)}
              placeholder={t('submissions.filterDirectionPlaceholder')}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 w-56"
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">{t('submissions.filterPeriod')}</label>
          <DatePicker
            locale="fr"
            dateFormat="MM/yyyy"
            showMonthYearPicker
            selected={filterMois ? parseISO(filterMois + '-01') : null}
            onChange={date => setFilterMois(date ? format(date, 'yyyy-MM') : '')}
            placeholderText="mm/aaaa"
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer w-32"
            isClearable
          />
        </div>
        {(filterDir || filterMois) && (
          <button
            onClick={() => { setFilterDir(''); setFilterMois('') }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-2 self-end"
          >
            ✕ {t('submissions.reset')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {error && (
          <div className="px-5 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
        )}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">{t('dashboard.loading')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {isDG && <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t('submissions.colDirection')}</th>}
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t('submissions.colPeriod')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t('submissions.colReunion')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t('submissions.colStatus')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t('submissions.colSubmitted')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={isDG ? 6 : 5} className="py-12 text-center text-gray-400 text-xs">
                      {t('submissions.empty')}
                    </td>
                  </tr>
                )}
                {rows.map(row => (
                  <tr
                    key={row.revue_id}
                    className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors cursor-pointer ${selectedId === row.revue_id ? 'bg-blue-50' : ''}`}
                    onClick={() => openDetail(row.revue_id)}
                  >
                    {isDG && (
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {row.direction?.nom_direction || '—'}
                        {row.direction?.sigle && <span className="ml-1.5 text-xs text-gray-400">({row.direction.sigle})</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {fmtDate(row.periode_debut)} → {fmtDate(row.periode_fin)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {fmtDate(row.date_reunion)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge statut={row.statut} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(row.date_soumission)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); openDetail(row.revue_id) }}
                        className="text-xs text-blue-700 hover:text-blue-900 font-medium"
                      >
                        {t('submissions.view')} →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedId && (
        detailLoading
          ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-xl px-8 py-6 text-sm text-gray-500">{t('dashboard.loading')}</div>
            </div>
          )
          : <RevueDetail revue={detail} onClose={closeDetail} t={t} />
      )}
    </div>
  )
}
