import { useTranslation } from 'react-i18next'
import { SectionTitle, Field, FieldGroup, DynamicList } from '../components/FormField'

export default function Step8Rapports({ data, onChange, showErrors }) {
  const { t } = useTranslation()
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="VIII" title={t('steps.s8.title')} />
      <FieldGroup>
        <Field label={t('steps.s8.rapportsPeriodiques')}   name="rapportsPeriodiques"   value={data.rapportsPeriodiques}   {...f} type="yesno" />
        <Field label={t('steps.s8.frequenceProduction')}   name="frequenceProduction"   value={data.frequenceProduction}   {...f} type="text" placeholder={t('steps.s8.frequencePlaceholder')} />
        <Field label={t('steps.s8.tableauxBord')}          name="tableauxBord"          value={data.tableauxBord}          {...f} type="yesno" />
        <Field label={t('steps.s8.statistiquesDisponibles')} name="statistiquesDisponibles" value={data.statistiquesDisponibles} {...f} type="yesno" />
        <Field label={t('steps.s8.retardsRapports')}       name="retardsRapports"       value={data.retardsRapports}       {...f} rows={3} />

        <DynamicList
          label={t('steps.s8.derniersRapports')}
          name="derniersRapports"
          value={data.derniersRapports}
          onChange={(val) => onChange({ derniersRapports: val })}
          showErrors={showErrors}
          placeholder={t('steps.s8.derniersRapportsPlaceholder')}
        />
        <DynamicList
          label={t('steps.s8.principauxLivrables')}
          name="principauxLivrables"
          value={data.principauxLivrables}
          onChange={(val) => onChange({ principauxLivrables: val })}
          showErrors={showErrors}
          placeholder={t('steps.s8.principauxLivrablesPlaceholder')}
        />
        <DynamicList
          label={t('steps.s8.causesRapports')}
          name="causesRapports"
          value={data.causesRapports}
          onChange={(val) => onChange({ causesRapports: val })}
          showErrors={showErrors}
          placeholder={t('steps.s8.causesRapportsPlaceholder')}
        />
      </FieldGroup>
    </div>
  )
}
