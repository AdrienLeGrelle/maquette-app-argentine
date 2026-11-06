import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LogoCanal } from '@/components/Logos'
import { AUJOURDHUI, ecart, plusJours } from '@/lib/dates'
import { STOCK, devis, pesos, type Etape, type Message } from '@/lib/demo'
import { useEtat, useT } from '@/lib/etat'
import { Icon, type IconName } from '@/lib/icons'
import { jourMois, montantLien, periode } from '@/lib/paiement'
import { num, useCouleurs, useWa } from '@/lib/theme'

/**
 * Le paiement Mercado Pago, vu depuis la discussion : la carte du lien
 * envoyé, les étapes en pastilles, l'état de la réservation épinglé sous
 * l'en-tête. Toujours dans la langue de l'hôtelier.
 */

/** Le texte d'une étape, pour la pastille du fil et l'aperçu de la liste. */
export function useTexteEtape() {
  const t = useT()
  const { peut } = useEtat()
  return (e: Etape) => {
    switch (e.quoi) {
      case 'retenue': return t(`Habitación retenida hasta las ${e.jusqua}`, `Chambre retenue jusqu’à ${e.jusqua}`)
      case 'attente': return t('Esperando el pago', 'En attente du paiement')
      case 'paye': {
        const quoi = e.especes ? t('Pago en efectivo', 'Paiement en espèces') : t('Pago recibido', 'Paiement reçu')
        return peut('paiements') ? `${quoi} · ${pesos(e.montant)}` : quoi
      }
      case 'confirmee': return t('Reserva confirmada', 'Réservation confirmée')
      case 'expire': return t('Enlace vencido · habitación liberada', 'Lien expiré · chambre libérée')
    }
  }
}

/** Une étape du paiement, au milieu du fil comme les pastilles de WhatsApp : ambre en attente, vert une fois payé. */
export function PastilleEtape({ etape }: { etape: Etape }) {
  const wa = useWa()
  const c = useCouleurs()
  const texte = useTexteEtape()
  const ton: { icon: IconName; fond: string; encre: string } =
    etape.quoi === 'retenue' || etape.quoi === 'attente' ? { icon: 'clock', fond: c.warnWash, encre: c.warnInk }
      : etape.quoi === 'expire' ? { icon: 'x', fond: wa.pastille, encre: wa.bulleMeta }
        : { icon: etape.quoi === 'paye' ? 'card' : 'checkPlain', fond: c.okWash, encre: c.ok }
  return (
    <View style={[s.pastille, { backgroundColor: ton.fond }]}>
      <Icon name={ton.icon} size={14} color={ton.encre} trait={2} />
      <Text style={[s.pastilleTexte, { color: ton.encre }]}>{texte(etape)}</Text>
    </View>
  )
}

/** Le lien de paiement envoyé, en carte : ce que le voyageur règle, et le bouton qu'il touche. */
export function CarteLien({ m, suite }: { m: Message & { lien: NonNullable<Message['lien']> }; suite: boolean }) {
  const wa = useWa()
  const t = useT()
  const { langue, peut } = useEtat()
  const l = m.lien
  const nuits = ecart(l.debut, l.fin)
  const part = Math.round((l.montant / l.total) * 100)
  return (
    <View style={[s.carte, { backgroundColor: wa.bulleOut }, suite && s.suite]}>
      <View style={[s.apercu, { backgroundColor: wa.apercuLien }]}>
        <LogoCanal nom="mercadopago" size={34} />
        <View style={s.flex}>
          <Text style={[s.marque, { color: wa.encre }]}>Mercado Pago</Text>
          <Text style={[s.domaine, { color: wa.bulleMeta }]}>mpago.la</Text>
        </View>
      </View>
      <View style={s.corps}>
        <Text style={[s.titre, { color: wa.encre }]}>{t('Reserva', 'Réservation')} · {l.chambre}</Text>
        <Text style={[s.detail, { color: wa.bulleMeta }]}>
          {jourMois(l.debut, langue)} → {jourMois(l.fin, langue)} · {nuits} {nuits > 1 ? t('noches', 'nuits') : t('noche', 'nuit')}
        </Text>
        {peut('paiements') && (
          <View style={s.montant}>
            <Text style={[s.detail, { color: wa.encre }]}>{l.reste ? t('Saldo', 'Reste à payer') : part < 100 ? t(`Seña ${part} %`, `Acompte ${part} %`) : 'Total'}</Text>
            <Text style={[s.somme, num, { color: wa.encre }]}>{pesos(l.montant)}</Text>
          </View>
        )}
        <View style={s.meta}>
          <Text style={[s.heure, { color: wa.bulleMeta }]}>{m.heure}</Text>
          <Icon name="checks" size={16} color={m.lu ? wa.lu : wa.bulleMeta} />
        </View>
      </View>
      <View style={[s.bouton, { borderTopColor: wa.ligne }]}>
        <Icon name="link" size={16} color={wa.lienBouton} trait={2} />
        <Text style={[s.boutonTexte, { color: wa.lienBouton }]}>{t('Pagar con Mercado Pago', 'Payer avec Mercado Pago')}</Text>
      </View>
    </View>
  )
}

