import { useTranslation } from 'react-i18next'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'

function fmtDate(iso) {
  if (!iso) return '—'
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'dd/MM/yyyy', { locale: fr }) : iso
}

function val(v) {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  return String(v)
}

function Section({ number, title }) {
  return (
    <div className="bg-blue-800 text-white px-4 py-2 rounded-t-lg">
      <p className="text-xs font-bold uppercase tracking-widest">{number}. {title}</p>
    </div>
  )
}

function Block({ number, title, children }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Section number={number} title={title} />
      <div className="bg-white divide-y divide-gray-100 px-4">
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid md:grid-cols-5 gap-2 py-2.5">
      <span className="md:col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide pt-0.5">{label}</span>
      <div className="md:col-span-3 text-sm text-gray-800">{children}</div>
    </div>
  )
}

function TextVal({ v }) {
  return <span className={v === '—' ? 'text-gray-300 italic' : 'whitespace-pre-wrap'}>{v}</span>
}

function ListVal({ items }) {
  const filtered = items.filter(i => {
    if (typeof i === 'string') return i.trim() !== ''
    if (typeof i === 'object') return Object.values(i).some(x => String(x || '').trim() !== '')
    return false
  })
  if (filtered.length === 0) return <span className="text-gray-300 italic text-sm">—</span>
  return (
    <ul className="space-y-1">
      {filtered.map((item, idx) => (
        <li key={idx} className="flex gap-2 text-sm text-gray-800">
          <span className="text-blue-400 mt-0.5 shrink-0">▸</span>
          <span>{typeof item === 'string' ? item : Object.values(item).filter(Boolean).join(' — ')}</span>
        </li>
      ))}
    </ul>
  )
}

