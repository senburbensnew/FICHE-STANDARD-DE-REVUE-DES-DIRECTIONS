import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step10Mesures({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div className="space-y-8">
      {/* Section XI */}
      <div>
        <SectionTitle number="XI" title="Mesures Correctives Proposées par la Direction" />
        <FieldGroup>
          <Field label="Mesures pouvant être prises par la structure elle-même" name="mesuresStructure" value={data.mesuresStructure} {...f} rows={3} />
          <Field label="Mesures nécessitant l'intervention de la Direction Générale" name="mesuresDG" value={data.mesuresDG} {...f} rows={3} />
          <Field label="Mesures nécessitant un arbitrage du Ministre" name="mesuresMinistre" value={data.mesuresMinistre} {...f} rows={3} />
        </FieldGroup>
      </div>

      {/* Section XII */}
      <div>
        <SectionTitle number="XII" title="Appui Attendu de la Direction Générale" />
        <FieldGroup>
          <Field label="Décisions souhaitées" name="decisionsOuhaitees" value={data.decisionsOuhaitees} {...f} rows={3} />
          <Field label="Appuis administratifs demandés" name="appuisAdmin" value={data.appuisAdmin} {...f} rows={3} />
          <Field label="Appuis logistiques demandés" name="appuisLogistiques" value={data.appuisLogistiques} {...f} rows={3} />
          <Field label="Appuis en ressources humaines demandés" name="appuisRH" value={data.appuisRH} {...f} rows={3} />
          <Field label="Appuis en transformation numérique demandés" name="appuisNumerique" value={data.appuisNumerique} {...f} rows={3} />
        </FieldGroup>
      </div>
    </div>
  )
}
