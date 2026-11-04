import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Repere } from '@/components/Repere'
import { AUJOURDHUI, plusJours } from '@/lib/dates'
import { UNITES, occupation, pesos, statsMois } from '@/lib/demo'
import { useEtat } from '@/lib/etat'
import { Icon } from '@/lib/icons'
import { num, useWa } from '@/lib/theme'

/** « 1 départ », « 2 départs ». */
function pl(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? 's' : ''}`
}

/** Lignes de la journée visibles avant « Voir plus ». */
const APERCU = 3

/**
 * Le tableau de bord (onglet Menu), en briefing : une phrase sur la journée,
 * le remplissage de ce soir, puis la journée heure par heure. Tout est compté
 * sur les mêmes séjours que le calendrier.
 */
export default function Tablero() {
  const wa = useWa()
  const { ouvrirAgent, config, membreVu, peut, sejours } = useEtat()
  const [question, setQuestion] = useState('')
  const [tout, setTout] = useState(false)
  const envoyer = () => { ouvrirAgent(question.trim() || undefined); setQuestion('') }

  const arrivees = sejours.filter((s) => s.debut === AUJOURDHUI && s.statut !== 'bloque')
  const departs = sejours.filter((s) => s.fin === AUJOURDHUI && s.statut !== 'bloque')
  const occ = occupation(AUJOURDHUI, sejours)
  // À encaisser : les paiements qui restent sur la semaine qui vient.
  const semaine = sejours.filter((p) => p.statut === 'attente' && p.fin > AUJOURDHUI && p.montant > p.paye && p.debut <= plusJours(AUJOURDHUI, 7))
    .map((p) => ({ id: p.id, nom: p.nom, montant: p.montant - p.paye, echeance: `arrivée le ${p.debut.slice(8)}/${p.debut.slice(5, 7)}` }))
  const lignes = [
    ...departs.map((d) => ({ heure: config.depart, quoi: 'Départ', s: d })),
    ...arrivees.map((a) => ({ heure: config.arrivee, quoi: 'Arrivée', s: a })),
  ]

  return (
    <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: wa.fond }]}>
      <ScrollView contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
        <View style={[s.question, { backgroundColor: wa.champ }]}>
          <Icon name="sparkles" size={20} color={wa.vert} plein />
          <TextInput value={question} onChangeText={setQuestion} placeholder="Posez votre question à l’assistant…"
                     placeholderTextColor={wa.gris} returnKeyType="send" accessibilityLabel="Question pour l’assistant Roomz"
                     onSubmitEditing={envoyer} style={[s.questionChamp, { color: wa.encre }]} />
          <Pressable onPress={envoyer} accessibilityRole="button" accessibilityLabel="Envoyer" style={[s.questionEnvoyer, { backgroundColor: wa.vert }]}>
            <Icon name="send" size={16} color={wa.surVert} plein />
          </Pressable>
        </View>

        <Text style={[s.salut, { color: wa.encre }]}>Bonjour {membreVu?.prenom ?? (config.prenom || 'Hermine')},</Text>
        <Text style={[s.resume, { color: wa.gris }]}>
          Aujourd’hui, <Gras>{pl(arrivees.length, 'arrivée')}</Gras> et <Gras>{pl(departs.length, 'départ')}</Gras>.
        </Text>

        {(peut('arrivees') || peut('reservations')) && <View style={s.bloc}>
          <View style={s.ligneJauge}>
            <Text style={[s.etiquette, { color: wa.gris }]}>Ce soir</Text>
            <Text style={[s.etiquette, num, { color: wa.encre }]}>{occ}/{UNITES} occupées</Text>
          </View>
          <View style={[s.jauge, { backgroundColor: wa.champ }]}>
            <View style={[s.jaugePlein, { width: `${(occ / UNITES) * 100}%`, backgroundColor: wa.vert }]} />
          </View>
        </View>}

        {peut('arrivees') && <View style={s.bloc}>
          <Text style={[s.titreSection, { color: wa.gris }]}>Votre journée</Text>
          {lignes.length === 0 && <Text style={[s.petit, { color: wa.gris }]}>Ni arrivée ni départ aujourd’hui.</Text>}
          {(tout ? lignes : lignes.slice(0, APERCU)).map((l) => (
            <Pressable key={l.s.id + l.quoi} onPress={() => router.push({ pathname: '/reservation/[id]', params: { id: l.s.id } })}
                       style={({ pressed }) => [s.creneau, pressed && { opacity: 0.6 }]}>
              <Text style={[s.heure, num, { color: wa.gris }]}>{l.heure}</Text>
              <View style={[s.trait, { backgroundColor: l.quoi === 'Arrivée' ? wa.vert : wa.chipBord }]} />
              <View style={s.flex}>
                <Text style={[s.creneauTitre, { color: wa.encre }]}>{l.quoi} · {l.s.nom}</Text>
                <Text style={[s.petit, { color: wa.gris }]}>
                  {l.s.chambre} · {l.s.adultes + l.s.enfants} pers.
                  {l.quoi === 'Arrivée' && peut('paiements') && l.s.montant > l.s.paye ? ` · reste ${pesos(l.s.montant - l.s.paye)}` : ''}
                </Text>
              </View>
              <Icon name="chevR" size={16} color={wa.gris} />
            </Pressable>
          ))}
          {lignes.length > APERCU && (
            <Pressable onPress={() => setTout(!tout)} accessibilityRole="button" hitSlop={6}
                       style={({ pressed }) => [s.voirPlus, pressed && { opacity: 0.6 }]}>
              <Text style={[s.voirPlusTexte, num, { color: wa.vert }]}>
                {tout ? 'Voir moins' : `Voir plus (${lignes.length - APERCU})`}
              </Text>
              <Icon name="chevD" size={16} color={wa.vert} />
            </Pressable>
          )}
        </View>}

        {peut('paiements') && semaine.length > 0 && (
          <Repere cle="aEncaisser">
            <View style={s.bloc}>
              <Text style={[s.titreSection, { color: wa.gris }]}>À encaisser cette semaine</Text>
              {semaine.map((p) => (
                <Pressable key={p.id} onPress={() => router.push({ pathname: '/reservation/[id]', params: { id: p.id } })} style={s.paiement}>
                  <View style={s.flex}>
                    <Text style={[s.creneauTitre, { color: wa.encre }]}>{p.nom}</Text>
                    <Text style={[s.petit, { color: wa.gris }]}>{p.echeance}</Text>
                  </View>
                  <Text style={[s.montant, num, { color: wa.encre }]}>{pesos(p.montant)}</Text>
                </Pressable>
              ))}
            </View>
          </Repere>
        )}

        {peut('paiements') && <LienStats />}
      </ScrollView>
    </SafeAreaView>
  )
}

function Gras({ children }: { children: ReactNode }) {
  const wa = useWa()
  return <Text style={[s.gras, num, { color: wa.encre }]}>{children}</Text>
}

function LienStats() {
  const wa = useWa()
  const m = statsMois[statsMois.length - 1]
  const total = Object.values(m.canaux).reduce((n, c) => ({ r: n.r + c.reservations, e: n.e + c.montant }), { r: 0, e: 0 })
  return (
    <Pressable onPress={() => router.push('/stats')} accessibilityRole="button"
               style={({ pressed }) => [s.stats, { backgroundColor: wa.champ, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name="trendUp" size={20} color={wa.vert} />
      <Text numberOfLines={1} style={[s.statsTexte, { color: wa.encre }]}>
        {m.mois.split(' ')[0]} : <Text style={[num, s.gras]}>{total.r}</Text> réservations · <Text style={[num, s.gras]}>{pesos(total.e)}</Text>
      </Text>
      <Icon name="chevR" size={16} color={wa.gris} />
    </Pressable>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  gras: { fontWeight: '700' },
  contenu: { padding: 16, paddingTop: 12, gap: 18, paddingBottom: 32 },
  question: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 999, paddingLeft: 16, paddingRight: 5, height: 50 },
  questionChamp: { flex: 1, fontSize: 16, height: 48 },
  questionEnvoyer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  salut: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  resume: { fontSize: 17, lineHeight: 25, marginTop: -8 },
  bloc: { gap: 8 },
  ligneJauge: { flexDirection: 'row', justifyContent: 'space-between' },
  etiquette: { fontSize: 14, fontWeight: '600' },
  jauge: { height: 10, borderRadius: 5, overflow: 'hidden' },
  jaugePlein: { height: 10, borderRadius: 5 },
  petit: { fontSize: 13, lineHeight: 18 },
  titreSection: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  creneau: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54 },
  heure: { width: 40, fontSize: 14, fontWeight: '600' },
  trait: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  creneauTitre: { fontSize: 16, fontWeight: '600' },
  voirPlus: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, paddingLeft: 52 },
  voirPlusTexte: { fontSize: 15, fontWeight: '600' },
  paiement: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  montant: { fontSize: 16, fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, minHeight: 50 },
  statsTexte: { flex: 1, fontSize: 15 },
})
