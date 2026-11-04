import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Repere } from '@/components/Repere'
import { AUJOURDHUI, INITIALES, JOURS_COURTS, MOIS, casesDuMois, date, ecart } from '@/lib/dates'
import { UNITES, occupation, type Sejour } from '@/lib/demo'
import { useEtat } from '@/lib/etat'
import { Icon } from '@/lib/icons'
import { num, useCal, type CouleursCal } from '@/lib/theme'

/** Les séjours présents le `jour` : arrivées et nuits en cours d'abord, départs du matin à la fin. */
function duJour(jour: string, sejours: Sejour[]) {
  return sejours.filter((s) => s.debut <= jour && jour <= s.fin)
    .sort((a, b) => Number(a.fin === jour) - Number(b.fin === jour))
}

function dateCourte(jour: string) {
  const d = date(jour)
  return `${JOURS_COURTS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()].slice(0, 4)}.`
}

/**
 * Le calendrier, présenté comme Google Agenda : le mois reste en haut, la
 * journée touchée s'affiche dessous, avec une loupe pour chercher par nom.
 */
/** Le calendrier n'est ouvert qu'à ceux qui gèrent les réservations. */
export default function Calendrier() {
  const { peut } = useEtat()
  return peut('reservations') ? <CalendrierOuvert /> : <Redirect href="/menu" />
}

function CalendrierOuvert() {
  const cal = useCal()
  const { sejours } = useEtat()
  const aujourdhui = date(AUJOURDHUI)
  const [mois, setMois] = useState({ annee: aujourdhui.getUTCFullYear(), mois: aujourdhui.getUTCMonth() })
  const [choisi, setChoisi] = useState(AUJOURDHUI)
  const [cherche, setCherche] = useState(false)
  const [q, setQ] = useState('')

  const changerMois = (sens: number) => {
    const m = mois.mois + sens
    setMois({ annee: mois.annee + Math.floor(m / 12), mois: ((m % 12) + 12) % 12 })
  }
  const allerA = (jour: string) => {
    setChoisi(jour)
    const d = date(jour)
    setMois({ annee: d.getUTCFullYear(), mois: d.getUTCMonth() })
  }

  const requete = q.trim().toLowerCase()
  const resultats = requete ? sejours.filter((s) => s.statut !== 'bloque' && s.nom.toLowerCase().includes(requete)) : []
  const jour = duJour(choisi, sejours)
  const d = date(choisi)

  return (
    <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: cal.fond }]}>
      <View style={s.entete}>
        <Repere cle="moisCalendrier" rayon={10}>
          <Text style={[s.titre, { color: cal.encre }]}>{MOIS[mois.mois]}{mois.annee !== aujourdhui.getUTCFullYear() ? ` ${mois.annee}` : ''}</Text>
        </Repere>
        <Pressable onPress={() => allerA(AUJOURDHUI)} accessibilityRole="button" accessibilityLabel="Aujourd’hui"
                   style={[s.boutonJour, { borderColor: cal.encre }]}>
          <Text style={[s.boutonJourTexte, num, { color: cal.encre }]}>{aujourdhui.getUTCDate()}</Text>
        </Pressable>
      </View>

      <GrilleMois cal={cal} annee={mois.annee} mois={mois.mois} choisi={choisi} onChoisir={allerA} onMois={changerMois} />

      <View style={[s.journee, { borderTopColor: cal.ligne }]}>
        <View style={s.journeeEntete}>
          {cherche ? (
            <View style={[s.recherche, { borderColor: cal.ligne }]}>
              <Icon name="search" size={16} color={cal.gris} />
              <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Nom de la réservation"
                         placeholderTextColor={cal.gris} style={[s.rechercheChamp, { color: cal.encre }]} />
              <Pressable onPress={() => { setCherche(false); setQ('') }} hitSlop={10} accessibilityLabel="Fermer la recherche">
                <Icon name="x" size={18} color={cal.gris} />
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={[s.journeeTitre, { color: choisi === AUJOURDHUI ? cal.aujourdhui : cal.encre }]}>
                {JOURS_COURTS[d.getUTCDay()]} {d.getUTCDate()} {MOIS[d.getUTCMonth()]}
              </Text>
              <Text style={[s.journeeCompte, num, { color: cal.gris }]}>
                {occupation(choisi, sejours)}/{UNITES} occupées{jour.some((e) => e.fin === choisi) ? ` · ${jour.filter((e) => e.fin === choisi).length} départ${jour.filter((e) => e.fin === choisi).length > 1 ? 's' : ''}` : ''}
              </Text>
              <Pressable onPress={() => setCherche(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Chercher une réservation">
                <Icon name="search" size={18} color={cal.gris} trait={1.7} />
              </Pressable>
            </>
          )}
        </View>

        <ScrollView contentContainerStyle={s.liste} keyboardShouldPersistTaps="handled">
          {requete ? (
            resultats.length
              ? resultats.map((e) => <Carte key={e.id} cal={cal} e={e} detail={`${dateCourte(e.debut)} → ${dateCourte(e.fin)}`} />)
              : <Text style={[s.rien, { color: cal.gris }]}>Aucune réservation à ce nom.</Text>
          ) : (
            jour.length
              ? jour.map((e) => <Carte key={e.id} cal={cal} e={e} detail={moment(e, choisi)} />)
              : <Text style={[s.rien, { color: cal.gris }]}>Rien de prévu ce jour-là.</Text>
          )}
          <View style={s.basDePage} />
        </ScrollView>
      </View>

      <View style={s.fabZone}>
        <Repere cle="calendrierAjouter" rayon={18}>
          <Pressable accessibilityRole="button" accessibilityLabel="Nouvelle réservation"
                     style={({ pressed }) => [s.fab, { backgroundColor: cal.fab, opacity: pressed ? 0.85 : 1 }]}>
            <Icon name="plus" size={26} color={cal.surFab} trait={2.4} />
          </Pressable>
        </Repere>
      </View>
    </SafeAreaView>
  )
}

