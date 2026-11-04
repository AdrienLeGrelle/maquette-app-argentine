import { router, usePathname } from 'expo-router'
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui'
import { useState, type ComponentRef, type Ref } from 'react'
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AgentDemiEcran } from '@/components/Agent'
import { Halo } from '@/components/Repere'
import { estPourMoi, useEtat, useT } from '@/lib/etat'
import { Icon, type IconName } from '@/lib/icons'
import { useWa } from '@/lib/theme'

/**
 * La barre du bas, dessinée comme celle de WhatsApp : Menu, Calendrier,
 * Discussions, Paramètres. L'app s'ouvre sur Discussions (la route « / »).
 * Tant que l'hôtel n'est pas configuré, Paramètres s'éclaire et une bulle
 * invite à commencer.
 */
export default function OngletsLayout() {
  const t = useT()
  const pathname = usePathname()
  const { conecte, convs, agentLance, bulleFermee, fermerBulle, agent, regleContacts, peut, membreVu } = useEtat()
  const [barre, setBarre] = useState({ largeur: 0, hauteur: 0 })
  // La pastille de Discussions ne compte que ce qui demande une réponse à la main :
  // « Action requise » une fois l'agent lancé, les non-lus avant (personne ne répond encore).
  const aRepondre = convs.filter((c) => !estPourMoi(c, regleContacts) && (agentLance ? c.colonne === 'action' : c.nonLus > 0))
  const nonLues = conecte ? aRepondre.length : 0
  // La configuration regarde le gérant, pas ses employés.
  const aConfigurer = !agentLance && !membreVu
  const bulle = aConfigurer && !bulleFermee && pathname !== '/ajustes' && barre.hauteur > 0

  return (
    <Tabs style={s.flex}>
      <TabSlot style={s.flex} />
      <TabList asChild>
        <Barre onLayout={(e) => setBarre({ largeur: e.nativeEvent.layout.width, hauteur: e.nativeEvent.layout.height })}>
          <TabTrigger name="menu" href="/menu" asChild>
            <Onglet icon="menu" label={t('Menú', 'Menu')} />
          </TabTrigger>
          <TabTrigger name="calendario" href="/calendario" asChild>
            <Onglet icon="calendar" label={t('Calendario', 'Calendrier')} cache={!peut('reservations')} />
          </TabTrigger>
          <TabTrigger name="index" href="/" asChild>
            <Onglet icon="chat" label={t('Chats', 'Discussions')} badge={nonLues} cache={!peut('discussions')} />
          </TabTrigger>
          <TabTrigger name="ajustes" href="/ajustes" asChild>
            <Onglet icon="settings" label={t('Ajustes', 'Paramètres')} eclaire={aConfigurer} />
          </TabTrigger>
        </Barre>
      </TabList>
      {bulle && !agent.ouvert && <BulleGuide largeur={barre.largeur} bas={barre.hauteur} onFermer={fermerBulle} />}
      <AgentDemiEcran />
    </Tabs>
  )
}

/** « Commencez ici », au-dessus de l'onglet Paramètres. */
function BulleGuide({ largeur, bas, onFermer }: { largeur: number; bas: number; onFermer: () => void }) {
  const wa = useWa()
  return (
    <>
      <View style={[s.fleche, { backgroundColor: wa.vert, bottom: bas + 4, right: largeur / 8 - 7 }]} />
      <View style={[s.bulle, { backgroundColor: wa.vert, bottom: bas + 10 }]}>
        <Pressable onPress={() => router.navigate('/ajustes')} accessibilityRole="button" style={s.flex}>
          <Text style={[s.bulleTitre, { color: wa.surVert }]}>👋 Commencez ici</Text>
          <Text style={[s.bulleTexte, { color: wa.surVert }]}>Présentez-vous et votre hôtel : en quelques minutes, l’assistant sait répondre à votre place.</Text>
        </Pressable>
        <Pressable onPress={onFermer} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fermer">
          <Icon name="x" size={18} color={wa.surVert} />
        </Pressable>
      </View>
    </>
  )
}

function Barre({ style, ...props }: ViewProps) {
  const wa = useWa()
  const insets = useSafeAreaInsets()
  return (
    <View {...props}
          style={[style, s.barre, { backgroundColor: wa.barre, borderTopColor: wa.ligne, paddingBottom: Math.max(insets.bottom, 8) }]} />
  )
}

type OngletProps = TabTriggerSlotProps & { label: string; icon: IconName; badge?: number; eclaire?: boolean; cache?: boolean }

function Onglet({ label, icon, badge, eclaire, cache, isFocused, ref, ...props }: OngletProps) {
  const wa = useWa()
  // Pas d'accès : l'onglet disparaît, la route reste déclarée.
  if (cache) return null
  return (
    <Pressable {...props} ref={ref as unknown as Ref<ComponentRef<typeof Pressable>>} accessibilityRole="tab" accessibilityState={{ selected: isFocused }} style={s.onglet}>
      <View style={[s.pilule, (isFocused || eclaire) && { backgroundColor: wa.vertWash }]}>
        <View>
          <Icon name={icon} size={26} color={eclaire && !isFocused ? wa.vert : wa.encre} plein={isFocused && icon === 'chat'} trait={isFocused ? 2.2 : 1.6} />
          {!!badge && (
            <View style={[s.badge, { backgroundColor: wa.vert, borderColor: wa.barre }]}>
              <Text style={[s.badgeTexte, { color: wa.surVert }]}>{badge}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={1} style={[s.label, { color: wa.encre, fontWeight: isFocused ? '600' : '400' }]}>{label}</Text>
        {eclaire && <Halo rayon={20} />}
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  barre: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6, paddingHorizontal: 4 },
  onglet: { flex: 1, alignItems: 'center' },
  pilule: { alignItems: 'center', gap: 2, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 16, minWidth: 76 },
  label: { fontSize: 11 },
  badge: {
    position: 'absolute', top: -5, left: 16, minWidth: 22, height: 22, borderRadius: 11, borderWidth: 2,
    paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center',
  },
  badgeTexte: { fontSize: 12, fontWeight: '700' },
  bulle: {
    position: 'absolute', right: 8, width: 260, flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderRadius: 14, padding: 12, boxShadow: '0 6px 18px rgba(0,0,0,.18)',
  },
  bulleTitre: { fontSize: 16, fontWeight: '700' },
  bulleTexte: { fontSize: 14, lineHeight: 19, marginTop: 2 },
  fleche: { position: 'absolute', width: 14, height: 14, transform: [{ rotate: '45deg' }] },
})
