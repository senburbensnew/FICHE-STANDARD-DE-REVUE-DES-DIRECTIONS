import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionTitle } from '../components/FormField'
import { fetchSuggestionsContraintes, fetchSuggestionsBesoins } from '../api'

// ── Combo input : texte libre + suggestions depuis les revues passées ──────────
function SuggestionInput({ label, value, onChange, placeholder, suggestions, showErrors, required = true }) {
  const { t } = useTranslation()
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState(value || '')
  const [pos, setPos]         = useState({ top: 0, left: 0, width: 0 })
  const inputRef              = useRef(null)
  const dropRef               = useRef(null)

  // Sync external value → local query (e.g. when form is reset)
  useEffect(() => { setQuery(value || '') }, [value])

  // Close on outside click
  useEffect(() => {
    function onDown(e) {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        dropRef.current  && !dropRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const isNew     = query.trim() && !suggestions.includes(query.trim())
  const filtered  = query.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions.slice(0, 10)

  const isEmpty = showErrors && required && (!value || !value.trim())

  function openDrop() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  function handleChange(e) {
    const v = e.target.value
    setQuery(v)
    onChange(v)
    openDrop()
  }

  function handleSelect(s) {
    setQuery(s)
    onChange(s)
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'Enter' && query.trim()) {
      setOpen(false)
      e.preventDefault()
    }
  }

  return (
    <div className="grid md:grid-cols-5 gap-2 items-start py-3 border-b border-gray-100 last:border-0">
      <label className="md:col-span-2 text-sm font-semibold text-gray-700 pt-2">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="md:col-span-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={openDrop}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className={`w-full border rounded-lg px-3 py-2 pr-8 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition ${
              isEmpty
                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {/* Badge "Nouveau" quand la valeur n'existe pas dans les suggestions */}
          {isNew && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full pointer-events-none">
              Nouveau
            </span>
          )}
        </div>

        {isEmpty && <p className="text-xs text-red-500 mt-1">{t('field.required')}</p>}

        {/* Dropdown suggestions — fixed positioning to escape any overflow:hidden parent */}
        {open && filtered.length > 0 && (
          <div
            ref={dropRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999, maxHeight: 220 }}
            className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
              Déjà utilisé dans les revues passées
            </div>
            <div className="overflow-auto" style={{ maxHeight: 180 }}>
              {filtered.map((s, i) => {
                const idx    = s.toLowerCase().indexOf(query.toLowerCase())
                const before = s.slice(0, idx)
                const match  = s.slice(idx, idx + query.length)
                const after  = s.slice(idx + query.length)
                return (
                  <button
                    key={i}
                    type="button"
                    tabIndex={0}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                  >
                    {query.trim()
                      ? <>{before}<span className="font-bold text-blue-700">{match}</span>{after}</>
                      : s
                    }
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step 9 ─────────────────────────────────────────────────────────────────────
export default function Step9Contraintes({ data, onChange, showErrors }) {
  const { t } = useTranslation()
  const [suggestionsContraintes, setSuggestionsContraintes] = useState([])
  const [suggestionsBesoins,     setSuggestionsBesoins]     = useState([])

  useEffect(() => {
    fetchSuggestionsContraintes().then(setSuggestionsContraintes).catch(() => {})
    fetchSuggestionsBesoins().then(setSuggestionsBesoins).catch(() => {})
  }, [])

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
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-visible bg-gray-50 px-4">
          {data.contraintes.map((c, idx) => (
            <SuggestionInput
              key={idx}
              label={t('steps.s9.contrainte', { n: idx + 1 })}
              value={c.contrainte}
              onChange={val => updateContrainte(idx, val)}
              placeholder={contraintePlaceholders[idx] || ''}
              suggestions={suggestionsContraintes}
              showErrors={showErrors}
              required={idx === 0}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle number="X" title={t('steps.s9.titleBesoins')} />
        <p className="text-sm text-gray-500 mb-4">{t('steps.s9.noticeBesoins')}</p>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-visible bg-gray-50 px-4">
          {data.besoinsPrioritaires.map((b, idx) => (
            <SuggestionInput
              key={idx}
              label={t('steps.s9.besoin', { n: idx + 1 })}
              value={b.besoin}
              onChange={val => updateBesoin(idx, val)}
              placeholder={t('steps.s9.besoinPlaceholder', { n: idx + 1 })}
              suggestions={suggestionsBesoins}
              showErrors={showErrors}
              required={idx === 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
