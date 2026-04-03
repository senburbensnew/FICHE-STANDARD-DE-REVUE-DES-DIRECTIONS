import { SectionTitle, Field, FieldGroup, DynamicList } from '../components/FormField'

export default function Step8Rapports({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="VIII" title="Production de Rapports, Statistiques et Livrables" />
      <FieldGroup>
        {/* Champs uniques → revue_rapports */}
        <Field label="Rapports périodiques produits ?" name="rapportsPeriodiques" value={data.rapportsPeriodiques} {...f} type="yesno" />
        <Field label="Fréquence de production" name="frequenceProduction" value={data.frequenceProduction} {...f} type="text" placeholder="ex. Mensuelle, Trimestrielle…" />
        <Field label="Tableaux de bord disponibles ?" name="tableauxBord" value={data.tableauxBord} {...f} type="yesno" />
        <Field label="Statistiques disponibles ?" name="statistiquesDisponibles" value={data.statistiquesDisponibles} {...f} type="yesno" />
        <Field label="Retards ou insuffisances constatés dans la production des rapports" name="retardsRapports" value={data.retardsRapports} {...f} rows={3} />

        {/* Derniers rapports produits — table revue_derniers_rapports (Multiple) */}
        <DynamicList
          label="Derniers rapports produits"
          name="derniersRapports"
          value={data.derniersRapports}
          onChange={(val) => onChange({ derniersRapports: val })}
          showErrors={showErrors}
          placeholder="Ex. Rapport mensuel de mars 2025…"
        />

        {/* Principaux livrables — table revue_livrables (Multiple) */}
        <DynamicList
          label="Principaux livrables réalisés"
          name="principauxLivrables"
          value={data.principauxLivrables}
          onChange={(val) => onChange({ principauxLivrables: val })}
          showErrors={showErrors}
          placeholder="Ex. Guide de procédures…"
        />

        {/* Causes difficultés rapports — table revue_causes_difficultes_rapports (Multiple) */}
        <DynamicList
          label="Causes des difficultés dans la production des rapports"
          name="causesRapports"
          value={data.causesRapports}
          onChange={(val) => onChange({ causesRapports: val })}
          showErrors={showErrors}
          placeholder="Ex. Manque de données sources…"
        />
      </FieldGroup>
    </div>
  )
}
