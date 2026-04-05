import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr/translation.json'
import ht from './locales/ht/translation.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ht: { translation: ht },
    },
    lng: localStorage.getItem('mef_lang') || 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('mef_lang', lng)
})

export default i18n
