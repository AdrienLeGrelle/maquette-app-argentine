import { router } from 'expo-router'
import type { ComponentRef, Ref } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Points } from '@/components/Points'
import type { Conversation, Message } from '@/lib/demo'
import { useT } from '@/lib/etat'
import { Avatar, Icon } from '@/lib/icons'
import { useFil } from '@/lib/theme'

/**
 * Instagram et Messenger dans Roomz, avec leur propre allure : les lignes
 * de la liste et le fil ressemblent à l'app d'origine, pour qu'on sache
 * d'où écrit la personne. Le haut de page (titre, recherche, filtres),
 * l'assistant et le glisser restent ceux de Roomz.
 */
export type Habit = 'instagram' | 'messenger'

/** L'heure ou le jour d'un fil, en version courte : « 12:55 », « Hier », « mar. ». */
function quandCourt(c: Conversation, t: (es: string, fr: string) => string) {
  const q = c.quand
  return q.jour === 'date' ? q.date.slice(0, 5) : q.jour === 'semaine' ? t(q.es, q.fr).slice(0, 3) + '.' : q.jour === 'ayer' ? t('Ayer', 'Hier') : q.heure
}

function apercu(m: Message, t: (es: string, fr: string) => string) {
  if (m.vocal) return t('Mensaje de voz', 'Message vocal')
  return (m.de === 'hotel' ? t('Vos: ', 'Vous : ') : '') + (m.texte ?? '')
}

/** Une discussion de la liste : grand avatar, nom en gras s'il y a du nouveau, point bleu à droite. */
export function LigneBoite({ c, canal }: { c: Conversation; canal: Habit }) {
  const f = useFil(canal)
  const t = useT()
  const nonLu = c.nonLus > 0
  const d = c.messages[c.messages.length - 1]
  const texte = nonLu && canal === 'instagram' && c.nonLus > 1
    ? t(`${c.nonLus} mensajes nuevos`, `${c.nonLus} nouveaux messages`)
    : apercu(d, t)
  return (
    <Pressable onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
               style={({ pressed }) => [s.ligne, pressed && { backgroundColor: f.champ }]}>
      <View>
        <Avatar size={56} photo={c.photo} fond={f.avatar} icone={f.avatarIcone} />
        {canal === 'messenger' && c.quand.jour === 'hoy' && <View style={[s.enLigne, { backgroundColor: f.enLigne, borderColor: f.fond }]} />}
      </View>
      <View style={s.flex}>
        <Text numberOfLines={1} style={[s.nom, { color: f.encre, fontWeight: nonLu ? '700' : '400' }]}>{c.nom}</Text>
        <View style={s.apercuLigne}>
          <Text numberOfLines={1} style={[s.apercu, { color: nonLu ? f.encre : f.gris, fontWeight: nonLu ? '600' : '400' }]}>{texte}</Text>
          <Text numberOfLines={1} style={[s.quand, { color: nonLu ? f.encre : f.gris, fontWeight: nonLu ? '600' : '400' }]}> · {quandCourt(c, t)}</Text>
        </View>
      </View>
      {nonLu
        ? <View style={[s.point, { backgroundColor: f.accent }]} />
        : canal === 'instagram'
          ? <Icon name="camera" size={24} color={f.gris} trait={1.7} />
          : d.de === 'hotel' && d.lu ? <Avatar size={16} photo={c.photo} fond={f.avatar} icone={f.avatarIcone} /> : null}
    </Pressable>
  )
}

