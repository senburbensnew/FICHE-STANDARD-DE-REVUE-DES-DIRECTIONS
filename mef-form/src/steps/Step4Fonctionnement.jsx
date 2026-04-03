import { SectionTitle, FieldGroup, DynamicList } from '../components/FormField'

export default function Step4Fonctionnement({ data, onChange, showErrors }) {
  return (
    <div>
      <SectionTitle number="IV" title="État de Fonctionnement de la Structure" />
      <FieldGroup>
        {/* Activités — table revue_activites (type=principale_realisee) */}
        <DynamicList
          label="Activités principales réalisées durant la période"
          name="activitesRealisees"
          value={data.activitesRealisees}
          onChange={(val) => onChange({ activitesRealisees: val })}
          showErrors={showErrors}
          placeholder="Décrire une activité réalisée…"
        />

        {/* Activités en cours — type=en_cours */}
        <DynamicList
          label="Activités en cours"
          name="activitesEnCours"
          value={data.activitesEnCours}
          onChange={(val) => onChange({ activitesEnCours: val })}
          showErrors={showErrors}
          placeholder="Décrire une activité en cours…"
        />

        {/* Activités non réalisées — type=non_realisee */}
        <DynamicList
          label="Activités non réalisées ou partiellement réalisées"
          name="activitesNonRealisees"
          value={data.activitesNonRealisees}
          onChange={(val) => onChange({ activitesNonRealisees: val })}
          showErrors={showErrors}
          placeholder="Décrire une activité non réalisée…"
        />

        {/* Résultats — table revue_resultats */}
        <DynamicList
          label="Résultats obtenus"
          name="resultatsObtenus"
          value={data.resultatsObtenus}
          onChange={(val) => onChange({ resultatsObtenus: val })}
          showErrors={showErrors}
          placeholder="Décrire un résultat obtenu…"
        />

        {/* Difficultés — table revue_difficultes_activites */}
        <DynamicList
          label="Difficultés ayant affecté l'exécution des activités"
          name="difficultesExecution"
          value={data.difficultesExecution}
          onChange={(val) => onChange({ difficultesExecution: val })}
          showErrors={showErrors}
          placeholder="Décrire une difficulté rencontrée…"
        />
      </FieldGroup>
    </div>
  )
}
