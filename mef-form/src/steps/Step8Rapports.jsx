import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step8Rapports({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="VIII" title="Production de Rapports, Statistiques et Livrables" />
      <FieldGroup>
        <Field label="Rapports périodiques produits ?" name="rapportsPeriodiques" value={data.rapportsPeriodiques} {...f} type="yesno" />
        <Field label="Fréquence de production" name="frequenceProduction" value={data.frequenceProduction} {...f} type="text" placeholder="ex. Mensuelle, Trimestrielle..." />
        <Field label="Derniers rapports produits" name="derniersRapports" value={data.derniersRapports} {...f} rows={3} />
        <Field label="Tableaux de bord disponibles ?" name="tableauxBord" value={data.tableauxBord} {...f} type="yesno" />
        <Field label="Statistiques disponibles ?" name="statistiquesDisponibles" value={data.statistiquesDisponibles} {...f} type="yesno" />
        <Field label="Principaux livrables réalisés" name="principauxLivrables" value={data.principauxLivrables} {...f} rows={3} />
        <Field label="Retards ou insuffisances constatés dans la production des rapports" name="retardsRapports" value={data.retardsRapports} {...f} rows={3} />
        <Field label="Causes des difficultés dans la production des rapports" name="causesRapports" value={data.causesRapports} {...f} rows={3} />
      </FieldGroup>
    </div>
  )
}
