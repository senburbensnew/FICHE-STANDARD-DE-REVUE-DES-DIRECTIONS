import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step7Communication({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="VII" title="Communication, Systèmes et Dématérialisation" />
      <FieldGroup>
        <Field label="Niveau de circulation de l'information en interne" name="circulationInfo" value={data.circulationInfo} {...f} rows={3} />
        <Field label="Relations avec les autres structures du MEF" name="relationsAutresStructures" value={data.relationsAutresStructures} {...f} rows={3} />
        <Field label="Outils numériques utilisés" name="outilsNumeriques" value={data.outilsNumeriques} {...f} rows={3} />
        <Field label="Procédures dématérialisées existantes" name="proceduresDematerialisees" value={data.proceduresDematerialisees} {...f} rows={3} />
        <Field label="Procédures encore manuelles" name="proceduresManuelles" value={data.proceduresManuelles} {...f} rows={3} />
        <Field label="Besoins en digitalisation" name="besoinsDig" value={data.besoinsDig} {...f} rows={3} />
        <Field label="Difficultés liées à internet, aux réseaux ou aux systèmes" name="difficultesInternet" value={data.difficultesInternet} {...f} rows={3} />
      </FieldGroup>
    </div>
  )
}
