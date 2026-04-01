import { useState, useEffect, useRef } from 'react'
import { SectionTitle, Field, FieldGroup, DateField, SearchableSelect } from '../components/FormField'
import { fetchDirections, addDirection } from '../api'

const EMPTY_MODAL = { nom: '', responsable: '', fonction: '', localisation: '', coordonneesTel: '', adresseEmail: '', missionPrincipale: '', principalesAttributions: '', principauxServices: '' }

export default function Step1Identification({ data, onChange, showErrors, savedFields }) {
  const f = { onChange, showErrors, savedFields }
  const [directions, setDirections] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState(EMPTY_MODAL)
  const [adding, setAdding] = useState(false)
  const [modalError, setModalError] = useState('')
  const firstInputRef = useRef(null)

  useEffect(() => {
    fetchDirections().then(setDirections).catch(() => {})
  }, [])

  useEffect(() => {
    if (modalOpen) setTimeout(() => firstInputRef.current?.focus(), 50)
  }, [modalOpen])

  function handleDirectionSelect({ intituleDirection: nom }) {
    const dir = directions.find(d => d.nom === nom)
    const prefill = {}
    for (const field of ['responsable', 'fonction', 'localisation', 'coordonneesTel', 'adresseEmail',
                         'missionPrincipale', 'principalesAttributions', 'principauxServices']) {
      if (dir?.[field]) prefill[field] = dir[field]
    }
    onChange({ intituleDirection: nom, ...prefill })
  }

  function setModal(field, value) {
    setModalData(prev => ({ ...prev, [field]: value }))
    setModalError('')
  }

  async function handleModalConfirm() {
    const nom = modalData.nom.trim()
    if (!nom) { setModalError('L\'intitulé est obligatoire.'); return }
    if (directions.some(d => d.nom.toLowerCase() === nom.toLowerCase())) {
      setModalError('Cette direction / unité existe déjà.')
      return
    }
    setAdding(true)
    setModalError('')
    try {
      const created = await addDirection({
        nom,
        responsable:             modalData.responsable.trim(),
        fonction:                modalData.fonction.trim(),
        localisation:            modalData.localisation.trim(),
        coordonneesTel:          modalData.coordonneesTel.trim(),
        adresseEmail:            modalData.adresseEmail.trim(),
        missionPrincipale:       modalData.missionPrincipale.trim(),
        principalesAttributions: modalData.principalesAttributions.trim(),
        principauxServices:      modalData.principauxServices.trim(),
      })
      setDirections(prev => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom)))
      handleDirectionSelect({ intituleDirection: created.nom })
      setModalOpen(false)
      setModalData(EMPTY_MODAL)
    } catch (err) {
      setModalError(err.message || 'Erreur lors de l\'ajout.')
    } finally {
      setAdding(false)
    }
  }

  const inputCls = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${err ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`

  return (
    <div>
      <SectionTitle number="I" title="Identification de la Structure" />
      <p className="text-xs text-gray-500 mb-5 italic">
        À transmettre à la Direction Générale quarante-huit (48) heures avant la tenue de la réunion aux adresses :
        uep.mef@gmail.com, secretariatdg@mef.gouv.ht, bouco.jeanjacques@mef.gouv.ht
      </p>
      <FieldGroup>
        <SearchableSelect
          label="Intitulé de la Direction / Unité"
          name="intituleDirection"
          value={data.intituleDirection}
          options={directions.map(d => d.nom)}
          onChange={handleDirectionSelect}
          showErrors={showErrors}
          savedFields={savedFields}
          onAddClick={() => { setModalData(EMPTY_MODAL); setModalError(''); setModalOpen(true) }}
        />
        <Field label="Responsable" name="responsable" value={data.responsable} {...f} type="text" />
        <Field label="Fonction" name="fonction" value={data.fonction} {...f} type="text" />
        <DateField label="Date de la réunion" name="dateReunion" value={data.dateReunion} onChange={onChange} showErrors={showErrors} />
        <Field label="Période couverte par la revue" name="periodeCoverte" value={data.periodeCoverte} {...f} type="text" readOnly />
        <Field label="Localisation" name="localisation" value={data.localisation} {...f} type="text" />
        <Field label="Coordonnées téléphoniques" name="coordonneesTel" value={data.coordonneesTel} {...f} type="tel" />
        <Field label="Adresse électronique" name="adresseEmail" value={data.adresseEmail} {...f} type="email" />
      </FieldGroup>

      {modalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-blue-900 mb-5">Ajouter une direction / unité</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Intitulé <span className="text-red-500">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  value={modalData.nom}
                  onChange={e => setModal('nom', e.target.value)}
                  placeholder="Direction / Unité"
                  className={inputCls(modalError && !modalData.nom.trim())}
                />
                {modalError && <p className="text-xs text-red-500 mt-1">{modalError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Responsable</label>
                  <input type="text" value={modalData.responsable} onChange={e => setModal('responsable', e.target.value)} placeholder="Nom du responsable" className={inputCls(false)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fonction</label>
                  <input type="text" value={modalData.fonction} onChange={e => setModal('fonction', e.target.value)} placeholder="Titre / fonction" className={inputCls(false)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Localisation</label>
                <input type="text" value={modalData.localisation} onChange={e => setModal('localisation', e.target.value)} placeholder="Adresse ou bâtiment" className={inputCls(false)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" value={modalData.coordonneesTel} onChange={e => setModal('coordonneesTel', e.target.value)} placeholder="+509 …" className={inputCls(false)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input type="email" value={modalData.adresseEmail} onChange={e => setModal('adresseEmail', e.target.value)} placeholder="direction@mef.gouv.ht" className={inputCls(false)} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mission et Attributions</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mission principale</label>
                    <textarea rows={3} value={modalData.missionPrincipale} onChange={e => setModal('missionPrincipale', e.target.value)} placeholder="Mission principale de la structure…" className={`${inputCls(false)} resize-y`} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Principales attributions</label>
                    <textarea rows={3} value={modalData.principalesAttributions} onChange={e => setModal('principalesAttributions', e.target.value)} placeholder="Principales attributions…" className={`${inputCls(false)} resize-y`} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Principaux services rendus</label>
                    <textarea rows={3} value={modalData.principauxServices} onChange={e => setModal('principauxServices', e.target.value)} placeholder="Principaux services rendus…" className={`${inputCls(false)} resize-y`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">
                Annuler
              </button>
              <button
                type="button"
                disabled={adding}
                onClick={handleModalConfirm}
                className="px-4 py-2 text-sm font-semibold bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {adding ? 'Ajout en cours…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
