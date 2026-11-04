import { useEffect, useState, type ComponentRef, type ReactNode } from 'react'
import { Animated, Platform, StyleSheet, View } from 'react-native'
import { useEtat } from '@/lib/etat'
import { useWa } from '@/lib/theme'

const natif = Platform.OS !== 'web'

/** Un anneau qui pulse autour d'un élément : « c'est ici ». */
export function Halo({ rayon = 14, couleur }: { rayon?: number; couleur?: string }) {
  const wa = useWa()
  const [v] = useState(() => new Animated.Value(0))
  useEffect(() => {
    const boucle = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: natif }),
      Animated.timing(v, { toValue: 0, duration: 700, useNativeDriver: natif }),
    ]))
    boucle.start()
    return () => boucle.stop()
  }, [v])
  return (
    <Animated.View style={[s.halo, {
      borderRadius: rayon, borderColor: couleur ?? wa.vert,
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
    }]} />
  )
}

/**
 * Enveloppe un bouton que l'assistant d'aide peut montrer : quand `montrer`
 * vaut `cle`, l'écran défile jusqu'à lui et un halo l'entoure jusqu'à ce
 * qu'on le touche. C'est à l'hôtelier de toucher : on montre, on ne fait pas.
 */
export function Repere({ cle, rayon, children }: { cle: string; rayon?: number; children: ReactNode }) {
  const { montrer, setMontrer } = useEtat()
  const [boite, setBoite] = useState<ComponentRef<typeof View> | null>(null)
  const actif = montrer === cle
  useEffect(() => {
    if (!actif) return
    // Le temps que l'onglet arrive, puis on amène le bouton au milieu de l'écran.
    const t = setTimeout(() => defilerJusqua(boite), 450)
    // Filet de sécurité : le halo finit par s'éteindre si personne ne touche.
    const fin = setTimeout(() => setMontrer(null), 60000)
    return () => { clearTimeout(t); clearTimeout(fin) }
  }, [actif, boite, setMontrer])
  return (
    <View ref={setBoite} onTouchStart={actif ? () => setMontrer(null) : undefined}
          onPointerDown={actif ? () => setMontrer(null) : undefined}>
      {children}
      {actif && <Halo rayon={rayon} />}
    </View>
  )
}

/**
 * Fait défiler la liste qui contient l'élément pour le poser au milieu de
 * l'écran. Sur le web seulement (la maquette s'ouvre dans Safari) ; on ne
 * touche qu'au défilement vertical, jamais aux onglets posés côte à côte.
 */
function defilerJusqua(vue: ComponentRef<typeof View> | null) {
  if (Platform.OS !== 'web' || !vue) return
  const el = vue as unknown as HTMLElement
  let liste = el.parentElement
  while (liste && !(/(auto|scroll)/.test(getComputedStyle(liste).overflowY) && liste.scrollHeight > liste.clientHeight)) liste = liste.parentElement
  if (!liste) return
  const r = el.getBoundingClientRect()
  const l = liste.getBoundingClientRect()
  // Déjà bien visible : on ne bouge rien.
  if (r.top >= l.top + 40 && r.bottom <= l.bottom - 40) return
  // La liste de React Native remplace `scrollTo` par la sienne : on appelle celle du navigateur.
  const defiler = Element.prototype.scrollTo as (this: Element, o: ScrollToOptions) => void
  defiler.call(liste, { top: Math.max(0, liste.scrollTop + (r.top - l.top) - (l.height - r.height) / 2), behavior: 'smooth' })
}

const s = StyleSheet.create({
  halo: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderWidth: 3, pointerEvents: 'none' },
})
