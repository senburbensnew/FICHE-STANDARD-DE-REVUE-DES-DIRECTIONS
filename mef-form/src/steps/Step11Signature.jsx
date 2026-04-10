import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import SignatureCanvas from 'react-signature-canvas'
import { SectionTitle, Field, FieldGroup, DynamicList, DateField } from '../components/FormField'

export default function Step11Signature({ data, onChange, showErrors, savedFields }) {
  const { t } = useTranslation()
  const f = { onChange, showErrors, savedFields }
  const sigRef = useRef(null)

  // Restore a previously drawn signature when the component mounts
  useEffect(() => {
    if (data.signatureImage && sigRef.current && sigRef.current.isEmpty()) {
      const img = new Image()
      img.onload = () => {
        const canvas = sigRef.current.getCanvas()
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
      }
      img.src = data.signatureImage
    }
  }, [])

  function handleEnd() {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onChange({ signatureImage: sigRef.current.toDataURL('image/png') })
    }
  }

  function handleClear() {
    sigRef.current?.clear()
    onChange({ signatureImage: '' })
  }

  const sigCls = 'w-full rounded-lg border-2 touch-none border-gray-300 bg-white'

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle number="XIII" title={t('steps.s11.titleObservations')} />
        <FieldGroup>
          <DynamicList
            label={t('steps.s11.observations')}
            name="observations"
            value={data.observations}
            onChange={(val) => onChange({ observations: val })}
            showErrors={showErrors}
            placeholder={t('steps.s11.observationsPlaceholder')}
          />
        </FieldGroup>
      </div>

      <div>
        <SectionTitle number="XIV" title={t('steps.s11.titleSignature')} />
        <FieldGroup>
          <Field label={t('steps.s11.nomResponsable')}    name="nomResponsable"    value={data.nomResponsable}    {...f} type="text" />
          <Field label={t('steps.s11.fonctionSignature')} name="fonctionSignature" value={data.fonctionSignature} {...f} type="text" />
          <DateField label={t('steps.s11.dateSignature')} name="dateSignature" value={data.dateSignature} onChange={onChange} showErrors={showErrors} />
        </FieldGroup>

        <div className="mt-6 border border-gray-200 rounded-lg p-5 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">{t('steps.s11.signatureLabel')} <span className="text-xs font-normal text-gray-400 ml-1">(optionnel)</span></p>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors border border-gray-300 rounded-md px-2.5 py-1 hover:border-red-300"
            >
              {t('steps.s11.signatureClear')}
            </button>
          </div>
          <SignatureCanvas
            ref={sigRef}
            onEnd={handleEnd}
            canvasProps={{ className: sigCls, height: 120 }}
            backgroundColor="transparent"
            penColor="#1e3a5f"
          />
          <p className="text-xs text-gray-400 mt-2 italic">{t('steps.s11.signatureHint')}</p>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 italic">
            <strong>Nb.</strong> — {t('steps.s11.note')}
          </p>
        </div>
      </div>
    </div>
  )
}
