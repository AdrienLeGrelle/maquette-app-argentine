import { router, usePathname } from 'expo-router'
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui'
import { useEffect, useMemo, useState, type ComponentRef, type ReactNode, type Ref } from 'react'
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AgentDemiEcran } from '@/components/Agent'
import { IconeCanal, LogoCanal } from '@/components/Logos'
import { Halo } from '@/components/Repere'
import { canalDe, estPourMoi, useEtat, useT, type Boite } from '@/lib/etat'
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
  const wa = useWa()
  const pathname = usePathname()
  const { conecte, convs, agentLance, bulleFermee, fermerBulle, agent, regleContacts, peut, membreVu, boites, boite, setBoite } = useEtat()
  const [barre, setBarre] = useState({ largeur: 0, hauteur: 0 })
  const [eventail, setEventail] = useState(false)
  // La pastille de Discussions ne compte que ce qui demande une réponse à la main :
  // « Action requise » une fois l'agent lancé, les non-lus avant (personne ne répond encore).
  const aRepondre = convs.filter((c) => boites.includes(canalDe(c)) && !estPourMoi(c, regleContacts) && (agentLance ? c.colonne === 'action' : c.nonLus > 0))
  const nonLues = conecte ? aRepondre.length : 0
  const parBoite = (b: Boite) => aRepondre.filter((c) => canalDe(c) === b).length
  // L'éventail se déplie au-dessus de l'onglet Discussions, où qu'il soit dans la barre.
  const visibles = ['menu', peut('reservations') && 'calendario', peut('discussions') && 'index', 'ajustes'].filter(Boolean)
  const centre = (barre.largeur * (visibles.indexOf('index') + 0.5)) / visibles.length

  // Glisser l'écran à gauche ou à droite passe à l'onglet voisin, dans l'ordre de la barre.
  const [x] = useState(() => new Animated.Value(0))
  const ordre = visibles.join(',')
  const glisser = useMemo(() => {
    const onglets = ordre.split(',')
    const ici = onglets.indexOf(CLES[pathname] ?? '')
    const voisin = (sens: number) => onglets[ici + sens]
    const largeur = barre.largeur || 400
    return PanResponder.create({
      // Après les enfants : une ligne de discussion ou une puce qu'on glisse garde son geste.
      onMoveShouldSetPanResponder: (_, g) => !eventail && ici >= 0 && Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
      onPanResponderMove: (_, g) => {
        // Au bout de la barre, l'écran résiste au lieu de partir.
        const libre = voisin(g.dx < 0 ? 1 : -1)
        x.setValue(libre ? g.dx : g.dx / 4)
      },
      onPanResponderRelease: (_, g) => {
        avalerClic()
        const sens = g.dx < 0 ? 1 : -1
        const cible = voisin(sens)
        if (!cible || (Math.abs(g.dx) < largeur * 0.28 && Math.abs(g.vx) < 0.5)) {
          Animated.spring(x, { toValue: 0, useNativeDriver: natif, bounciness: 0 }).start()
          return
        }
        Animated.timing(x, { toValue: -sens * largeur, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: natif }).start(() => {
          router.navigate(CHEMINS[cible])
          x.setValue(sens * largeur)
          Animated.timing(x, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: natif }).start()
        })
      },
      onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: natif, bounciness: 0 }).start(),
    })
  }, [x, ordre, pathname, barre.largeur, eventail])
  // La configuration regarde le gérant, pas ses employés.
  const aConfigurer = !agentLance && !membreVu
  const bulle = aConfigurer && !bulleFermee && pathname !== '/ajustes' && barre.hauteur > 0

  return (
    <Tabs style={s.flex}>
      <Animated.View style={[s.flex, s.coupe]} {...glisser.panHandlers}>
        <Animated.View style={[s.flex, { transform: [{ translateX: x }] }]}>
          <TabSlot style={s.flex} />
        </Animated.View>
      </Animated.View>
      <TabList asChild>
        <Barre onLayout={(e) => setBarre({ largeur: e.nativeEvent.layout.width, hauteur: e.nativeEvent.layout.height })}>
          <TabTrigger name="menu" href="/menu" asChild>
            <Onglet icon="menu" label={t('Menú', 'Menu')} />
          </TabTrigger>
          <TabTrigger name="calendario" href="/calendario" asChild>
            <Onglet icon="calendar" label={t('Calendario', 'Calendrier')} cache={!peut('reservations')} />
          </TabTrigger>
          <TabTrigger name="index" href="/" asChild>
            <Onglet icon="chat" label={t('Chats', 'Discussions')} badge={nonLues} cache={!peut('discussions')}
                    dessin={(actif) => <IconeCanal canal={boite} color={wa.encre} actif={actif} />}
                    // Un canal branché en plus de WhatsApp : retoucher l'onglet déplie les autres boîtes.
                    onReappui={boites.length > 1 ? () => setEventail((o) => !o) : undefined} />
          </TabTrigger>
          <TabTrigger name="ajustes" href="/ajustes" asChild>
            <Onglet icon="settings" label={t('Ajustes', 'Paramètres')} eclaire={aConfigurer} />
          </TabTrigger>
        </Barre>
      </TabList>
      {eventail && (
        <Eventail boites={boites} boite={boite} centre={centre} bas={barre.hauteur} compte={parBoite}
                  onChoisir={(b) => { setBoite(b); setEventail(false) }} onFermer={() => setEventail(false)} />
      )}
      {bulle && !agent.ouvert && !eventail && <BulleGuide largeur={barre.largeur} bas={barre.hauteur} onFermer={fermerBulle} />}
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

const natif = Platform.OS !== 'web'

/**
 * À la souris, relâcher un glissé envoie aussi un clic : il ouvrirait la
 * discussion sous le pointeur. On l'avale. Au doigt, il n'y en a pas.
 */
function avalerClic() {
  if (Platform.OS !== 'web') return
  const stop = (e: Event) => { e.stopPropagation(); e.preventDefault() }
  window.addEventListener('click', stop, { capture: true, once: true })
  setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 300)
}

