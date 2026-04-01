import { SectionTitle } from '../components/FormField'

function ListInputField({ label, name, value, onChange, placeholder, showErrors }) {
  const isEmpty = showErrors && (!value || value.trim() === '')
  return (
    <div className="grid md:grid-cols-5 gap-2 items-start py-3 border-b border-gray-100 last:border-0">
      <label className="md:col-span-2 text-sm font-semibold text-gray-700 pt-2">
        {label}<span className="ml-0.5 text-red-500">*</span>
      </label>
      <div className="md:col-span-3">
        <input
          type="text"
          value={value}
          onChange={e => onChange({ [name]: e.target.value })}
          placeholder={placeholder}
          className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition ${
            isEmpty
              ? 'border-red-400 bg-red-50 focus:ring-red-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {isEmpty && <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>}
      </div>
    </div>
  )
}

export default function Step9Contraintes({ data, onChange, showErrors }) {
  const f = { onChange, showErrors }
  return (
    <div className="space-y-8">
      {/* Section IX */}
      <div>
        <SectionTitle number="IX" title="Contraintes Majeures" />
        <p className="text-sm text-gray-500 mb-4">
          Veuillez classer les trois principales contraintes de la structure :
        </p>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 px-4">
          <ListInputField label="Contrainte 1" name="contrainte1" value={data.contrainte1} {...f} placeholder="Première contrainte principale..." />
          <ListInputField label="Contrainte 2" name="contrainte2" value={data.contrainte2} {...f} placeholder="Deuxième contrainte principale..." />
          <ListInputField label="Contrainte 3" name="contrainte3" value={data.contrainte3} {...f} placeholder="Troisième contrainte principale..." />
        </div>
      </div>

      {/* Section X */}
      <div>
        <SectionTitle number="X" title="Besoins Prioritaires" />
        <p className="text-sm text-gray-500 mb-4">
          Veuillez indiquer les besoins les plus urgents à satisfaire :
        </p>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 px-4">
          <ListInputField label="Besoin 1" name="besoin1" value={data.besoin1} {...f} placeholder="Besoin prioritaire n°1..." />
          <ListInputField label="Besoin 2" name="besoin2" value={data.besoin2} {...f} placeholder="Besoin prioritaire n°2..." />
          <ListInputField label="Besoin 3" name="besoin3" value={data.besoin3} {...f} placeholder="Besoin prioritaire n°3..." />
          <ListInputField label="Besoin 4" name="besoin4" value={data.besoin4} {...f} placeholder="Besoin prioritaire n°4..." />
          <ListInputField label="Besoin 5" name="besoin5" value={data.besoin5} {...f} placeholder="Besoin prioritaire n°5..." />
        </div>
      </div>
    </div>
  )
}
