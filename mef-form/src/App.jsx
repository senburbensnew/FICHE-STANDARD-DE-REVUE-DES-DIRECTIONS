import { useState } from 'react'
import { submitFiche } from './api'
import { useKeycloak } from './keycloak'
import Dashboard from './pages/Dashboard'
import Step1Identification from './steps/Step1Identification'
import Step2Mission from './steps/Step2Mission'
import Step3RessourcesHumaines from './steps/Step3RessourcesHumaines'
import Step4Fonctionnement from './steps/Step4Fonctionnement'
import Step5Locaux from './steps/Step5Locaux'
import Step6Equipements from './steps/Step6Equipements'
import Step7Communication from './steps/Step7Communication'
import Step8Rapports from './steps/Step8Rapports'
import Step9Contraintes from './steps/Step9Contraintes'
import Step10Mesures from './steps/Step10Mesures'
import Step11Signature from './steps/Step11Signature'

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const getCurrentMonthLabel = () => {
  const now = new Date()
  return `${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`
}
const getTodayISO = () => new Date().toISOString().split('T')[0]

// Fields that persist across monthly submissions (structural, not periodic)
const PERSISTENT_FIELDS = [
  'intituleDirection', 'responsable', 'fonction', 'localisation',
  'coordonneesTel', 'adresseEmail',
  'missionPrincipale', 'principalesAttributions', 'principauxServices',
  'nomResponsable', 'fonctionSignature',
]

const LS_KEY = 'mef_fiche_saved'

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePersistent(data) {
  const toSave = {}
  PERSISTENT_FIELDS.forEach(k => { if (data[k]) toSave[k] = data[k] })
  localStorage.setItem(LS_KEY, JSON.stringify(toSave))
}

function buildInitialData(saved = {}) {
  const base = {
    intituleDirection: '', responsable: '', fonction: '', dateReunion: '',
    periodeCoverte: getCurrentMonthLabel(), localisation: '', coordonneesTel: '', adresseEmail: '',
    missionPrincipale: '', principalesAttributions: '', principauxServices: '',
    effectifTheorique: '', effectifPoste: '', effectifDisponible: '',
    repartitionPersonnel: '', postesVacants: '', besoinsPrioPersonnel: '',
    besoinsFormation: '', difficultesRH: '',
    activitesRealisees: '', activitesEnCours: '', activitesNonRealisees: '',
    resultatsObtenus: '', difficultesExecution: '',
    locauxAdaptes: '', etatBatiments: '', niveauExiguite: '', etatProprete: '',
    signaletique: '', conditionsAccueil: '', travauxPrioritaires: '',
    mobilierBureau: '', materielInformatique: '', etatOrdinateurs: '',
    electricite: '', internet: '', vehicules: '', autresEquipements: '',
    insuffisancesMaterielles: '',
    circulationInfo: '', relationsAutresStructures: '', outilsNumeriques: '',
    proceduresDematerialisees: '', proceduresManuelles: '', besoinsDig: '',
    difficultesInternet: '',
    rapportsPeriodiques: '', frequenceProduction: '', derniersRapports: '',
    tableauxBord: '', statistiquesDisponibles: '', principauxLivrables: '',
    retardsRapports: '', causesRapports: '',
    contrainte1: '', contrainte2: '', contrainte3: '',
    besoin1: '', besoin2: '', besoin3: '', besoin4: '', besoin5: '',
    mesuresStructure: '', mesuresDG: '', mesuresMinistre: '',
    decisionsOuhaitees: '', appuisAdmin: '', appuisLogistiques: '',
    appuisRH: '', appuisNumerique: '',
    observationsComplementaires: '',
    nomResponsable: '', fonctionSignature: '', date: getTodayISO(),
  }
  // Merge saved values over the base (only persistent fields)
  PERSISTENT_FIELDS.forEach(k => { if (saved[k]) base[k] = saved[k] })
  return base
}

