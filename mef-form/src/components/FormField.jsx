import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr } from 'date-fns/locale'
import { parseISO, format, isValid } from 'date-fns'

registerLocale('fr', fr)

// ISO string → Date object (safe)
function toDate(iso) {
  if (!iso) return null
  const d = parseISO(iso)
  return isValid(d) ? d : null
}

// Date object → ISO string
function toISO(date) {
  return date ? format(date, 'yyyy-MM-dd') : ''
}

export function SectionTitle({ number, title }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-800 pb-2">
        {number}. {title}
      </h2>
    </div>
  )
}

export function DateField({ label, name, value, onChange, showErrors = false, required = true, disabled = false, errorMsg = null }) {
  const { t } = useTranslation()
  const isEmpty = required && showErrors && !value && !disabled
  const hasError = isEmpty || !!errorMsg

  const triggerCls = [
    'w-full border rounded-lg px-3 py-2 text-sm text-left transition focus:outline-none focus:ring-2 focus:border-transparent',
    disabled
      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
      : hasError
        ? 'border-red-400 bg-red-50 focus:ring-red-400 cursor-pointer'
        : 'border-gray-300 bg-white text-gray-800 focus:ring-blue-500 cursor-pointer',
  ].join(' ')

  return (
    <div className="grid md:grid-cols-5 gap-2 items-start py-3 border-b border-gray-100 last:border-0">
      <div className="md:col-span-2 pt-2 leading-snug">
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      </div>
      <div className="md:col-span-3">
        <DatePicker
          locale="fr"
          dateFormat="dd/MM/yyyy"
          selected={toDate(value)}
          onChange={date => !disabled && onChange({ [name]: toISO(date) })}
          placeholderText={t('field.dateFormat')}
          className={triggerCls}
          wrapperClassName="w-full"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          yearDropdownItemNumber={10}
          disabled={disabled}
        />
        {isEmpty && <p className="text-xs text-red-500 mt-1">{t('field.required')}</p>}
        {!isEmpty && errorMsg && <p className="text-xs text-red-500 mt-1">{errorMsg}</p>}
      </div>
    </div>
  )
}

