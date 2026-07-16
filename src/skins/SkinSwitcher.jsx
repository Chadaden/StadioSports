import { useSkin } from './SkinContext'

// Floating skin toggle. Deliberately small and unobtrusive — it is the control
// that lets you jump into the new look and, just as importantly, jump straight
// back to the current one. Easy to hide behind a role/param or remove entirely
// once a direction is locked in.
export default function SkinSwitcher() {
  const { skin, toggle } = useSkin()
  const isNew = skin === 'stardial'
  return (
    <button
      type="button"
      className={`skin-switcher${isNew ? ' is-new' : ''}`}
      onClick={toggle}
      aria-pressed={isNew}
      title="Switch between the current look and the new Stardial look"
    >
      <span className="skin-switcher-dot" aria-hidden="true" />
      <span className="skin-switcher-label">{isNew ? 'New look' : 'Try the new look'}</span>
    </button>
  )
}
