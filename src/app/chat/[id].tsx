import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Points } from '@/components/Points'
import type { Message } from '@/lib/demo'
import { estPourMoi, useEtat, useT } from '@/lib/etat'
import { Avatar, Icon } from '@/lib/icons'
import { useWa } from '@/lib/theme'

/** Une conversation ouverte, dessinée comme dans WhatsApp. */
export default function Chat() {
  const wa = useWa()
  const t = useT()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { convs, lire, envoyer, agentLance, regleContacts, mettrePourMoi, reprendreMain } = useEtat()
  const [texte, setTexte] = useState('')
  const defile = useRef<ComponentRef<typeof ScrollView>>(null)
  const c = convs.find((x) => x.id === id)
  const autresNonLues = convs.filter((x) => x.id !== id && x.nonLus > 0).length

  useEffect(() => { if (id) lire(id) }, [id, lire])

  if (!c) return <Redirect href="/" />

  const moi = estPourMoi(c, regleContacts)
  const ecrit = !!c.ecrit && agentLance && !c.pause && !moi
  // Qui tient le fil : « Perso », l'hôtelier (pause) ou l'assistant.
  const tenue = moi
    ? { icon: 'lock' as const, texte: 'Perso : pas de réponse auto', bouton: 'Confier à l’agent', action: () => mettrePourMoi(c.id, false), couleur: wa.zoneMoi }
    : !agentLance ? null
      : c.pause
        ? { icon: 'hand' as const, texte: 'Vous avez la main', bouton: 'Rendre à l’assistant', action: () => reprendreMain(c.id, false), couleur: wa.gris }
        : { icon: 'sparkles' as const, texte: 'L’assistant gère', bouton: 'Reprendre la main', action: () => reprendreMain(c.id, true), couleur: wa.vert }

  const q = c.quand
  const jour = q.jour === 'date' ? q.date : q.jour === 'semaine' ? t(q.es, q.fr) : q.jour === 'ayer' ? t('Ayer', 'Hier') : t('Hoy', 'Aujourd’hui')

  const mandar = () => {
    if (!texte.trim()) return
    envoyer(c.id, texte.trim())
    setTexte('')
  }

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: wa.papier }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.entete, { paddingTop: insets.top + 6, backgroundColor: wa.barre, borderBottomColor: wa.ligne }]}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10}
                   accessibilityRole="button" accessibilityLabel={t('Volver', 'Retour')} style={s.retour}>
          <Icon name="chevL" size={28} color={wa.encre} trait={2.2} />
          {autresNonLues > 0 && <Text style={[s.retourNombre, { color: wa.encre }]}>{autresNonLues}</Text>}
        </Pressable>
        <Avatar size={36} photo={c.photo} fond={wa.avatar} icone={wa.avatarIcone} />
        <View style={s.flex}>
          <Text numberOfLines={1} style={[s.nom, { color: wa.encre }]}>{c.nom}</Text>
          <Text numberOfLines={1} style={[s.sous, { color: wa.gris }]}>{ecrit ? t('el asistente está escribiendo…', 'l’assistant écrit…') : c.tel}</Text>
        </View>
      </View>

      {tenue && (
        <View style={[s.tenue, { backgroundColor: wa.barre, borderBottomColor: wa.ligne }]}>
          <Icon name={tenue.icon} size={16} color={tenue.couleur} plein={tenue.icon === 'sparkles'} />
          <Text numberOfLines={1} style={[s.tenueTexte, { color: wa.gris }]}>{tenue.texte}</Text>
          <Pressable onPress={tenue.action} accessibilityRole="button" hitSlop={8}
                     style={[s.tenueBouton, { borderColor: tenue.couleur }]}>
            <Text style={[s.tenueBoutonTexte, { color: tenue.couleur }]}>{tenue.bouton}</Text>
          </Pressable>
        </View>
      )}

      <ScrollView ref={defile} contentContainerStyle={s.fil}
                  onContentSizeChange={() => defile.current?.scrollToEnd({ animated: false })}>
        <View style={[s.jour, { backgroundColor: wa.pastille }]}><Text style={[s.jourTexte, { color: wa.bulleMeta }]}>{jour}</Text></View>
        {c.messages.map((m, i) => <Bulle key={i} m={m} suite={i > 0 && c.messages[i - 1].de === m.de} />)}
        {ecrit && (
          <View style={[s.bulle, s.sortante, { backgroundColor: wa.bulleOut }]}>
            <View style={s.ecrit}><Points color={wa.bulleMeta} taille={7} /></View>
          </View>
        )}
      </ScrollView>

      <View style={[s.saisie, { backgroundColor: wa.barre, borderTopColor: wa.ligne, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Icon name="plus" size={26} color={wa.encre} trait={1.8} />
        <TextInput value={texte} onChangeText={setTexte} onSubmitEditing={mandar} placeholder=""
                   accessibilityLabel={t('Mensaje', 'Message')}
                   style={[s.champ, { backgroundColor: wa.saisie, borderColor: wa.ligne, color: wa.encre }]} />
        {texte.trim() ? (
          <Pressable onPress={mandar} accessibilityRole="button" accessibilityLabel={t('Mandar', 'Envoyer')}
                     style={[s.envoyer, { backgroundColor: wa.vert }]}>
            <Icon name="send" size={18} color={wa.surVert} plein />
          </Pressable>
        ) : (
          <>
            <Icon name="camera" size={24} color={wa.encre} trait={1.7} />
            <Icon name="mic" size={24} color={wa.encre} trait={1.7} />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

function Bulle({ m, suite }: { m: Message; suite: boolean }) {
  const wa = useWa()
  const sortante = m.de === 'hotel'
  return (
    <View style={[s.bulle, sortante ? s.sortante : s.entrante, { backgroundColor: sortante ? wa.bulleOut : wa.bulleIn }, suite && s.suite]}>
      <View style={s.bulleCorps}>
        {m.vocal ? (
          <View style={s.vocal}>
            <Icon name="play" size={22} color={wa.gris} plein />
            <View style={s.onde}>
              {[6, 12, 18, 10, 16, 8, 14, 20, 12, 7, 15, 9, 13, 6, 11, 17, 8, 12].map((h, i) => (
                <View key={i} style={[s.barre, { height: h, backgroundColor: wa.gris }]} />
              ))}
            </View>
          </View>
        ) : (
          <Text style={[s.texte, { color: wa.encre }]}>{m.texte}</Text>
        )}
        <View style={s.meta}>
          <Text style={[s.heure, { color: wa.bulleMeta }]}>{m.vocal ? `${m.vocal}  ·  ${m.heure}` : m.heure}</Text>
          {sortante && <Icon name="checks" size={16} color={m.lu ? wa.lu : wa.bulleMeta} />}
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  retour: { flexDirection: 'row', alignItems: 'center', minWidth: 36, minHeight: 44 },
  retourNombre: { fontSize: 17, marginLeft: -2 },
  nom: { fontSize: 17, fontWeight: '600' },
  sous: { fontSize: 12, marginTop: 1 },
  tenue: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  tenueTexte: { flex: 1, fontSize: 13 },
  tenueBouton: { borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tenueBoutonTexte: { fontSize: 13, fontWeight: '600' },
  fil: { padding: 10, paddingBottom: 14, gap: 6 },
  jour: { alignSelf: 'center', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginVertical: 6 },
  jourTexte: { fontSize: 12, fontWeight: '500' },
  bulle: { maxWidth: '80%', borderRadius: 12, paddingHorizontal: 9, paddingTop: 6, paddingBottom: 5, boxShadow: '0 1px 0.5px rgba(11,20,26,.13)' },
  entrante: { alignSelf: 'flex-start', borderTopLeftRadius: 4 },
  sortante: { alignSelf: 'flex-end', borderTopRightRadius: 4 },
  suite: { borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: -3 },
  bulleCorps: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  texte: { fontSize: 16, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto', paddingLeft: 8, transform: [{ translateY: 2 }] },
  heure: { fontSize: 11 },
  ecrit: { paddingVertical: 6, paddingHorizontal: 4 },
  vocal: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, minWidth: 200 },
  onde: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  barre: { width: 3, borderRadius: 2 },
  saisie: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  champ: { flex: 1, minHeight: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 16 },
  envoyer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
})
