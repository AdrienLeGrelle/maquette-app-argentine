import { router } from 'expo-router'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { Points } from '@/components/Points'
import { aides, suggestionsAide, type Aide } from '@/lib/demo'
import { useEtat } from '@/lib/etat'
import { Icon } from '@/lib/icons'
import { useWa } from '@/lib/theme'

const natif = Platform.OS !== 'web'

type Bulle = { de: 'moi' | 'roomz'; texte: string; aide?: Aide; suggestions?: boolean }

const ACCUEIL: Bulle = {
  de: 'roomz', suggestions: true,
  texte: 'Bonjour ! Dites-moi ce que vous voulez faire, je vous montre où toucher.',
}

/** Sans accents ni majuscules, pour comparer aux mots-clés. */
function simple(texte: string) {
  return texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function repondre(question: string): Bulle {
  const q = simple(question)
  const aide = aides.find((a) => a.mots.some((m) => q.includes(simple(m))))
  if (aide) return { de: 'roomz', texte: aide.reponse, aide }
  return { de: 'roomz', suggestions: true, texte: 'Je n’ai pas encore la réponse à ça. Voici ce que je sais vous montrer :' }
}

/** La petite tête de robot de l'assistant. */
export function TeteBot({ size = 40 }: { size?: number }) {
  const wa = useWa()
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={20} fill={wa.vert} />
      <Path d="M20 8v4" stroke={wa.surVert} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={20} cy={7.5} r={1.8} fill={wa.surVert} />
      <Rect x={10} y={12.5} width={20} height={16} rx={6} fill={wa.surVert} />
      <Circle cx={16} cy={20.5} r={2} fill={wa.vert} />
      <Circle cx={24} cy={20.5} r={2} fill={wa.vert} />
      <Path d="M17 25c1.8 1.3 4.2 1.3 6 0" stroke={wa.vert} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </Svg>
  )
}

/** Le bouton de l'assistant : il flotte doucement, et ouvre le demi-écran. */
export function BoutonAgent() {
  const { ouvrirAgent } = useEtat()
  const [v] = useState(() => new Animated.Value(0))
  useEffect(() => {
    const boucle = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: natif }),
      Animated.timing(v, { toValue: 0, duration: 900, useNativeDriver: natif }),
    ]))
    boucle.start()
    return () => boucle.stop()
  }, [v])
  return (
    <Pressable onPress={() => ouvrirAgent()} accessibilityRole="button" accessibilityLabel="Ouvrir l’assistant Roomz" hitSlop={8}>
      <Animated.View style={{
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) },
        ],
      }}>
        <TeteBot size={40} />
      </Animated.View>
    </Pressable>
  )
}

/**
 * L'assistant sur la moitié basse de l'écran : on voit l'app au-dessus, et
 * « Me montrer » ferme le demi-écran et fait clignoter le bon bouton.
 */
