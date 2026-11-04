import { useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react'
import { Animated, PanResponder, Platform, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native'

const natif = Platform.OS !== 'web'
/** À quelle distance du bord la rangée se met à défiler pendant le glisser. */
const BORD = 36
/** Vitesse de ce défilement, en points par image. */
const PAS = 7

/** Ce que reçoit chaque élément : s'il est en train d'être déplacé, et de quoi le faire voir en entier. */
export type PoigneeTri = { glisse: boolean; reveler: () => void }

/**
 * Une rangée défilante d'éléments qu'on réordonne au doigt : on attrape l'un
 * et on le fait glisser à gauche ou à droite, les voisins s'écartent. Arrivé
 * au bord, la rangée défile toute seule. L'ordre part au lâcher.
 */
export function Triables({ cles, gap, marge, style, onOrdre, rendre, fin }: {
  cles: string[]
  gap: number
  /** Marge à gauche et à droite de la rangée. */
  marge: number
  style?: StyleProp<ViewStyle>
  onOrdre: (cles: string[]) => void
  rendre: (cle: string, poignee: PoigneeTri) => ReactNode
  /** Ce qui suit la rangée sans se déplacer (le bouton « + »). */
  fin?: ReactNode
}) {
  const [glisse, setGlisse] = useState<string | null>(null)
  const [ordre, setOrdre] = useState(cles)
  const [x] = useState(() => new Animated.Value(0))
  const [echelle] = useState(() => new Animated.Value(1))
  const defile = useRef<ComponentRef<typeof ScrollView>>(null)
  // Lu et écrit seulement dans les gestes, jamais au rendu.
  const g = useRef({
    cle: null as string | null, touche: null as string | null, ordre: cles, depart: 0, dx: 0,
    decalage: 0, decalageDepart: 0, vue: 0, contenu: 0, boucle: 0, largeurs: {} as Record<string, number>,
  })

  const position = (cle: string, o: string[]) => {
    let p = 0
    for (const k of o) {
      if (k === cle) return p
      p += (g.current.largeurs[k] ?? 0) + gap
    }
    return p
  }

  // Place l'élément glissé sous le doigt et range les voisins autour.
  const placer = () => {
    const cle = g.current.cle
    if (!cle) return
    const w = g.current.largeurs[cle] ?? 0
    const cible = g.current.depart + g.current.dx + (g.current.decalage - g.current.decalageDepart)
    const centre = cible + w / 2
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
  }

  // Tant qu'on tient l'élément près d'un bord, la rangée avance d'elle-même.
  const bord = () => {
    const e = g.current
    if (!e.cle) return
    const w = e.largeurs[e.cle] ?? 0
    const gauche = marge + e.depart + e.dx + (e.decalage - e.decalageDepart) - e.decalage
    const max = Math.max(0, e.contenu - e.vue)
    let pas = 0
    if (gauche < BORD) pas = -PAS
    else if (gauche + w > e.vue - BORD) pas = PAS
    const suivant = Math.min(max, Math.max(0, e.decalage + pas))
    if (suivant !== e.decalage) {
      e.decalage = suivant
      defile.current?.scrollTo({ x: suivant, animated: false })
      placer()
    }
    e.boucle = requestAnimationFrame(bord)
  }

  const commencer = (cle: string) => {
    g.current = { ...g.current, cle, ordre: cles, dx: 0, decalageDepart: g.current.decalage }
    g.current.depart = position(cle, cles)
    setOrdre(cles)
    x.setValue(0)
    setGlisse(cle)
    Animated.spring(echelle, { toValue: 1.08, useNativeDriver: natif }).start()
    g.current.boucle = requestAnimationFrame(bord)
  }

  const finir = () => {
    const cle = g.current.cle
    cancelAnimationFrame(g.current.boucle)
    g.current.touche = null
    if (!cle) return
    g.current.cle = null
    onOrdre(g.current.ordre)
    Animated.parallel([
      Animated.spring(x, { toValue: 0, useNativeDriver: natif, bounciness: 0 }),
      Animated.spring(echelle, { toValue: 1, useNativeDriver: natif }),
    ]).start(() => setGlisse(null))
  }

  useEffect(() => () => cancelAnimationFrame(g.current.boucle), [])

  const repondeur = useMemo(() => PanResponder.create({
    // Chaque nouveau toucher repart de zéro ; l'élément touché se signale juste après.
    onStartShouldSetPanResponderCapture: () => { g.current.touche = null; return false },
    // Le doigt part à l'horizontale sur un élément : on l'attrape.
    onMoveShouldSetPanResponderCapture: (_, geste) =>
      g.current.touche != null && Math.abs(geste.dx) > 6 && Math.abs(geste.dx) > Math.abs(geste.dy),
    onPanResponderGrant: () => { if (g.current.touche) commencer(g.current.touche) },
    onPanResponderMove: (_, geste) => { g.current.dx = geste.dx; placer() },
    onPanResponderRelease: finir,
    onPanResponderTerminate: finir,
    onPanResponderTerminationRequest: () => false,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [cles, gap])

  // Fait défiler la rangée pour montrer un élément à moitié caché.
  const reveler = (cle: string) => {
    const e = g.current
    const gauche = marge + position(cle, cles)
    const droite = gauche + (e.largeurs[cle] ?? 0) + marge
    let cible = e.decalage
    if (gauche - marge < e.decalage) cible = gauche - marge
    else if (droite > e.decalage + e.vue) cible = droite - e.vue
    if (cible !== e.decalage) defile.current?.scrollTo({ x: cible, animated: true })
  }

  const affiche = glisse ? ordre : cles
  return (
    // Le défilement à la main est coupé : glisser à l'horizontale déplace un
    // élément. La rangée avance quand on l'amène au bord, ou quand on touche
    // un élément à moitié caché.
    <ScrollView ref={defile} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} style={style}
                contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap, paddingHorizontal: marge }}
                onLayout={(e) => { g.current.vue = e.nativeEvent.layout.width }}
                onContentSizeChange={(w) => { g.current.contenu = w }}
                onScroll={(e) => { g.current.decalage = e.nativeEvent.contentOffset.x }} scrollEventThrottle={16}>
      <View {...repondeur.panHandlers} style={{ flexDirection: 'row', gap, zIndex: glisse ? 2 : 0 }}>
        {affiche.map((cle) => {
          const actif = cle === glisse
          return (
            <Animated.View key={cle} onLayout={(e) => { g.current.largeurs[cle] = e.nativeEvent.layout.width }}
                           onStartShouldSetResponderCapture={() => { g.current.touche = cle; return false }}
                           style={actif ? { zIndex: 2, transform: [{ translateX: x }, { scale: echelle }] } : null}>
              {rendre(cle, { glisse: actif, reveler: () => reveler(cle) })}
            </Animated.View>
          )
        })}
      </View>
      {fin}
    </ScrollView>
  )
}
