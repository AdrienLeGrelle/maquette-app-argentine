import { AUJOURDHUI, MOIS, date, ecart, plusJours } from './dates'
import { pesos, type Conversation, type Message, type Sejour } from './demo'
import { chambreEs, heurePlus, messageConfirmation } from './paiement'

/**
 * L'échange qui a mené à une réservation, pour celles dont la démo n'a pas
 * écrit le fil à la main : la demande, le prix, les petites questions
 * (petit-déjeuner, arrivée tardive, chien…), le lien Mercado Pago, puis la
 * confirmation au retour du paiement, jamais avant. Les messages sont dans la
 * langue du voyageur, les pastilles de date dans celle de l'hôtelier.
 */

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/** Chaque option de la réservation, telle que le voyageur l'a demandée, et la réponse. */
const QUESTIONS: Record<string, [string, string]> = {
  'Petit-déjeuner': ['¿El desayuno está incluido?', 'Sí, el desayuno casero está incluido ☕ Es de 8 a 10:30, en el comedor.'],
  'Dîner régional': ['¿Se puede cenar ahí?', 'Sí, cena regional: locro, empanadas, humita. Se reserva el día anterior.'],
  'Excursion à cheval': ['¿Organizan cabalgatas?', 'Sí, medio día hasta la Garganta del Diablo, con guía. Te la anoto.'],
  'Transfert depuis le terminal': ['¿Nos pueden buscar en la terminal?', 'Sí, te buscamos con el equipaje. Pasanos el horario del bus.'],
  'Départ tardif (14 h)': ['¿Podemos dejar la habitación más tarde el último día?', 'Sí, hasta las 14 h, según las llegadas del día. Te lo anoto.'],
  'Arrivée tardive (22 h)': ['Llegamos tarde, tipo 22 h. ¿Hay problema?', 'Ningún problema, te esperamos. Avisanos cuando estén cerca.'],
  'Lit bébé': ['¿Tienen cuna para el bebé?', 'Sí, te la dejamos armada en la cabaña.'],
  'Animal (chien)': ['¿Podemos ir con nuestro perro? Es re tranquilo 🐶', '¡Claro! Aceptamos mascotas, lo anoto.'],
  'Parking': ['¿Tienen cochera?', 'Sí, cubierta, frente a la entrada. Te guardo un lugar.'],
}

/** Même réservation, même échange, à chaque chargement. */
function graine(id: string) {
  let h = 7
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h)
}

/** « Lundi 26 octobre », « 1er novembre » ; « Hier », « Aujourd’hui » tout près. */
function pastille(jour: string) {
  if (jour === AUJOURDHUI) return 'Aujourd’hui'
  if (jour === plusJours(AUJOURDHUI, -1)) return 'Hier'
  const d = date(jour)
  return `${JOURS[d.getUTCDay()]} ${d.getUTCDate() === 1 ? '1er' : d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`
}

function personas(e: Sejour) {
  if (e.adultes === 1 && !e.enfants) return 'para una persona'
  const nenes = e.enfants ? ` y ${e.enfants} ${e.enfants > 1 ? 'nenes' : 'nene'}` : ''
  return `para ${e.adultes} adultos${nenes}`
}

const PRENOMS_F = new Set(['Sofía', 'Valentina', 'Camila', 'Martina', 'Julieta', 'Florencia', 'Paula', 'Micaela', 'Rocío',
  'Emilia', 'Agustina', 'Carolina', 'Abril', 'Carla', 'Lucía', 'Silvia', 'Hilda', 'Ana', 'Familia'])

/** Une photo de profil de démonstration (randomuser.me), la même à chaque chargement. */
function photo(nom: string, g: number) {
  return `https://randomuser.me/api/portraits/${PRENOMS_F.has(nom.split(' ')[0]) ? 'women' : 'men'}/${g % 100}.jpg`
}

/** « @agustin.rios » : l'identifiant Instagram tiré du nom. */
function compte(nom: string) {
  return '@' + nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.')
}

