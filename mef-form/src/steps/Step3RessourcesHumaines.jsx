import { SectionTitle, Field, FieldGroup, DynamicList, DynamicTable } from '../components/FormField'

export default function Step3RessourcesHumaines({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="III" title="Situation des Ressources Humaines" />
      <FieldGroup>
        {/* Effectifs scalaires */}
        <Field label="Effectif théorique" name="effectifTheorique" value={data.effectifTheorique} {...f} type="text" />
        <Field label="Effectif en poste / Agent actif" name="effectifPoste" value={data.effectifPoste} {...f} type="text" />
        <Field label="Effectif réellement disponible" name="effectifDisponible" value={data.effectifDisponible} {...f} type="text" />
        <Field label="Postes vacants" name="postesVacants" value={data.postesVacants} {...f} type="text" />

        {/* Répartition par catégorie — table normalisée revue_repartition_personnel */}
        <DynamicTable
          label="Répartition du personnel par catégorie"
          name="repartitionPersonnel"
          value={data.repartitionPersonnel}
          onChange={(val) => onChange({ repartitionPersonnel: val })}
          showErrors={showErrors}
        />

        {/* Besoins en personnel — table revue_besoins_personnel */}
        <DynamicList
          label="Besoins prioritaires en personnel"
          name="besoinsPrioPersonnel"
          value={data.besoinsPrioPersonnel}
          onChange={(val) => onChange({ besoinsPrioPersonnel: val })}
          showErrors={showErrors}
          placeholder="Ex. Recrutement d'un comptable…"
        />

        {/* Besoins en formation — table revue_besoins_formation */}
        <DynamicList
          label="Besoins en formation / renforcement de capacités"
          name="besoinsFormation"
          value={data.besoinsFormation}
          onChange={(val) => onChange({ besoinsFormation: val })}
          showErrors={showErrors}
          placeholder="Ex. Formation en gestion de projet…"
        />

        {/* Difficultés RH — champ unique revue_ressources_humaines.difficultes_rh */}
        <Field label="Principales difficultés liées aux ressources humaines" name="difficultesRH" value={data.difficultesRH} {...f} rows={3} />
      </FieldGroup>
    </div>
  )
}
