import { SectionTitle, Field, FieldGroup, DynamicList } from '../components/FormField'

export default function Step5Locaux({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="V" title="Locaux, Infrastructures et Image Institutionnelle" />
      <FieldGroup>
        {/* Champs uniques → revue_infrastructures */}
        <Field label="Les locaux sont-ils adaptés aux missions de la structure ?" name="locauxAdaptes" value={data.locauxAdaptes} {...f} type="yesno" />
        <Field label="État général des bâtiments" name="etatBatiments" value={data.etatBatiments} {...f} rows={3} />
        <Field label="Niveau d'exiguïté ou inadéquation des espaces" name="niveauExiguite" value={data.niveauExiguite} {...f} rows={2} />
        <Field label="État de propreté et d'entretien" name="etatProprete" value={data.etatProprete} {...f} rows={2} />
        <Field label="Signalétique et identification institutionnelle visibles ?" name="signaletique" value={data.signaletique} {...f} type="yesno" />
        <Field label="Conditions d'accueil du public" name="conditionsAccueil" value={data.conditionsAccueil} {...f} rows={3} />

        {/* Travaux prioritaires — table revue_travaux_prioritaires (Multiple) */}
        <DynamicList
          label="Travaux ou améliorations prioritaires à envisager"
          name="travauxPrioritaires"
          value={data.travauxPrioritaires}
          onChange={(val) => onChange({ travauxPrioritaires: val })}
          showErrors={showErrors}
          placeholder="Ex. Réfection de la toiture…"
        />
      </FieldGroup>
    </div>
  )
}
