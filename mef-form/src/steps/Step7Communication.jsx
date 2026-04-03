import { SectionTitle, Field, FieldGroup, DynamicList } from '../components/FormField'

export default function Step7Communication({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="VII" title="Communication, Systèmes et Dématérialisation" />
      <FieldGroup>
        {/* Champs uniques → revue_communication */}
        <Field label="Niveau de circulation de l'information en interne" name="circulationInfo" value={data.circulationInfo} {...f} rows={3} />
        <Field label="Relations avec les autres structures du MEF" name="relationsAutresStructures" value={data.relationsAutresStructures} {...f} rows={3} />
        <Field label="Difficultés liées à internet, aux réseaux ou aux systèmes" name="difficultesInternet" value={data.difficultesInternet} {...f} rows={3} />

        {/* Outils numériques — table revue_outils_numeriques (Multiple) */}
        <DynamicList
          label="Outils numériques utilisés"
          name="outilsNumeriques"
          value={data.outilsNumeriques}
          onChange={(val) => onChange({ outilsNumeriques: val })}
          showErrors={showErrors}
          placeholder="Ex. SIGTAS, e-mail, Teams…"
        />

        {/* Procédures dématérialisées — table revue_procedures_dematerialisees (Multiple) */}
        <DynamicList
          label="Procédures dématérialisées existantes"
          name="proceduresDematerialisees"
          value={data.proceduresDematerialisees}
          onChange={(val) => onChange({ proceduresDematerialisees: val })}
          showErrors={showErrors}
          placeholder="Ex. Déclaration fiscale en ligne…"
        />

        {/* Procédures manuelles — table revue_procedures_manuelles (Multiple) */}
        <DynamicList
          label="Procédures encore manuelles"
          name="proceduresManuelles"
          value={data.proceduresManuelles}
          onChange={(val) => onChange({ proceduresManuelles: val })}
          showErrors={showErrors}
          placeholder="Ex. Émission manuelle de reçus…"
        />

        {/* Besoins digitalisation — table revue_besoins_digitalisation (Multiple) */}
        <DynamicList
          label="Besoins en digitalisation"
          name="besoinsDig"
          value={data.besoinsDig}
          onChange={(val) => onChange({ besoinsDig: val })}
          showErrors={showErrors}
          placeholder="Ex. Numérisation des archives…"
        />
      </FieldGroup>
    </div>
  )
}