/** Où en est le séjour ce jour-là. */
function moment(e: Sejour, jour: string) {
  const nuits = ecart(e.debut, e.fin)
  if (jour === e.debut) return `Arrivée · ${nuits} ${nuits > 1 ? 'nuits' : 'nuit'}`
  if (jour === e.fin) return 'Départ aujourd’hui'
  return `Nuit ${ecart(e.debut, jour) + 1} sur ${nuits}`
}

/**
 * Une réservation de la journée : la carte prend un lavis doux de la couleur
 * de son statut, avec un liseret à gauche et le statut en pilule. Vert de
 * l'app pour confirmée, ambre pour à payer, gris pour un blocage importé.
 */
function Carte({ cal, e, detail }: { cal: CouleursCal; e: Sejour; detail: string }) {
  const { checkins } = useEtat()
  const bloque = e.statut === 'bloque'
  const titre = bloque ? `Bloqué · ${e.chambre}` : e.nom
  const arrive = checkins.includes(e.id)
  const statut = bloque ? e.source ?? 'Bloqué' : e.statut === 'attente' ? (e.lien?.etat === 'retenue' ? 'Retenue' : 'À payer') : arrive ? 'Arrivé' : 'Confirmée'
  const sous = [bloque ? null : e.chambre, detail, bloque ? null : `${e.adultes + e.enfants} pers.`].filter(Boolean).join(' · ')
  const t = teintes(cal, e, arrive)
  return (
    <Pressable onPress={() => router.push({ pathname: '/reservation/[id]', params: { id: e.id } })} accessibilityRole="button"
               style={({ pressed }) => [s.carte, { backgroundColor: t.lavis, opacity: pressed ? 0.7 : 1 }]}>
      <View style={[s.liseret, { backgroundColor: t.trait }]} />
      <View style={s.flex}>
        <View style={s.carteHaut}>
          <Text numberOfLines={1} style={[s.carteTitre, { color: bloque ? cal.gris : cal.encre }]}>{titre}</Text>
          <View style={[s.statut, { backgroundColor: cal.fond }]}>
            <View style={[s.pastille, { backgroundColor: t.trait }]} />
            <Text style={[s.statutTexte, { color: t.texte }]}>{statut}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={[s.carteDetail, { color: cal.gris }]}>{sous}</Text>
      </View>
      <Icon name="chevR" size={16} color={t.texte} />
    </Pressable>
  )
}

