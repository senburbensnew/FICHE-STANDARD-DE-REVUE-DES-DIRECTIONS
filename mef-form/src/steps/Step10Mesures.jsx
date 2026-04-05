import { useTranslation } from 'react-i18next'
import { SectionTitle, Field, FieldGroup } from '../components/FormField'

export default function Step10Mesures({ data, onChange, showErrors }) {
  const { t } = useTranslation()
  const f = { onChange, showErrors }
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle number="XI" title={t('steps.s10.titleMesures')} />
        <FieldGroup>
          <Field label={t('steps.s10.mesuresStructure')} name="mesuresStructure" value={data.mesuresStructure} {...f} rows={3} />
          <Field label={t('steps.s10.mesuresDG')}        name="mesuresDG"        value={data.mesuresDG}        {...f} rows={3} />
          <Field label={t('steps.s10.mesuresMinistre')}  name="mesuresMinistre"  value={data.mesuresMinistre}  {...f} rows={3} />
        </FieldGroup>
      </div>

      <div>
        <SectionTitle number="XII" title={t('steps.s10.titleAppui')} />
        <FieldGroup>
          <Field label={t('steps.s10.decisionsOuhaitees')} name="decisionsOuhaitees" value={data.decisionsOuhaitees} {...f} rows={3} />
          <Field label={t('steps.s10.appuisAdmin')}        name="appuisAdmin"        value={data.appuisAdmin}        {...f} rows={3} />
          <Field label={t('steps.s10.appuisLogistiques')}  name="appuisLogistiques"  value={data.appuisLogistiques}  {...f} rows={3} />
          <Field label={t('steps.s10.appuisRH')}           name="appuisRH"           value={data.appuisRH}           {...f} rows={3} />
          <Field label={t('steps.s10.appuisNumerique')}    name="appuisNumerique"    value={data.appuisNumerique}    {...f} rows={3} />
        </FieldGroup>
      </div>
    </div>
  )
}
