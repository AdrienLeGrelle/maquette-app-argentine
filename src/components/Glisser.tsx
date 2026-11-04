import { useMemo, useState, type ReactNode } from 'react'
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon, type IconName } from '@/lib/icons'
import { useWa } from '@/lib/theme'

const natif = Platform.OS !== 'web'
const BOUTON = 78

export type ActionGlisser = { label: string; icon: IconName; couleur: string; onPress: () => void }

/**
 * Glisser une ligne vers la gauche, comme dans WhatsApp : les boutons
 * apparaissent derrière et la ligne reste ouverte. Toucher un bouton agit et
 * referme ; toucher la ligne referme sans rien faire.
 */
export function Glisser({ children, actions }: { children: ReactNode; actions: ActionGlisser[] }) {
  const wa = useWa()
  const largeur = BOUTON * actions.length
  const [x] = useState(() => new Animated.Value(0))
  const [ouvert, setOuvert] = useState(false)

  const repondeur = useMemo(() => {
    const aller = (ouvrir: boolean) => {
      setOuvert(ouvrir)
      Animated.spring(x, { toValue: ouvrir ? -largeur : 0, useNativeDriver: natif, bounciness: 0 }).start()
    }
    return PanResponder.create({
      // Fermée, la ligne ne prend que le geste vers la gauche : vers la droite, l'écran passe à l'onglet voisin.
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && (ouvert || g.dx < 0),
      onPanResponderMove: (_, g) => x.setValue(Math.max(-largeur - 20, Math.min(0, g.dx + (ouvert ? -largeur : 0)))),
      onPanResponderRelease: (_, g) => aller(g.dx + (ouvert ? -largeur : 0) < -largeur / 2),
      onPanResponderTerminate: () => aller(ouvert),
      // Une fois la ligne prise, l'écran ne la lui reprend pas pour changer d'onglet.
      onPanResponderTerminationRequest: () => false,
    })
  }, [x, largeur, ouvert])

  const fermer = () => {
    setOuvert(false)
    Animated.spring(x, { toValue: 0, useNativeDriver: natif, bounciness: 0 }).start()
  }

  return (
    <View style={s.cadre}>
      <View style={[s.derriere, { width: largeur }]}>
        {actions.map((a) => (
          <Pressable key={a.label} onPress={() => { fermer(); a.onPress() }} accessibilityRole="button"
                     style={[s.bouton, { backgroundColor: a.couleur }]}>
            <Icon name={a.icon} size={22} color={wa.surVert} />
            <Text style={[s.label, { color: wa.surVert }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
      <Animated.View {...repondeur.panHandlers} style={[s.devant, { transform: [{ translateX: x }], backgroundColor: wa.fond }]}>
        {children}
        {ouvert && <Pressable onPress={fermer} accessibilityLabel="Refermer" style={s.voile} />}
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  cadre: { overflow: 'hidden' },
  derriere: { position: 'absolute', top: 0, bottom: 0, right: 0, flexDirection: 'row' },
  bouton: { width: BOUTON, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontSize: 12, fontWeight: '600' },
  voile: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  // Sur ordinateur, glisser à la souris ne doit pas sélectionner le texte.
  devant: { userSelect: 'none' },
})
