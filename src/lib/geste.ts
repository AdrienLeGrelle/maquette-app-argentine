import { Platform } from 'react-native'

/**
 * À la souris, relâcher un glissé envoie aussi un clic : il ouvrirait ce qui
 * se trouve sous le pointeur (une discussion, un jour). On l'avale. Au doigt,
 * il n'y en a pas.
 */
export function avalerClic() {
  if (Platform.OS !== 'web') return
  const stop = (e: Event) => { e.stopPropagation(); e.preventDefault() }
  window.addEventListener('click', stop, { capture: true, once: true })
  setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 300)
}
