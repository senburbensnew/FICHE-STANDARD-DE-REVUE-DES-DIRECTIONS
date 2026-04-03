import { SectionTitle, Field, FieldGroup, DynamicList, DateField } from '../components/FormField'

export default function Step11Signature({ data, onChange, showErrors, savedFields }) {
  const f = { onChange, showErrors, savedFields }
  return (
    <div className="space-y-8">
      {/* Section XIII — Observations complémentaires (Multiple → revue_observations) */}
      <div>
        <SectionTitle number="XIII" title="Observations Complémentaires" />
        <FieldGroup>
          <DynamicList
            label="Observations complémentaires"
            name="observations"
            value={data.observations}
            onChange={(val) => onChange({ observations: val })}
            showErrors={showErrors}
            placeholder="Toute observation jugée utile pour compléter la fiche…"
          />
        </FieldGroup>
      </div>

      {/* Section XIV — Signature → revue_signature */}
      <div>
        <SectionTitle number="XIV" title="Signature" />
        <FieldGroup>
          <Field label="Nom du Responsable signataire" name="nomResponsable" value={data.nomResponsable} {...f} type="text" />
          <Field label="Fonction du signataire" name="fonctionSignature" value={data.fonctionSignature} {...f} type="text" />
          <DateField label="Date de signature" name="dateSignature" value={data.dateSignature} onChange={onChange} showErrors={showErrors} />
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
