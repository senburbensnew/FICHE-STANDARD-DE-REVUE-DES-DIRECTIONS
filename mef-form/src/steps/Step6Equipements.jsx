import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionTitle, Field, FieldGroup, DynamicList } from '../components/FormField'
import { fetchSuggestionsInsuffisances } from '../api'

export default function Step6Equipements({ data, onChange, showErrors }) {
  const { t } = useTranslation()
  const f = { onChange, showErrors }
  const [sugInsuffisances, setSugInsuffisances] = useState([])

  useEffect(() => {
    fetchSuggestionsInsuffisances().then(setSugInsuffisances).catch(() => {})
  }, [])

  return (
    <div>
      <SectionTitle number="VI" title={t('steps.s6.title')} />
      <FieldGroup>
        <Field label={t('steps.s6.mobilierBureau')}        name="mobilierBureau"        value={data.mobilierBureau}        {...f} rows={2} />
        <Field label={t('steps.s6.materielInformatique')}  name="materielInformatique"  value={data.materielInformatique}  {...f} rows={2} />
        <Field label={t('steps.s6.etatOrdinateurs')}       name="etatOrdinateurs"       value={data.etatOrdinateurs}       {...f} rows={2} />
        <Field label={t('steps.s6.electricite')}           name="electricite"           value={data.electricite}           {...f} rows={2} />
        <Field label={t('steps.s6.internet')}              name="internet"              value={data.internet}              {...f} rows={2} />
        <Field label={t('steps.s6.vehicules')}             name="vehicules"             value={data.vehicules}             {...f} rows={2} />
        <Field label={t('steps.s6.autresEquipements')}     name="autresEquipements"     value={data.autresEquipements}     {...f} rows={3} />

        <DynamicList
          label={t('steps.s6.insuffisancesMaterielles')}
          name="insuffisancesMaterielles"
          value={data.insuffisancesMaterielles}
          onChange={(val) => onChange({ insuffisancesMaterielles: val })}
          showErrors={showErrors}
          placeholder={t('steps.s6.insuffisancesPlaceholder')}
          suggestions={sugInsuffisances}
        />
      </FieldGroup>
    </div>
  )
}
