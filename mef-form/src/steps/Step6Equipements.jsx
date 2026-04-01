import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step6Equipements({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="VI" title="Équipements et Moyens Logistiques" />
      <FieldGroup>
        <Field label="Disponibilité du mobilier de bureau" name="mobilierBureau" value={data.mobilierBureau} {...f} rows={2} />
        <Field label="Disponibilité de matériel informatique" name="materielInformatique" value={data.materielInformatique} {...f} rows={2} />
        <Field label="État des ordinateurs et imprimantes" name="etatOrdinateurs" value={data.etatOrdinateurs} {...f} rows={2} />
        <Field label="Disponibilité d'électricité" name="electricite" value={data.electricite} {...f} rows={2} />
        <Field label="Disponibilité d'internet" name="internet" value={data.internet} {...f} rows={2} />
        <Field label="Disponibilité de véhicules / moyens de transport" name="vehicules" value={data.vehicules} {...f} rows={2} />
        <Field label="Autres équipements essentiels" name="autresEquipements" value={data.autresEquipements} {...f} rows={3} />
        <Field label="Principales insuffisances matérielles et logistiques" name="insuffisancesMaterielles" value={data.insuffisancesMaterielles} {...f} rows={3} />
      </FieldGroup>
    </div>
  )
}
