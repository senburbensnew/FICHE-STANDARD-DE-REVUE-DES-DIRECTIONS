import { useState, useEffect } from 'react'
import { SectionTitle, DateField, SearchableSelect } from '../components/FormField'
import { fetchDirections } from '../api'

/** Carte de groupe avec titre en bandeau */
function SubGroup({ title, children }) {
  return (
    <div className="border border-gray-200 rounded-xl">
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 rounded-t-xl">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">{title}</p>
      </div>
      <div className="bg-white px-4 divide-y divide-gray-100 rounded-b-xl">
        {children}
      </div>
    </div>
  )
}

/** Ligne label + contenu (pour les champs sans leur propre layout) */
function Row({ label, required, children }) {
  return (
    <div className="grid md:grid-cols-5 gap-2 items-start py-3">
      <label className="md:col-span-2 text-sm font-semibold text-gray-700 pt-2">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="md:col-span-3">{children}</div>
    </div>
  )
}


export default function Step1Identification({
  data, onChange, showErrors, savedFields, onDirectionSelect, directionFields = new Set()
}) {
  const locked = !data.intituleDirection
  const df = (name) => directionFields.has(name)

  const [directions, setDirections] = useState([])

  useEffect(() => { fetchDirections().then(setDirections).catch(() => {}) }, [])

  function handleDirectionSelect({ intituleDirection: nom }) {
    const dir = directions.find(d => d.nom_direction === nom)
    const prefill = { intituleDirection: nom }
    if (dir?.localisation_siege)         prefill.localisation            = dir.localisation_siege
    if (dir?.mission_principale)         prefill.missionPrincipale       = dir.mission_principale
    if (dir?.principales_attributions)   prefill.principalesAttributions = dir.principales_attributions
    if (dir?.principaux_services_rendus) prefill.principauxServices      = dir.principaux_services_rendus
    if (dir?.effectif_theorique != null) prefill.effectifTheorique       = String(dir.effectif_theorique)
    onDirectionSelect(prefill)
    onChange({ responsable: '', fonction: '', coordonneesTel: '', adresseEmail: '' })
  }

  return (
    <div>
      <SectionTitle number="I" title="Identification de la Structure" />
      <p className="text-xs text-gray-500 mb-5 italic">
        À transmettre à la Direction Générale quarante-huit (48) heures avant la tenue de la réunion aux adresses :
        uep.mef@gmail.com, secretariatdg@mef.gouv.ht, bouco.jeanjacques@mef.gouv.ht
      </p>

      <div className="space-y-4">

        {/* ── Direction ── */}
        <SubGroup title="Direction">
          <SearchableSelect
            label="Intitulé de la Direction / Unité"
            name="intituleDirection"
            value={data.intituleDirection}
            options={directions.map(d => d.nom_direction)}
            onChange={handleDirectionSelect}
            showErrors={showErrors}
            savedFields={savedFields}
          />
          <Row label="Localisation" required>
            <input
              type="text"
              value={data.localisation || ''}
              onChange={e => onChange({ localisation: e.target.value })}
              disabled={locked || df('localisation')}
              placeholder="Adresse du siège"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Row>
        </SubGroup>

        {/* ── Responsable ── */}
        <SubGroup title="Responsable">
          <Row label="Responsable" required>
            <input
              type="text"
              value={data.responsable || ''}
              onChange={e => onChange({ responsable: e.target.value })}
              disabled={locked}
              placeholder="Nom et prénom du responsable"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Row>
          <Row label="Fonction" required>
            <input
              type="text"
              value={data.fonction || ''}
              onChange={e => onChange({ fonction: e.target.value })}
              disabled={locked}
              placeholder="ex. Directeur"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Row>
          <Row label="Coordonnées téléphoniques" required>
            <input
              type="text"
              value={data.coordonneesTel || ''}
              onChange={e => onChange({ coordonneesTel: e.target.value })}
              disabled={locked}
              placeholder="ex. +509 3700-0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Row>
          <Row label="Adresse électronique" required>
            <input
              type="email"
              value={data.adresseEmail || ''}
              onChange={e => onChange({ adresseEmail: e.target.value })}
              disabled={locked}
              placeholder="ex. nom@mef.gouv.ht"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Row>
        </SubGroup>

        {/* ── Réunion ── */}
        <SubGroup title="Réunion">
          <DateField label="Date de la réunion"          name="dateReunion"  value={data.dateReunion}
            onChange={onChange} showErrors={showErrors} disabled={locked} />
          <DateField label="Début de la période couverte" name="periodeDebut" value={data.periodeDebut}
            onChange={onChange} showErrors={showErrors} disabled={locked} />
          <DateField label="Fin de la période couverte"   name="periodeFin"   value={data.periodeFin}
            onChange={onChange} showErrors={showErrors} disabled={locked} />
        </SubGroup>

      </div>

    </div>
  )
}
