import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionTitle, DateField, SearchableSelect } from '../components/FormField'
import { fetchDirections, fetchUsersByDirection } from '../api'

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
  data, onChange, showErrors, savedFields, onDirectionSelect, directionFields = new Set(), userDirectionId, currentUser
}) {
  const { t } = useTranslation()
  const locked = !data.intituleDirection
  const df = (name) => directionFields.has(name)

  const [directions, setDirections] = useState([])
  const didAutoSelect = useRef(false)

  useEffect(() => { fetchDirections().then(setDirections).catch(() => {}) }, [])

  // Auto-select the user's direction when directions load (only once, only if not already set)
  useEffect(() => {
    if (didAutoSelect.current || !userDirectionId || directions.length === 0) return
    didAutoSelect.current = true
    if (data.intituleDirection) return // already set (e.g. from localStorage)
    const dir = directions.find(d => String(d.direction_id) === String(userDirectionId))
    if (!dir) return
    const prefill = { intituleDirection: dir.nom_direction }
    if (dir.localisation_siege)         prefill.localisation            = dir.localisation_siege
    if (dir.mission_principale)         prefill.missionPrincipale       = dir.mission_principale
    if (dir.principales_attributions)   prefill.principalesAttributions = dir.principales_attributions
    if (dir.principaux_services_rendus) prefill.principauxServices      = dir.principaux_services_rendus
    if (dir.effectif_theorique != null) prefill.effectifTheorique       = String(dir.effectif_theorique)
    onDirectionSelect(prefill)
    onChange({ responsable: '', fonction: '', coordonneesTel: '', adresseEmail: '' })
  }, [directions, userDirectionId])

  // Restrict dropdown to user's own direction when userDirectionId is present
  const availableDirections = userDirectionId
    ? directions.filter(d => String(d.direction_id) === String(userDirectionId))
    : directions

  // Resolve the active direction_id from token or from the selected direction name
  const selectedDir = directions.find(d => d.nom_direction === data.intituleDirection)
  const effectiveDirectionId = userDirectionId || (selectedDir ? String(selectedDir.direction_id) : null)

  const [directionUsers, setDirectionUsers] = useState([])
  const [loadingUsers, setLoadingUsers]     = useState(false)

  useEffect(() => {
    if (!effectiveDirectionId) { setDirectionUsers([]); return }
    setLoadingUsers(true)
    fetchUsersByDirection(effectiveDirectionId)
      .then(setDirectionUsers)
      .catch(() => setDirectionUsers([]))
      .finally(() => setLoadingUsers(false))
  }, [effectiveDirectionId])

  function displayName(u) {
    const full = `${u.firstName || ''} ${u.lastName || ''}`.trim()
    return full || u.username
  }

  // Auto-select current user once direction users are loaded
  const didAutoSelectUser = useRef(false)
  useEffect(() => {
    if (didAutoSelectUser.current || !currentUser || directionUsers.length === 0) return
    if (data.responsable) return // already set
    const match = directionUsers.find(u => u.email && u.email === currentUser.email)
    if (!match) return
    didAutoSelectUser.current = true
    const updates = { responsable: displayName(match) }
    if (match.attributes?.fonction?.[0])  updates.fonction       = match.attributes.fonction[0]
    if (match.attributes?.telephone?.[0]) updates.coordonneesTel = match.attributes.telephone[0]
    updates.adresseEmail = match.email
    onChange(updates)
  }, [directionUsers, currentUser])

  function handleResponsableSelect({ responsable: name }) {
    const updates = { responsable: name }
    const u = directionUsers.find(u => displayName(u) === name)
    if (u) {
      if (u.attributes?.fonction?.[0])  updates.fonction       = u.attributes.fonction[0]
      if (u.attributes?.telephone?.[0]) updates.coordonneesTel = u.attributes.telephone[0]
      if (u.email)                       updates.adresseEmail   = u.email
    }
    onChange(updates)
  }

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
      <SectionTitle number="I" title={t('steps.s1.title')} />
      <p className="text-xs text-gray-500 mb-5 italic">{t('steps.s1.notice')}</p>

      <div className="space-y-4">

        <SubGroup title={t('steps.s1.groupDirection')}>
          <SearchableSelect
            label={t('steps.s1.intituleDirection')}
            name="intituleDirection"
            value={data.intituleDirection}
            options={availableDirections.map(d => d.nom_direction)}
            onChange={handleDirectionSelect}
            showErrors={showErrors}
            savedFields={savedFields}
          />
          <Row label={t('steps.s1.localisation')} required>
            <input
              type="text"
              value={data.localisation || ''}
              onChange={e => onChange({ localisation: e.target.value })}
              disabled={locked || df('localisation')}
              placeholder={t('steps.s1.localisationPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Row>
        </SubGroup>

        <SubGroup title={t('steps.s1.groupResponsable')}>
          {directionUsers.length > 0 ? (
            <SearchableSelect
              label={t('steps.s1.responsable')}
              name="responsable"
              value={data.responsable || ''}
              options={directionUsers.map(displayName)}
              onChange={handleResponsableSelect}
              showErrors={showErrors}
            />
          ) : (
            <Row label={t('steps.s1.responsable')} required>
              <input
                type="text"
                value={data.responsable || ''}
                onChange={e => onChange({ responsable: e.target.value })}
                disabled={locked || loadingUsers}
                placeholder={loadingUsers ? t('steps.s1.loading') : t('steps.s1.responsablePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </Row>
          )}
          <Row label={t('steps.s1.fonction')} required>
            <input
              type="text"
              value={data.fonction || ''}
              onChange={e => onChange({ fonction: e.target.value })}
              disabled={locked}
              placeholder={t('steps.s1.fonctionPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Row>
          <Row label={t('steps.s1.tel')} required>
            <input
              type="text"
              value={data.coordonneesTel || ''}
              onChange={e => onChange({ coordonneesTel: e.target.value })}
              disabled={locked}
              placeholder={t('steps.s1.telPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Row>
          <Row label={t('steps.s1.email')} required>
            <input
              type="email"
              value={data.adresseEmail || ''}
              onChange={e => onChange({ adresseEmail: e.target.value })}
              disabled={locked}
              placeholder={t('steps.s1.emailPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Row>
        </SubGroup>

        <SubGroup title={t('steps.s1.groupReunion')}>
          {(() => {
            const debut    = data.periodeDebut
            const fin      = data.periodeFin
            const reunion  = data.dateReunion
            const errDebut  = showErrors && debut && fin && debut > fin      ? t('steps.s1.errDebutApresFin')    : null
            const errFin    = showErrors && fin && reunion && fin >= reunion  ? t('steps.s1.errFinApresReunion')  : null
            const errReunion= showErrors && fin && reunion && fin >= reunion  ? t('steps.s1.errReunionAvantFin')  : null
            return (
              <>
                <DateField label={t('steps.s1.periodeDebut')} name="periodeDebut" value={debut}
                  onChange={onChange} showErrors={showErrors} disabled={locked} errorMsg={errDebut} />
                <DateField label={t('steps.s1.periodeFin')}   name="periodeFin"   value={fin}
                  onChange={onChange} showErrors={showErrors} disabled={locked} errorMsg={errFin} />
                <DateField label={t('steps.s1.dateReunion')}  name="dateReunion"  value={reunion}
                  onChange={onChange} showErrors={showErrors} disabled={locked} errorMsg={errReunion} />
              </>
            )
          })()}
        </SubGroup>

      </div>

    </div>
  )
}
