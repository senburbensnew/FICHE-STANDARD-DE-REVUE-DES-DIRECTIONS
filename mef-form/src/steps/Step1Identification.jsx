import { SectionTitle, Field, FieldGroup, DateField } from '../components/FormField'

export default function Step1Identification({ data, onChange, showErrors, savedFields }) {
  const f = { onChange, showErrors, savedFields }
  return (
    <div>
      <SectionTitle number="I" title="Identification de la Structure" />
      <p className="text-xs text-gray-500 mb-5 italic">
        À transmettre à la Direction Générale quarante-huit (48) heures avant la tenue de la réunion aux adresses :
        uep.mef@gmail.com, secretariatdg@mef.gouv.ht, bouco.jeanjacques@mef.gouv.ht
      </p>
      <FieldGroup>
        <Field label="Intitulé de la Direction / Unité" name="intituleDirection" value={data.intituleDirection} {...f} type="text" />
        <Field label="Responsable" name="responsable" value={data.responsable} {...f} type="text" />
        <Field label="Fonction" name="fonction" value={data.fonction} {...f} type="text" />
        <DateField label="Date de la réunion" name="dateReunion" value={data.dateReunion} onChange={onChange} showErrors={showErrors} />
        <Field label="Période couverte par la revue" name="periodeCoverte" value={data.periodeCoverte} {...f} type="text" readOnly />
        <Field label="Localisation" name="localisation" value={data.localisation} {...f} type="text" />
        <Field label="Coordonnées téléphoniques" name="coordonneesTel" value={data.coordonneesTel} {...f} type="tel" />
        <Field label="Adresse électronique" name="adresseEmail" value={data.adresseEmail} {...f} type="email" />
      </FieldGroup>
    </div>
  )
}