export function echangeDuSejour(e: Sejour, arrivee: string): Conversation {
  const g = graine(e.id)
  const prenom = e.nom.split(' ')[0]
  const nuits = ecart(e.debut, e.fin)
  const jj = (iso: string) => `${date(iso).getUTCDate()}/${date(iso).getUTCMonth() + 1}`
  // La demande arrive quelques jours avant l'arrivée, et jamais après aujourd'hui.
  const avant = plusJours(e.debut, -(3 + (g % 18)))
  const demande = avant < AUJOURDHUI ? avant : plusJours(AUJOURDHUI, -1)
  const depart = `${String(9 + (g % 12)).padStart(2, '0')}:${String((g * 7) % 60).padStart(2, '0')}`
  const h = (minutes: number) => heurePlus(depart, minutes)

  const fil: Message[] = []
  const dit = (de: Message['de'], heure: string, texte: string, jour?: string) =>
    fil.push({ de, heure, texte, lu: de === 'hotel' ? true : undefined, jour })

  dit('huesped', h(0), [
    `¡Hola! ¿Tienen lugar del ${jj(e.debut)} al ${jj(e.fin)}, ${personas(e)}?`,
    `Buenas, quería consultar disponibilidad del ${jj(e.debut)} al ${jj(e.fin)}, ${personas(e)}.`,
    `Hola, ¿cómo andan? Buscamos alojamiento del ${jj(e.debut)} al ${jj(e.fin)}, ${personas(e)}.`,
  ][g % 3], pastille(demande))
  dit('hotel', h(1), `¡Hola ${prenom}! Sí, tenemos una ${chambreEs(e.chambre)} libre ${nuits > 1 ? `esas ${nuits} noches` : 'esa noche'}. El total es ${pesos(e.montant)}.`)

  let m = 2
  for (const o of e.options) {
    const qr = QUESTIONS[o]
    if (!qr) continue
    dit('huesped', h(m + 2), qr[0])
    dit('hotel', h(m + 3), qr[1])
    m += 3
  }

  dit('huesped', h(m + 2), ['Dale, la reservo 🙌', 'Perfecto, ¿cómo pago?', 'Genial, reservamos.'][g % 3])
  const sena = e.paye > 0 && e.paye < e.montant
  const montant = sena ? e.paye : e.lien?.montant ?? e.montant
  fil.push({ de: 'hotel', heure: h(m + 3), lu: true, lien: { sejour: e.id, chambre: e.chambre, debut: e.debut, fin: e.fin, montant, total: e.montant } })

  const paye = h(m + 15)
  if (e.paye >= e.montant) {
    fil.push({ de: 'hotel', heure: paye, etape: { quoi: 'paye', montant: e.montant } })
    fil.push({ de: 'hotel', heure: paye, etape: { quoi: 'confirmee' } })
    dit('hotel', paye, messageConfirmation(e, arrivee))
  } else if (sena) {
    fil.push({ de: 'hotel', heure: paye, etape: { quoi: 'paye', montant: e.paye } })
    dit('hotel', paye, `Recibimos la seña de ${pesos(e.paye)} 🙌 El resto, ${pesos(e.montant - e.paye)}, lo abonás al llegar.`)
  } else {
    fil.push({ de: 'hotel', heure: h(m + 4), etape: { quoi: 'attente' } })
  }

  // Le jour de l'arrivée, puis le départ, pour un séjour déjà commencé.
  if (e.paye > 0 && e.debut <= AUJOURDHUI) {
    const tard = e.options.includes('Arrivée tardive (22 h)')
    dit('huesped', tard ? '20:40' : '12:15', tard ? 'Salimos de Jujuy, llegamos tipo 22 h como te dije' : '¡Hola! Estamos saliendo, llegamos a eso de las 15 h', pastille(e.debut))
    dit('hotel', tard ? '20:41' : '12:16', '¡Perfecto! Los esperamos. Buen viaje 🚗')
  }
  if (e.paye > 0 && e.fin < AUJOURDHUI) {
    dit('hotel', '11:30', `¡Gracias por elegirnos, ${prenom}! Que tengan buen viaje de vuelta.`, pastille(e.fin))
    dit('huesped', '12:02', '¡Gracias a ustedes! La pasamos re bien 💛')
  }

  return {
    id: `echange-${e.id}`, nom: e.nom, photo: photo(e.nom, g), tel: e.tel ?? compte(e.nom),
    canal: e.canal === 'instagram' ? 'instagram' : undefined,
    colonne: 'other', nonLus: 0, quand: { jour: 'date', date: jj(demande) }, messages: fil,
  }
}
