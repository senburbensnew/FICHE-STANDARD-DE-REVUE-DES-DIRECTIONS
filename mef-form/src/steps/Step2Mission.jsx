import { useTranslation } from 'react-i18next'
import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step2Mission({ data, onChange, showErrors, savedFields, directionFields = new Set() }) {
  const { t } = useTranslation()
  const f = { onChange, showErrors, savedFields }
  const df = (name) => directionFields.has(name)
  return (
    <div>
      <SectionTitle number="II" title={t('steps.s2.title')} />
      <FieldGroup>
        <Field label={t('steps.s2.missionPrincipale')}        name="missionPrincipale"        value={data.missionPrincipale}        {...f} rows={4} disabled={df('missionPrincipale')} />
        <Field label={t('steps.s2.principalesAttributions')}  name="principalesAttributions"  value={data.principalesAttributions}  {...f} rows={4} disabled={df('principalesAttributions')} />
        <Field label={t('steps.s2.principauxServices')}       name="principauxServices"       value={data.principauxServices}       {...f} rows={4} disabled={df('principauxServices')} />
      </FieldGroup>
    </div>
  )
}
