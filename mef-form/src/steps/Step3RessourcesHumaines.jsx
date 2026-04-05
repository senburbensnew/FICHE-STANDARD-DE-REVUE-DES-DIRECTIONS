import { useTranslation } from 'react-i18next'
import { SectionTitle, Field, FieldGroup, DynamicList, DynamicTable } from '../components/FormField'

export default function Step3RessourcesHumaines({ data, onChange, showErrors }) {
  const { t } = useTranslation()
  const f = { onChange, showErrors }
  return (
    <div>
      <SectionTitle number="III" title={t('steps.s3.title')} />
      <FieldGroup>
        <Field label={t('steps.s3.effectifTheorique')}   name="effectifTheorique"   value={data.effectifTheorique}   {...f} type="number" />
        <Field label={t('steps.s3.effectifPoste')}       name="effectifPoste"       value={data.effectifPoste}       {...f} type="number" />
        <Field label={t('steps.s3.effectifDisponible')}  name="effectifDisponible"  value={data.effectifDisponible}  {...f} type="number" />
        <Field label={t('steps.s3.postesVacants')}       name="postesVacants"       value={data.postesVacants}       {...f} type="number" />

        <DynamicTable
          label={t('steps.s3.repartition')}
          name="repartitionPersonnel"
          value={data.repartitionPersonnel}
          onChange={(val) => onChange({ repartitionPersonnel: val })}
          showErrors={showErrors}
        />

        <DynamicList
          label={t('steps.s3.besoinsPrio')}
          name="besoinsPrioPersonnel"
          value={data.besoinsPrioPersonnel}
          onChange={(val) => onChange({ besoinsPrioPersonnel: val })}
          showErrors={showErrors}
          placeholder={t('steps.s3.besoinsPrioPlaceholder')}
        />

        <DynamicList
          label={t('steps.s3.besoinsFormation')}
          name="besoinsFormation"
          value={data.besoinsFormation}
          onChange={(val) => onChange({ besoinsFormation: val })}
          showErrors={showErrors}
          placeholder={t('steps.s3.besoinsFormationPlaceholder')}
        />

        <Field label={t('steps.s3.difficultesRH')} name="difficultesRH" value={data.difficultesRH} {...f} rows={3} />
      </FieldGroup>
    </div>
  )
}
