import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step3RessourcesHumaines({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="III" title="Situation des Ressources Humaines" />
      <FieldGroup>
        <Field label="Effectif théorique" name="effectifTheorique" value={data.effectifTheorique} {...f} type="text" />
        <Field label="Effectif en poste / Agent actif" name="effectifPoste" value={data.effectifPoste} {...f} type="text" />
        <Field label="Effectif réellement disponible" name="effectifDisponible" value={data.effectifDisponible} {...f} type="text" />
        <Field label="Répartition du personnel par catégorie" name="repartitionPersonnel" value={data.repartitionPersonnel} {...f} rows={3} />
        <Field label="Postes vacants" name="postesVacants" value={data.postesVacants} {...f} rows={2} />
        <Field label="Besoins prioritaires en personnel" name="besoinsPrioPersonnel" value={data.besoinsPrioPersonnel} {...f} rows={3} />
        <Field label="Besoins en formation / renforcement de capacités" name="besoinsFormation" value={data.besoinsFormation} {...f} rows={3} />
        <Field label="Principales difficultés liées aux ressources humaines" name="difficultesRH" value={data.difficultesRH} {...f} rows={3} />
      </FieldGroup>
    </div>
  )
}
