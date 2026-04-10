import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionTitle, Field, FieldGroup, DynamicList } from '../components/FormField'
import { fetchSuggestionsCausesRapports } from '../api'

const FREQUENCES_OPTIONS = [
  'Journalier',
  'Hebdomadaire',
  'Bimensuel',
  'Mensuel',
  'Trimestriel',
  'Semestriel',
  'Annuel',
]

function FrequenceField({ label, value = [], autreValue = '', onChange, showErrors }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const selected = Array.isArray(value) ? value : (value ? [value] : [])
  const autreChecked = selected.includes('Autre')
  const isEmpty = showErrors && selected.length === 0

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function toggle(option) {
    const next = selected.includes(option)
      ? selected.filter(v => v !== option)
      : [...selected, option]
    const updates = { frequenceProduction: next }
    if (option === 'Autre' && !next.includes('Autre')) updates.frequenceAutre = ''
    onChange(updates)
  }

  const displayLabel = selected.length === 0
    ? '— Sélectionner —'
    : selected.map(v => v === 'Autre' && autreValue ? autreValue : v).join(', ')

  const triggerCls = [
    'w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between transition focus:outline-none focus:ring-2 focus:border-transparent bg-white cursor-pointer',
    isEmpty ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500',
  ].join(' ')

  return (
    <div className="grid md:grid-cols-5 gap-2 items-start py-3 border-b border-gray-100 last:border-0">
      <div className="md:col-span-2 pt-2 leading-snug">
        <label className="text-sm font-semibold text-gray-700">
          {label}<span className="ml-0.5 text-red-500">*</span>
        </label>
      </div>
      <div className="md:col-span-3 space-y-2" ref={containerRef}>
        <div className="relative">
          <button type="button" onClick={() => setOpen(o => !o)} className={triggerCls}>
            <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-800 truncate'}>
              {displayLabel}
            </span>
            <svg className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              {FREQUENCES_OPTIONS.map(opt => (
                <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggle(opt)}
                    className="accent-blue-700 w-4 h-4 shrink-0"
                  />
                  {opt}
                </label>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autreChecked}
                    onChange={() => toggle('Autre')}
                    className="accent-blue-700 w-4 h-4 shrink-0"
                  />
                  Autre
                </label>
              </div>
            </div>
          )}
        </div>

        {autreChecked && (
          <input
            type="text"
            value={autreValue}
            onChange={e => onChange({ frequenceAutre: e.target.value })}
            placeholder="Préciser la fréquence…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}

        {isEmpty && <p className="text-xs text-red-500 mt-1">Champ obligatoire</p>}
      </div>
    </div>
  )
}

export default function Step8Rapports({ data, onChange, showErrors }) {
  const { t } = useTranslation()
  const f = { onChange, showErrors }
  const [sugCauses, setSugCauses] = useState([])

  useEffect(() => {
    fetchSuggestionsCausesRapports().then(setSugCauses).catch(() => {})
  }, [])

  return (
    <div>
      <SectionTitle number="VIII" title={t('steps.s8.title')} />
      <FieldGroup>
        <Field label={t('steps.s8.rapportsPeriodiques')}   name="rapportsPeriodiques"   value={data.rapportsPeriodiques}   {...f} type="yesno" />
        <FrequenceField label={t('steps.s8.frequenceProduction')} value={data.frequenceProduction} autreValue={data.frequenceAutre} onChange={onChange} showErrors={showErrors} />
        <Field label={t('steps.s8.tableauxBord')}          name="tableauxBord"          value={data.tableauxBord}          {...f} type="yesno" />
        <Field label={t('steps.s8.statistiquesDisponibles')} name="statistiquesDisponibles" value={data.statistiquesDisponibles} {...f} type="yesno" />
        <Field label={t('steps.s8.retardsRapports')}       name="retardsRapports"       value={data.retardsRapports}       {...f} rows={3} />

        <DynamicList
          label={t('steps.s8.derniersRapports')}
          name="derniersRapports"
          value={data.derniersRapports}
          onChange={(val) => onChange({ derniersRapports: val })}
          showErrors={showErrors}
          placeholder={t('steps.s8.derniersRapportsPlaceholder')}
        />
        <DynamicList
          label={t('steps.s8.principauxLivrables')}
          name="principauxLivrables"
          value={data.principauxLivrables}
          onChange={(val) => onChange({ principauxLivrables: val })}
          showErrors={showErrors}
          placeholder={t('steps.s8.principauxLivrablesPlaceholder')}
        />
        <DynamicList
          label={t('steps.s8.causesRapports')}
          name="causesRapports"
          value={data.causesRapports}
          onChange={(val) => onChange({ causesRapports: val })}
          showErrors={showErrors}
          placeholder={t('steps.s8.causesRapportsPlaceholder')}
          suggestions={sugCauses}
        />
      </FieldGroup>
    </div>
  )
}
