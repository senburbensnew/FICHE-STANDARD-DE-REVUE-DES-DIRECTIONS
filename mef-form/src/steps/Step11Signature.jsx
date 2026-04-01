import { SectionTitle, Field, FieldGroup, DateField } from '../components/FormField'

export default function Step11Signature({ data, onChange, showErrors, savedFields }) {
  const f = { onChange, showErrors, savedFields }
  return (
    <div className="space-y-8">
      {/* Section XIII */}
      <div>
        <SectionTitle number="XIII" title="Observations Complémentaires" />
        <FieldGroup>
          <Field label="Observations complémentaires" name="observationsComplementaires" value={data.observationsComplementaires} {...f} rows={5} placeholder="Toute observation jugée utile pour compléter la fiche..." />
        </FieldGroup>
      </div>

      {/* Section XIV */}
      <div>
        <SectionTitle number="XIV" title="Signature" />
        <FieldGroup>
          <Field label="Nom du Responsable" name="nomResponsable" value={data.nomResponsable} {...f} type="text" />
          <Field label="Fonction" name="fonctionSignature" value={data.fonctionSignature} {...f} type="text" />
          <DateField label="Date" name="date" value={data.date} onChange={onChange} showErrors={showErrors} />
        </FieldGroup>

        <div className="mt-6 border border-gray-200 rounded-lg p-5 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700 mb-3">Signature</p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center bg-white">
            <span className="text-gray-400 text-sm italic">Zone de signature</span>
          </div>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 italic">
            <strong>Nb.</strong> — Toutes les rubriques doivent être renseignées avec précision car les informations
            fournies serviront de base aux échanges lors de la réunion.
          </p>
        </div>
      </div>
    </div>
  )
}