export function AgentDemiEcran() {
  const wa = useWa()
  const insets = useSafeAreaInsets()
  const { agent, fermerAgent, setMontrer } = useEtat()
  const [bulles, setBulles] = useState<Bulle[]>([ACCUEIL])
  const [texte, setTexte] = useState('')
  const [ecrit, setEcrit] = useState(false)
  const defile = useRef<ComponentRef<typeof ScrollView>>(null)
  const champ = useRef<ComponentRef<typeof TextInput>>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined)
  const dejaPosee = useRef(0)

  useEffect(() => () => clearTimeout(minuteur.current), [])

  const demander = (question: string) => {
    if (!question.trim()) return
    setBulles((bs) => [...bs, { de: 'moi', texte: question.trim() }])
    setTexte('')
    setEcrit(true)
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => {
      setBulles((bs) => [...bs, repondre(question)])
      setEcrit(false)
    }, 700)
  }

  // Question tapée dans la barre du Menu : posée dès l'ouverture, une seule fois.
  useEffect(() => {
    if (agent.ouvert && agent.question && dejaPosee.current !== agent.n) {
      dejaPosee.current = agent.n
      demander(agent.question)
    }
  })

  // À l'ouverture, le curseur est déjà dans le champ : on écrit tout de suite.
  useEffect(() => {
    if (!agent.ouvert) return
    const t = setTimeout(() => champ.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [agent.ouvert, agent.n])

  if (!agent.ouvert) return null

  const montrer = (a: Aide) => {
    setMontrer(a.repere)
    fermerAgent()
    router.navigate(a.route)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.couche} pointerEvents="box-none">
      <View style={[s.feuille, { backgroundColor: wa.fond, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={[s.entete, { borderBottomColor: wa.ligne }]}>
          <View style={[s.poignee, { backgroundColor: wa.chipBord }]} />
          <TeteBot size={34} />
          <View style={s.flex}>
            <Text style={[s.nom, { color: wa.encre }]}>Assistant Roomz</Text>
            <Text style={[s.sous, { color: wa.gris }]}>{ecrit ? 'écrit…' : 'vous guide dans l’app'}</Text>
          </View>
          <Pressable onPress={fermerAgent} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fermer l’assistant">
            <Icon name="x" size={22} color={wa.gris} />
          </Pressable>
        </View>

        <ScrollView ref={defile} style={{ backgroundColor: wa.papier }} contentContainerStyle={s.fil} keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => defile.current?.scrollToEnd({ animated: true })}>
          {bulles.map((b, i) => (
            <View key={i} style={[s.bulle, b.de === 'moi' ? s.moi : s.roomz, { backgroundColor: b.de === 'moi' ? wa.bulleOut : wa.bulleIn }]}>
              <Text style={[s.texte, { color: wa.encre }]}>{b.texte}</Text>
              {b.aide && (
                <Pressable onPress={() => montrer(b.aide!)} accessibilityRole="button" style={[s.action, { borderTopColor: wa.ligne }]}>
                  <Icon name="search" size={16} color={wa.vert} />
                  <Text style={[s.actionTexte, { color: wa.vert }]}>{b.aide.bouton}</Text>
                </Pressable>
              )}
              {b.suggestions && (
                <View style={s.suggestions}>
                  {suggestionsAide.map((q) => (
                    <Pressable key={q} onPress={() => demander(q)} accessibilityRole="button" style={[s.suggestion, { borderColor: wa.chipBord }]}>
                      <Text style={[s.suggestionTexte, { color: wa.vertEncre }]}>{q}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
          {ecrit && (
            <View style={[s.bulle, s.roomz, { backgroundColor: wa.bulleIn }]}>
              <View style={s.points}><Points color={wa.bulleMeta} taille={7} /></View>
            </View>
          )}
        </ScrollView>

        <View style={[s.saisie, { borderTopColor: wa.ligne }]}>
          <TextInput ref={champ} value={texte} onChangeText={setTexte} onSubmitEditing={() => demander(texte)}
                     placeholder="J’aimerais faire…" placeholderTextColor={wa.gris} accessibilityLabel="Votre question"
                     style={[s.champ, { backgroundColor: wa.champ, color: wa.encre }]} />
          <Pressable onPress={() => demander(texte)} accessibilityRole="button" accessibilityLabel="Envoyer"
                     style={[s.envoyer, { backgroundColor: texte.trim() ? wa.vert : wa.chipBord }]}>
            <Icon name="send" size={16} color={wa.surVert} plein />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  couche: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, justifyContent: 'flex-end' },
  feuille: { height: '55%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', boxShadow: '0 -8px 30px rgba(0,0,0,.18)' },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  poignee: { position: 'absolute', top: 6, alignSelf: 'center', left: '50%', marginLeft: -18, width: 36, height: 4, borderRadius: 2 },
  nom: { fontSize: 16, fontWeight: '600' },
  sous: { fontSize: 12, marginTop: 1 },
  fil: { padding: 10, gap: 8 },
  bulle: { maxWidth: '88%', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, boxShadow: '0 1px 0.5px rgba(11,20,26,.13)' },
  roomz: { alignSelf: 'flex-start', borderTopLeftRadius: 4 },
  moi: { alignSelf: 'flex-end', borderTopRightRadius: 4 },
  texte: { fontSize: 15, lineHeight: 20 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 8, minHeight: 34 },
  actionTexte: { fontSize: 15, fontWeight: '600' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  suggestion: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  suggestionTexte: { fontSize: 13, fontWeight: '500' },
  points: { paddingVertical: 4, paddingHorizontal: 2 },
  saisie: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  champ: { flex: 1, minHeight: 38, borderRadius: 19, paddingHorizontal: 14, fontSize: 15 },
  envoyer: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
})
