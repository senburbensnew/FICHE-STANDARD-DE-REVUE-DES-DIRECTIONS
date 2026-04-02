import { useState, useRef, useEffect } from 'react'
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

export function DateField({ label, name, value, onChange, showErrors = false, required = true, disabled = false }) {
  const isEmpty = required && showErrors && !value && !disabled

  const triggerCls = [
    'w-full border rounded-lg px-3 py-2 text-sm text-left transition focus:outline-none focus:ring-2 focus:border-transparent',
    disabled
      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
      : isEmpty
        ? 'border-red-400 bg-red-50 focus:ring-red-400 cursor-pointer'
        : 'border-gray-300 bg-white text-gray-800 focus:ring-blue-500 cursor-pointer',
  ].join(' ')

  return (
    <div className={`grid md:grid-cols-5 gap-2 items-start py-3 border-b border-gray-100 last:border-0 ${disabled ? 'opacity-50' : ''}`}>
      <div className="md:col-span-2 pt-2 leading-snug">
        <label className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
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
          placeholderText="jj/mm/aaaa"
          className={triggerCls}
          wrapperClassName="w-full"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          yearDropdownItemNumber={10}
          disabled={disabled}
        />
        {isEmpty && <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>}
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
  const prefilled = savedFields?.has(name) ?? false
  const isEmpty = required && showErrors && !disabled && (!value || String(value).trim() === '')

  const base = 'w-full border rounded-lg px-3 py-2 text-sm transition'
  const normal   = 'border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const errorCls = 'border-red-400 bg-red-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent'
  const preCls   = 'border-teal-300 bg-teal-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent'
  const roCls    = 'border-blue-200 bg-blue-50 text-blue-900 font-semibold cursor-default'
  const disCls   = 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'

  const inputCls = `${base} ${disabled ? disCls : readOnly ? roCls : isEmpty ? errorCls : prefilled ? preCls : normal}`

  return (
    <div className={`grid md:grid-cols-5 gap-2 items-start py-3 border-b border-gray-100 last:border-0 ${disabled ? 'opacity-50' : ''}`}>
      <div className="md:col-span-2 pt-2 leading-snug">
        <label className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
          {readOnly && <span className="ml-1.5 text-xs font-normal text-blue-500 italic">(automatique)</span>}
          {required && !readOnly && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {prefilled && !readOnly && !disabled && (
          <span className="mt-1 inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs font-semibold px-1.5 py-0.5 rounded">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            pré-rempli
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
              {['Oui', 'Non'].map(opt => (
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
            {isEmpty && <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>}
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
            className={inputCls}
          />
        )}
        {isEmpty && type !== 'yesno' && (
          <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>
        )}
      </div>
    </div>
  )
}

export function SearchableSelect({
  label, name, value, onChange,
  options = [], showErrors = false, required = true, savedFields,
  onAddClick,
}) {
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
            pré-rempli
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
            {value || 'Sélectionner…'}
          </span>
          <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2 border-b border-gray-100">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-400 italic">Aucun résultat</li>
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
              {onAddClick && (
                <li className="px-2 py-2 border-t border-gray-100">
                  <button
                    type="button"
                    onMouseDown={() => { setOpen(false); setQuery(''); onAddClick() }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-blue-700 font-medium hover:bg-blue-50 transition"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter une direction / unité
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}

        {isEmpty && <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>}
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
