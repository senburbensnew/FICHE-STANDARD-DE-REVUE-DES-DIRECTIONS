import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'fr', label: 'FR', full: 'Français' },
  { code: 'ht', label: 'HT', full: 'Kreyòl' },
]

export default function LanguageSwitcher({ collapsed = false }) {
  const { i18n } = useTranslation()
  const current = i18n.language

  return (
    <div className={`flex ${collapsed ? 'flex-col gap-1 items-center' : 'flex-row gap-1'}`}>
      {LANGS.map(({ code, label, full }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          title={full}
          className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
            current === code
              ? 'bg-blue-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