/** Épinglée sous l'en-tête, comme un message épinglé : la réservation de ce fil et où elle en est. */
export function BarreReservation({ convId }: { convId: string }) {
  const wa = useWa()
  const c = useCouleurs()
  const t = useT()
  const { sejours, langue, peut } = useEtat()
  const e = sejours.filter((x) => x.convId === convId && x.fin >= AUJOURDHUI).at(-1)
  if (!e) return null
  // Court, pour laisser la place aux dates : l'horloge ambre dit « retenue », le détail est dans le fil.
  const etat: { icon: IconName; texte: string; fond: string; encre: string } = e.statut === 'confirmee'
    ? { icon: 'checkPlain', texte: t('Confirmada', 'Confirmée'), fond: c.okWash, encre: c.ok }
    : e.lien?.etat === 'retenue' ? { icon: 'clock', texte: t(`hasta ${e.lien.jusqua}`, `jusqu’à ${e.lien.jusqua}`), fond: c.warnWash, encre: c.warnInk }
      : { icon: 'clock', texte: t('A pagar', 'À payer'), fond: c.warnWash, encre: c.warnInk }
  const ouvrir = peut('reservations') ? () => router.push({ pathname: '/reservation/[id]', params: { id: e.id } }) : undefined
  return (
    <Pressable onPress={ouvrir} disabled={!ouvrir} accessibilityRole="button" accessibilityLabel={t('Ver la reserva', 'Voir la réservation')}
               style={({ pressed }) => [s.barre, { backgroundColor: wa.barre, borderBottomColor: wa.ligne }, pressed && { opacity: 0.7 }]}>
      <Icon name="calendar" size={17} color={wa.gris} trait={1.8} />
      <Text numberOfLines={1} style={[s.barreTexte, { color: wa.encre }]}>
        {e.chambre} · {periode(e.debut, e.fin, langue)}
      </Text>
      <View style={[s.etat, { backgroundColor: etat.fond }]}>
        <Icon name={etat.icon} size={12} color={etat.encre} trait={2.2} />
        <Text style={[s.etatTexte, { color: etat.encre }]}>{etat.texte}</Text>
      </View>
      {ouvrir && <Icon name="chevR" size={16} color={wa.gris} />}
    </Pressable>
  )
}

/**
 * L'assistant a préparé le lien de paiement ; l'hôtelier l'envoie d'un geste.
 * Sur la dernière unité d'une catégorie, il le dit : l'IA ne confirme jamais seule.
 */
