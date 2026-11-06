import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { useRef, useState, type ComponentRef, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EnteteApercu, Messages } from '@/components/Fil'
import { LogoCanal } from '@/components/Logos'
import { Deroulant } from '@/components/ui'
import { JOURS_COURTS, MOIS, date, ecart } from '@/lib/dates'
import { pesos } from '@/lib/demo'
import { echangeDuSejour } from '@/lib/echanges'
import { useEtat } from '@/lib/etat'
import { Icon, type IconName } from '@/lib/icons'
import { num, useCouleurs, useFil, useWa } from '@/lib/theme'

const NOMS_CANAUX = { whatsapp: 'WhatsApp', instagram: 'Instagram', booking: 'Booking', airbnb: 'Airbnb' }
/** Ce qu'on peut toujours faire défiler sous une fiche courte, pour que le geste vers le bas déroule la conversation. */
const ELAN = 56
/** De combien remonter au-dessus du canal pour que la conversation se replie. */
const SEUIL_REPLI = 48

function jourLong(iso: string) {
  const d = date(iso)
  return `${JOURS_COURTS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`
}

/**
 * Le détail d'une réservation, ouvert depuis le calendrier. La conversation
 * qui l'a amenée se déroule sous le canal, pour retrouver une petite info
 * (le chien, l'heure d'arrivée) sans quitter la fiche. Elle se déroule
 * d'elle-même quand on glisse jusqu'en bas, et se replie quand on remonte
 * au-dessus du canal.
 *
 * S'il reste à payer, « Payer le reste » propose les espèces, que l'hôtelier
 * valide à la main, ou un lien Mercado Pago du montant restant : le message
 * attend tout écrit au bas de la conversation, il n'y a plus qu'à l'envoyer.
 */
