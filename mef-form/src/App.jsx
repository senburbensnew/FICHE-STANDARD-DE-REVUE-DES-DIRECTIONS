import { useState, useEffect } from 'react'
import { submitRevue, checkDoublon } from './api'
import { useKeycloak } from './keycloak'
import Accueil from './pages/Accueil'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
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

const getTodayISO = () => new Date().toISOString().split('T')[0]

// Champs persistants entre les soumissions mensuelles (données structurelles)
const PERSISTENT_FIELDS = [
  'intituleDirection', 'responsable', 'fonction', 'localisation',
  'coordonneesTel', 'adresseEmail',
  'missionPrincipale', 'principalesAttributions', 'principauxServices',
  'effectifTheorique',
  'nomResponsable', 'fonctionSignature',
]

const LS_KEY = 'mef_revue_saved'

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

/**
 * Construit l'état initial du formulaire.
 * Les champs à valeurs multiples sont des tableaux.
 */
function buildInitialData(saved = {}) {
  const base = {
    // I. Identification
    intituleDirection: '', responsable: '', fonction: '',
    periodeDebut:   '', periodeFin:    '', dateReunion: '',
    localisation:   '', coordonneesTel: '', adresseEmail: '',

    // II. Mission (fixe direction)
    missionPrincipale: '', principalesAttributions: '', principauxServices: '',

    // III. Ressources humaines
    effectifTheorique: '', effectifPoste: '', effectifDisponible: '',
    postesVacants: '', difficultesRH: '',
    repartitionPersonnel: [{ categorie: '', nombre: '' }], // Multiple
    besoinsPrioPersonnel: [''],                             // Multiple
    besoinsFormation: [''],                                 // Multiple

    // IV. Fonctionnement
    activitesRealisees:    [''],  // Multiple type=principale_realisee
    activitesEnCours:      [''],  // Multiple type=en_cours
    activitesNonRealisees: [''],  // Multiple type=non_realisee
    resultatsObtenus:      [''],  // Multiple
    difficultesExecution:  [''],  // Multiple

    // V. Locaux
    locauxAdaptes: '', etatBatiments: '', niveauExiguite: '',
    etatProprete: '', signaletique: '', conditionsAccueil: '',
    travauxPrioritaires: [''],   // Multiple

    // VI. Équipements
    mobilierBureau: '', materielInformatique: '', etatOrdinateurs: '',
    electricite: '', internet: '', vehicules: '', autresEquipements: '',
    insuffisancesMaterielles: [''],  // Multiple

    // VII. Communication
    circulationInfo: '', relationsAutresStructures: '', difficultesInternet: '',
    outilsNumeriques:          [''],  // Multiple
    proceduresDematerialisees: [''],  // Multiple
    proceduresManuelles:       [''],  // Multiple
    besoinsDig:                [''],  // Multiple

    // VIII. Rapports
    rapportsPeriodiques: '', frequenceProduction: '',
    tableauxBord: '', statistiquesDisponibles: '', retardsRapports: '',
    derniersRapports:  [''],  // Multiple
    principauxLivrables: [''], // Multiple
    causesRapports:    [''],  // Multiple

    // IX. Contraintes (max 3)
    contraintes: [
      { ordre: 1, contrainte: '' },
      { ordre: 2, contrainte: '' },
      { ordre: 3, contrainte: '' },
    ],

    // X. Besoins prioritaires (max 5)
    besoinsPrioritaires: [
      { ordre: 1, besoin: '' },
      { ordre: 2, besoin: '' },
      { ordre: 3, besoin: '' },
      { ordre: 4, besoin: '' },
      { ordre: 5, besoin: '' },
    ],

    // XI. Mesures
    mesuresStructure: '', mesuresDG: '', mesuresMinistre: '',

    // XII. Appuis
    decisionsOuhaitees: '', appuisAdmin: '', appuisLogistiques: '',
    appuisRH: '', appuisNumerique: '',

    // XIII. Observations (multiple)
    observations: [''],

    // XIV. Signature
    nomResponsable: '', fonctionSignature: '', dateSignature: getTodayISO(),
  }

  // Restaurer les champs persistants
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

// Valide un tableau (au moins un élément non vide)
const hasItem = (arr) => Array.isArray(arr) && arr.some(v => {
  if (typeof v === 'string') return v.trim() !== ''
  if (typeof v === 'object') return Object.values(v).some(x => String(x).trim() !== '')
  return false
})

// Valide un champ scalaire
const notEmpty = (v) => v !== null && v !== undefined && String(v).trim() !== ''

const STEP_VALIDATORS = [
  // Step 1
  (d) => notEmpty(d.intituleDirection) && notEmpty(d.responsable) && notEmpty(d.fonction)
      && notEmpty(d.periodeDebut) && notEmpty(d.periodeFin) && notEmpty(d.dateReunion)
      && notEmpty(d.localisation) && notEmpty(d.coordonneesTel) && notEmpty(d.adresseEmail),
  // Step 2
  (d) => notEmpty(d.missionPrincipale) && notEmpty(d.principalesAttributions) && notEmpty(d.principauxServices),
  // Step 3
  (d) => notEmpty(d.effectifTheorique) && notEmpty(d.effectifPoste) && notEmpty(d.effectifDisponible)
      && notEmpty(d.postesVacants) && notEmpty(d.difficultesRH)
      && hasItem(d.repartitionPersonnel) && hasItem(d.besoinsPrioPersonnel) && hasItem(d.besoinsFormation),
  // Step 4
  (d) => hasItem(d.activitesRealisees) && hasItem(d.activitesEnCours) && hasItem(d.activitesNonRealisees)
      && hasItem(d.resultatsObtenus) && hasItem(d.difficultesExecution),
  // Step 5
  (d) => notEmpty(d.locauxAdaptes) && notEmpty(d.etatBatiments) && notEmpty(d.niveauExiguite)
      && notEmpty(d.etatProprete) && notEmpty(d.signaletique) && notEmpty(d.conditionsAccueil)
      && hasItem(d.travauxPrioritaires),
  // Step 6
  (d) => notEmpty(d.mobilierBureau) && notEmpty(d.materielInformatique) && notEmpty(d.etatOrdinateurs)
      && notEmpty(d.electricite) && notEmpty(d.internet) && notEmpty(d.vehicules)
      && notEmpty(d.autresEquipements) && hasItem(d.insuffisancesMaterielles),
  // Step 7
  (d) => notEmpty(d.circulationInfo) && notEmpty(d.relationsAutresStructures) && notEmpty(d.difficultesInternet)
      && hasItem(d.outilsNumeriques) && hasItem(d.proceduresDematerialisees)
      && hasItem(d.proceduresManuelles) && hasItem(d.besoinsDig),
  // Step 8
  (d) => notEmpty(d.rapportsPeriodiques) && notEmpty(d.frequenceProduction)
      && notEmpty(d.tableauxBord) && notEmpty(d.statistiquesDisponibles) && notEmpty(d.retardsRapports)
      && hasItem(d.derniersRapports) && hasItem(d.principauxLivrables) && hasItem(d.causesRapports),
  // Step 9 — au moins contrainte 1 et besoin 1
  (d) => d.contraintes?.[0]?.contrainte?.trim() && d.besoinsPrioritaires?.[0]?.besoin?.trim(),
  // Step 10
  (d) => notEmpty(d.mesuresStructure) && notEmpty(d.mesuresDG) && notEmpty(d.mesuresMinistre)
      && notEmpty(d.decisionsOuhaitees) && notEmpty(d.appuisAdmin) && notEmpty(d.appuisLogistiques)
      && notEmpty(d.appuisRH) && notEmpty(d.appuisNumerique),
  // Step 11
  (d) => hasItem(d.observations) && notEmpty(d.nomResponsable) && notEmpty(d.fonctionSignature) && notEmpty(d.dateSignature),
]

const isStepValid = (idx, data) => !!STEP_VALIDATORS[idx]?.(data)

export default function App() {
  const { token, user, logout, login, authenticated } = useKeycloak()

  const hasRole = (role) => user?.realm_access?.roles?.includes(role) ?? false
  const isAdmin       = hasRole('admin')
  const isResponsable = hasRole('responsable')
  const isDG          = hasRole('direction-generale')

  const [showAccueil, setShowAccueil]     = useState(true)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showAdmin, setShowAdmin]         = useState(false)
  const [sidebarOpen, setSidebarOpen]     = useState(false)

  const goTo = (view) => {
    if (view === 'form'      && (!authenticated || !isResponsable)) view = 'accueil'
    if (view === 'dashboard' && (!authenticated || !isDG))          view = 'accueil'
    if (view === 'admin'     && (!authenticated || !isAdmin))       view = 'accueil'
    setShowAccueil(view === 'accueil')
    setShowDashboard(view === 'dashboard')
    setShowAdmin(view === 'admin')
  }

  const saved    = loadSaved()
  const hasSaved = Object.keys(saved).length > 0
  const [savedFields]       = useState(() => new Set(Object.keys(saved).filter(k => saved[k])))
  const [formData, setFormData] = useState(() => buildInitialData(saved))
  const [currentStep, setCurrentStep] = useState(0)
  const [submitted, setSubmitted]     = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [attempted, setAttempted]     = useState(new Set())
  const [maxReached, setMaxReached]   = useState(0)
  const [directionFields, setDirectionFields] = useState(new Set())
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    const { intituleDirection, periodeDebut, periodeFin } = formData
    if (!intituleDirection || !periodeDebut || !periodeFin) { setAlreadySubmitted(false); return }
    checkDoublon(intituleDirection, periodeDebut, periodeFin)
      .then(({ exists }) => setAlreadySubmitted(exists))
      .catch(() => {})
  }, [formData.intituleDirection, formData.periodeDebut, formData.periodeFin])

  const updateData = (fields) => setFormData(prev => ({ ...prev, ...fields }))

  const resetForDirection = (prefill) => {
    setFormData({ ...buildInitialData(), ...prefill })
    setDirectionFields(new Set(Object.keys(prefill).filter(k => k !== 'intituleDirection' && prefill[k])))
    setCurrentStep(0)
    setAttempted(new Set())
    setMaxReached(0)
  }

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
    if (firstInvalid !== -1) { setCurrentStep(firstInvalid); return }

    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitRevue(formData, token)
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
  const stepValid  = isStepValid(currentStep, formData)
  const showErrors = attempted.has(currentStep)

  const sidebar = (
    <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-md z-50 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-52' : 'w-12'}`}>
      <button
        onClick={() => setSidebarOpen(o => !o)}
        className="flex items-center justify-center h-12 w-full text-gray-500 hover:bg-gray-100 transition-colors border-b border-gray-200 shrink-0"
        title={sidebarOpen ? 'Réduire' : 'Ouvrir le menu'}
      >
        {sidebarOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
      <nav className="flex flex-col flex-1 pt-2 overflow-hidden">
        <button
          onClick={() => goTo('accueil')}
          title="Accueil"
          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${showAccueil ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {sidebarOpen && 'Accueil'}
        </button>
        {authenticated && isResponsable && (
          <button
            onClick={() => goTo('form')}
            title="Formulaire"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${!showAccueil && !showDashboard && !showAdmin ? 'bg-green-50 text-green-900' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {sidebarOpen && 'Formulaire'}
          </button>
        )}
        {authenticated && isDG && (
          <button
            onClick={() => goTo('dashboard')}
            title="Analyses"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${showDashboard ? 'bg-blue-50 text-blue-900' : 'text-blue-800 hover:bg-blue-50'}`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {sidebarOpen && 'Analyses'}
          </button>
        )}
        {authenticated && isAdmin && (
          <button
            onClick={() => goTo('admin')}
            title="Admin"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${showAdmin ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {sidebarOpen && 'Admin'}
          </button>
        )}
      </nav>
      <div className="border-t border-gray-200 p-2 shrink-0">
        {authenticated ? (
          <div className="flex flex-col gap-1">
            {sidebarOpen && (
              <span className="text-xs text-gray-500 truncate px-1">
                {user?.preferred_username || user?.name}
              </span>
            )}
            <button
              onClick={logout}
              title="Déconnexion"
              className="flex items-center gap-3 px-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm whitespace-nowrap w-full"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {sidebarOpen && 'Déconnexion'}
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            title="Connexion"
            className="flex items-center gap-3 px-2 py-2 rounded-lg bg-blue-800 text-white hover:bg-blue-900 transition-colors text-sm font-medium whitespace-nowrap w-full"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && 'Connexion'}
          </button>
        )}
      </div>
    </aside>
  )

  const mainOffset = `transition-all duration-300 ${sidebarOpen ? 'ml-52' : 'ml-12'}`

  if (showAccueil) return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebar}
      <div className={`flex-1 ${mainOffset}`}>
        <Accueil onNavigate={goTo} authenticated={authenticated} onLogin={login} user={user} />
      </div>
    </div>
  )

  if (showDashboard) return (
    isDG ? (
      <div className="min-h-screen bg-gray-50 flex">
        {sidebar}
        <div className={`flex-1 ${mainOffset}`}>
          <Dashboard />
        </div>
      </div>
    ) : (
      <div className="min-h-screen bg-gray-50 flex">
        {sidebar}
        <div className={`flex-1 ${mainOffset}`}>
          <Accueil onNavigate={goTo} authenticated={authenticated} onLogin={login} user={user} />
        </div>
      </div>
    )
  )

  if (showAdmin) return (
    isAdmin ? (
      <div className="min-h-screen bg-gray-50 flex">
        {sidebar}
        <div className={`flex-1 ${mainOffset}`}>
          <Admin />
        </div>
      </div>
    ) : (
      <div className="min-h-screen bg-gray-50 flex">
        {sidebar}
        <div className={`flex-1 ${mainOffset}`}>
          <Accueil onNavigate={goTo} authenticated={authenticated} onLogin={login} user={user} />
        </div>
      </div>
    )
  )

  if (!authenticated || !isResponsable) return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebar}
      <div className={`flex-1 ${mainOffset}`}>
        <Accueil onNavigate={goTo} authenticated={authenticated} onLogin={login} user={user} />
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebar}
      <div className={`flex-1 flex items-center justify-center p-4 ${mainOffset}`}>
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
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebar}
      <div className={`flex-1 flex flex-col ${mainOffset}`}>

      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 text-center">
          <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">
            Ministère de l&apos;Économie et des Finances — Direction Générale
          </p>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mt-0.5">
            Fiche Standard de Revue des Directions
          </h1>
          <p className="text-xs text-gray-400 italic">Document administratif — MEF</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        {hasSaved && (
          <div className="mb-4 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-teal-800">
              Certaines informations permanentes ont été pré-remplies depuis votre dernière soumission
              <span className="ml-1 inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs font-semibold px-1.5 py-0.5 rounded">pré-rempli</span>.
              Vérifiez-les et corrigez si nécessaire.
            </p>
          </div>
        )}

        {alreadySubmitted && (
          <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-amber-800">
              <strong>Soumission déjà effectuée.</strong>{' '}
              La direction <strong>{formData.intituleDirection}</strong> a déjà soumis une fiche pour cette période. Une seule soumission est autorisée par période.
            </p>
          </div>
        )}

        {/* Progress bar */}
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
              const valid      = isStepValid(idx, formData)
              const isAttempted = attempted.has(idx)
              const isCurrent  = idx === currentStep
              const isLocked   = idx > maxReached

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

        {submitError && (
          <div className="mb-4 bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700"><strong>Erreur :</strong> {submitError}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <StepComponent
            data={formData}
            onChange={updateData}
            showErrors={showErrors}
            savedFields={savedFields}
            onDirectionSelect={resetForDirection}
            directionFields={directionFields}
          />
        </div>

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
              disabled={submitting || alreadySubmitted}
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

      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-gray-400">
          <span className="font-semibold text-gray-500">Contact administrateur</span>
          <a href="mailto:admin.revue@finances.gov.mg" className="flex items-center gap-1 hover:text-blue-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            admin.revue@finances.gov.mg
          </a>
          <a href="tel:+261200000000" className="flex items-center gap-1 hover:text-blue-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            +261 20 00 000 00
          </a>
          <span className="text-gray-300">|</span>
          <span>MEF — Direction Générale &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
      </div>
    </div>
  )
}
