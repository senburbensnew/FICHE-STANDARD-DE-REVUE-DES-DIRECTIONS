import { useTranslation } from 'react-i18next'
import { SectionTitle } from '../components/FormField'

function OrderedInput({ label, value, onChange, placeholder, showErrors, required = true }) {
  const { t } = useTranslation()
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
        {isEmpty && <p className="text-xs text-red-500 mt-1">{t('field.required')}</p>}
      </div>
    </div>
  )
}

export default function Step9Contraintes({ data, onChange, showErrors }) {
  const { t } = useTranslation()

  function updateContrainte(idx, val) {
    const next = data.contraintes.map((c, i) => i === idx ? { ...c, contrainte: val } : c)
    onChange({ contraintes: next })
  }

  function updateBesoin(idx, val) {
    const next = data.besoinsPrioritaires.map((b, i) => i === idx ? { ...b, besoin: val } : b)
    onChange({ besoinsPrioritaires: next })
  }

  const contraintePlaceholders = [
    t('steps.s9.contraintePlaceholder_1'),
    t('steps.s9.contraintePlaceholder_2'),
    t('steps.s9.contraintePlaceholder_3'),
  ]

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle number="IX" title={t('steps.s9.titleContraintes')} />
        <p className="text-sm text-gray-500 mb-4">{t('steps.s9.noticeContraintes')}</p>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 px-4">
          {data.contraintes.map((c, idx) => (
            <OrderedInput
              key={idx}
              label={t('steps.s9.contrainte', { n: idx + 1 })}
              value={c.contrainte}
              onChange={(val) => updateContrainte(idx, val)}
              placeholder={contraintePlaceholders[idx] || ''}
              showErrors={showErrors}
              required={idx === 0}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle number="X" title={t('steps.s9.titleBesoins')} />
        <p className="text-sm text-gray-500 mb-4">{t('steps.s9.noticeBesoins')}</p>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 px-4">
          {data.besoinsPrioritaires.map((b, idx) => (
            <OrderedInput
              key={idx}
              label={t('steps.s9.besoin', { n: idx + 1 })}
              value={b.besoin}
              onChange={(val) => updateBesoin(idx, val)}
              placeholder={t('steps.s9.besoinPlaceholder', { n: idx + 1 })}
              showErrors={showErrors}
              required={idx === 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
