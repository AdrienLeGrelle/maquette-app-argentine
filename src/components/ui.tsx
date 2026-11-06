import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Icon, type IconName } from '@/lib/icons'
import { espace, rayon, tap, taille, useCouleurs } from '@/lib/theme'

/**
 * Les briques communes des écrans. Avant d'écrire un bouton ou un encadré
 * dans un écran, le prendre ici.
 */

/** Un écran : contenu qui défile, et le geste principal en bas, sous le pouce. */
export function Screen({ children, pie, haut = true }: { children: ReactNode; pie?: ReactNode; haut?: boolean }) {
  const c = useCouleurs()
  return (
    <SafeAreaView edges={haut ? ['top', 'bottom'] : ['bottom']} style={[s.flex, { backgroundColor: c.ground }]}>
      <ScrollView contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {pie && <View style={[s.pie, { borderTopColor: c.line, backgroundColor: c.ground }]}>{pie}</View>}
    </SafeAreaView>
  )
}

type ButtonProps = {
  children: string
  onPress: () => void
  kind?: 'primary' | 'secondary' | 'text'
  icon?: IconName
  loading?: boolean
}

export function Button({ children, onPress, kind = 'primary', icon, loading }: ButtonProps) {
  const c = useCouleurs()
  const fond = kind === 'primary' ? c.accent : kind === 'secondary' ? c.surface : 'transparent'
  const encre = kind === 'primary' ? c.onAccent : c.accentInk
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading}
      android_ripple={{ color: kind === 'primary' ? 'rgba(255,255,255,.2)' : c.accentWash }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: fond, opacity: pressed ? 0.85 : 1 },
        kind === 'secondary' && { borderWidth: 1, borderColor: c.line },
        kind === 'text' && s.btnTexte,
      ]}>
      {loading ? <ActivityIndicator color={encre} /> : (
        <>
          {icon && <Icon name={icon} size={20} color={encre} />}
          <Text style={[s.btnLabel, { color: encre }]}>{children}</Text>
        </>
      )}
    </Pressable>
  )
}

export function Notice({ children, tone = 'info', icon = 'info' }: { children: ReactNode; tone?: 'info' | 'warn'; icon?: IconName }) {
  const c = useCouleurs()
  const [fond, bord, encre] = tone === 'warn' ? [c.warnWash, c.warnLine, c.warnInk] : [c.infoWash, c.infoLine, c.info]
  return (
    <View style={[s.notice, { backgroundColor: fond, borderColor: bord }]}>
      <View style={s.noticeIcon}><Icon name={icon} size={17} color={encre} /></View>
      <Text style={[s.noticeTexte, { color: c.ink2 }]}>{children}</Text>
    </View>
  )
}

/** « Paso 1 de 2 » au-dessus du titre. */
export function Etape({ children }: { children: string }) {
  const c = useCouleurs()
  return <Text style={[s.etape, { color: c.accentInk }]}>{children}</Text>
}

export function Titre({ children, grand, centre }: { children: string; grand?: boolean; centre?: boolean }) {
  const c = useCouleurs()
  return <Text accessibilityRole="header" style={[grand ? s.titreGrand : s.titre, centre && s.centre, { color: c.ink }]}>{children}</Text>
}

export function Texte({ children, faible, centre }: { children: ReactNode; faible?: boolean; centre?: boolean }) {
  const c = useCouleurs()
  return <Text style={[s.texte, centre && s.centre, { color: faible ? c.muted : c.ink2 }]}>{children}</Text>
}

/**
 * Un volet qui se déroule vers le bas, et remonte au toucher suivant. Le
 * contenu reste monté pour être mesuré ; seule la hauteur s'anime.
 * `onOuvert` part une fois le volet tout à fait ouvert.
 */
export function Deroulant({ ouvert, onOuvert, children }: { ouvert: boolean; onOuvert?: () => void; children: ReactNode }) {
  const [hauteur, setHauteur] = useState(0)
  const [part] = useState(() => new Animated.Value(0))
  const fin = useRef(onOuvert)
  useEffect(() => { fin.current = onOuvert })

  useEffect(() => {
    Animated.timing(part, { toValue: ouvert ? 1 : 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false })
      .start(({ finished }) => { if (finished && ouvert) fin.current?.() })
  }, [ouvert, part])

  return (
    <Animated.View aria-hidden={!ouvert} pointerEvents={ouvert ? 'auto' : 'none'}
                   style={[s.deroulant, { height: part.interpolate({ inputRange: [0, 1], outputRange: [0, hauteur] }) }]}>
      <View style={s.deroulantContenu} onLayout={(e) => setHauteur(e.nativeEvent.layout.height)}>{children}</View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  contenu: { padding: espace[5], gap: espace[4], flexGrow: 1 },
  pie: { padding: espace[4], paddingBottom: espace[3], borderTopWidth: StyleSheet.hairlineWidth, gap: espace[2] },
  btn: {
    minHeight: tap.btn, borderRadius: rayon.md, paddingHorizontal: espace[5],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espace[2], overflow: 'hidden',
  },
  btnTexte: { minHeight: 48 },
  btnLabel: { fontSize: taille.label, fontWeight: '600' },
  notice: { flexDirection: 'row', gap: espace[3], padding: espace[3], borderRadius: rayon.md, borderWidth: 1 },
  noticeIcon: { paddingTop: 2 },
  noticeTexte: { flex: 1, fontSize: taille.meta, lineHeight: 21 },
  etape: { fontSize: taille.meta, fontWeight: '600' },
  titre: { fontSize: taille.headline, lineHeight: 30, fontWeight: '700' },
  titreGrand: { fontSize: taille.display, lineHeight: 40, fontWeight: '700', letterSpacing: -0.5 },
  texte: { fontSize: taille.body, lineHeight: 24 },
  centre: { textAlign: 'center' },
  deroulant: { overflow: 'hidden' },
  deroulantContenu: { position: 'absolute', top: 0, left: 0, right: 0 },
})