/** Les onglets de la barre, par leur adresse, pour passer de l'un à l'autre en glissant. */
const CLES: Record<string, string> = { '/menu': 'menu', '/calendario': 'calendario', '/': 'index', '/ajustes': 'ajustes' }
const CHEMINS = { menu: '/menu', calendario: '/calendario', index: '/', ajustes: '/ajustes' } as Record<string, '/menu' | '/calendario' | '/' | '/ajustes'>

/** Le diamètre d'une boîte dans l'éventail. */
const TAILLE = 46

const NOMS: Record<Boite, string> = { whatsapp: 'WhatsApp', messenger: 'Messenger', instagram: 'Instagram', mail: 'Mail', booking: 'Booking' }

/**
 * Les boîtes branchées, dépliées en colonne au-dessus de l'onglet : WhatsApp
 * au plus près du doigt, puis les autres canaux. Le logo suffit, sans nom ;
 * chacun garde sa pastille.
 */
function Eventail({ boites, boite, centre, bas, compte, onChoisir, onFermer }: {
  boites: Boite[]; boite: Boite; centre: number; bas: number; compte: (b: Boite) => number; onChoisir: (b: Boite) => void; onFermer: () => void
}) {
  const wa = useWa()
  const [v] = useState(() => new Animated.Value(0))
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(1.4)), useNativeDriver: false }).start()
  }, [v])
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: wa.voile, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
        <Pressable onPress={onFermer} accessibilityLabel="Fermer" style={s.flex} />
      </Animated.View>
      <View pointerEvents="box-none" style={[s.eventail, { bottom: bas + 6, left: centre - TAILLE / 2 }]}>
        {boites.map((b, i) => {
          const n = compte(b)
          return (
            <Animated.View key={b} style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [(i + 1) * 18, 0] }) }] }}>
              <Pressable onPress={() => onChoisir(b)} accessibilityRole="radio" accessibilityState={{ checked: b === boite }} accessibilityLabel={NOMS[b]}
                         style={({ pressed }) => [s.boite, pressed && { opacity: 0.8 }]}>
                <View style={s.rondBoite}>
                  <LogoCanal nom={b} size={TAILLE} />
                  {n > 0 && (
                    <View style={[s.badge, s.badgeBoite, { backgroundColor: wa.vert }]}>
                      <Text style={[s.badgeTexte, { color: wa.surVert }]}>{n}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          )
        }).reverse()}
      </View>
    </>
  )
}

type OngletProps = TabTriggerSlotProps & {
  label: string; icon: IconName; badge?: number; eclaire?: boolean; cache?: boolean
  /** Remplace l'icône : le logo du canal affiché, pour Discussions. */
  dessin?: (actif: boolean) => ReactNode
  /** Toucher l'onglet déjà ouvert. */
  onReappui?: () => void
}

function Onglet({ label, icon, badge, eclaire, cache, dessin, onReappui, isFocused, ref, ...props }: OngletProps) {
  const wa = useWa()
  // Pas d'accès : l'onglet disparaît, la route reste déclarée.
  if (cache) return null
  // Sur le web l'onglet est un lien : sans preventDefault, retoucher l'onglet rechargerait la page.
  return (
    <Pressable {...props}
               onPress={(e) => { if (isFocused && onReappui) { e.preventDefault(); onReappui() } else props.onPress?.(e) }}
               onLongPress={(e) => { if (onReappui) { e.preventDefault(); onReappui() } else props.onLongPress?.(e) }}
               ref={ref as unknown as Ref<ComponentRef<typeof Pressable>>} accessibilityRole="tab" accessibilityState={{ selected: isFocused }} style={s.onglet}>
      <View style={[s.pilule, (isFocused || eclaire) && { backgroundColor: wa.vertWash }]}>
        <View>
          {dessin ? dessin(!!isFocused)
            : <Icon name={icon} size={26} color={eclaire && !isFocused ? wa.vert : wa.encre} plein={isFocused && icon === 'chat'} trait={isFocused ? 2.2 : 1.6} />}
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
  coupe: { overflow: 'hidden' },
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
  eventail: { position: 'absolute', width: TAILLE, gap: 10, alignItems: 'center' },
  boite: { flexDirection: 'row', alignItems: 'center' },
  rondBoite: { width: TAILLE, height: TAILLE },
  badgeBoite: { top: -6, left: undefined, right: -7, borderWidth: 0 },
})
