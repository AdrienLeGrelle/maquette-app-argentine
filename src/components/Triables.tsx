import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Animated, PanResponder, Platform, View } from 'react-native'

const natif = Platform.OS !== 'web'

/** Ce que reçoit chaque élément : de quoi lancer le glisser par un appui long. */
export type PoigneeTri = { glisse: boolean; onLongPress: () => void; onPressOut: () => void }

/**
 * Une rangée d'éléments qu'on réordonne au doigt : appui long sur l'un, il se
 * soulève, on le fait glisser, les voisins s'écartent. L'ordre part au lâcher.
 */
export function Triables({ cles, gap, onOrdre, onGlisse, rendre }: {
  cles: string[]
  gap: number
  onOrdre: (cles: string[]) => void
  /** Prévient le parent, pour couper le défilement horizontal pendant le glisser. */
  onGlisse?: (v: boolean) => void
  rendre: (cle: string, poignee: PoigneeTri) => ReactNode
}) {
  const [glisse, setGlisse] = useState<string | null>(null)
  const [ordre, setOrdre] = useState(cles)
  const [x] = useState(() => new Animated.Value(0))
  const [echelle] = useState(() => new Animated.Value(1))
  // Lu et écrit seulement dans les gestes, jamais au rendu.
  const g = useRef({ cle: null as string | null, ordre: cles, depart: 0, pan: false, largeurs: {} as Record<string, number> })

  const position = (cle: string, o: string[]) => {
    let p = 0
    for (const k of o) {
      if (k === cle) return p
      p += (g.current.largeurs[k] ?? 0) + gap
    }
    return p
  }

  const finir = () => {
    const cle = g.current.cle
    if (!cle) return
    g.current.cle = null
    g.current.pan = false
    onOrdre(g.current.ordre)
    Animated.parallel([
      Animated.spring(x, { toValue: 0, useNativeDriver: natif, bounciness: 0 }),
      Animated.spring(echelle, { toValue: 1, useNativeDriver: natif }),
    ]).start(() => setGlisse(null))
    onGlisse?.(false)
  }

  const commencer = (cle: string) => {
    g.current = { ...g.current, cle, ordre: cles, pan: false }
    g.current.depart = position(cle, cles)
    setOrdre(cles)
    x.setValue(0)
    setGlisse(cle)
    onGlisse?.(true)
    Animated.spring(echelle, { toValue: 1.08, useNativeDriver: natif }).start()
  }

  const repondeur = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => g.current.cle != null,
    onMoveShouldSetPanResponderCapture: () => g.current.cle != null,
    onPanResponderGrant: () => { g.current.pan = true },
    onPanResponderMove: (_, geste) => {
      const cle = g.current.cle
      if (!cle) return
      const w = g.current.largeurs[cle] ?? 0
      const cible = g.current.depart + geste.dx
      const centre = cible + w / 2
      // Où le placer : avant le premier voisin dont le centre est plus loin.
      const autres = g.current.ordre.filter((k) => k !== cle)
      let p = 0
      let i = 0
      for (; i < autres.length; i++) {
        const wk = g.current.largeurs[autres[i]] ?? 0
        if (centre < p + wk / 2) break
        p += wk + gap
      }
      const nouvel = [...autres.slice(0, i), cle, ...autres.slice(i)]
      if (nouvel.join() !== g.current.ordre.join()) {
        g.current.ordre = nouvel
        setOrdre(nouvel)
      }
      x.setValue(cible - position(cle, nouvel))
    },
    onPanResponderRelease: finir,
    onPanResponderTerminate: finir,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [cles, gap])

  const affiche = glisse ? ordre : cles
  return (
    <View {...repondeur.panHandlers} style={{ flexDirection: 'row', gap }}>
      {affiche.map((cle) => {
        const actif = cle === glisse
        return (
          <Animated.View key={cle} onLayout={(e) => { g.current.largeurs[cle] = e.nativeEvent.layout.width }}
                         style={actif ? { zIndex: 2, transform: [{ translateX: x }, { scale: echelle }] } : null}>
            {rendre(cle, {
              glisse: actif,
              onLongPress: () => commencer(cle),
              // Lâché sans bouger : on repose l'élément. Si le glisser a pris
              // la main, le geste se termine de son côté.
              onPressOut: () => setTimeout(() => { if (!g.current.pan) finir() }, 60),
            })}
          </Animated.View>
        )
      })}
    </View>
  )
}
