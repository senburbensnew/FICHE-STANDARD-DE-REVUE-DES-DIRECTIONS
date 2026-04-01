import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step4Fonctionnement({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="IV" title="État de Fonctionnement de la Structure" />
      <FieldGroup>
        <Field label="Activités principales réalisées durant la période" name="activitesRealisees" value={data.activitesRealisees} {...f} rows={4} />
        <Field label="Activités en cours" name="activitesEnCours" value={data.activitesEnCours} {...f} rows={3} />
        <Field label="Activités non réalisées ou partiellement réalisées" name="activitesNonRealisees" value={data.activitesNonRealisees} {...f} rows={3} />
        <Field label="Résultats obtenus" name="resultatsObtenus" value={data.resultatsObtenus} {...f} rows={4} />
        <Field label="Difficultés ayant affecté l'exécution des activités" name="difficultesExecution" value={data.difficultesExecution} {...f} rows={3} />
      </FieldGroup>
    </div>
  )
}
