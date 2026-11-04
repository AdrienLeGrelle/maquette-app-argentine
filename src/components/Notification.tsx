import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LogoCanal } from '@/components/Logos'
import { pesos } from '@/lib/demo'
import { useEtat, useT } from '@/lib/etat'
import { useCouleurs } from '@/lib/theme'

/**
 * La notification qui descend en haut du téléphone quand le paiement arrive
 * (ou quand un lien expire). Elle repart seule ; la toucher ouvre le fil.
 */
export function Notification() {
  const c = useCouleurs()
  const t = useT()
  const insets = useSafeAreaInsets()
  const { notif, fermerNotif, peut } = useEtat()
  const [y] = useState(() => new Animated.Value(-140))
  const n = notif?.n

  useEffect(() => {
    if (!n) return
    y.setValue(-140)
    Animated.timing(y, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start()
    const fin = setTimeout(() => {
      Animated.timing(y, { toValue: -140, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(() => fermerNotif())
    }, 4500)
    return () => clearTimeout(fin)
  }, [n, y, fermerNotif])

  if (!notif) return null
  const prenom = notif.nom.split(' ')[0]
  const somme = peut('paiements') ? ` ${pesos(notif.montant)}` : ''
  const texte = notif.quoi === 'paye'
    ? t(`${prenom} pagó${somme} · reserva confirmada`, `${prenom} a payé${somme} · réservation confirmée`)
    : t(`El enlace de ${prenom} venció · habitación liberada`, `Le lien de ${prenom} a expiré · chambre libérée`)
  const ouvrir = () => {
    fermerNotif()
    if (notif.convId && peut('discussions')) router.push({ pathname: '/chat/[id]', params: { id: notif.convId } })
  }

  return (
    <Animated.View pointerEvents="box-none" style={[s.zone, { top: insets.top + 8, transform: [{ translateY: y }] }]}>
      <Pressable onPress={ouvrir} accessibilityRole="button" accessibilityLiveRegion="polite"
                 style={[s.carte, { backgroundColor: c.surface, borderColor: c.line }]}>
        <LogoCanal nom="mercadopago" size={36} />
        <View style={s.flex}>
          <Text style={[s.titre, { color: c.ink }]}>{notif.quoi === 'paye' ? t('Pago recibido', 'Paiement reçu') : t('Enlace vencido', 'Lien expiré')}</Text>
          <Text style={[s.texte, { color: c.muted }]}>{texte}</Text>
        </View>
        <Text style={[s.quand, { color: c.muted }]}>{t('ahora', 'maintenant')}</Text>
      </Pressable>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  zone: { position: 'absolute', left: 8, right: 8, zIndex: 50 },
  carte: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 12, boxShadow: '0 10px 30px rgba(16,26,51,.18)' },
  titre: { fontSize: 15, fontWeight: '600' },
  texte: { fontSize: 14, marginTop: 1 },
  quand: { fontSize: 12, alignSelf: 'flex-start' },
})
