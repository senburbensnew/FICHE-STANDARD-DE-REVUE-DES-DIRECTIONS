import { SectionTitle } from '../components/FormField'

function OrderedInput({ label, value, onChange, placeholder, showErrors, required = true }) {
  const isEmpty = showErrors && required && (!value || value.trim() === '')
  return (
    <div className="grid md:grid-cols-5 gap-2 items-start py-3 border-b border-gray-100 last:border-0">
      <label className="md:col-span-2 text-sm font-semibold text-gray-700 pt-2">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="md:col-span-3">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
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

/**
 * Gère les contraintes (max 3) → table revue_contraintes {ordre, contrainte}
 * et les besoins prioritaires (max 5) → table revue_besoins_prioritaires {ordre, besoin}
 */
export default function Step9Contraintes({ data, onChange, showErrors }) {
  function updateContrainte(idx, val) {
    const next = data.contraintes.map((c, i) => i === idx ? { ...c, contrainte: val } : c)
    onChange({ contraintes: next })
  }

  function updateBesoin(idx, val) {
    const next = data.besoinsPrioritaires.map((b, i) => i === idx ? { ...b, besoin: val } : b)
    onChange({ besoinsPrioritaires: next })
  }

  return (
    <div className="space-y-8">
      {/* Section IX — Contraintes majeures (max 3) */}
      <div>
        <SectionTitle number="IX" title="Contraintes Majeures" />
        <p className="text-sm text-gray-500 mb-4">
          Veuillez classer les trois principales contraintes de la structure (au moins la première est obligatoire) :
        </p>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 px-4">
          {data.contraintes.map((c, idx) => (
            <OrderedInput
              key={idx}
              label={`Contrainte ${idx + 1}`}
              value={c.contrainte}
              onChange={(val) => updateContrainte(idx, val)}
              placeholder={`${idx === 0 ? 'Contrainte principale…' : idx === 1 ? 'Deuxième contrainte…' : 'Troisième contrainte…'}`}
              showErrors={showErrors}
              required={idx === 0}
            />
          ))}
        </div>
      </div>

      {/* Section X — Besoins prioritaires (max 5) */}
      <div>
        <SectionTitle number="X" title="Besoins Prioritaires" />
        <p className="text-sm text-gray-500 mb-4">
          Veuillez indiquer les besoins les plus urgents à satisfaire (au moins le premier est obligatoire) :
        </p>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 px-4">
          {data.besoinsPrioritaires.map((b, idx) => (
            <OrderedInput
              key={idx}
              label={`Besoin ${idx + 1}`}
              value={b.besoin}
              onChange={(val) => updateBesoin(idx, val)}
              placeholder={`Besoin prioritaire n°${idx + 1}…`}
              showErrors={showErrors}
              required={idx === 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