const STEPS = [
  { id: 1,  label: 'I. Identification',                   component: Step1Identification },
  { id: 2,  label: 'II. Mission',                         component: Step2Mission },
  { id: 3,  label: 'III. Ressources Humaines',            component: Step3RessourcesHumaines },
  { id: 4,  label: 'IV. Fonctionnement',                  component: Step4Fonctionnement },
  { id: 5,  label: 'V. Locaux',                           component: Step5Locaux },
  { id: 6,  label: 'VI. Équipements',                     component: Step6Equipements },
  { id: 7,  label: 'VII. Communication',                  component: Step7Communication },
  { id: 8,  label: 'VIII. Rapports',                      component: Step8Rapports },
  { id: 9,  label: 'IX-X. Contraintes & Besoins',        component: Step9Contraintes },
  { id: 10, label: 'XI-XII. Mesures & Appui',             component: Step10Mesures },
  { id: 11, label: 'XIII-XIV. Observations & Signature',  component: Step11Signature },
]

const STEP_REQUIRED_FIELDS = [
  ['intituleDirection', 'responsable', 'fonction', 'dateReunion', 'periodeCoverte', 'localisation', 'coordonneesTel', 'adresseEmail'],
  ['missionPrincipale', 'principalesAttributions', 'principauxServices'],
  ['effectifTheorique', 'effectifPoste', 'effectifDisponible', 'repartitionPersonnel', 'postesVacants', 'besoinsPrioPersonnel', 'besoinsFormation', 'difficultesRH'],
  ['activitesRealisees', 'activitesEnCours', 'activitesNonRealisees', 'resultatsObtenus', 'difficultesExecution'],
  ['locauxAdaptes', 'etatBatiments', 'niveauExiguite', 'etatProprete', 'signaletique', 'conditionsAccueil', 'travauxPrioritaires'],
  ['mobilierBureau', 'materielInformatique', 'etatOrdinateurs', 'electricite', 'internet', 'vehicules', 'autresEquipements', 'insuffisancesMaterielles'],
  ['circulationInfo', 'relationsAutresStructures', 'outilsNumeriques', 'proceduresDematerialisees', 'proceduresManuelles', 'besoinsDig', 'difficultesInternet'],
  ['rapportsPeriodiques', 'frequenceProduction', 'derniersRapports', 'tableauxBord', 'statistiquesDisponibles', 'principauxLivrables', 'retardsRapports', 'causesRapports'],
  ['contrainte1', 'contrainte2', 'contrainte3', 'besoin1', 'besoin2', 'besoin3', 'besoin4', 'besoin5'],
  ['mesuresStructure', 'mesuresDG', 'mesuresMinistre', 'decisionsOuhaitees', 'appuisAdmin', 'appuisLogistiques', 'appuisRH', 'appuisNumerique'],
  ['observationsComplementaires', 'nomResponsable', 'fonctionSignature', 'date'],
]

const isStepValid = (idx, data) =>
  STEP_REQUIRED_FIELDS[idx].every(f => data[f] && String(data[f]).trim() !== '')

