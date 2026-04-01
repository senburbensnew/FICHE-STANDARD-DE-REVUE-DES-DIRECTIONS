import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step2Mission({ data, onChange, showErrors, savedFields }) {
  const f = { onChange, showErrors, savedFields }
  return (
    <div>
      <SectionTitle number="II" title="Mission et Attributions" />
      <FieldGroup>
        <Field label="Mission principale de la structure" name="missionPrincipale" value={data.missionPrincipale} {...f} rows={4} />
        <Field label="Principales attributions" name="principalesAttributions" value={data.principalesAttributions} {...f} rows={4} />
        <Field label="Principaux services rendus" name="principauxServices" value={data.principauxServices} {...f} rows={4} />
      </FieldGroup>
    </div>
  )
}
