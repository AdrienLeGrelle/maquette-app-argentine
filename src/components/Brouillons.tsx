import { useMemo, useState } from 'react'
import { Animated, Easing, PanResponder, Platform, StyleSheet, Text, View } from 'react-native'
import { Icon } from '@/lib/icons'
import { useWa } from '@/lib/theme'

const natif = Platform.OS !== 'web'
/** Où commence le texte du champ : marge, bouton « + », écart, marge intérieure. */
const DEBUT_CHAMP = 12 + 26 + 12 + 14
/** Marge haute de la barre de saisie. */
const HAUT_BARRE = 8

/**
 * Les réponses proposées, en bulles au-dessus de la barre de saisie.
 * Toucher une bulle l'envoie telle quelle ; la faire glisser jusqu'à la barre
 * la dépose dans le champ, pour la corriger avant d'envoyer.
 */
export function Brouillons({ propositions, onEnvoyer, onCorriger }: {
  propositions: string[]
  onEnvoyer: (texte: string) => void
  onCorriger: (texte: string) => void
}) {
  const wa = useWa()
  // Hauteur de la zone : la barre de saisie commence juste en dessous.
  // Objet mutable, lu seulement pendant les gestes.
  const [zone] = useState(() => ({ hauteur: 0 }))
  return (
    <View style={s.zone} onLayout={(e) => { Object.assign(zone, { hauteur: e.nativeEvent.layout.height }) }}>
      <View style={s.aide}>
        <Icon name="sparkles" size={13} color={wa.gris} plein />
        <Text style={[s.aideTexte, { color: wa.gris }]}>Touchez pour envoyer · glissez vers la barre pour corriger</Text>
      </View>
      {propositions.map((p) => <Proposition key={p} texte={p} zone={zone} onEnvoyer={onEnvoyer} onCorriger={onCorriger} />)}
    </View>
  )
}

function Proposition({ texte, zone, onEnvoyer, onCorriger }: {
  texte: string
  zone: { hauteur: number }
  onEnvoyer: (t: string) => void
  onCorriger: (t: string) => void
}) {
  const wa = useWa()
  const [xy] = useState(() => new Animated.ValueXY())
  const [echelle] = useState(() => new Animated.Value(1))
  const [opacite] = useState(() => new Animated.Value(1))
  const [prise, setPrise] = useState(false)
  // Place de la bulle dans la zone, lue seulement pendant le geste.
  const [cadre] = useState(() => ({ x: 0, y: 0, w: 0, h: 0 }))

  const repondeur = useMemo(() => {
    const reposer = () => Animated.parallel([
      Animated.spring(xy, { toValue: { x: 0, y: 0 }, useNativeDriver: natif, bounciness: 6 }),
      Animated.spring(echelle, { toValue: 1, useNativeDriver: natif }),
    ]).start()
    // Écart entre le bas de la bulle et le haut de la barre.
    const ecart = () => zone.hauteur - cadre.y - cadre.h
    // La bulle file dans le champ en rapetissant, puis le texte y apparaît.
    const deposer = () => {
      const { x, y, w } = cadre
      const fin = 0.92
      const cible = { x: DEBUT_CHAMP - x - (w * (1 - fin)) / 2, y: zone.hauteur + HAUT_BARRE - y }
      Animated.parallel([
        Animated.timing(xy, { toValue: cible, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: natif }),
        Animated.timing(echelle, { toValue: fin, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: natif }),
        Animated.timing(opacite, { toValue: 0, duration: 120, delay: 130, useNativeDriver: natif }),
      ]).start(() => {
        onCorriger(texte)
        xy.setValue({ x: 0, y: 0 })
        echelle.setValue(1)
        opacite.setValue(1)
      })
    }
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setPrise(true)
        Animated.spring(echelle, { toValue: 1.04, useNativeDriver: natif }).start()
      },
      onPanResponderMove: (_, g) => xy.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_, g) => {
        setPrise(false)
        if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) { reposer(); onEnvoyer(texte); return }
        if (g.dy > Math.max(20, ecart() * 0.6)) { deposer(); return }
        reposer()
      },
      onPanResponderTerminate: () => { setPrise(false); reposer() },
    })
  }, [xy, echelle, opacite, zone, cadre, texte, onEnvoyer, onCorriger])

  return (
    <Animated.View {...repondeur.panHandlers} accessibilityRole="button" accessibilityLabel={`Envoyer : ${texte}`}
                   onLayout={(e) => { const l = e.nativeEvent.layout; Object.assign(cadre, { x: l.x, y: l.y, w: l.width, h: l.height }) }}
                   style={[s.bulle, { backgroundColor: wa.bulleOut, borderColor: wa.vert, opacity: opacite }, prise && s.prise,
                           { transform: [...xy.getTranslateTransform(), { scale: echelle }] }]}>
      <Text style={[s.texte, { color: wa.encre }]}>{texte}</Text>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  // Au-dessus de la barre de saisie, pour que la bulle glissée passe devant.
  zone: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 8, gap: 6, alignItems: 'flex-end', zIndex: 5, elevation: 5 },
  aide: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', marginBottom: 2 },
  aideTexte: { fontSize: 12 },
  bulle: { maxWidth: '85%', borderRadius: 14, borderTopRightRadius: 4, borderWidth: 1.2, borderStyle: 'dashed', paddingHorizontal: 11, paddingVertical: 8,
           userSelect: 'none', cursor: 'grab' },
  prise: { boxShadow: '0 8px 20px rgba(11,20,26,.22)', zIndex: 2, cursor: 'grabbing' },
  texte: { fontSize: 16, lineHeight: 21 },
})