function GrilleMois({ cal, annee, mois, choisi, onChoisir, onMois }: {
  cal: CouleursCal; annee: number; mois: number; choisi: string; onChoisir: (j: string) => void; onMois: (sens: number) => void
}) {
  const { sejours } = useEtat()
  const cases = casesDuMois(annee, mois)
  return (
    <View style={s.grille}>
      <View style={s.grilleEntete}>
        <Pressable onPress={() => onMois(-1)} hitSlop={10} accessibilityLabel="Mois précédent"><Icon name="chevL" size={20} color={cal.gris} /></Pressable>
        <View style={s.initiales}>
          {INITIALES.map((l, i) => <Text key={i} style={[s.initiale, { color: cal.gris }]}>{l}</Text>)}
        </View>
        <Pressable onPress={() => onMois(1)} hitSlop={10} accessibilityLabel="Mois suivant"><Icon name="chevR" size={20} color={cal.gris} /></Pressable>
      </View>
      <View style={s.cases}>
        {cases.map((j, i) => {
          if (!j) return <View key={i} style={s.case} />
          const estAujourdhui = j === AUJOURDHUI
          const estChoisi = j === choisi
          const occ = occupation(j, sejours)
          return (
            <Pressable key={j} onPress={() => onChoisir(j)} style={s.case} accessibilityRole="button"
                       accessibilityLabel={`${date(j).getUTCDate()} ${MOIS[mois]}, ${occ} sur ${UNITES} occupées`}>
              <View style={[s.rondJour, estChoisi && !estAujourdhui && { backgroundColor: cal.choisi }]}>
                <Anneau cal={cal} taux={occ / UNITES} />
                <View style={[s.centreJour, estAujourdhui && { backgroundColor: cal.aujourdhui }]}>
                  <Text style={[s.numJour, num, { color: estAujourdhui ? cal.surAujourdhui : cal.encre, fontWeight: estChoisi ? '700' : '400' }]}>{date(j).getUTCDate()}</Text>
                </View>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

/** L'anneau fin qui se remplit avec l'occupation de la nuit : vert calme, ambre, rouge complet. */
function Anneau({ cal, taux }: { cal: CouleursCal; taux: number }) {
  const r = 16
  const tour = 2 * Math.PI * r
  const teinte = taux >= 1 ? cal.occComplet : taux >= 0.7 ? cal.occTendu : cal.occCalme
  return (
    <Svg width={38} height={38} viewBox="0 0 38 38" style={s.anneau}>
      <Circle cx={19} cy={19} r={r} stroke={cal.piste} strokeWidth={2.5} fill="none" />
      <Circle cx={19} cy={19} r={r} stroke={teinte} strokeWidth={2.5} fill="none" strokeLinecap="round"
              strokeDasharray={`${tour * Math.min(1, taux)} ${tour}`} transform="rotate(-90 19 19)" />
    </Svg>
  )
}

function teintes(cal: CouleursCal, e: Sejour, arrive: boolean) {
  if (e.statut === 'confirmee') return { trait: cal.confirmee, lavis: arrive ? cal.lavisArrive : cal.lavisConfirmee, texte: cal.texteConfirmee }
  if (e.statut === 'attente') return { trait: cal.attente, lavis: cal.lavisAttente, texte: cal.texteAttente }
  return { trait: cal.bloque, lavis: cal.lavisBloque, texte: cal.texteBloque }
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52 },
  titre: { fontSize: 22, fontWeight: '500', textTransform: 'capitalize', paddingHorizontal: 4 },
  boutonJour: { width: 26, height: 26, borderWidth: 2, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  boutonJourTexte: { fontSize: 12, fontWeight: '700' },
  grille: { paddingHorizontal: 8, paddingBottom: 6 },
  grilleEntete: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  initiales: { flex: 1, flexDirection: 'row' },
  initiale: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '500' },
  cases: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 },
  case: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2, height: 44 },
  rondJour: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  anneau: { position: 'absolute' },
  centreJour: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numJour: { fontSize: 14 },
  journee: { flex: 1, borderTopWidth: StyleSheet.hairlineWidth },
  journeeEntete: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, minHeight: 52 },
  journeeTitre: { flex: 1, fontSize: 17, fontWeight: '600' },
  journeeCompte: { fontSize: 13 },
  recherche: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, height: 38 },
  rechercheChamp: { flex: 1, fontSize: 16, height: 36 },
  liste: { paddingHorizontal: 16, gap: 8, paddingTop: 2 },
  rien: { fontSize: 15, paddingTop: 16, textAlign: 'center' },
  carte: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingLeft: 18, paddingRight: 14, paddingVertical: 12, overflow: 'hidden' },
  liseret: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  carteHaut: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  carteTitre: { flex: 1, fontSize: 16, fontWeight: '600' },
  carteDetail: { fontSize: 13, marginTop: 3 },
  statut: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pastille: { width: 8, height: 8, borderRadius: 4 },
  statutTexte: { fontSize: 12, fontWeight: '500' },
  basDePage: { height: 90 },
  fabZone: { position: 'absolute', right: 16, bottom: 16 },
  fab: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.18)' },
})
