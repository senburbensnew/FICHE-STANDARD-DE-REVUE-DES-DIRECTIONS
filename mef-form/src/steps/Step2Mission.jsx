import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step2Mission({ data, onChange, showErrors, savedFields, directionFields = new Set() }) {
  const f = { onChange, showErrors, savedFields }
  const df = (name) => directionFields.has(name)
  return (
    <div>
      <SectionTitle number="II" title="Mission et Attributions" />
      <FieldGroup>
        <Field label="Mission principale de la structure" name="missionPrincipale" value={data.missionPrincipale} {...f} rows={4} disabled={df('missionPrincipale')} />
        <Field label="Principales attributions" name="principalesAttributions" value={data.principalesAttributions} {...f} rows={4} disabled={df('principalesAttributions')} />
        <Field label="Principaux services rendus" name="principauxServices" value={data.principauxServices} {...f} rows={4} disabled={df('principauxServices')} />
      </FieldGroup>
    </div>
  )
}
