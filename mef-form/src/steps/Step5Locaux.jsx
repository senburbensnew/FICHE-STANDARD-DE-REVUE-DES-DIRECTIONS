import { useTranslation } from 'react-i18next'
import { SectionTitle, Field, FieldGroup, DynamicList } from '../components/FormField'

export default function Step5Locaux({ data, onChange, showErrors }) {
  const { t } = useTranslation()
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="V" title={t('steps.s5.title')} />
      <FieldGroup>
        <Field label={t('steps.s5.locauxAdaptes')}     name="locauxAdaptes"     value={data.locauxAdaptes}     {...f} type="yesno" />
        <Field label={t('steps.s5.etatBatiments')}     name="etatBatiments"     value={data.etatBatiments}     {...f} rows={3} />
        <Field label={t('steps.s5.niveauExiguite')}    name="niveauExiguite"    value={data.niveauExiguite}    {...f} rows={2} />
        <Field label={t('steps.s5.etatProprete')}      name="etatProprete"      value={data.etatProprete}      {...f} rows={2} />
        <Field label={t('steps.s5.signaletique')}      name="signaletique"      value={data.signaletique}      {...f} type="yesno" />
        <Field label={t('steps.s5.conditionsAccueil')} name="conditionsAccueil" value={data.conditionsAccueil} {...f} rows={3} />

        <DynamicList
          label={t('steps.s5.travauxPrioritaires')}
          name="travauxPrioritaires"
          value={data.travauxPrioritaires}
          onChange={(val) => onChange({ travauxPrioritaires: val })}
          showErrors={showErrors}
          placeholder={t('steps.s5.travauxPrioritairesPlaceholder')}
        />
      </FieldGroup>
    </div>
  )
}
