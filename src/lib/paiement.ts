import { date } from './dates'
import type { Sejour } from './demo'

/** Ce que le lien demande, selon le réglage « Arrivées, départs, paiement ». */
export function montantLien(total: number, regle: string) {
  if (regle.includes('30')) return Math.round(total * 0.3)
  if (regle.includes('50')) return Math.round(total * 0.5)
  return total
}

/** « 13:10 » + 30 → « 13:40 ». */
export function heurePlus(heure: string, minutes: number) {
  const [h, m] = heure.split(':').map(Number)
  const t = (h * 60 + m + minutes) % (24 * 60)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MESES_CORTOS = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.']

/** « 25 nov. », dans la langue de l'hôtelier. */
export function jourMois(iso: string, langue: 'es' | 'fr') {
  const d = date(iso)
  return `${d.getUTCDate()} ${(langue === 'fr' ? MOIS_COURTS : MESES_CORTOS)[d.getUTCMonth()]}`
}

/** « 15 → 17 déc. » quand les deux dates tombent le même mois, sinon « 30 nov. → 2 déc. ». */
export function periode(debut: string, fin: string, langue: 'es' | 'fr') {
  const a = date(debut)
  return a.getUTCMonth() === date(fin).getUTCMonth() ? `${a.getUTCDate()} → ${jourMois(fin, langue)}` : `${jourMois(debut, langue)} → ${jourMois(fin, langue)}`
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const CHAMBRES_ES: Record<string, string> = { 'Double': 'habitación doble', 'Cabane 4': 'cabaña para 4', 'Dortoir': 'cama en dormitorio' }

/** Le message que Roomz envoie au voyageur quand son paiement arrive, dans sa langue. */
export function messageConfirmation(e: Sejour, arrivee: string) {
  const a = date(e.debut)
  const b = date(e.fin)
  const dates = a.getUTCMonth() === b.getUTCMonth()
    ? `del ${a.getUTCDate()} al ${b.getUTCDate()} de ${MESES[b.getUTCMonth()]}`
    : `del ${a.getUTCDate()} de ${MESES[a.getUTCMonth()]} al ${b.getUTCDate()} de ${MESES[b.getUTCMonth()]}`
  const prenom = e.nom.split(' ')[0]
  return `¡Recibimos tu pago, ${prenom}! Tu reserva está confirmada: ${CHAMBRES_ES[e.chambre] ?? e.chambre}, ${dates}. El check-in es desde las ${arrivee}. ¡Te esperamos!`
}