export default function Reservation() {
  const wa = useWa()
  const c = useCouleurs()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insta = useFil('instagram')
  const { checkins, basculerCheckin, config, convs, peut, sejours, encaisser, envoyerReste } = useEtat()
  const [fil, setFil] = useState(false)
  const defile = useRef<ComponentRef<typeof ScrollView>>(null)
  const yCanal = useRef(0)
  const dernierY = useRef(0)
  // Juste après une ouverture, un mouvement vers le haut (le rebond du bas de page) ne referme rien.
  const verrou = useRef(false)
  const [hauteurVue, setHauteurVue] = useState(0)
  const [paiement, setPaiement] = useState<null | 'choix' | 'especes'>(null)
  const [brouillon, setBrouillon] = useState<string | null>(null)
  // La conversation s'ouvre pour le brouillon : on descend jusqu'à lui, pas jusqu'au canal.
  const versBrouillon = useRef(false)
  const e = sejours.find((x) => x.id === id)
  if (!e) return <Redirect href="/calendario" />
  const conv = e.statut === 'bloque' ? undefined : e.convId ? convs.find((x) => x.id === e.convId) : echangeDuSejour(e, config.arrivee)

  const verrouiller = () => {
    verrou.current = true
    setTimeout(() => { verrou.current = false }, 800)
  }

  // Le sens compte : le repli fait lui-même remonter la page, et le déroulé la fait descendre jusqu'au canal.
  const suivre = (ev: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = ev.nativeEvent
    const y = contentOffset.y
    const descend = y > dernierY.current
    const monte = y < dernierY.current
    dernierY.current = y
    if (!conv) return
    if (!fil && descend && y + layoutMeasurement.height >= contentSize.height - 2) {
      verrouiller()
      setFil(true)
    } else if (fil && monte && y < yCanal.current - SEUIL_REPLI && !verrou.current) {
      setFil(false)
      defile.current?.scrollTo({ y: 0, animated: true })
    }
  }

  const bloque = e.statut === 'bloque'
  const nuits = ecart(e.debut, e.fin)
  const arrive = checkins.includes(e.id)
  const statut = bloque ? { label: `Bloqué par ${e.source}`, fond: wa.champ, encre: wa.gris }
    : e.statut === 'attente' ? { label: e.lien?.etat === 'retenue' ? `Retenue jusqu’à ${e.lien.jusqua}` : 'À payer', fond: c.warnWash, encre: c.warnInk }
      : { label: 'Confirmée', fond: c.okWash, encre: c.ok }
  const personnes = [`${e.adultes} adulte${e.adultes > 1 ? 's' : ''}`, e.enfants ? `${e.enfants} enfant${e.enfants > 1 ? 's' : ''}` : null].filter(Boolean).join(', ')
  const reste = bloque ? 0 : e.montant - e.paye
  const lienEnvoye = e.lien?.etat === 'attente' && e.lien.montant === reste ? e.lien : undefined
  const enInsta = conv?.canal === 'instagram'

  const allerEnBas = () => defile.current?.scrollToEnd({ animated: true })
  const preparerLien = () => {
    setPaiement(null)
    setBrouillon(`¡Hola ${e.nom.split(' ')[0]}! Te paso el link para abonar el saldo de la reserva 👇`)
    verrouiller()
    // Déjà ouverte : on attend que les deux choix se soient repliés pour descendre.
    if (fil) setTimeout(allerEnBas, 320)
    else { versBrouillon.current = true; setFil(true) }
  }
  const envoyerBrouillon = () => {
    envoyerReste(e.id, brouillon ?? '')
    setBrouillon(null)
    setTimeout(allerEnBas, 80)
  }

  return (
    <View style={[s.flex, { backgroundColor: wa.fond }]}>
      <View style={[s.entete, { paddingTop: insets.top + 6, borderBottomColor: wa.ligne }]}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/calendario'))} hitSlop={10}
                   accessibilityRole="button" accessibilityLabel="Retour" style={s.retour}>
          <Icon name="chevL" size={28} color={wa.encre} trait={2.2} />
        </Pressable>
        <Text numberOfLines={1} style={[s.enteteTitre, { color: wa.encre }]}>{bloque ? `Bloqué · ${e.chambre}` : e.nom}</Text>
      </View>

      <ScrollView ref={defile} onScroll={suivre} scrollEventThrottle={16}
                  onLayout={(ev) => setHauteurVue(ev.nativeEvent.layout.height)}
                  contentContainerStyle={[s.contenu, { paddingBottom: insets.bottom + 24 }, conv && hauteurVue > 0 && { minHeight: hauteurVue + ELAN }]}>
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
          {reste > 0 && peut('paiements') && (
            <>
              <Pressable onPress={() => setPaiement((p) => (p ? null : 'choix'))} accessibilityRole="button" accessibilityState={{ expanded: !!paiement }}
                         style={({ pressed }) => [s.ouvrir, { borderColor: wa.ligne, opacity: pressed ? 0.7 : 1 }]}>
                <Icon name="card" size={18} color={wa.vert} />
                <Text style={[s.ouvrirTexte, { color: wa.vert }]}>Payer le reste · <Text style={num}>{pesos(reste)}</Text></Text>
                <View style={paiement && s.retourne}><Icon name="chevD" size={18} color={wa.vert} trait={2.2} /></View>
              </Pressable>
              <Deroulant ouvert={!!paiement}>
                {paiement === 'especes' ? (
                  <View style={s.especes}>
                    <Text style={[s.especesTexte, { color: wa.encre }]}>
                      Vous avez reçu <Text style={[num, s.gras]}>{pesos(reste)}</Text> en espèces ?
                    </Text>
                    <Text style={[s.choixSous, { color: wa.gris }]}>La réservation sera marquée payée.</Text>
                    <View style={s.especesBoutons}>
                      <Pressable onPress={() => setPaiement('choix')} accessibilityRole="button" hitSlop={8} style={s.annuler}>
                        <Text style={[s.annulerTexte, { color: wa.gris }]}>Annuler</Text>
                      </Pressable>
                      <Pressable onPress={() => { encaisser(e.id); setPaiement(null) }} accessibilityRole="button"
                                 style={({ pressed }) => [s.valider, { backgroundColor: wa.vert, opacity: pressed ? 0.85 : 1 }]}>
                        <Icon name="checkPlain" size={17} color={wa.surVert} trait={2.6} />
                        <Text style={[s.validerTexte, { color: wa.surVert }]}>Valider le paiement</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <Choix titre="Espèces" sous="Reçu en main propre : vous validez" onPress={() => setPaiement('especes')}
                           icone={<View style={[s.choixIcone, { backgroundColor: c.okWash }]}><Icon name="billet" size={20} color={c.ok} trait={1.8} /></View>} />
                    <Choix titre="Mercado Pago" icone={<LogoCanal nom="mercadopago" size={36} />} onPress={preparerLien} dernier
                           sous={lienEnvoye ? `Lien envoyé à ${lienEnvoye.heure} · le renvoyer` : `Lien à envoyer sur ${NOMS_CANAUX[e.canal]}`} />
                  </>
                )}
              </Deroulant>
            </>
          )}
        </Section>

        {!bloque && (
          <View onLayout={(ev) => { yCanal.current = ev.nativeEvent.layout.y }}>
            <Section titre="Canal">
              <View style={s.canal}>
                <LogoCanal nom={e.canal === 'airbnb' ? 'booking' : e.canal} size={36} />
                <View style={s.flex}>
                  <Text style={[s.canalNom, { color: wa.encre }]}>Réservé par {NOMS_CANAUX[e.canal]}</Text>
                  {e.tel && <Text style={[s.canalSous, num, { color: wa.gris }]}>{e.tel}</Text>}
                </View>
              </View>
              {conv && (
                <>
                  <Pressable onPress={() => setFil((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: fil }}
                             style={({ pressed }) => [s.ouvrir, { borderColor: wa.ligne, opacity: pressed ? 0.7 : 1 }]}>
                    <Icon name="chat" size={18} color={wa.vert} />
                    <Text style={[s.ouvrirTexte, { color: wa.vert }]}>{fil ? 'Masquer la conversation' : 'Voir la conversation'}</Text>
                    <View style={fil && s.retourne}><Icon name="chevD" size={18} color={wa.vert} trait={2.2} /></View>
                  </Pressable>
                  {/* Bord à bord dans la carte : le volet coupe ce qui dépasse, la marge se prend donc dehors. */}
                  <View style={s.bordABord}>
                    <Deroulant ouvert={fil} onOuvert={() => {
                      if (versBrouillon.current) { versBrouillon.current = false; allerEnBas() }
                      else defile.current?.scrollTo({ y: yCanal.current, animated: true })
                    }}>
                      <EnteteApercu c={conv} />
                      <View style={[s.fil, { backgroundColor: enInsta ? insta.fond : wa.papier }]}>
                        <Messages c={conv} />
                      </View>
                      {brouillon !== null && reste > 0 && (
                        <SaisieLien texte={brouillon} setTexte={setBrouillon} montant={reste} onEnvoyer={envoyerBrouillon} onRetirer={() => setBrouillon(null)}
                                    accent={enInsta ? insta.accent : wa.vert} surAccent={enInsta ? insta.surAccent : wa.surVert} />
                      )}
                      <View style={s.pied}>
                        <Pressable onPress={() => setFil(false)} accessibilityRole="button" hitSlop={8} style={s.lienPied}>
                          <View style={s.retourne}><Icon name="chevD" size={16} color={wa.gris} trait={2.2} /></View>
                          <Text style={[s.lienPiedTexte, { color: wa.gris }]}>Replier</Text>
                        </Pressable>
                        {e.convId && (
                          <Pressable onPress={() => router.push({ pathname: '/chat/[id]', params: { id: conv.id } })}
                                     accessibilityRole="button" hitSlop={8} style={s.lienPied}>
                            <Text style={[s.lienPiedTexte, { color: wa.vert }]}>Répondre dans Discussions</Text>
                            <Icon name="chevR" size={16} color={wa.vert} trait={2.2} />
                          </Pressable>
                        )}
                      </View>
                    </Deroulant>
                  </View>
                </>
              )}
            </Section>
          </View>
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

/** Une façon de payer, dans la liste qui se déroule sous « Payer le reste ». */
function Choix({ icone, titre, sous, onPress, dernier }: { icone: ReactNode; titre: string; sous: string; onPress: () => void; dernier?: boolean }) {
  const wa = useWa()
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
               style={({ pressed }) => [s.choix, !dernier && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: wa.ligne }, pressed && { opacity: 0.7 }]}>
      {icone}
      <View style={s.flex}>
        <Text style={[s.choixTitre, { color: wa.encre }]}>{titre}</Text>
        <Text style={[s.choixSous, { color: wa.gris }]}>{sous}</Text>
      </View>
      <Icon name="chevR" size={18} color={wa.gris} trait={2} />
    </Pressable>
  )
}

/**
 * Le message préparé au bas de la conversation : le lien Mercado Pago du reste
 * en pièce jointe, un mot au voyageur dans sa langue, et le bouton d'envoi.
 */
function SaisieLien({ texte, setTexte, montant, accent, surAccent, onEnvoyer, onRetirer }: {
  texte: string; setTexte: (v: string) => void; montant: number; accent: string; surAccent: string; onEnvoyer: () => void; onRetirer: () => void
}) {
  const wa = useWa()
  const [hauteur, setHauteur] = useState(40)
  return (
    <View style={[s.saisie, { backgroundColor: wa.barre, borderTopColor: wa.ligne }]}>
      <View style={[s.saisieBulle, { backgroundColor: wa.saisie, borderColor: wa.ligne }]}>
        <View style={[s.piece, { backgroundColor: wa.apercuLien }]}>
          <LogoCanal nom="mercadopago" size={30} />
          <View style={s.flex}>
            <Text style={[s.pieceTitre, { color: wa.encre }]}>Mercado Pago</Text>
            <Text style={[s.pieceSous, { color: wa.gris }]}>Reste à payer · <Text style={num}>{pesos(montant)}</Text></Text>
          </View>
          <Pressable onPress={onRetirer} accessibilityRole="button" accessibilityLabel="Retirer le lien" hitSlop={10}>
            <Icon name="x" size={16} color={wa.gris} trait={2} />
          </Pressable>
        </View>
        <TextInput multiline value={texte} onChangeText={setTexte} accessibilityLabel="Message au voyageur"
                   onContentSizeChange={(ev) => setHauteur(Math.min(120, Math.max(40, ev.nativeEvent.contentSize.height)))}
                   style={[s.champ, { height: hauteur, color: wa.encre }]} />
      </View>
      <Pressable onPress={onEnvoyer} accessibilityRole="button" accessibilityLabel="Envoyer"
                 style={({ pressed }) => [s.envoyer, { backgroundColor: accent, opacity: pressed ? 0.85 : 1 }]}>
        <Icon name="send" size={18} color={surAccent} plein />
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  gras: { fontWeight: '700' },
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
  retourne: { transform: [{ rotate: '180deg' }] },
  bordABord: { marginHorizontal: -14 },
  fil: { paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  pied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, paddingHorizontal: 14 },
  lienPied: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  lienPiedTexte: { fontSize: 15, fontWeight: '600' },
  choix: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 10 },
  choixIcone: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  choixTitre: { fontSize: 16, fontWeight: '600' },
  choixSous: { fontSize: 13.5, marginTop: 1 },
  especes: { paddingTop: 4, paddingBottom: 12, gap: 4 },
  especesTexte: { fontSize: 16 },
  especesBoutons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 10 },
  annuler: { paddingVertical: 6 },
  annulerTexte: { fontSize: 15, fontWeight: '500' },
  valider: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 16, minHeight: 40 },
  validerTexte: { fontSize: 15, fontWeight: '600' },
  saisie: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  saisieBulle: { flex: 1, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 4 },
  piece: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 8 },
  pieceTitre: { fontSize: 14, fontWeight: '600' },
  pieceSous: { fontSize: 13, marginTop: 1 },
  champ: { fontSize: 16, paddingHorizontal: 10, paddingVertical: 9 },
  envoyer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
})
