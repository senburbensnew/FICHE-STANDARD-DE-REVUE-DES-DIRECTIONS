import { useTranslation } from 'react-i18next'
import { SectionTitle, FieldGroup, DynamicList } from '../components/FormField'

export default function Step4Fonctionnement({ data, onChange, showErrors }) {
  const { t } = useTranslation()
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
        />
      </FieldGroup>
    </div>
  )
}
