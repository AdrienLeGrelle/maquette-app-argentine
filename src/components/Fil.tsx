import { Fragment } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { BulleFil, JourFil } from '@/components/Boites'
import { CarteLien, PastilleEtape } from '@/components/Paiement'
import { Points } from '@/components/Points'
import type { Conversation, Message } from '@/lib/demo'
import { canalDe, useT } from '@/lib/etat'
import { Avatar, Icon } from '@/lib/icons'
import { useFil, useWa } from '@/lib/theme'

/**
 * Les messages d'une discussion, dessinés comme dans l'app d'origine :
 * bulles WhatsApp, ou l'allure d'Instagram et de Messenger. Servi par la
 * discussion ouverte et par le détail d'une réservation.
 */
export function Messages({ c }: { c: Conversation }) {
  const t = useT()
  const canal = canalDe(c)
  const habit = canal === 'instagram' || canal === 'messenger' ? canal : null
  const q = c.quand
  const jour = q.jour === 'date' ? q.date : q.jour === 'semaine' ? t(q.es, q.fr) : q.jour === 'ayer' ? t('Ayer', 'Hier') : t('Hoy', 'Aujourd’hui')
  // « Vu » ne se pose que sous le dernier message de l'hôtel que la personne a lu.
  const dernierVu = c.messages.findLastIndex((m) => m.de === 'hotel' && !m.etape && !m.lien && m.lu)

  return (
    <>
      {!c.messages[0]?.jour && (habit ? <JourFil canal={habit} texte={`${jour} ${c.messages[0]?.heure ?? ''}`} /> : <Pastille texte={jour} />)}
      {c.messages.map((m, i) => (
        <Fragment key={i}>
          {m.jour && (habit ? <JourFil canal={habit} texte={`${m.jour} ${m.heure}`} /> : <Pastille texte={m.jour} />)}
          {m.etape ? <PastilleEtape etape={m.etape} />
            : habit && !m.lien ? (
              <BulleFil m={m} canal={habit} photo={c.photo} vu={i === dernierVu}
                        premier={!memeEnvoi(c.messages[i - 1], m)} dernier={!memeEnvoi(m, c.messages[i + 1])} />
            )
            : m.lien ? <CarteLien m={{ ...m, lien: m.lien }} suite={i > 0 && !m.jour && c.messages[i - 1].de === m.de && !c.messages[i - 1].etape} />
              : <Bulle m={m} suite={i > 0 && !m.jour && c.messages[i - 1].de === m.de && !c.messages[i - 1].etape} />}
        </Fragment>
      ))}
    </>
  )
}

/**
 * Le haut d'un fil montré hors de Discussions (le détail d'une réservation) :
 * la photo, le nom, et le numéro ou le compte, comme en haut de la discussion,
 * pour savoir d'un coup d'œil avec qui l'on parle.
 */
export function EnteteApercu({ c }: { c: Conversation }) {
  const wa = useWa()
  const canal = canalDe(c)
  const habit = canal === 'instagram' || canal === 'messenger' ? canal : null
  const f = useFil(habit ?? 'instagram')
  const ton = habit
    ? { fond: f.fond, encre: f.encre, gris: f.gris, ligne: f.ligne, avatar: f.avatar, icone: f.avatarIcone }
    : { fond: wa.barre, encre: wa.encre, gris: wa.gris, ligne: wa.ligne, avatar: wa.avatar, icone: wa.avatarIcone }
  return (
    <View style={[s.apercu, { backgroundColor: ton.fond, borderBottomColor: ton.ligne }]}>
      <Avatar size={36} photo={c.photo} fond={ton.avatar} icone={ton.icone} />
      <View style={s.flex}>
        <Text numberOfLines={1} style={[s.apercuNom, { color: ton.encre }]}>{c.nom}</Text>
        <Text numberOfLines={1} style={[s.apercuSous, { color: ton.gris }]}>{c.tel}</Text>
      </View>
    </View>
  )
}

/** Les trois points de l'assistant qui écrit, dans une bulle sortante WhatsApp. */
export function EcritWa() {
  const wa = useWa()
  return (
    <View style={[s.bulle, s.sortante, { backgroundColor: wa.bulleOut }]}>
      <View style={s.ecrit}><Points color={wa.bulleMeta} taille={7} /></View>
    </View>
  )
}

/** Deux messages du même envoi : même auteur, sans date ni pastille entre eux. */
function memeEnvoi(a: Message | undefined, b: Message | undefined) {
  return !!a && !!b && a.de === b.de && !b.jour && !a.etape && !b.etape && !a.lien && !b.lien
}

function Pastille({ texte }: { texte: string }) {
  const wa = useWa()
  return <View style={[s.jour, { backgroundColor: wa.pastille }]}><Text style={[s.jourTexte, { color: wa.bulleMeta }]}>{texte}</Text></View>
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
  apercu: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  apercuNom: { fontSize: 16, fontWeight: '600' },
  apercuSous: { fontSize: 13, marginTop: 1 },
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
})
