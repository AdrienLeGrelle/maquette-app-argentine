import { useMemo, useState } from 'react'
import { Animated, PanResponder, Platform, StyleSheet, Text, View } from 'react-native'
import { Icon } from '@/lib/icons'
import { useWa } from '@/lib/theme'

const natif = Platform.OS !== 'web'
/** De combien descendre la bulle pour qu'elle tombe dans la barre de saisie. */
const VERS_LA_BARRE = 28

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
  return (
    <View style={s.zone}>
      <View style={s.aide}>
        <Icon name="sparkles" size={13} color={wa.gris} plein />
        <Text style={[s.aideTexte, { color: wa.gris }]}>Touchez pour envoyer · glissez vers la barre pour corriger</Text>
      </View>
      {propositions.map((p) => <Proposition key={p} texte={p} onEnvoyer={onEnvoyer} onCorriger={onCorriger} />)}
    </View>
  )
}

function Proposition({ texte, onEnvoyer, onCorriger }: { texte: string; onEnvoyer: (t: string) => void; onCorriger: (t: string) => void }) {
  const wa = useWa()
  const [xy] = useState(() => new Animated.ValueXY())
  const [prise, setPrise] = useState(false)

  const repondeur = useMemo(() => {
    const reposer = () => Animated.spring(xy, { toValue: { x: 0, y: 0 }, useNativeDriver: natif, bounciness: 6 }).start()
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setPrise(true),
      onPanResponderMove: (_, g) => xy.setValue({ x: g.dx * 0.4, y: Math.max(-20, g.dy) }),
      onPanResponderRelease: (_, g) => {
        setPrise(false)
        if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) { reposer(); onEnvoyer(texte); return }
        if (g.dy > VERS_LA_BARRE) { xy.setValue({ x: 0, y: 0 }); onCorriger(texte); return }
        reposer()
      },
      onPanResponderTerminate: () => { setPrise(false); reposer() },
    })
  }, [xy, texte, onEnvoyer, onCorriger])

  return (
    <Animated.View {...repondeur.panHandlers} accessibilityRole="button" accessibilityLabel={`Envoyer : ${texte}`}
                   style={[s.bulle, { backgroundColor: wa.bulleOut, borderColor: wa.vert }, prise && s.prise,
                           { transform: xy.getTranslateTransform() }]}>
      <Text style={[s.texte, { color: wa.encre }]}>{texte}</Text>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  zone: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 8, gap: 6, alignItems: 'flex-end' },
  aide: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', marginBottom: 2 },
  aideTexte: { fontSize: 12 },
  bulle: { maxWidth: '85%', borderRadius: 14, borderTopRightRadius: 4, borderWidth: 1.2, borderStyle: 'dashed', paddingHorizontal: 11, paddingVertical: 8,
           userSelect: 'none', cursor: 'grab' },
  prise: { boxShadow: '0 6px 16px rgba(11,20,26,.18)', zIndex: 2 },
  texte: { fontSize: 16, lineHeight: 21 },
})
