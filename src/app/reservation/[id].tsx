import { Redirect, router, useLocalSearchParams } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LogoCanal } from '@/components/Logos'
import { JOURS_COURTS, MOIS, date, ecart } from '@/lib/dates'
import { pesos, sejours } from '@/lib/demo'
import { useEtat } from '@/lib/etat'
import { Icon, type IconName } from '@/lib/icons'
import { num, useCouleurs, useWa } from '@/lib/theme'

const NOMS_CANAUX = { whatsapp: 'WhatsApp', instagram: 'Instagram', booking: 'Booking', airbnb: 'Airbnb' }

function jourLong(iso: string) {
  const d = date(iso)
  return `${JOURS_COURTS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`
}

/** Le détail d'une réservation, ouvert depuis le calendrier. */
export default function Reservation() {
  const wa = useWa()
  const c = useCouleurs()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { checkins, basculerCheckin, config, peut } = useEtat()
  const e = sejours.find((x) => x.id === id)
  if (!e) return <Redirect href="/calendario" />

  const bloque = e.statut === 'bloque'
  const nuits = ecart(e.debut, e.fin)
  const arrive = checkins.includes(e.id)
  const statut = bloque ? { label: `Bloqué par ${e.source}`, fond: wa.champ, encre: wa.gris }
    : e.statut === 'attente' ? { label: 'À payer', fond: c.warnWash, encre: c.warnInk }
      : { label: 'Confirmée', fond: c.okWash, encre: c.ok }
  const personnes = [`${e.adultes} adulte${e.adultes > 1 ? 's' : ''}`, e.enfants ? `${e.enfants} enfant${e.enfants > 1 ? 's' : ''}` : null].filter(Boolean).join(', ')

  return (
    <View style={[s.flex, { backgroundColor: wa.fond }]}>
      <View style={[s.entete, { paddingTop: insets.top + 6, borderBottomColor: wa.ligne }]}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/calendario'))} hitSlop={10}
                   accessibilityRole="button" accessibilityLabel="Retour" style={s.retour}>
          <Icon name="chevL" size={28} color={wa.encre} trait={2.2} />
        </Pressable>
        <Text numberOfLines={1} style={[s.enteteTitre, { color: wa.encre }]}>{bloque ? `Bloqué · ${e.chambre}` : e.nom}</Text>
      </View>

      <ScrollView contentContainerStyle={[s.contenu, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[s.statut, { backgroundColor: statut.fond }]}><Text style={[s.statutTexte, { color: statut.encre }]}>{statut.label}</Text></View>

        <View style={[s.dates, { backgroundColor: wa.champ }]}>
          <View style={s.flex}>
            <Text style={[s.datesLabel, { color: wa.gris }]}>Arrivée</Text>
            <Text style={[s.datesJour, { color: wa.encre }]}>{jourLong(e.debut)}</Text>
            <Text style={[s.datesHeure, { color: wa.gris }]}>à partir de {config.arrivee}</Text>
          </View>
          <View style={s.nuits}>
            <Icon name="chevR" size={18} color={wa.gris} />
            <Text style={[s.nuitsTexte, num, { color: wa.gris }]}>{nuits} nuit{nuits > 1 ? 's' : ''}</Text>
          </View>
          <View style={[s.flex, s.droite]}>
            <Text style={[s.datesLabel, { color: wa.gris }]}>Départ</Text>
            <Text style={[s.datesJour, { color: wa.encre }]}>{jourLong(e.fin)}</Text>
            <Text style={[s.datesHeure, { color: wa.gris }]}>avant {config.depart}</Text>
          </View>
        </View>

        {!bloque && (
          <Pressable onPress={() => basculerCheckin(e.id)} accessibilityRole="button" accessibilityState={{ checked: arrive }}
                     style={({ pressed }) => [s.checkin, arrive ? { backgroundColor: wa.vertWash } : { backgroundColor: wa.vert }, pressed && { opacity: 0.85 }]}>
            <Icon name="checkPlain" size={20} color={arrive ? wa.vertEncre : wa.surVert} trait={2.6} />
            <Text style={[s.checkinTexte, { color: arrive ? wa.vertEncre : wa.surVert }]}>{arrive ? 'Check-in fait' : 'Marquer le check-in fait'}</Text>
          </Pressable>
        )}

        <Section titre="Commande">
          <Ligne icon="bed" label="Chambre" valeur={`${e.chambre} × 1`} />
          {!bloque && <Ligne icon="user" label="Personnes" valeur={personnes} />}
          {!bloque && <Ligne icon="sparkles" label="Options" valeur={e.options.length ? e.options.join(', ') : 'Aucune'} dernier={!peut('paiements')} />}
          {!bloque && peut('paiements') && <Ligne icon="card" label="Montant" valeur={pesos(e.montant)} nombre />}
          {!bloque && peut('paiements') && <Ligne icon="checkPlain" label="Déjà payé" valeur={pesos(e.paye)} nombre dernier
                            couleur={e.paye >= e.montant ? c.ok : c.warnInk} />}
          {bloque && <Ligne icon="info" label="Origine" valeur={`Importé du calendrier ${e.source}`} dernier />}
        </Section>

        {!bloque && (
          <Section titre="Canal">
            <View style={s.canal}>
              <LogoCanal nom={e.canal === 'airbnb' ? 'booking' : e.canal} size={36} />
              <View style={s.flex}>
                <Text style={[s.canalNom, { color: wa.encre }]}>Réservé par {NOMS_CANAUX[e.canal]}</Text>
                {e.tel && <Text style={[s.canalSous, num, { color: wa.gris }]}>{e.tel}</Text>}
              </View>
            </View>
            <Pressable onPress={() => e.convId && router.push({ pathname: '/chat/[id]', params: { id: e.convId } })}
                       disabled={!e.convId} accessibilityRole="button"
                       style={({ pressed }) => [s.ouvrir, { borderColor: wa.ligne, opacity: !e.convId ? 0.45 : pressed ? 0.7 : 1 }]}>
              <Icon name="chat" size={18} color={wa.vert} />
              <Text style={[s.ouvrirTexte, { color: wa.vert }]}>
                {e.convId ? 'Ouvrir la conversation' : `Conversation ${NOMS_CANAUX[e.canal]} pas encore reliée`}
              </Text>
            </Pressable>
          </Section>
        )}
      </ScrollView>
    </View>
  )
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  const wa = useWa()
  return (
    <View style={s.section}>
      <Text style={[s.sectionTitre, { color: wa.gris }]}>{titre}</Text>
      <View style={[s.groupe, { backgroundColor: wa.champ }]}>{children}</View>
    </View>
  )
}

function Ligne({ icon, label, valeur, nombre, dernier, couleur }: { icon: IconName; label: string; valeur: string; nombre?: boolean; dernier?: boolean; couleur?: string }) {
  const wa = useWa()
  return (
    <View style={[s.ligne, !dernier && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: wa.ligne }]}>
      <Icon name={icon} size={20} color={wa.gris} trait={1.7} />
      <Text style={[s.ligneLabel, { color: wa.gris }]}>{label}</Text>
      <Text style={[s.ligneValeur, nombre && num, { color: couleur ?? wa.encre }]}>{valeur}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  droite: { alignItems: 'flex-end' },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  retour: { minWidth: 36, minHeight: 44, justifyContent: 'center' },
  enteteTitre: { flex: 1, fontSize: 18, fontWeight: '600' },
  contenu: { padding: 16, gap: 16 },
  statut: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  statutTexte: { fontSize: 14, fontWeight: '600' },
  dates: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14 },
  datesLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase' },
  datesJour: { fontSize: 17, fontWeight: '600', marginTop: 2 },
  datesHeure: { fontSize: 13, marginTop: 1 },
  nuits: { alignItems: 'center', paddingHorizontal: 6 },
  nuitsTexte: { fontSize: 12 },
  checkin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: 999 },
  checkinTexte: { fontSize: 17, fontWeight: '600' },
  section: { gap: 6 },
  sectionTitre: { fontSize: 13, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3, marginLeft: 4 },
  groupe: { borderRadius: 14, paddingHorizontal: 14 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingVertical: 8 },
  ligneLabel: { fontSize: 15, width: 92 },
  ligneValeur: { flex: 1, fontSize: 16, textAlign: 'right' },
  canal: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  canalNom: { fontSize: 16, fontWeight: '500' },
  canalSous: { fontSize: 14, marginTop: 2 },
  ouvrir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  ouvrirTexte: { fontSize: 16, fontWeight: '600' },
})