/** L'en-tête d'un fil : flèche, avatar, nom et sous-titre, appel et vidéo. */
export function EnteteFil({ c, canal, ecrit, autresNonLues }: { c: Conversation; canal: Habit; ecrit: boolean; autresNonLues: number }) {
  const f = useFil(canal)
  const t = useT()
  const insets = useSafeAreaInsets()
  const teinte = canal === 'messenger' ? f.accent : f.encre
  const sous = ecrit ? t('el asistente está escribiendo…', 'l’assistant écrit…')
    : canal === 'instagram' ? c.tel : c.quand.jour === 'hoy' ? t('En línea', 'En ligne') : 'Messenger'
  return (
    <View style={[s.enteteFil, { paddingTop: insets.top + 6, backgroundColor: f.fond, borderBottomColor: f.ligne }]}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10}
                 accessibilityRole="button" accessibilityLabel={t('Volver', 'Retour')} style={s.retour}>
        <Icon name="chevL" size={28} color={teinte} trait={2.4} />
        {canal === 'messenger' && autresNonLues > 0 && <Text style={[s.retourNombre, { color: teinte }]}>{autresNonLues}</Text>}
      </Pressable>
      <View>
        <Avatar size={canal === 'instagram' ? 32 : 36} photo={c.photo} fond={f.avatar} icone={f.avatarIcone} />
        {canal === 'messenger' && c.quand.jour === 'hoy' && <View style={[s.enLigne, s.enLignePetit, { backgroundColor: f.enLigne, borderColor: f.fond }]} />}
      </View>
      <View style={s.flex}>
        <Text numberOfLines={1} style={[s.filNom, { color: f.encre }]}>{c.nom}</Text>
        <Text numberOfLines={1} style={[s.filSous, { color: f.gris }]}>{sous}</Text>
      </View>
      <View style={s.appels}>
        <Icon name="phone" size={22} color={teinte} trait={1.9} />
        <Icon name="video" size={25} color={teinte} trait={1.9} />
      </View>
    </View>
  )
}

/** L'heure d'ouverture d'un fil, centrée, sans pastille. */
export function JourFil({ texte, canal }: { texte: string; canal: Habit }) {
  const f = useFil(canal)
  return <Text style={[s.jour, { color: f.gris }]}>{texte}</Text>
}

/**
 * Une bulle : grise à gauche, colorée à droite, sans heure dedans. Les
 * bulles d'un même envoi se serrent, et l'avatar ne se pose qu'à côté de
 * la dernière.
 */
export function BulleFil({ m, canal, photo, premier, dernier, vu }: {
  m: Message; canal: Habit; photo?: string; premier: boolean; dernier: boolean; vu: boolean
}) {
  const f = useFil(canal)
  const t = useT()
  const sortante = m.de === 'hotel'
  const r = canal === 'instagram' ? 22 : 18
  const coins = sortante
    ? { borderTopRightRadius: premier ? r : 4, borderBottomRightRadius: dernier ? r : 4 }
    : { borderTopLeftRadius: premier ? r : 4, borderBottomLeftRadius: dernier ? r : 4 }
  return (
    <View style={[!premier && s.serre]}>
      <View style={[s.rangeeBulle, sortante && s.rangeeSortante]}>
        {!sortante && (
          <View style={s.place}>
            {dernier && <Avatar size={28} photo={photo} fond={f.avatar} icone={f.avatarIcone} />}
          </View>
        )}
        <View style={[s.bulle, { borderRadius: r, backgroundColor: sortante ? f.bulleOut : f.bulleIn }, coins]}>
          {m.vocal ? (
            <View style={s.vocal}>
              <Icon name="play" size={18} color={sortante ? f.surBulleOut : f.encre} plein />
              <Text style={[s.texte, { color: sortante ? f.surBulleOut : f.encre }]}>{m.vocal}</Text>
            </View>
          ) : (
            <Text style={[s.texte, { color: sortante ? f.surBulleOut : f.encre }]}>{m.texte}</Text>
          )}
        </View>
      </View>
      {vu && (canal === 'instagram'
        ? <Text style={[s.vu, { color: f.gris }]}>{t('Visto', 'Vu')}</Text>
        : <View style={s.vuAvatar}><Avatar size={14} photo={photo} fond={f.avatar} icone={f.avatarIcone} /></View>)}
    </View>
  )
}

/** L'assistant en train d'écrire, dans une bulle de l'hôtel. */
export function EcritFil({ canal }: { canal: Habit }) {
  const f = useFil(canal)
  return (
    <View style={[s.rangeeBulle, s.rangeeSortante]}>
      <View style={[s.bulle, s.bulleEcrit, { backgroundColor: f.bulleOut }]}><Points color={f.surBulleOut} taille={6} /></View>
    </View>
  )
}

