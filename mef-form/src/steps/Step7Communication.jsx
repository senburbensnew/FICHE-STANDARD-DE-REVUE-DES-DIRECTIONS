import { useTranslation } from 'react-i18next'
import { SectionTitle, Field, FieldGroup, DynamicList } from '../components/FormField'

export default function Step7Communication({ data, onChange, showErrors }) {
  const { t } = useTranslation()
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="VII" title={t('steps.s7.title')} />
      <FieldGroup>
        <Field label={t('steps.s7.circulationInfo')}          name="circulationInfo"          value={data.circulationInfo}          {...f} rows={3} />
        <Field label={t('steps.s7.relationsAutresStructures')} name="relationsAutresStructures" value={data.relationsAutresStructures} {...f} rows={3} />
        <Field label={t('steps.s7.difficultesInternet')}      name="difficultesInternet"      value={data.difficultesInternet}      {...f} rows={3} />

        <DynamicList
          label={t('steps.s7.outilsNumeriques')}
          name="outilsNumeriques"
          value={data.outilsNumeriques}
          onChange={(val) => onChange({ outilsNumeriques: val })}
          showErrors={showErrors}
          placeholder={t('steps.s7.outilsNumeriquesPlaceholder')}
        />
        <DynamicList
          label={t('steps.s7.proceduresDematerialisees')}
          name="proceduresDematerialisees"
          value={data.proceduresDematerialisees}
          onChange={(val) => onChange({ proceduresDematerialisees: val })}
          showErrors={showErrors}
          placeholder={t('steps.s7.proceduresDematerialiseesPlaceholder')}
        />
        <DynamicList
          label={t('steps.s7.proceduresManuelles')}
          name="proceduresManuelles"
          value={data.proceduresManuelles}
          onChange={(val) => onChange({ proceduresManuelles: val })}
          showErrors={showErrors}
          placeholder={t('steps.s7.proceduresManuellesPlaceholder')}
        />
        <DynamicList
          label={t('steps.s7.besoinsDig')}
          name="besoinsDig"
          value={data.besoinsDig}
          onChange={(val) => onChange({ besoinsDig: val })}
          showErrors={showErrors}
          placeholder={t('steps.s7.besoinsDigPlaceholder')}
        />
      </FieldGroup>
    </div>
  )
}