export function Field({
  label, name, value, onChange,
  type = 'textarea', placeholder = '', rows = 3,
  readOnly = false, showErrors = false, required = true,
  savedFields, disabled = false,
}) {
  const { t } = useTranslation()
  const prefilled = savedFields?.has(name) ?? false
  const isEmpty = required && showErrors && !disabled && (!value || String(value).trim() === '')

  const base = 'w-full border rounded-lg px-3 py-2 text-sm transition'
  const normal   = 'border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const errorCls = 'border-red-400 bg-red-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent'
  const preCls   = 'border-teal-300 bg-teal-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent'
  const roCls    = 'border-blue-200 bg-blue-50 text-blue-900 font-semibold cursor-default'
  const disCls   = 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'

  const inputCls = `${base} ${disabled ? disCls : readOnly ? roCls : isEmpty ? errorCls : prefilled ? preCls : normal}`

  const yesLabel = t('field.yesNo.yes')
  const noLabel  = t('field.yesNo.no')

  return (
    <div className="grid md:grid-cols-5 gap-2 items-start py-3 border-b border-gray-100 last:border-0">
      <div className="md:col-span-2 pt-2 leading-snug">
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {readOnly && <span className="ml-1.5 text-xs font-normal text-blue-500 italic">({t('field.automatic')})</span>}
          {required && !readOnly && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {prefilled && !readOnly && !disabled && (
          <span className="mt-1 inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs font-semibold px-1.5 py-0.5 rounded">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            {t('field.prefilled')}
          </span>
        )}
      </div>

      <div className="md:col-span-3">
        {type === 'textarea' ? (
          <textarea
            name={name}
            value={value}
            onChange={e => onChange({ [name]: e.target.value })}
            rows={rows}
            placeholder={placeholder}
            readOnly={readOnly || disabled}
            disabled={disabled}
            className={`${inputCls} resize-y`}
          />
        ) : type === 'yesno' ? (
          <div>
            <div className={`flex gap-4 pt-2 rounded-lg ${isEmpty ? 'bg-red-50 px-3 py-1 border border-red-400' : ''}`}>
              {[yesLabel, noLabel].map(opt => (
                <label key={opt} className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name={name}
                    value={opt}
                    checked={value === opt}
                    onChange={() => !disabled && onChange({ [name]: opt })}
                    disabled={disabled}
                    className="accent-blue-800 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
            {isEmpty && <p className="text-xs text-red-500 mt-1">{t('field.required')}</p>}
          </div>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={e => onChange({ [name]: e.target.value })}
            placeholder={placeholder}
            readOnly={readOnly || disabled}
            disabled={disabled}
            {...(type === 'number' ? { min: 0 } : {})}
            className={inputCls}
          />
        )}
        {isEmpty && type !== 'yesno' && (
          <p className="text-xs text-red-500 mt-1">{t('field.required')}</p>
        )}
      </div>
    </div>
  )
}

export function SearchableSelect({
  label, name, value, onChange,
  options = [], showErrors = false, required = true, savedFields,
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const prefilled = savedFields?.has(name) ?? false
  const isEmpty = required && showErrors && (!value || value.trim() === '')

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function select(option) {
    onChange({ [name]: option })
    setOpen(false)
    setQuery('')
  }

  const triggerBase = 'w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between transition focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer'
  const triggerCls = triggerBase + ' ' + (
    isEmpty
      ? 'border-red-400 bg-red-50 focus:ring-red-400'
      : prefilled
        ? 'border-teal-300 bg-teal-50 focus:ring-teal-400'
        : 'border-gray-300 bg-white text-gray-800 focus:ring-blue-500'
  )

  return (
    <div className="grid md:grid-cols-5 gap-2 items-start py-3 border-b border-gray-100 last:border-0">
      <div className="md:col-span-2 pt-2 leading-snug">
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {prefilled && (
          <span className="mt-1 inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs font-semibold px-1.5 py-0.5 rounded">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            {t('field.prefilled')}
          </span>
        )}
      </div>

      <div className="md:col-span-3 relative" ref={containerRef}>
        <button
          type="button"
          className={triggerCls}
          onClick={() => {
            setOpen(o => !o)
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
        >
          <span className={value ? 'text-gray-800' : 'text-gray-400'}>
            {value || t('field.select')}
          </span>
          <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-200 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col">
            <div className="p-2 border-b border-gray-100">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('field.search')}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1 flex-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-400 italic">{t('field.noResult')}</li>
              )}
              {filtered.map(option => (
                <li
                  key={option}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-900 ${value === option ? 'bg-blue-100 font-semibold text-blue-900' : 'text-gray-700'}`}
                  onMouseDown={() => select(option)}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isEmpty && <p className="text-xs text-red-500 mt-1">{t('field.required')}</p>}
      </div>
    </div>
  )
}

export function FieldGroup({ children }) {
  return (
    <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 px-4">
      {children}
    </div>
  )
}

export function SubGroup({ title, children }) {
  return (
    <fieldset className="border border-gray-200 rounded-xl overflow-hidden">
      <legend className="ml-4 px-2 text-xs font-bold text-blue-700 uppercase tracking-widest bg-white">
        {title}
      </legend>
      <div className="px-4 divide-y divide-gray-100">
        {children}
      </div>
    </fieldset>
  )
}

export function DynamicList({
  label, name, value = [''], onChange,
  showErrors = false, required = true,
  placeholder = '', maxItems = 20,
}) {
  const { t } = useTranslation()
  const items = Array.isArray(value) && value.length > 0 ? value : ['']
  const hasError = required && showErrors && !items.some(v => v && v.trim())

  function update(idx, val) {
    const next = [...items]
    next[idx] = val
    onChange(next)
  }

  function add() {
    if (items.length >= maxItems) return
    onChange([...items, ''])
  }

  function remove(idx) {
    if (items.length <= 1) { onChange(['']); return }
    const next = items.filter((_, i) => i !== idx)
    onChange(next)
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="grid md:grid-cols-5 gap-2 items-start">
        <div className="md:col-span-2 pt-2 leading-snug">
          <label className="text-sm font-semibold text-gray-700">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        </div>
        <div className="md:col-span-3 space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={e => update(idx, e.target.value)}
                placeholder={placeholder || t('field.addEntry')}
                className={`flex-1 border rounded-lg px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:border-transparent ${
                  hasError && !item.trim()
                    ? 'border-red-400 bg-red-50 focus:ring-red-400'
                    : 'border-gray-300 text-gray-800 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="shrink-0 w-8 h-8 mt-0.5 flex items-center justify-center rounded-md border border-gray-300 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition"
                title={t('field.remove')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          ))}
          {items.length < maxItems && (
            <button
              type="button"
              onClick={add}
              className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-medium mt-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('field.addEntry')}
            </button>
          )}
          {hasError && (
            <p className="text-xs text-red-500">{t('field.entryRequired')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function DynamicTable({
  label, name, value = [{ categorie: '', nombre: '' }], onChange,
  showErrors = false, required = true,
}) {
  const { t } = useTranslation()
  const rows = Array.isArray(value) && value.length > 0
    ? value
    : [{ categorie: '', nombre: '' }]

  const hasError = required && showErrors && !rows.some(r => r.categorie && r.categorie.trim())

  function update(idx, field, val) {
    const next = rows.map((r, i) => i === idx ? { ...r, [field]: val } : r)
    onChange(next)
  }
  function add() { onChange([...rows, { categorie: '', nombre: '' }]) }
  function remove(idx) {
    if (rows.length <= 1) { onChange([{ categorie: '', nombre: '' }]); return }
    onChange(rows.filter((_, i) => i !== idx))
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="grid md:grid-cols-5 gap-2 items-start">
        <div className="md:col-span-2 pt-2 leading-snug">
          <label className="text-sm font-semibold text-gray-700">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <p className="text-xs text-gray-400 mt-0.5">{t('field.categoryHint')}</p>
        </div>
        <div className="md:col-span-3 space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={row.categorie}
                onChange={e => update(idx, 'categorie', e.target.value)}
                placeholder="Ex. Catégorie A"
                className={`flex-1 border rounded-lg px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:border-transparent ${
                  hasError && !row.categorie.trim()
                    ? 'border-red-400 bg-red-50 focus:ring-red-400'
                    : 'border-gray-300 text-gray-800 focus:ring-blue-500'
                }`}
              />
              <input
                type="number"
                value={row.nombre}
                onChange={e => update(idx, 'nombre', e.target.value)}
                placeholder="Nbre"
                min="0"
                className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="shrink-0 w-8 h-8 mt-0.5 flex items-center justify-center rounded-md border border-gray-300 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition"
                title={t('field.remove')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-medium mt-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('field.addCategory')}
          </button>
          {hasError && (
            <p className="text-xs text-red-500">{t('field.categoryRequired')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
