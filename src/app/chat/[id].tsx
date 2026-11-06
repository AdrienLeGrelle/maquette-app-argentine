import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EcritFil, EnteteFil, SaisieFil } from '@/components/Boites'
import { Brouillons } from '@/components/Brouillons'
import { EcritWa, Messages } from '@/components/Fil'
import { BarreReservation, ProposerLien } from '@/components/Paiement'
import { brouillonsPerso } from '@/lib/perso'
import { canalDe, estPourMoi, useEtat, useT } from '@/lib/etat'
import { Avatar, Icon } from '@/lib/icons'
import { useFil, useWa } from '@/lib/theme'

/** Une conversation ouverte, dessinée comme dans WhatsApp. */
export default function Chat() {
  const wa = useWa()
  const t = useT()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { convs, lire, envoyer, agentLance, regleContacts, mettrePourMoi, reprendreMain, membreVu, peut } = useEtat()
  const [texte, setTexte] = useState('')
  const [ecriture, setEcriture] = useState(false)
  const [lienIgnore, setLienIgnore] = useState(false)
  const defile = useRef<ComponentRef<typeof ScrollView>>(null)
  const champ = useRef<ComponentRef<typeof TextInput>>(null)
  const c = convs.find((x) => x.id === id)
  const autresNonLues = convs.filter((x) => x.id !== id && x.nonLus > 0).length
  // Instagram et Messenger gardent leur allure : en-tête, bulles et saisie de l'app d'origine.
  const canal = c ? canalDe(c) : 'whatsapp'
  const habit = canal === 'instagram' || canal === 'messenger' ? canal : null
  const f = useFil(habit ?? 'instagram')

  useEffect(() => { if (id) lire(id) }, [id, lire])

  if (!c || (membreVu && estPourMoi(c, regleContacts))) return <Redirect href="/" />

  const moi = estPourMoi(c, regleContacts)
  const ecrit = !!c.ecrit && agentLance && !c.pause && !moi
  // Qui tient le fil : « Perso », l'hôtelier (pause) ou l'assistant.
  const tenue = moi
    ? { icon: 'lock' as const, texte: 'Perso : pas de réponse auto', bouton: 'Confier à l’agent', action: () => mettrePourMoi(c.id, false), couleur: wa.zoneMoi }
    : !agentLance ? null
      : c.pause
        ? { icon: 'hand' as const, texte: 'Vous avez la main', bouton: 'Rendre à l’assistant', action: () => reprendreMain(c.id, false), couleur: wa.gris }
        : { icon: 'sparkles' as const, texte: 'L’assistant gère', bouton: 'Reprendre la main', action: () => reprendreMain(c.id, true), couleur: wa.vert }

  const mandar = () => {
    if (!texte.trim()) return
    envoyer(c.id, texte.trim())
    setTexte('')
  }
  // Perso : deux brouillons tant que le contact attend une réponse. Ils
  // s'effacent dès qu'on écrit soi-même (le clavier monte).
  const derniere = c.messages[c.messages.length - 1]
  const propositions = moi && derniere?.de === 'huesped' ? brouillonsPerso[c.id] : undefined
  const corriger = (p: string) => { setTexte(p); champ.current?.focus() }

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: habit ? f.fond : wa.papier }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {habit ? <EnteteFil c={c} canal={habit} ecrit={ecrit} autresNonLues={autresNonLues} /> : (
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
      )}

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

      <BarreReservation convId={c.id} />

      <ScrollView ref={defile} contentContainerStyle={s.fil}
                  onContentSizeChange={() => defile.current?.scrollToEnd({ animated: false })}>
        <Messages c={c} />
        {ecrit && habit && <EcritFil canal={habit} />}
        {ecrit && !habit && <EcritWa />}
      </ScrollView>

      {!moi && peut('reservations') && !lienIgnore && !ecriture && !texte && (
        <ProposerLien convId={c.id} onIgnorer={() => setLienIgnore(true)} />
      )}

      {propositions && !ecriture && !texte && (
        <Brouillons propositions={propositions} onEnvoyer={(p) => envoyer(c.id, p)} onCorriger={corriger} />
      )}

      {habit ? (
        <SaisieFil canal={habit} texte={texte} setTexte={setTexte} onEnvoyer={mandar} champ={champ}
                   onFocus={() => setEcriture(true)} onBlur={() => setEcriture(false)} />
      ) : (
        <View style={[s.saisie, { backgroundColor: wa.barre, borderTopColor: wa.ligne, paddingBottom: Math.max(insets.bottom, 8) }]}>
          <Icon name="plus" size={26} color={wa.encre} trait={1.8} />
          <TextInput ref={champ} value={texte} onChangeText={setTexte} onSubmitEditing={mandar} placeholder=""
                     onFocus={() => setEcriture(true)} onBlur={() => setEcriture(false)}
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
      )}
    </KeyboardAvoidingView>
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
  saisie: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  champ: { flex: 1, minHeight: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 16 },
  envoyer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
})