/** La saisie : l'appareil photo dans un rond (Instagram) ou la rangée d'icônes bleues et le pouce (Messenger). */
export function SaisieFil({ canal, texte, setTexte, onEnvoyer, champ, onFocus, onBlur }: {
  canal: Habit; texte: string; setTexte: (v: string) => void; onEnvoyer: () => void
  champ: Ref<ComponentRef<typeof TextInput>>; onFocus: () => void; onBlur: () => void
}) {
  const f = useFil(canal)
  const t = useT()
  const insets = useSafeAreaInsets()
  const plein = !!texte.trim()
  const saisie = (
    <TextInput ref={champ} value={texte} onChangeText={setTexte} onSubmitEditing={onEnvoyer} onFocus={onFocus} onBlur={onBlur}
               placeholder={canal === 'instagram' ? t('Mensaje…', 'Votre message…') : 'Aa'} placeholderTextColor={f.gris}
               accessibilityLabel={t('Mensaje', 'Message')} style={[s.saisieTexte, { color: f.encre }]} />
  )
  if (canal === 'instagram') return (
    <View style={[s.saisieZone, { backgroundColor: f.fond, paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={[s.saisieInsta, { backgroundColor: f.champ }]}>
        <View style={[s.appareil, { backgroundColor: f.accent }]}><Icon name="camera" size={18} color={f.surAccent} trait={2} /></View>
        {saisie}
        {plein ? (
          <Pressable onPress={onEnvoyer} accessibilityRole="button" hitSlop={8}>
            <Text style={[s.envoyer, { color: f.accent }]}>{t('Enviar', 'Envoyer')}</Text>
          </Pressable>
        ) : (
          <View style={s.icones}>
            <Icon name="mic" size={22} color={f.encre} trait={1.8} />
            <Icon name="image" size={22} color={f.encre} trait={1.8} />
            <Icon name="smile" size={22} color={f.encre} trait={1.8} />
          </View>
        )}
      </View>
    </View>
  )
  return (
    <View style={[s.saisieZone, s.saisieMessenger, { backgroundColor: f.fond, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {!plein && (
        <View style={s.icones}>
          <Icon name="plusRond" size={24} color={f.accent} trait={2} />
          <Icon name="camera" size={24} color={f.accent} trait={2} />
          <Icon name="image" size={23} color={f.accent} trait={2} />
          <Icon name="mic" size={23} color={f.accent} trait={2} />
        </View>
      )}
      <View style={[s.saisieAa, { backgroundColor: f.champ }]}>
        {saisie}
        <Icon name="smile" size={22} color={f.accent} trait={2} />
      </View>
      <Pressable onPress={plein ? onEnvoyer : undefined} accessibilityRole="button" accessibilityLabel={plein ? t('Enviar', 'Envoyer') : 'J’aime'} hitSlop={8}>
        <Icon name={plein ? 'avion' : 'like'} size={24} color={f.accent} trait={2} plein={!plein} />
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  nom: { fontSize: 15 },
  apercuLigne: { flexDirection: 'row', marginTop: 2 },
  apercu: { fontSize: 14, flexShrink: 1 },
  quand: { fontSize: 14, flexShrink: 0 },
  point: { width: 10, height: 10, borderRadius: 5 },
  enLigne: { position: 'absolute', right: 1, bottom: 1, width: 15, height: 15, borderRadius: 8, borderWidth: 2.5 },
  enLignePetit: { right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  enteteFil: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  retour: { flexDirection: 'row', alignItems: 'center', minWidth: 32, minHeight: 44 },
  retourNombre: { fontSize: 17, marginLeft: -2 },
  filNom: { fontSize: 16, fontWeight: '700' },
  filSous: { fontSize: 12, marginTop: 1 },
  appels: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingRight: 8 },
  jour: { alignSelf: 'center', fontSize: 12, fontWeight: '500', marginVertical: 10 },
  serre: { marginTop: -4 },
  rangeeBulle: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rangeeSortante: { justifyContent: 'flex-end' },
  place: { width: 28 },
  bulle: { maxWidth: '72%', paddingHorizontal: 13, paddingVertical: 9 },
  bulleEcrit: { paddingVertical: 12 },
  texte: { fontSize: 15.5, lineHeight: 20 },
  vocal: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vu: { alignSelf: 'flex-end', fontSize: 12, marginTop: 3, marginRight: 4 },
  vuAvatar: { alignSelf: 'flex-end', marginTop: 3 },
  saisieZone: { paddingHorizontal: 10, paddingTop: 8 },
  saisieInsta: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 24, paddingLeft: 6, paddingRight: 14, minHeight: 46 },
  appareil: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  saisieTexte: { flex: 1, minWidth: 0, fontSize: 16, minHeight: 40 },
  envoyer: { fontSize: 16, fontWeight: '600' },
  icones: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  saisieMessenger: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saisieAa: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingLeft: 14, paddingRight: 10, minHeight: 38 },
})