export default function StepConfirmation({ data }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">

      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-amber-800">
          <strong>{t('confirm.bannerTitle')}</strong> {t('confirm.bannerBody')}
        </p>
      </div>

      {/* I. Identification */}
      <Block number="I" title={t('steps.s1.title')}>
        <Row label={t('steps.s1.intituleDirection')}><TextVal v={val(data.intituleDirection)} /></Row>
        <Row label={t('steps.s1.localisation')}><TextVal v={val(data.localisation)} /></Row>
        <Row label={t('steps.s1.responsable')}><TextVal v={val(data.responsable)} /></Row>
        <Row label={t('steps.s1.fonction')}><TextVal v={val(data.fonction)} /></Row>
        <Row label={t('steps.s1.tel')}><TextVal v={val(data.coordonneesTel)} /></Row>
        <Row label={t('steps.s1.email')}><TextVal v={val(data.adresseEmail)} /></Row>
        <Row label={t('steps.s1.dateReunion')}><TextVal v={fmtDate(data.dateReunion)} /></Row>
        <Row label={t('steps.s1.periodeDebut')}><TextVal v={fmtDate(data.periodeDebut)} /></Row>
        <Row label={t('steps.s1.periodeFin')}><TextVal v={fmtDate(data.periodeFin)} /></Row>
      </Block>

      {/* II. Mission */}
      <Block number="II" title={t('steps.s2.title')}>
        <Row label={t('steps.s2.missionPrincipale')}><TextVal v={val(data.missionPrincipale)} /></Row>
        <Row label={t('steps.s2.principalesAttributions')}><TextVal v={val(data.principalesAttributions)} /></Row>
        <Row label={t('steps.s2.principauxServices')}><TextVal v={val(data.principauxServices)} /></Row>
      </Block>

      {/* III. RH */}
      <Block number="III" title={t('steps.s3.title')}>
        <Row label={t('steps.s3.effectifTheorique')}><TextVal v={val(data.effectifTheorique)} /></Row>
        <Row label={t('steps.s3.effectifPoste')}><TextVal v={val(data.effectifPoste)} /></Row>
        <Row label={t('steps.s3.effectifDisponible')}><TextVal v={val(data.effectifDisponible)} /></Row>
        <Row label={t('steps.s3.postesVacants')}><TextVal v={val(data.postesVacants)} /></Row>
        <Row label={t('steps.s3.difficultesRH')}><TextVal v={val(data.difficultesRH)} /></Row>
        <Row label={t('steps.s3.repartition')}><ListVal items={data.repartitionPersonnel || []} /></Row>
        <Row label={t('steps.s3.besoinsPrio')}><ListVal items={data.besoinsPrioPersonnel || []} /></Row>
        <Row label={t('steps.s3.besoinsFormation')}><ListVal items={data.besoinsFormation || []} /></Row>
      </Block>

      {/* IV. Fonctionnement */}
      <Block number="IV" title={t('steps.s4.title')}>
        <Row label={t('steps.s4.activitesRealisees')}><ListVal items={data.activitesRealisees || []} /></Row>
        <Row label={t('steps.s4.activitesEnCours')}><ListVal items={data.activitesEnCours || []} /></Row>
        <Row label={t('steps.s4.activitesNonRealisees')}><ListVal items={data.activitesNonRealisees || []} /></Row>
        <Row label={t('steps.s4.resultatsObtenus')}><ListVal items={data.resultatsObtenus || []} /></Row>
        <Row label={t('steps.s4.difficultesExecution')}><ListVal items={data.difficultesExecution || []} /></Row>
      </Block>

      {/* V. Locaux */}
      <Block number="V" title={t('steps.s5.title')}>
        <Row label={t('steps.s5.locauxAdaptes')}><TextVal v={val(data.locauxAdaptes)} /></Row>
        <Row label={t('steps.s5.etatBatiments')}><TextVal v={val(data.etatBatiments)} /></Row>
        <Row label={t('steps.s5.niveauExiguite')}><TextVal v={val(data.niveauExiguite)} /></Row>
        <Row label={t('steps.s5.etatProprete')}><TextVal v={val(data.etatProprete)} /></Row>
        <Row label={t('steps.s5.signaletique')}><TextVal v={val(data.signaletique)} /></Row>
        <Row label={t('steps.s5.conditionsAccueil')}><TextVal v={val(data.conditionsAccueil)} /></Row>
        <Row label={t('steps.s5.travauxPrioritaires')}><ListVal items={data.travauxPrioritaires || []} /></Row>
      </Block>

      {/* VI. Équipements */}
      <Block number="VI" title={t('steps.s6.title')}>
        <Row label={t('steps.s6.mobilierBureau')}><TextVal v={val(data.mobilierBureau)} /></Row>
        <Row label={t('steps.s6.materielInformatique')}><TextVal v={val(data.materielInformatique)} /></Row>
        <Row label={t('steps.s6.etatOrdinateurs')}><TextVal v={val(data.etatOrdinateurs)} /></Row>
        <Row label={t('steps.s6.electricite')}><TextVal v={val(data.electricite)} /></Row>
        <Row label={t('steps.s6.internet')}><TextVal v={val(data.internet)} /></Row>
        <Row label={t('steps.s6.vehicules')}><TextVal v={val(data.vehicules)} /></Row>
        <Row label={t('steps.s6.autresEquipements')}><TextVal v={val(data.autresEquipements)} /></Row>
        <Row label={t('steps.s6.insuffisancesMaterielles')}><ListVal items={data.insuffisancesMaterielles || []} /></Row>
      </Block>

      {/* VII. Communication */}
      <Block number="VII" title={t('steps.s7.title')}>
        <Row label={t('steps.s7.circulationInfo')}><TextVal v={val(data.circulationInfo)} /></Row>
        <Row label={t('steps.s7.relationsAutresStructures')}><TextVal v={val(data.relationsAutresStructures)} /></Row>
        <Row label={t('steps.s7.difficultesInternet')}><TextVal v={val(data.difficultesInternet)} /></Row>
        <Row label={t('steps.s7.outilsNumeriques')}><ListVal items={data.outilsNumeriques || []} /></Row>
        <Row label={t('steps.s7.proceduresDematerialisees')}><ListVal items={data.proceduresDematerialisees || []} /></Row>
        <Row label={t('steps.s7.proceduresManuelles')}><ListVal items={data.proceduresManuelles || []} /></Row>
        <Row label={t('steps.s7.besoinsDig')}><ListVal items={data.besoinsDig || []} /></Row>
      </Block>

      {/* VIII. Rapports */}
      <Block number="VIII" title={t('steps.s8.title')}>
        <Row label={t('steps.s8.rapportsPeriodiques')}><TextVal v={val(data.rapportsPeriodiques)} /></Row>
        <Row label={t('steps.s8.frequenceProduction')}><TextVal v={val(data.frequenceProduction)} /></Row>
        <Row label={t('steps.s8.tableauxBord')}><TextVal v={val(data.tableauxBord)} /></Row>
        <Row label={t('steps.s8.statistiquesDisponibles')}><TextVal v={val(data.statistiquesDisponibles)} /></Row>
        <Row label={t('steps.s8.retardsRapports')}><TextVal v={val(data.retardsRapports)} /></Row>
        <Row label={t('steps.s8.derniersRapports')}><ListVal items={data.derniersRapports || []} /></Row>
        <Row label={t('steps.s8.principauxLivrables')}><ListVal items={data.principauxLivrables || []} /></Row>
        <Row label={t('steps.s8.causesRapports')}><ListVal items={data.causesRapports || []} /></Row>
      </Block>

      {/* IX. Contraintes */}
      <Block number="IX" title={t('steps.s9.titleContraintes')}>
        {(data.contraintes || []).map((c, i) => (
          <Row key={i} label={t('steps.s9.contrainte', { n: c.ordre })}>
            <TextVal v={val(c.contrainte)} />
          </Row>
        ))}
      </Block>

      {/* X. Besoins prioritaires */}
      <Block number="X" title={t('steps.s9.titleBesoins')}>
        {(data.besoinsPrioritaires || []).map((b, i) => (
          <Row key={i} label={t('steps.s9.besoin', { n: b.ordre })}>
            <TextVal v={val(b.besoin)} />
          </Row>
        ))}
      </Block>

      {/* XI. Mesures */}
      <Block number="XI" title={t('steps.s10.titleMesures')}>
        <Row label={t('steps.s10.mesuresStructure')}><TextVal v={val(data.mesuresStructure)} /></Row>
        <Row label={t('steps.s10.mesuresDG')}><TextVal v={val(data.mesuresDG)} /></Row>
        <Row label={t('steps.s10.mesuresMinistre')}><TextVal v={val(data.mesuresMinistre)} /></Row>
      </Block>

      {/* XII. Appui */}
      <Block number="XII" title={t('steps.s10.titleAppui')}>
        <Row label={t('steps.s10.decisionsOuhaitees')}><TextVal v={val(data.decisionsOuhaitees)} /></Row>
        <Row label={t('steps.s10.appuisAdmin')}><TextVal v={val(data.appuisAdmin)} /></Row>
        <Row label={t('steps.s10.appuisLogistiques')}><TextVal v={val(data.appuisLogistiques)} /></Row>
        <Row label={t('steps.s10.appuisRH')}><TextVal v={val(data.appuisRH)} /></Row>
        <Row label={t('steps.s10.appuisNumerique')}><TextVal v={val(data.appuisNumerique)} /></Row>
      </Block>

      {/* XIII. Observations */}
      <Block number="XIII" title={t('steps.s11.titleObservations')}>
        <Row label={t('steps.s11.observations')}><ListVal items={data.observations || []} /></Row>
      </Block>

      {/* XIV. Signature */}
      <Block number="XIV" title={t('steps.s11.titleSignature')}>
        <Row label={t('steps.s11.nomResponsable')}><TextVal v={val(data.nomResponsable)} /></Row>
        <Row label={t('steps.s11.fonctionSignature')}><TextVal v={val(data.fonctionSignature)} /></Row>
        <Row label={t('steps.s11.dateSignature')}><TextVal v={fmtDate(data.dateSignature)} /></Row>
        <Row label={t('steps.s11.signatureLabel')}>
          {data.signatureImage
            ? <img src={data.signatureImage} alt="Signature" className="h-16 border border-gray-200 rounded-lg bg-white p-1" />
            : <span className="text-gray-300 italic text-sm">—</span>
          }
        </Row>
      </Block>

    </div>
  )
}
