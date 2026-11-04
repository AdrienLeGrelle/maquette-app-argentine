import type { IconName } from './icons'

/**
 * L'équipe : le gérant en haut, qui a tout, et les employés qu'il invite par
 * leur numéro WhatsApp. Chacun ne voit que ce qu'on lui ouvre.
 */
export type Acces = 'discussions' | 'reservations' | 'arrivees' | 'paiements' | 'chambres' | 'agent'

export type Membre = {
  id: string
  prenom: string
  /** Dix chiffres, comme le numéro de l'hôtel. */
  tel: string
  acces: Acces[]
  /** « invite » tant qu'il n'a pas tapé le code reçu sur WhatsApp. */
  statut: 'actif' | 'invite'
  photo?: string
}

export const ACCES: { cle: Acces; icon: IconName; titre: string; sous: string }[] = [
  { cle: 'discussions', icon: 'chat', titre: 'Répondre aux voyageurs', sous: 'Voir les discussions et y répondre.' },
  { cle: 'reservations', icon: 'calendar', titre: 'Gérer les réservations', sous: 'Créer, déplacer, annuler, sur le même calendrier que vous.' },
  { cle: 'arrivees', icon: 'arrivee', titre: 'Arrivées et départs', sous: 'Qui arrive, qui part aujourd’hui, et faire le check-in.' },
  { cle: 'paiements', icon: 'card', titre: 'Voir les paiements', sous: 'Montants, liens Mercado Pago, ce qui reste à encaisser.' },
  { cle: 'chambres', icon: 'bed', titre: 'Chambres et prix', sous: 'Changer un tarif, le stock, fermer une chambre.' },
  { cle: 'agent', icon: 'sparkles', titre: 'Régler l’assistant', sous: 'Ses réponses, son style, quand il vous passe la main.' },
]

/** Des rôles tout prêts, pour ne pas cocher six cases à chaque fois. */
export const MODELES: { nom: string; acces: Acces[] }[] = [
  { nom: 'Réception', acces: ['discussions', 'reservations', 'arrivees', 'paiements'] },
  { nom: 'Ménage', acces: ['arrivees'] },
  { nom: 'Bras droit', acces: ['discussions', 'reservations', 'arrivees', 'paiements', 'chambres', 'agent'] },
]

/** Le nom du rôle d'après ses accès, ou « Sur mesure ». */
export function nomRole(acces: Acces[]) {
  const m = MODELES.find((x) => x.acces.length === acces.length && x.acces.every((a) => acces.includes(a)))
  return m?.nom ?? 'Sur mesure'
}

const portrait = (cle: string) => `https://randomuser.me/api/portraits/${cle}.jpg`

export const equipeDemo: Membre[] = [
  { id: 'rosa', prenom: 'Rosa', tel: '3884112233', acces: MODELES[0].acces, statut: 'actif', photo: portrait('women/50') },
  { id: 'julio', prenom: 'Julio', tel: '3885223344', acces: MODELES[1].acces, statut: 'invite', photo: portrait('men/45') },
]