export function ProposerLien({ convId, onIgnorer }: { convId: string; onIgnorer: () => void }) {
  const wa = useWa()
  const c = useCouleurs()
  const t = useT()
  const { sejours, config, envoyerLien, langue, peut } = useEtat()
  const d = devis[convId]
  if (!d || sejours.some((x) => x.convId === convId && x.lien)) return null
  const montant = montantLien(d.montant, config.paiement)
  const nuits = Array.from({ length: ecart(d.debut, d.fin) }, (_, i) => plusJours(d.debut, i))
  const derniere = nuits.some((j) => sejours.filter((x) => x.chambre === d.chambre && x.debut <= j && j < x.fin).length >= STOCK[d.chambre] - 1)
  return (
    <View style={[s.proposition, { backgroundColor: wa.bulleIn }]}>
      <View style={s.propositionHaut}>
        <Icon name="sparkles" size={15} color={wa.vert} plein />
        <Text style={[s.propositionQui, { color: wa.gris }]}>{t('El asistente propone', 'L’assistant propose')}</Text>
      </View>
      <Text style={[s.titre, { color: wa.encre }]}>{t('Enviar el enlace de pago', 'Envoyer le lien de paiement')}</Text>
      <Text style={[s.detail, { color: wa.gris }]}>
        {d.chambre} · {jourMois(d.debut, langue)} → {jourMois(d.fin, langue)}{peut('paiements') ? ` · ${pesos(montant)}` : ''}
      </Text>
      {derniere && (
        <View style={s.derniere}>
          <Icon name="alert" size={15} color={c.warnInk} trait={2} />
          <Text style={[s.derniereTexte, { color: c.warnInk }]}>
            {t(`Última ${d.chambre.toLowerCase()} en esas fechas: confirmás vos.`, `Dernière ${d.chambre.toLowerCase()} sur ces dates : c’est vous qui validez.`)}
          </Text>
        </View>
      )}
      <View style={s.propositionBoutons}>
        <Pressable onPress={onIgnorer} accessibilityRole="button" hitSlop={8} style={s.ignorer}>
          <Text style={[s.ignorerTexte, { color: wa.gris }]}>{t('Ahora no', 'Plus tard')}</Text>
        </Pressable>
        <Pressable onPress={() => envoyerLien(convId)} accessibilityRole="button"
                   style={({ pressed }) => [s.envoyer, { backgroundColor: wa.vert, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[s.envoyerTexte, { color: wa.surVert }]}>{t('Enviar', 'Envoyer')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  pastille: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginVertical: 4 },
  pastilleTexte: { fontSize: 12.5, fontWeight: '600' },
  carte: { alignSelf: 'flex-end', width: 268, borderRadius: 12, borderTopRightRadius: 4, padding: 4, boxShadow: '0 1px 0.5px rgba(11,20,26,.13)' },
  suite: { borderTopRightRadius: 12, marginTop: -3 },
  apercu: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, padding: 8 },
  marque: { fontSize: 14, fontWeight: '600' },
  domaine: { fontSize: 12, marginTop: 1 },
  corps: { paddingHorizontal: 6, paddingTop: 8, gap: 2 },
  titre: { fontSize: 15.5, fontWeight: '600' },
  detail: { fontSize: 14 },
  montant: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  somme: { fontSize: 17, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 2 },
  heure: { fontSize: 11 },
  bouton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 4, paddingVertical: 10 },
  boutonTexte: { fontSize: 15, fontWeight: '600' },
  barre: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth },
  barreTexte: { flex: 1, fontSize: 13.5, fontWeight: '500' },
  etat: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  etatTexte: { fontSize: 12, fontWeight: '600' },
  proposition: { marginHorizontal: 10, marginBottom: 8, borderRadius: 14, padding: 12, gap: 3, boxShadow: '0 1px 3px rgba(11,20,26,.12)' },
  propositionHaut: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  propositionQui: { fontSize: 13 },
  derniere: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  derniereTexte: { flex: 1, fontSize: 13, fontWeight: '500' },
  propositionBoutons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 10 },
  ignorer: { paddingVertical: 6 },
  ignorerTexte: { fontSize: 15, fontWeight: '500' },
  envoyer: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  envoyerTexte: { fontSize: 15, fontWeight: '600' },
})
