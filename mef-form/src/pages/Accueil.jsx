import { useTranslation } from 'react-i18next'

export default function Accueil({ onNavigate, authenticated, onLogin, user }) {
  const { t } = useTranslation()

  const hasRole = (role) => user?.realm_access?.roles?.includes(role) ?? false
  const isResponsable = hasRole('responsable-direction')
  const isDG          = hasRole('direction-generale')
  const isAdmin       = hasRole('admin')

  const featureCards = [
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      ),
      title: t('accueil.features.guided.title'),
      desc:  t('accueil.features.guided.desc'),
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      ),
      title: t('accueil.features.analytics.title'),
      desc:  t('accueil.features.analytics.desc'),
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      ),
      title: t('accueil.features.secure.title'),
      desc:  t('accueil.features.secure.desc'),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">{t('accueil.country')}</p>
            <p className="text-gray-800 text-sm font-bold">{t('accueil.ministry')}</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto">

          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full border border-blue-100 mb-6">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {t('accueil.badge')}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            {t('accueil.title')}<br />
            <span className="text-blue-700">{t('accueil.titleHighlight')}</span>
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            {t('accueil.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {authenticated ? (
              <>
                {isResponsable && (
                  <button
                    onClick={() => onNavigate('form')}
                    className="flex items-center gap-2 px-7 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('accueil.fillForm')}
                  </button>
                )}
                {isDG && (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-2 px-7 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {t('accueil.dashboard')}
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="flex items-center gap-2 px-7 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('accueil.administration')}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-8 py-3.5 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {t('accueil.connect')}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {featureCards.map((card, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {card.icon}
              </svg>
            </div>
            <h3 className="text-gray-800 font-bold text-sm mb-1">{card.title}</h3>
            <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center">
        <p className="text-gray-400 text-xs">
          {t('accueil.footer', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  )
}
