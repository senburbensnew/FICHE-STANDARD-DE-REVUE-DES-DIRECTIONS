import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionTitle, FieldGroup, DynamicList } from '../components/FormField'
import { fetchSuggestionsDifficultes } from '../api'

export default function Step4Fonctionnement({ data, onChange, showErrors }) {
  const { t } = useTranslation()
  const [sugDifficultes, setSugDifficultes] = useState([])

  useEffect(() => {
    fetchSuggestionsDifficultes().then(setSugDifficultes).catch(() => {})
  }, [])

  return (
    <div>
      <SectionTitle number="IV" title={t('steps.s4.title')} />
      <FieldGroup>
        <DynamicList
          label={t('steps.s4.activitesRealisees')}
          name="activitesRealisees"
          value={data.activitesRealisees}
          onChange={(val) => onChange({ activitesRealisees: val })}
          showErrors={showErrors}
          placeholder={t('steps.s4.activitesRealiseesPlaceholder')}
        />
        <DynamicList
          label={t('steps.s4.activitesEnCours')}
          name="activitesEnCours"
          value={data.activitesEnCours}
          onChange={(val) => onChange({ activitesEnCours: val })}
          showErrors={showErrors}
          placeholder={t('steps.s4.activitesEnCoursPlaceholder')}
        />
        <DynamicList
          label={t('steps.s4.activitesNonRealisees')}
          name="activitesNonRealisees"
          value={data.activitesNonRealisees}
          onChange={(val) => onChange({ activitesNonRealisees: val })}
          showErrors={showErrors}
          placeholder={t('steps.s4.activitesNonRealiseesPlaceholder')}
        />
        <DynamicList
          label={t('steps.s4.resultatsObtenus')}
          name="resultatsObtenus"
          value={data.resultatsObtenus}
          onChange={(val) => onChange({ resultatsObtenus: val })}
          showErrors={showErrors}
          placeholder={t('steps.s4.resultatsObtenusPlaceholder')}
        />
        <DynamicList
          label={t('steps.s4.difficultesExecution')}
          name="difficultesExecution"
          value={data.difficultesExecution}
          onChange={(val) => onChange({ difficultesExecution: val })}
          showErrors={showErrors}
          placeholder={t('steps.s4.difficultesExecutionPlaceholder')}
          suggestions={sugDifficultes}
        />
      </FieldGroup>
    </div>
  )
}