export default function App() {
  const { token, user, logout, login, authenticated } = useKeycloak()
  const [showDashboard, setShowDashboard] = useState(false)

  const saved = loadSaved()
  const hasSaved = Object.keys(saved).length > 0
  const [savedFields] = useState(() => new Set(Object.keys(saved).filter(k => saved[k])))
  const [formData, setFormData] = useState(() => buildInitialData(saved))
  const [currentStep, setCurrentStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [attempted, setAttempted] = useState(new Set())
  const [maxReached, setMaxReached] = useState(0)

  if (showDashboard) {
    return <Dashboard onBack={() => setShowDashboard(false)} />
  }

  const updateData = (fields) => setFormData(prev => ({ ...prev, ...fields }))
  const markAttempted = (idx) => setAttempted(prev => new Set([...prev, idx]))

  const handleNext = () => {
    if (!isStepValid(currentStep, formData)) {
      markAttempted(currentStep)
      return
    }
    const next = currentStep + 1
    setCurrentStep(next)
    setMaxReached(m => Math.max(m, next))
  }

  const handleSubmit = async () => {
    setAttempted(new Set(STEPS.map((_, i) => i)))
    const firstInvalid = STEPS.findIndex((_, i) => !isStepValid(i, formData))
    if (firstInvalid !== -1) {
      setCurrentStep(firstInvalid)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitFiche(formData, token)
      savePersistent(formData)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewForm = () => {
    const newSaved = loadSaved()
    setFormData(buildInitialData(newSaved))
    setCurrentStep(0)
    setAttempted(new Set())
    setMaxReached(0)
    setSubmitted(false)
  }

  const handlePillClick = (idx) => {
    if (idx > maxReached) return
    setCurrentStep(idx)
  }

  const StepComponent = STEPS[currentStep].component
  const stepValid = isStepValid(currentStep, formData)
  const showErrors = attempted.has(currentStep)

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Fiche soumise avec succès</h2>
          <p className="text-gray-500 mb-6">
            Votre fiche standard de revue a été enregistrée. Elle sera transmise à la Direction Générale.
          </p>
          <button onClick={handleNewForm} className="bg-blue-800 text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors">
            Remplir la fiche du mois prochain
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Title block */}
          <div className="flex-1 text-center">
            <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">
              Ministère de l&apos;Économie et des Finances — Direction Générale
            </p>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mt-0.5">
              Fiche Standard de Revue des Directions
            </h1>
            <p className="text-xs text-gray-400 italic">Document administratif — MEF</p>
            <span className="inline-block mt-1.5 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              Période : {getCurrentMonthLabel()}
            </span>
          </div>

          {/* User actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyses
            </button>
            {authenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 max-w-30 truncate">
                  {user?.preferred_username || user?.name}
                </span>
                <button
                  onClick={logout}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-800 text-white hover:bg-blue-900 font-medium transition-colors"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Pre-fill notice */}
        {hasSaved && (
          <div className="mb-4 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-teal-800">
              Certaines informations permanentes ont été pré-remplies depuis votre dernière soumission
              <span className="ml-1 inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs font-semibold px-1.5 py-0.5 rounded">
                pré-rempli
              </span>.
              Vérifiez-les et corrigez si nécessaire.
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-gray-500">Étape {currentStep + 1} / {STEPS.length}</span>
            <span className="text-sm font-semibold text-blue-800">{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-800 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="hidden md:flex flex-wrap gap-1.5 mt-3">
            {STEPS.map((step, idx) => {
              const valid = isStepValid(idx, formData)
              const isAttempted = attempted.has(idx)
              const isCurrent = idx === currentStep
              const isLocked = idx > maxReached

              let cls = 'text-xs px-3 py-1 rounded-full border font-medium transition-colors flex items-center gap-1 '
              if (isCurrent)        cls += 'bg-blue-800 text-white border-blue-800'
              else if (isLocked)    cls += 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'
              else if (valid)       cls += 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer'
              else if (isAttempted) cls += 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 cursor-pointer'
              else                  cls += 'bg-white text-gray-400 border-gray-300 hover:border-gray-400 cursor-pointer'

              return (
                <button key={step.id} onClick={() => handlePillClick(idx)} className={cls} disabled={isLocked}>
                  {!isCurrent && !isLocked && valid && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {!isCurrent && isAttempted && !valid && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {step.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Validation error banner */}
        {showErrors && !stepValid && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">
              Veuillez remplir tous les champs obligatoires avant de continuer. Les champs manquants sont indiqués en rouge.
            </p>
          </div>
        )}

        {/* API error banner */}
        {submitError && (
          <div className="mb-4 bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">
              <strong>Erreur :</strong> {submitError}
            </p>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <StepComponent data={formData} onChange={updateData} showErrors={showErrors} savedFields={savedFields} />
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Précédent
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-800 text-white hover:bg-blue-900 transition-colors font-medium"
            >
              Suivant
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Envoi en cours…
                </>
              ) : (
                <>
                  Soumettre la fiche
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
