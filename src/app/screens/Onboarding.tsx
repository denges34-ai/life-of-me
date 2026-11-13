import { useState, type FormEvent } from 'react'
import { completeOnboarding } from '../../core/company'
import { CURRENCIES } from '../../core/format'
import { officeRegistry } from '../../offices/registry'
import { Button } from '../../shared/ui/Button'
import { ONBOARDING_STEPS, useOnboardingStore } from '../onboardingStore'

const INPUT_CLASS =
  'mt-6 w-full rounded-2xl bg-white px-4 py-4 text-lg font-semibold shadow-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-brand-500'

/** Onboarding en 4 étapes : entreprise, prénom, bureaux, devise. */
export function Onboarding() {
  const draft = useOnboardingStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLastStep = draft.step === ONBOARDING_STEPS - 1

  // Chaque étape dit si on peut continuer.
  const canContinue = [
    true, // nom d'entreprise : vide = nom par défaut
    draft.firstName.trim().length > 0,
    draft.enabledOfficeIds.length > 0,
    true,
  ][draft.step]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canContinue || saving) return
    if (!isLastStep) return draft.next()

    setSaving(true)
    setError(null)
    try {
      await completeOnboarding(
        {
          companyName: draft.companyName,
          firstName: draft.firstName,
          currency: draft.currency,
          enabledOfficeIds: draft.enabledOfficeIds,
        },
        officeRegistry.map((office) => office.id),
      )
      draft.reset()
    } catch {
      setError("L'enregistrement n'a pas fonctionné. Réessaie dans un instant.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="safe-top safe-bottom mx-auto flex h-full max-w-md flex-col px-6">
      {/* Progression */}
      <div className="flex gap-2" aria-label={`Étape ${draft.step + 1} sur ${ONBOARDING_STEPS}`}>
        {Array.from({ length: ONBOARDING_STEPS }, (_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${index <= draft.step ? 'bg-brand-500' : 'bg-black/10'}`}
          />
        ))}
      </div>

      <div key={draft.step} className="pop-in min-h-0 flex-1 overflow-y-auto py-8">
        {draft.step === 0 && (
          <>
            <div className="text-5xl">🏢</div>
            <h1 className="mt-4 text-3xl font-extrabold">Bienvenue, PDG.</h1>
            <p className="mt-2 text-muted">Ta vie devient une mini-entreprise. Comment s'appelle-t-elle ?</p>
            <input
              className={INPUT_CLASS}
              value={draft.companyName}
              onChange={(e) => draft.setCompanyName(e.target.value)}
              placeholder="Life of Me"
              maxLength={40}
              aria-label="Nom de l'entreprise"
              enterKeyHint="next"
            />
          </>
        )}

        {draft.step === 1 && (
          <>
            <div className="text-5xl">👔</div>
            <h1 className="mt-4 text-3xl font-extrabold">Et toi, c'est ?</h1>
            <p className="mt-2 text-muted">Ton prénom, pour que l'entreprise sache qui est le patron.</p>
            <input
              className={INPUT_CLASS}
              value={draft.firstName}
              onChange={(e) => draft.setFirstName(e.target.value)}
              placeholder="Ton prénom"
              maxLength={30}
              autoComplete="given-name"
              autoCapitalize="words"
              aria-label="Prénom"
              enterKeyHint="next"
              autoFocus
            />
          </>
        )}

        {draft.step === 2 && (
          <>
            <h1 className="text-3xl font-extrabold">Tes bureaux</h1>
            <p className="mt-2 text-muted">Choisis ceux que tu veux dans ton open space. Tu pourras changer plus tard.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {officeRegistry.map((office) => {
                const selected = draft.enabledOfficeIds.includes(office.id)
                return (
                  <button
                    key={office.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => draft.toggleOffice(office.id)}
                    className={`relative min-h-24 rounded-3xl p-4 text-left transition active:scale-[0.97] ${selected ? 'text-white shadow-md' : 'bg-white text-muted ring-1 ring-black/10'}`}
                    style={selected ? { backgroundColor: office.color } : undefined}
                  >
                    <div className={`text-3xl ${selected ? '' : 'opacity-50 grayscale'}`}>{office.icon}</div>
                    <div className="mt-2 text-sm font-bold">{office.defaultName}</div>
                    <div className="absolute right-3 top-3 text-sm font-bold">{selected ? '✓' : ''}</div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {draft.step === 3 && (
          <>
            <h1 className="text-3xl font-extrabold">Ta devise</h1>
            <p className="mt-2 text-muted">Celle dans laquelle tu comptes ton argent au quotidien.</p>
            <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="Devise">
              {CURRENCIES.map((currency) => {
                const selected = draft.currency === currency.code
                return (
                  <button
                    key={currency.code}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => draft.setCurrency(currency.code)}
                    className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 text-left transition active:scale-[0.98] ${selected ? 'bg-brand-500 text-white shadow-md' : 'bg-white ring-1 ring-black/10'}`}
                  >
                    <span className="text-2xl">{currency.flag}</span>
                    <span className="flex-1 font-semibold">{currency.label}</span>
                    <span className={`text-sm font-bold ${selected ? 'text-white/80' : 'text-muted'}`}>
                      {currency.code}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}

      {/* Actions en bas de l'écran, à portée de pouce */}
      <div className="flex gap-3">
        {draft.step > 0 && (
          <Button variant="ghost" onClick={draft.back} disabled={saving}>
            Retour
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={!canContinue || saving}>
          {isLastStep ? (saving ? 'Ouverture…' : 'Ouvrir mon entreprise 🚀') : 'Continuer'}
        </Button>
      </div>
    </form>
  )
}
