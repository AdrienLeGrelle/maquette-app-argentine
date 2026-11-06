import { HOTEL, avis } from './hotel'
import { filsPerso } from './perso'

/**
 * Données de démonstration : un petit hôtel de Tilcara, des voyageurs
 * argentins. En attendant le back, c'est la seule source des écrans.
 */

/** La colonne d'une conversation, déduite de son état (CLAUDE.md). */
export type Colonne = 'action' | 'unpaid' | 'paid' | 'other'

/** `hoy` affiche l'heure ; `ayer` et `semaine` se traduisent ; sinon la date telle quelle. */
export type Quand = { jour: 'hoy' | 'ayer'; heure: string } | { jour: 'semaine'; es: string; fr: string } | { jour: 'date'; date: string }

export type Message = {
  de: 'huesped' | 'hotel'
  heure: string
  texte?: string
  /** Durée d'un message vocal, « 0:12 ». */
  vocal?: string
  /** Pour un message de l'hôtel : lu par le voyageur (coches bleues). */
  lu?: boolean
  /** Premier message d'une journée : le libellé de la pastille de date au-dessus. */
  jour?: string
  /** Une carte de paiement Mercado Pago, telle qu'envoyée. */
  lien?: CarteLien
  /** Une étape du paiement, en pastille au milieu du fil plutôt qu'en bulle. */
  etape?: Etape
}

/**
 * Les étapes d'un paiement, dans le fil. La réservation n'est confirmée qu'au
 * retour du paiement, jamais à l'envoi du lien : retenue, puis en attente.
 */
export type Etape =
  | { quoi: 'retenue'; jusqua: string }
  | { quoi: 'attente' }
  | { quoi: 'paye'; montant: number }
  | { quoi: 'confirmee' }
  | { quoi: 'expire' }

/** Ce que montre la carte : le séjour qu'elle règle, et ce qu'elle demande sur le total. */
export type CarteLien = { sejour: string; chambre: string; debut: string; fin: string; montant: number; total: number }

/** Le lien de paiement d'un séjour, et où il en est. */
export type LienPaiement = {
  etat: 'retenue' | 'attente' | 'payee'
  /** Heure d'envoi. */
  heure: string
  /** Fin de la retenue de la chambre, trente minutes après l'envoi. */
  jusqua?: string
  /** Ce que le lien demande : le total ou l'acompte. */
  montant: number
}

/** Portraits de démonstration (randomuser.me), pour une liste qui ressemble à un vrai téléphone. */
const portrait = (cle: string) => `https://randomuser.me/api/portraits/${cle}.jpg`

export type Conversation = {
  id: string
  nom: string
  tel: string
  colonne: Colonne
  /** L'assistant mène l'échange : devis envoyé, paiement attendu, réponse en cours. */
  enCours?: boolean
  /** L'assistant est en train d'écrire, à l'instant. */
  ecrit?: boolean
  nonLus: number
  epingle?: boolean
  /** Photo de profil WhatsApp ; absente, on montre la silhouette grise, comme chez WhatsApp. */
  photo?: string
  /** Contact enregistré dans le téléphone (banque, fournisseur, équipe…). */
  enregistre?: boolean
  /** Choix manuel : true = « Perso », false = confié à l'assistant ; absent = la règle décide. */
  pourMoi?: boolean
  /** L'hôtelier a repris la main : l'assistant ne répond plus sur ce fil. */
  pause?: boolean
  /** Par où la personne écrit ; absent, c'est WhatsApp. `tel` porte alors son identifiant (@compte, e-mail). */
  canal?: 'instagram' | 'messenger' | 'booking' | 'mail'
  quand: Quand
  messages: Message[]
}

const brutes: Conversation[] = [
  {
    id: 'torres', photo: portrait('women/44'), nom: 'Familia Torres', tel: '+54 9 387 512-4410', colonne: 'action', nonLus: 3, epingle: true,
    quand: { jour: 'hoy', heure: '13:24' },
    messages: [
      { de: 'huesped', heure: '13:20', texte: '¡Hola! Buenas tardes' },
      { de: 'huesped', heure: '13:22', texte: 'Queríamos ir del 14 al 16 de noviembre' },
      { de: 'huesped', heure: '13:24', texte: 'Somos 6, 4 adultos y 2 nenes. ¿Tienen algo para estar todos juntos?' },
    ],
  },
  {
    id: 'banco', photo: portrait('men/52'), nom: 'Carlos · Banco Macro', tel: '+54 9 388 422-9100', colonne: 'other', nonLus: 1, enregistre: true,
    quand: { jour: 'hoy', heure: '12:10' },
    messages: [{ de: 'huesped', heure: '12:10', texte: 'Buen día Hermine, te paso el resumen de la cuenta. ¿Podemos hablar a la tarde?' }],
  },
  {
    id: 'verduras', photo: portrait('men/78'), nom: 'Don José verduras', tel: '+54 9 388 455-0193', colonne: 'other', nonLus: 0, enregistre: true,
    quand: { jour: 'ayer', heure: '18:02' },
    messages: [{ de: 'huesped', heure: '18:02', texte: 'Mañana te llevo los tomates y la lechuga 👍' }],
  },
  {
    id: 'martin', photo: portrait('men/32'), nom: 'Martín Gómez', tel: '+54 9 11 4823-1190', colonne: 'action', nonLus: 2,
    quand: { jour: 'hoy', heure: '13:21' },
    messages: [
      { de: 'huesped', heure: '13:15', texte: '¡Hola! ¿Tienen lugar del 25 al 28 de noviembre? Somos 2' },
      { de: 'hotel', heure: '13:16', lu: true, texte: '¡Hola Martín! Sí, para esas fechas nos queda una habitación doble: $68.000 por noche con desayuno. Son 3 noches, $204.000 en total. ¿Te la reservo?' },
      { de: 'huesped', heure: '13:20', texte: '¿La perrita puede venir? Es chiquita 🐶' },
      { de: 'huesped', heure: '13:21', texte: '¿Y aceptan efectivo?' },
    ],
  },
  {
    id: 'nahuel', photo: portrait('men/11'), nom: 'Nahuel Quispe', tel: '+54 9 388 430-2271', colonne: 'other', enCours: true, ecrit: true, nonLus: 0,
    quand: { jour: 'hoy', heure: '13:25' },
    messages: [
      { de: 'huesped', heure: '13:25', texte: '¡Buenas! ¿A qué hora es el check-in? Llegamos en el bus de las 10 desde Jujuy' },
    ],
  },
  {
    id: 'lucia', photo: portrait('women/68'), nom: 'Lucía Fernández', tel: '+54 9 381 566-0934', colonne: 'unpaid', enCours: true, nonLus: 0,
    quand: { jour: 'hoy', heure: '13:10' },
    messages: [
      { de: 'huesped', heure: '12:30', texte: '¡Buenas! Quería reservar la cabaña para 4 del 15 al 17 de diciembre' },
      { de: 'hotel', heure: '12:31', lu: true, texte: '¡Hola Lucía! La cabaña para 4 está libre del 15 al 17/12: 2 noches, $190.000 en total. ¿Te la reservo?' },
      { de: 'huesped', heure: '13:08', texte: 'Dale, la reservo' },
      { de: 'hotel', heure: '13:10', lu: true, texte: '¡Genial! Te la guardo 30 minutos. Para confirmarla, pagá acá con Mercado Pago 👇' },
      { de: 'hotel', heure: '13:10', lu: true, lien: { sejour: 's13', chambre: 'Cabane 4', debut: '2026-12-15', fin: '2026-12-17', montant: 190000, total: 190000 } },
      { de: 'hotel', heure: '13:10', etape: { quoi: 'retenue', jusqua: '13:40' } },
    ],
  },
  {
    id: 'silvia', photo: portrait('women/26'), nom: 'Silvia Ruiz', tel: '+54 9 351 702-4485', colonne: 'paid', nonLus: 0,
    quand: { jour: 'hoy', heure: '11:05' },
    messages: [
      { de: 'huesped', heure: '10:58', texte: 'Listo, ya pagué 🙌' },
      { de: 'hotel', heure: '11:05', lu: true, texte: '¡Recibido, Silvia! Tu reserva está confirmada: habitación doble, del 2 al 4 de noviembre. El check-in es desde las 14 h. ¡Te esperamos!' },
    ],
  },
  {
    id: 'ramon', photo: portrait('men/61'), nom: 'Ramón Díaz', tel: '+54 9 388 619-0072', colonne: 'unpaid', enCours: true, nonLus: 0,
    quand: { jour: 'ayer', heure: '19:30' },
    messages: [
      { de: 'huesped', heure: '19:22', texte: 'Hola, ¿puedo dejar una seña y el resto lo pago al llegar?' },
      { de: 'hotel', heure: '19:30', lu: true, texte: '¡Claro, Ramón! Con una seña de $45.000 te guardamos la habitación. Te mando el link de pago 👇' },
      { de: 'hotel', heure: '19:30', lu: false, lien: { sejour: 's8', chambre: 'Double', debut: '2026-11-07', fin: '2026-11-09', montant: 45000, total: 136000 } },
      { de: 'hotel', heure: '20:00', etape: { quoi: 'attente' } },
    ],
  },
  {
    id: 'agustina', photo: portrait('women/12'), nom: 'Agustina Vera', tel: '+54 9 11 3391-7720', colonne: 'other', nonLus: 0,
    quand: { jour: 'ayer', heure: '10:12' },
    messages: [
      { de: 'hotel', heure: '09:50', lu: true, texte: '¡Gracias por elegirnos, Agustina! Que tengan buen viaje de vuelta.' },
      { de: 'huesped', heure: '10:12', texte: '¡Gracias por todo! La pasamos re bien, volvemos seguro 💛' },
    ],
  },
  {
    id: 'hilda', photo: portrait('women/79'), nom: 'Hilda Mamani', tel: '+54 9 388 245-8813', colonne: 'paid', nonLus: 0,
    quand: { jour: 'semaine', es: 'miércoles', fr: 'mercredi' },
    messages: [
      { de: 'huesped', heure: '16:02', texte: 'Perfecto, ahí te mandé el pago' },
      { de: 'hotel', heure: '16:10', lu: true, texte: 'Tu reserva quedó confirmada ✅ Del 8 al 10 de noviembre, cabaña para 4.' },
    ],
  },
  {
    id: 'diego', nom: 'Diego Paz', tel: '+54 9 264 488-3105', colonne: 'other', nonLus: 0,
    quand: { jour: 'date', date: '27/10/2026' },
    messages: [
      { de: 'huesped', heure: '18:40', texte: 'Hola, una consulta' },
      { de: 'huesped', heure: '18:41', vocal: '0:12' },
    ],
  },
  {
    id: 'mama', photo: portrait('women/90'), nom: 'Mamá', tel: '+54 9 388 401-2236', colonne: 'other', nonLus: 2, enregistre: true,
    quand: { jour: 'hoy', heure: '11:47' },
    messages: [{ de: 'huesped', heure: '11:47', texte: '¿Vienen el domingo a almorzar? Hago empanadas 🥟' }],
  },
  {
    id: 'pablo', photo: portrait('men/41'), nom: 'Pablo (hermano)', tel: '+54 9 11 6012-8873', colonne: 'other', nonLus: 0, enregistre: true,
    quand: { jour: 'hoy', heure: '09:15' },
    messages: [{ de: 'huesped', heure: '09:15', texte: 'Te devuelvo la camioneta el jueves, ¿dale?' }],
  },
  {
    id: 'ruben', nom: 'Rubén plomero', tel: '+54 9 388 470-3381', colonne: 'other', nonLus: 1, enregistre: true,
    quand: { jour: 'hoy', heure: '08:32' },
    messages: [{ de: 'huesped', heure: '08:32', texte: 'Paso a las 15 por el calefón de la cabaña' }],
  },
  {
    id: 'marcelo', photo: portrait('men/67'), nom: 'Marcelo · Gas del Norte', tel: '+54 9 388 422-1190', colonne: 'other', nonLus: 0, enregistre: true,
    quand: { jour: 'ayer', heure: '17:40' },
    messages: [{ de: 'huesped', heure: '17:40', texte: 'El viernes reponemos las garrafas' }],
  },
  {
    id: 'lavanderia', nom: 'Lavandería Norte', tel: '+54 9 388 455-7722', colonne: 'other', nonLus: 0, enregistre: true,
    quand: { jour: 'ayer', heure: '12:05' },
    messages: [{ de: 'huesped', heure: '12:05', texte: 'Ya están listas las sábanas, 42 juegos' }],
  },
  {
    id: 'ines', photo: portrait('women/57'), nom: 'Inés contadora', tel: '+54 9 388 430-9914', colonne: 'other', nonLus: 1, enregistre: true,
    quand: { jour: 'semaine', es: 'martes', fr: 'mardi' },
    messages: [{ de: 'huesped', heure: '10:00', texte: 'Necesito las facturas de octubre antes del 10' }],
  },
  {
    id: 'rocio', photo: portrait('women/33'), nom: 'Rocío (limpieza)', tel: '+54 9 388 618-2045', colonne: 'other', nonLus: 0, enregistre: true,
    quand: { jour: 'semaine', es: 'lunes', fr: 'lundi' },
    messages: [{ de: 'huesped', heure: '10:00', texte: 'Mañana llego 8:30, termino la cabaña 2 primero' }],
  },
  {
    id: 'fede', photo: portrait('men/23'), nom: 'Fede', tel: '+54 9 11 3302-6610', colonne: 'other', nonLus: 0, enregistre: true,
    quand: { jour: 'semaine', es: 'domingo', fr: 'dimanche' },
    messages: [{ de: 'huesped', heure: '10:00', texte: '¿Partido el sábado? Faltamos dos' }],
  },
]

/**
 * Les autres canaux : les gens du coin et les artisans écrivent souvent par
 * Messenger, d'autres par Instagram ou par mail. Visibles une fois le canal
 * branché dans Paramètres.
 */
brutes.push(
  {
    id: 'claudia', canal: 'messenger', photo: portrait('women/21'), nom: 'Claudia Ríos', tel: 'Messenger', colonne: 'action', nonLus: 1,
    quand: { jour: 'hoy', heure: '13:02' },
    messages: [{ de: 'huesped', heure: '13:02', texte: 'Hola! ¿Tienen lugar este finde para 2? Somos de Salta, llegaríamos el sábado temprano' }],
  },
  {
    id: 'marcos', canal: 'messenger', photo: portrait('men/15'), nom: 'Marcos Vilte', tel: 'Messenger', colonne: 'action', nonLus: 2,
    quand: { jour: 'hoy', heure: '11:58' },
    messages: [
      { de: 'huesped', heure: '11:57', texte: 'Buenas! Para el Carnaval de Tilcara, ¿todavía tienen algo?' },
      { de: 'huesped', heure: '11:58', texte: 'Seríamos 4 amigos, del 13 al 17 de febrero' },
    ],
  },
  {
    id: 'ramiro', canal: 'messenger', photo: portrait('men/71'), nom: 'Ramiro · Tejidos Andinos', tel: 'Messenger', colonne: 'other', nonLus: 1,
    quand: { jour: 'hoy', heure: '10:40' },
    messages: [{ de: 'huesped', heure: '10:40', texte: 'Buen día! ¿Te dejo los ponchos nuevos el jueves para la vitrina del hostal?' }],
  },
  {
    id: 'flor', canal: 'messenger', photo: portrait('women/8'), nom: 'Florencia Cruz', tel: 'Messenger', colonne: 'unpaid', enCours: true, nonLus: 0,
    quand: { jour: 'hoy', heure: '09:12' },
    messages: [
      { de: 'huesped', heure: '09:05', texte: 'Hola, ¿el dormitorio tiene lockers? Voy sola, del 6 al 8 de noviembre' },
      { de: 'hotel', heure: '09:07', lu: true, texte: '¡Hola Florencia! Sí, cada cama tiene su locker con candado. Son 2 noches, $36.000 en total. ¿Te la reservo?' },
      { de: 'huesped', heure: '09:10', texte: 'Dale!' },
      { de: 'hotel', heure: '09:12', lu: true, texte: 'Te mando el link de pago de Mercado Pago para confirmarla 👇' },
    ],
  },
  {
    id: 'elsa', canal: 'messenger', photo: portrait('women/72'), nom: 'Doña Elsa · Dulces regionales', tel: 'Messenger', colonne: 'other', nonLus: 0,
    quand: { jour: 'ayer', heure: '18:20' },
    messages: [
      { de: 'huesped', heure: '18:12', texte: 'Hermine, mañana te llevo los dulces de cayote y los alfajores para el desayuno' },
      { de: 'hotel', heure: '18:20', lu: true, texte: '¡Gracias Elsa! Dejalos en la cocina como siempre 🙏' },
    ],
  },
  {
    id: 'turismo', canal: 'messenger', photo: portrait('men/36'), nom: 'Gustavo · Turismo Quebrada', tel: 'Messenger', colonne: 'other', enCours: true, nonLus: 0,
    quand: { jour: 'semaine', es: 'martes', fr: 'mardi' },
    messages: [
      { de: 'huesped', heure: '15:40', texte: '¿Les puedo dejar folletos de la excursión a Hornocal en la recepción?' },
      { de: 'hotel', heure: '15:44', lu: true, texte: '¡Claro Gustavo! Pasá cuando quieras, hay un lugar al lado de la entrada.' },
      { de: 'huesped', heure: '15:46', texte: 'Genial, el jueves paso 👍' },
    ],
  },
  {
    id: 'valen', canal: 'instagram', photo: portrait('women/31'), nom: 'Valentina Ortiz', tel: '@valen.ortiz', colonne: 'action', nonLus: 1,
    quand: { jour: 'hoy', heure: '13:18' },
    messages: [{ de: 'huesped', heure: '13:18', texte: '¿Aceptan perros? Viajamos con Lola, es mediana 🐕' }],
  },
  {
    id: 'sofia', canal: 'instagram', photo: portrait('women/65'), nom: 'Sofía', tel: '@sofi.viaja', colonne: 'action', nonLus: 2,
    quand: { jour: 'hoy', heure: '12:55' },
    messages: [
      { de: 'huesped', heure: '12:54', texte: '¡Hola! Vi sus fotos de la cabaña 😍' },
      { de: 'huesped', heure: '12:55', texte: '¿Cuánto sale para 4 la primera semana de enero?' },
    ],
  },
  {
    id: 'nicocami', canal: 'instagram', photo: portrait('men/22'), nom: 'Nico y Cami', tel: '@nicoycami.viajan', colonne: 'action', nonLus: 3,
    quand: { jour: 'hoy', heure: '11:32' },
    messages: [
      { de: 'huesped', heure: '11:30', texte: 'Hola!! Estamos de luna de miel 💍' },
      { de: 'huesped', heure: '11:31', texte: '¿Tienen alguna habitación con vista a los cerros?' },
      { de: 'huesped', heure: '11:32', texte: 'Sería del 20 al 23 de noviembre' },
    ],
  },
  {
    id: 'mochileros', canal: 'instagram', nom: 'Mochileros Argentina', tel: '@mochileros.arg', colonne: 'other', enCours: true, nonLus: 0,
    quand: { jour: 'ayer', heure: '21:14' },
    messages: [
      { de: 'huesped', heure: '21:10', texte: '¿Hacen precio para grupos? Seríamos 6 en el dormitorio' },
      { de: 'hotel', heure: '21:14', lu: true, texte: '¡Hola! Sí, para 6 en el dormitorio la noche sale $16.000 por persona en lugar de $18.000. ¿Qué fechas tienen pensadas?' },
    ],
  },
  {
    id: 'lucasfoto', canal: 'instagram', photo: portrait('men/55'), nom: 'Lucas · Foto Norte', tel: '@lucas.fotonorte', colonne: 'other', nonLus: 0,
    quand: { jour: 'ayer', heure: '20:05' },
    messages: [
      { de: 'huesped', heure: '19:50', texte: 'Hola! Soy fotógrafo, ¿les interesa un canje de fotos del hostal por dos noches?' },
      { de: 'hotel', heure: '20:05', lu: true, texte: '¡Hola Lucas! Nos interesa, ¿nos pasás tu portfolio?' },
    ],
  },
  {
    id: 'meli', canal: 'instagram', photo: portrait('women/54'), nom: 'Meli Torres', tel: '@meli.trs', colonne: 'paid', nonLus: 0,
    quand: { jour: 'semaine', es: 'lunes', fr: 'lundi' },
    messages: [
      { de: 'huesped', heure: '17:02', texte: 'Ya pagué la seña ✨' },
      { de: 'hotel', heure: '17:05', lu: true, texte: '¡Recibido, Meli! Tu reserva quedó confirmada: habitación doble, del 14 al 16 de noviembre. ¡Te esperamos!' },
      { de: 'huesped', heure: '17:06', texte: '❤️' },
    ],
  },
  {
    id: 'andestours', canal: 'mail', nom: 'Andes Tours', tel: 'reservas@andestours.com.ar', colonne: 'action', nonLus: 1,
    quand: { jour: 'hoy', heure: '09:30' },
    messages: [{ de: 'huesped', heure: '09:30', texte: 'Estimada Hermine: le solicitamos cotización para un grupo de 8 pasajeros, 3 noches del 12 al 15 de marzo, con desayuno. Saludos cordiales.' }],
  },
  {
    id: 'thomas', canal: 'booking', nom: 'Thomas Müller', tel: 'Booking.com', colonne: 'other', enCours: true, nonLus: 0,
    quand: { jour: 'hoy', heure: '08:05' },
    messages: [
      { de: 'huesped', heure: '08:01', texte: 'Hello! We arrive by bus around 11 pm, is late check-in ok?' },
      { de: 'hotel', heure: '08:05', lu: true, texte: 'Hi Thomas! No problem, we leave the key at the reception box. The code will be sent the day before. See you soon!' },
    ],
  },
)

/**
 * Encore des fils, pour que chaque boîte ressemble à un vrai téléphone
 * d'hôtelier : voyageurs d'ici et d'ailleurs, groupes, fournisseurs, proches.
 */
brutes.push(
  // ── WhatsApp ──
  {
    id: 'gutierrez', photo: portrait('women/17'), nom: 'Familia Gutiérrez', tel: '+54 9 381 455-2091', colonne: 'action', nonLus: 4,
    quand: { jour: 'hoy', heure: '13:05' },
    messages: [
      { de: 'huesped', heure: '13:03', texte: '¡Hola!!' },
      { de: 'huesped', heure: '13:04', texte: 'Somos 5, 2 adultos y 3 chicos' },
      { de: 'huesped', heure: '13:05', texte: '¿Tienen algo para Semana Santa? Del 2 al 5 de abril' },
    ],
  },
  {
    id: 'valeria', photo: portrait('women/36'), nom: 'Valeria Sosa', tel: '+54 9 381 612-7740', colonne: 'action', nonLus: 2,
    quand: { jour: 'hoy', heure: '12:52' },
    messages: [
      { de: 'huesped', heure: '12:51', texte: 'Hola! ¿Tienen cochera?' },
      { de: 'huesped', heure: '12:52', texte: 'Vamos en auto desde Tucumán, 2 noches desde el viernes 6' },
    ],
  },
  {
    id: 'docente', photo: portrait('men/48'), nom: 'Prof. Daniel Ruiz', tel: '+54 9 387 501-3318', colonne: 'action', nonLus: 1,
    quand: { jour: 'hoy', heure: '12:40' },
    messages: [{ de: 'huesped', heure: '12:40', texte: 'Buenas tardes, soy docente de una escuela de Salta. Hacemos viaje de estudio: 18 alumnos y 2 docentes. ¿Hacen precio por grupo en el dormitorio?' }],
  },
  {
    id: 'camitomas', photo: portrait('women/47'), nom: 'Camila y Tomás', tel: '+54 9 11 6230-4417', colonne: 'unpaid', enCours: true, nonLus: 0,
    quand: { jour: 'hoy', heure: '11:50' },
    messages: [
      { de: 'huesped', heure: '11:41', texte: 'Nos quedamos con la doble del 13 al 15 🙌' },
      { de: 'hotel', heure: '11:42', lu: true, texte: '¡Genial! Son 2 noches, $136.000 con desayuno. Para confirmarla te pido una seña del 30 %: $40.800.' },
      { de: 'huesped', heure: '11:48', texte: 'Dale, ¿cómo pago?' },
      { de: 'hotel', heure: '11:50', lu: true, texte: 'Te mando el link de Mercado Pago en un ratito, apenas lo pagues queda confirmada 😊' },
    ],
  },
  {
    id: 'jorge', photo: portrait('men/58'), nom: 'Jorge Méndez', tel: '+54 9 351 418-9902', colonne: 'paid', nonLus: 0,
    quand: { jour: 'hoy', heure: '10:20' },
    messages: [
      { de: 'huesped', heure: '10:12', texte: 'Ahí te mandé el pago' },
      { de: 'hotel', heure: '10:20', lu: true, texte: '¡Recibido, Jorge! Reserva confirmada: cabaña para 4 del 7 al 9 de noviembre. ¡Los esperamos!' },
    ],
  },
  {
    id: 'quispe', photo: portrait('women/83'), nom: 'Rosa Quispe', tel: '+54 9 388 470-1182', colonne: 'other', enCours: true, nonLus: 0,
    quand: { jour: 'hoy', heure: '09:40' },
    messages: [
      { de: 'huesped', heure: '09:31', vocal: '0:34' },
      { de: 'huesped', heure: '09:32', texte: '¿A qué hora sirven el desayuno?' },
      { de: 'hotel', heure: '09:40', lu: true, texte: '¡Buen día Rosa! El desayuno es de 8 a 10:30, en el comedor de abajo ☕' },
    ],
  },
  {
    id: 'hugo', nom: 'Hugo electricista', tel: '+54 9 388 455-3307', colonne: 'other', nonLus: 1, enregistre: true,
    quand: { jour: 'hoy', heure: '08:15' },
    messages: [{ de: 'huesped', heure: '08:15', texte: 'Mañana paso a ver el tablero de la cabaña 2' }],
  },
  {
    id: 'martinalopez', photo: portrait('women/62'), nom: 'Martina López', tel: '+54 9 11 5873-2264', colonne: 'action', nonLus: 1,
    quand: { jour: 'ayer', heure: '23:45' },
    messages: [{ de: 'huesped', heure: '23:45', texte: '¡Perdón la hora! ¿Se puede hacer check-in a las 7 de la mañana? Llegamos en el bus nocturno' }],
  },
  {
    id: 'lukas', photo: portrait('men/84'), nom: 'Lukas (Alemania)', tel: '+49 151 2384 7710', colonne: 'paid', nonLus: 0,
    quand: { jour: 'ayer', heure: '22:10' },
    messages: [
      { de: 'huesped', heure: '22:02', texte: 'Hi! Do you have a bed tonight? I am at the bus terminal' },
      { de: 'hotel', heure: '22:05', lu: true, texte: 'Hi Lukas! Yes, one bed left in the dorm, $18.000 with breakfast. Walk 5 minutes up Belgrano street 🙂' },
      { de: 'huesped', heure: '22:10', texte: 'Perfect, on my way!' },
    ],
  },
  {
    id: 'raul', nom: 'Remis Tilcara · Raúl', tel: '+54 9 388 401-7765', colonne: 'other', nonLus: 0, enregistre: true,
    quand: { jour: 'ayer', heure: '18:30' },
    messages: [{ de: 'huesped', heure: '18:30', texte: 'El traslado de las 6 al aeropuerto está confirmado 🚗' }],
  },
  {
    id: 'panaderia', nom: 'Panadería San José', tel: '+54 9 388 495-1120', colonne: 'other', nonLus: 0, enregistre: true,
    quand: { jour: 'ayer', heure: '07:30' },
    messages: [{ de: 'huesped', heure: '07:30', texte: 'Mañana van 4 docenas de medialunas como siempre?' }],
  },
  {
    id: 'paula', photo: portrait('women/24'), nom: 'Paula Benítez', tel: '+54 9 341 622-0981', colonne: 'other', nonLus: 0,
    quand: { jour: 'semaine', es: 'miércoles', fr: 'mercredi' },
    messages: [
      { de: 'huesped', heure: '10:02', texte: '¡Gracias por todo! Ya dejamos la reseña en Google ⭐⭐⭐⭐⭐' },
      { de: 'hotel', heure: '10:15', lu: true, texte: '¡Gracias a ustedes, Paula! Un abrazo grande y vuelvan cuando quieran 💛' },
    ],
  },
  {
    id: 'marta', photo: portrait('women/88'), nom: 'Tía Marta', tel: '+54 9 388 402-6614', colonne: 'other', nonLus: 0, enregistre: true,
    quand: { jour: 'semaine', es: 'martes', fr: 'mardi' },
    messages: [{ de: 'huesped', heure: '20:10', texte: '¿Cómo andan? Les mando un beso grande a todos 💕' }],
  },
  {
    id: 'ignacio', photo: portrait('men/29'), nom: 'Ignacio Herrera', tel: '+54 9 11 4471-9036', colonne: 'other', nonLus: 0,
    quand: { jour: 'semaine', es: 'lunes', fr: 'lundi' },
    messages: [
      { de: 'huesped', heure: '09:20', texte: 'Hola, tengo que cancelar la reserva del 20, se me complicó el trabajo 😞' },
      { de: 'hotel', heure: '09:35', lu: true, texte: '¡Qué pena, Ignacio! Te devolvemos la seña como dice la política de cancelación. ¡Ojalá vengas pronto!' },
    ],
  },

  // ── Messenger ──
  {
    id: 'mamani', canal: 'messenger', photo: portrait('men/65'), nom: 'Carlos Mamani', tel: 'Messenger', colonne: 'action', nonLus: 1,
    quand: { jour: 'hoy', heure: '12:22' },
    messages: [{ de: 'huesped', heure: '12:22', texte: 'Buenas! ¿Hacen descuento para jubilados? Vamos con mi señora en diciembre' }],
  },
  {
    id: 'luciab', canal: 'messenger', photo: portrait('women/41'), nom: 'Lucía Barrios', tel: 'Messenger', colonne: 'unpaid', enCours: true, nonLus: 0,
    quand: { jour: 'hoy', heure: '10:05' },
    messages: [
      { de: 'huesped', heure: '09:58', texte: 'Quiero reservar la doble del 13 al 15 de diciembre' },
      { de: 'hotel', heure: '10:05', lu: true, texte: '¡Perfecto, Lucía! Son $136.000 las 2 noches. Para confirmarla te pido una seña del 30 %: $40.800 por Mercado Pago.' },
    ],
  },
  {
    id: 'trekking', canal: 'messenger', photo: portrait('men/90'), nom: 'Club de Trekking Jujuy', tel: 'Messenger', colonne: 'action', nonLus: 2,
    quand: { jour: 'hoy', heure: '09:55' },
    messages: [
      { de: 'huesped', heure: '09:54', texte: 'Hola! Somos un grupo de 10 que vamos a subir al Hornocal' },
      { de: 'huesped', heure: '09:55', texte: '¿Tienen lugar para la noche del 14 de noviembre?' },
    ],
  },
  {
    id: 'feria', canal: 'messenger', photo: portrait('women/58'), nom: 'Feria Artesanal Tilcara', tel: 'Messenger', colonne: 'other', nonLus: 0,
    quand: { jour: 'ayer', heure: '16:00' },
    messages: [
      { de: 'huesped', heure: '15:52', texte: 'Hola Hermine! El domingo armamos la feria en la plaza, ¿pueden avisar a sus huéspedes?' },
      { de: 'hotel', heure: '16:00', lu: true, texte: '¡Claro! Lo pongo en el pizarrón de la recepción 🙌' },
    ],
  },
  {
    id: 'ezequiel', canal: 'messenger', photo: portrait('men/18'), nom: 'Ezequiel Romero', tel: 'Messenger', colonne: 'paid', nonLus: 0,
    quand: { jour: 'semaine', es: 'miércoles', fr: 'mercredi' },
    messages: [
      { de: 'huesped', heure: '18:40', texte: 'Pagado! 👍' },
      { de: 'hotel', heure: '18:44', lu: true, texte: 'Gracias, Ezequiel. Quedó confirmada la cabaña del 21 al 23 de noviembre.' },
    ],
  },
  {
    id: 'aurelio', canal: 'messenger', photo: portrait('men/77'), nom: 'Don Aurelio · Cerámica', tel: 'Messenger', colonne: 'other', nonLus: 0,
    quand: { jour: 'semaine', es: 'martes', fr: 'mardi' },
    messages: [{ de: 'huesped', heure: '11:15', texte: 'Te dejé las tazas nuevas en la recepción, después arreglamos 🙏' }],
  },

  // ── Instagram ──
  {
    id: 'agus', canal: 'instagram', photo: portrait('women/14'), nom: 'Agus', tel: '@agus.viaja', colonne: 'action', nonLus: 2,
    quand: { jour: 'hoy', heure: '13:15' },
    messages: [
      { de: 'huesped', heure: '13:14', texte: 'Holaa! Me encantó el hostal 😍' },
      { de: 'huesped', heure: '13:15', texte: '¿Tienen lugar el finde largo de noviembre? Somos 3' },
    ],
  },
  {
    id: 'marina', canal: 'instagram', photo: portrait('women/76'), nom: 'Marina Ríos', tel: '@marinarios', colonne: 'unpaid', enCours: true, nonLus: 0,
    quand: { jour: 'hoy', heure: '11:10' },
    messages: [
      { de: 'huesped', heure: '11:02', texte: 'Dale, la reservo!' },
      { de: 'hotel', heure: '11:10', lu: true, texte: '¡Genial, Marina! Te paso por acá el link de Mercado Pago para la seña y queda confirmada.' },
    ],
  },
  {
    id: 'romi', canal: 'instagram', photo: portrait('women/5'), nom: 'Romina Paz', tel: '@romi.paz', colonne: 'paid', nonLus: 0,
    quand: { jour: 'ayer', heure: '12:00' },
    messages: [
      { de: 'huesped', heure: '11:55', texte: 'Listo, pagué la seña ✨' },
      { de: 'hotel', heure: '12:00', lu: true, texte: '¡Recibido, Romi! Te esperamos el 7 🙌' },
    ],
  },
  {
    id: 'bruno', canal: 'instagram', photo: portrait('men/9'), nom: 'Bruno · Viajes Low Cost', tel: '@brunolowcost', colonne: 'other', nonLus: 1,
    quand: { jour: 'ayer', heure: '19:20' },
    messages: [{ de: 'huesped', heure: '19:20', texte: 'Hola! Hago contenido de viajes (80k seguidores), ¿les interesa un canje por 2 noches?' }],
  },
  {
    id: 'pedrojuli', canal: 'instagram', photo: portrait('men/38'), nom: 'Pedro y Juli', tel: '@pedroyjuli', colonne: 'other', nonLus: 0,
    quand: { jour: 'semaine', es: 'lunes', fr: 'lundi' },
    messages: [
      { de: 'huesped', heure: '21:30', texte: '¡Gracias por todo! Volvemos seguro 💛' },
      { de: 'hotel', heure: '21:41', lu: true, texte: '❤️' },
    ],
  },
  {
    id: 'yoga', canal: 'instagram', photo: portrait('women/93'), nom: 'Yoga en la Quebrada', tel: '@yogaquebrada', colonne: 'other', nonLus: 0,
    quand: { jour: 'semaine', es: 'domingo', fr: 'dimanche' },
    messages: [{ de: 'huesped', heure: '17:05', texte: 'Hola! Organizamos un retiro de yoga en marzo, ¿podríamos hablar de alojamiento para 12 personas?' }],
  },

  // ── Mail ──
  {
    id: 'claire', canal: 'mail', photo: portrait('women/49'), nom: 'Claire Dubois', tel: 'claire.dubois@gmail.com', colonne: 'action', nonLus: 1,
    quand: { jour: 'hoy', heure: '08:50' },
    messages: [{ de: 'huesped', heure: '08:50', texte: 'Bonjour, nous sommes deux Français et voudrions réserver une chambre double du 2 au 5 décembre. Acceptez-vous les cartes bancaires ? Merci !' }],
  },
  {
    id: 'colegio', canal: 'mail', nom: 'Colegio San Martín', tel: 'viajes@colegiosanmartin.edu.ar', colonne: 'action', nonLus: 1,
    quand: { jour: 'hoy', heure: '11:20' },
    messages: [{ de: 'huesped', heure: '11:20', texte: 'Estimados: solicitamos disponibilidad y tarifa para 22 alumnos y 3 docentes, del 10 al 13 de abril, con desayuno y cena. Quedamos atentos.' }],
  },
  {
    id: 'minera', canal: 'mail', nom: 'Minera Aguilar · RR.HH.', tel: 'rrhh@mineraaguilar.com.ar', colonne: 'action', nonLus: 1,
    quand: { jour: 'ayer', heure: '15:40' },
    messages: [{ de: 'huesped', heure: '15:40', texte: 'Buenas tardes: necesitamos alojamiento para 4 técnicos, del 16 al 20 de noviembre, en habitaciones dobles. ¿Pueden emitir factura A?' }],
  },
  {
    id: 'despegar', canal: 'mail', nom: 'Despegar', tel: 'notificaciones@despegar.com', colonne: 'other', nonLus: 0,
    quand: { jour: 'ayer', heure: '09:00' },
    messages: [{ de: 'huesped', heure: '09:00', texte: 'Nueva reseña de un huésped: «Excelente atención y una vista increíble». Puntaje 9,4' }],
  },
  {
    id: 'turismojujuy', canal: 'mail', nom: 'Turismo Jujuy', tel: 'info@turismo.jujuy.gob.ar', colonne: 'other', nonLus: 0,
    quand: { jour: 'semaine', es: 'martes', fr: 'mardi' },
    messages: [{ de: 'huesped', heure: '10:30', texte: 'Le recordamos completar el relevamiento de plazas hoteleras antes del 15 de noviembre.' }],
  },

  // ── Booking ──
  {
    id: 'ana', canal: 'booking', photo: portrait('women/19'), nom: 'Ana Souza', tel: 'Booking.com', colonne: 'action', nonLus: 1,
    quand: { jour: 'hoy', heure: '12:58' },
    messages: [{ de: 'huesped', heure: '12:58', texte: 'Olá! Chegamos de Salvador amanhã de manhã, é possível fazer check-in às 11h?' }],
  },
  {
    id: 'yuki', canal: 'booking', nom: 'Yuki Tanaka', tel: 'Booking.com', colonne: 'action', nonLus: 1,
    quand: { jour: 'hoy', heure: '10:44' },
    messages: [{ de: 'huesped', heure: '10:44', texte: 'Hello, can I leave my luggage after check-out? My bus leaves at 6 pm.' }],
  },
  {
    id: 'james', canal: 'booking', photo: portrait('men/26'), nom: 'James Carter', tel: 'Booking.com', colonne: 'other', enCours: true, nonLus: 0,
    quand: { jour: 'ayer', heure: '20:12' },
    messages: [
      { de: 'huesped', heure: '20:05', texte: 'Is breakfast included?' },
      { de: 'hotel', heure: '20:12', lu: true, texte: 'Hi James! Yes, breakfast is included, from 8 to 10:30. See you soon!' },
    ],
  },
  {
    id: 'elena', canal: 'booking', photo: portrait('women/37'), nom: 'Elena Rossi', tel: 'Booking.com', colonne: 'other', nonLus: 0,
    quand: { jour: 'ayer', heure: '11:30' },
    messages: [
      { de: 'huesped', heure: '11:22', texte: 'Grazie! Can we pay the city tax in cash?' },
      { de: 'hotel', heure: '11:30', lu: true, texte: 'Hi Elena, yes: cash or card, as you prefer.' },
    ],
  },
  {
    id: 'mateof', canal: 'booking', photo: portrait('men/51'), nom: 'Mateo Fernández', tel: 'Booking.com', colonne: 'other', nonLus: 0,
    quand: { jour: 'semaine', es: 'miércoles', fr: 'mercredi' },
    messages: [
      { de: 'huesped', heure: '14:10', texte: '¿Hay estacionamiento?' },
      { de: 'hotel', heure: '14:16', lu: true, texte: '¡Sí, Mateo! Tenemos cochera gratis para huéspedes.' },
    ],
  },
)

/**
 * Du plus récent au plus ancien, comme WhatsApp : aujourd'hui à l'heure près,
 * puis hier, les jours de la semaine (on est vendredi), enfin les dates.
 */
/** Les jours écoulés de la semaine, du plus ancien au plus récent. */
const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi']
export function cleQuand(q: Quand) {
  switch (q.jour) {
    case 'hoy': return `4 ${q.heure}`
    case 'ayer': return `3 ${q.heure}`
    case 'semaine': return `2 ${JOURS_SEMAINE.indexOf(q.fr)}`
    case 'date': {
      const [j, m, a] = q.date.split('/')
      return `1 ${a}-${m}-${j}`
    }
  }
}

/** Les contacts de la zone Perso reçoivent leurs longs fils (src/lib/perso.ts). */
export const conversations: Conversation[] = brutes.map((c) => (filsPerso[c.id] ? { ...c, messages: filsPerso[c.id] } : c))

/** « $ 190.000 » : pesos, séparateur de milliers à l'argentine. */
export function pesos(n: number) {
  return '$ ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Un séjour du calendrier : arrivée `debut`, départ `fin` (la nuit de `fin` n'est pas comptée). */
export type Sejour = {
  id: string
  nom: string
  chambre: string
  debut: string
  fin: string
  statut: 'confirmee' | 'attente' | 'bloque'
  /** Pour un blocage importé par iCal. */
  source?: 'Booking' | 'Airbnb'
  /** Par où la réservation est arrivée, et la discussion à rouvrir. */
  canal: 'whatsapp' | 'instagram' | 'booking' | 'airbnb'
  convId?: string
  tel?: string
  adultes: number
  enfants: number
  options: string[]
  montant: number
  paye: number
  /** Le lien Mercado Pago envoyé dans la discussion, s'il y en a un. */
  lien?: LienPaiement
}

const sejoursFixes: Sejour[] = [
  { id: 's1', nom: 'Agustina Vera', chambre: 'Double', debut: '2026-10-27', fin: '2026-10-29', statut: 'confirmee', canal: 'whatsapp', convId: 'agustina', tel: '+54 9 11 3391-7720', adultes: 2, enfants: 0, options: ['Petit-déjeuner'], montant: 136000, paye: 136000 },
  { id: 's2', nom: 'Agustín Ríos', chambre: 'Double', debut: '2026-10-30', fin: '2026-11-01', statut: 'confirmee', canal: 'instagram', adultes: 2, enfants: 0, options: ['Petit-déjeuner', 'Arrivée tardive (22 h)'], montant: 136000, paye: 136000 },
  { id: 's3', nom: 'Familia Paredes', chambre: 'Cabane 4', debut: '2026-10-30', fin: '2026-11-02', statut: 'attente', canal: 'whatsapp', tel: '+54 9 387 440-1278', adultes: 2, enfants: 2, options: ['Lit bébé'], montant: 285000, paye: 85500 },
  { id: 's4', nom: 'Booking', chambre: 'Double', debut: '2026-10-31', fin: '2026-11-02', statut: 'bloque', source: 'Booking', canal: 'booking', adultes: 2, enfants: 0, options: [], montant: 136000, paye: 136000 },
  { id: 's5', nom: 'Nahuel Quispe', chambre: 'Dortoir', debut: '2026-10-31', fin: '2026-11-01', statut: 'confirmee', canal: 'whatsapp', convId: 'nahuel', tel: '+54 9 388 430-2271', adultes: 1, enfants: 0, options: [], montant: 18000, paye: 18000 },
  { id: 's6', nom: 'Silvia Ruiz', chambre: 'Double', debut: '2026-11-02', fin: '2026-11-04', statut: 'confirmee', canal: 'whatsapp', convId: 'silvia', tel: '+54 9 351 702-4485', adultes: 2, enfants: 0, options: ['Petit-déjeuner'], montant: 136000, paye: 136000 },
  { id: 's7', nom: 'Airbnb', chambre: 'Dortoir', debut: '2026-11-06', fin: '2026-11-09', statut: 'bloque', source: 'Airbnb', canal: 'airbnb', adultes: 1, enfants: 0, options: [], montant: 54000, paye: 54000 },
  { id: 's8', nom: 'Ramón Díaz', chambre: 'Double', debut: '2026-11-07', fin: '2026-11-09', statut: 'attente', canal: 'whatsapp', convId: 'ramon', tel: '+54 9 388 619-0072', adultes: 2, enfants: 1, options: ['Animal (chien)'], montant: 136000, paye: 0, lien: { etat: 'attente', heure: '19:30', montant: 45000 } },
  { id: 's9', nom: 'Hilda Mamani', chambre: 'Cabane 4', debut: '2026-11-08', fin: '2026-11-10', statut: 'confirmee', canal: 'whatsapp', convId: 'hilda', tel: '+54 9 388 245-8813', adultes: 3, enfants: 1, options: ['Petit-déjeuner', 'Parking'], montant: 190000, paye: 190000 },
  { id: 's10', nom: 'Juan Pérez', chambre: 'Double', debut: '2026-11-12', fin: '2026-11-15', statut: 'confirmee', canal: 'instagram', adultes: 2, enfants: 0, options: [], montant: 204000, paye: 204000 },
  { id: 's11', nom: 'Carla Méndez', chambre: 'Dortoir', debut: '2026-11-20', fin: '2026-11-22', statut: 'confirmee', canal: 'whatsapp', tel: '+54 9 11 5520-3348', adultes: 1, enfants: 0, options: [], montant: 36000, paye: 36000 },
  { id: 's12', nom: 'Booking', chambre: 'Cabane 4', debut: '2026-11-27', fin: '2026-11-30', statut: 'bloque', source: 'Booking', canal: 'booking', adultes: 4, enfants: 0, options: [], montant: 285000, paye: 285000 },
  { id: 's13', nom: 'Lucía Fernández', chambre: 'Cabane 4', debut: '2026-12-15', fin: '2026-12-17', statut: 'attente', canal: 'whatsapp', convId: 'lucia', tel: '+54 9 381 566-0934', adultes: 4, enfants: 0, options: [], montant: 190000, paye: 0, lien: { etat: 'retenue', heure: '13:10', jusqua: '13:40', montant: 190000 } },
]

/**
 * Ce que l'assistant a préparé pour un fil, prêt à partir en lien de paiement
 * une fois validé par l'hôtelier. Martín prend la dernière double : l'IA ne
 * confirme jamais seule sur la dernière unité.
 */
export type Devis = { chambre: string; debut: string; fin: string; adultes: number; enfants: number; montant: number }
export const devis: Record<string, Devis> = {
  martin: { chambre: 'Double', debut: '2026-11-25', fin: '2026-11-28', adultes: 2, enfants: 0, montant: 204000 },
}

/** Ce que l'assistant d'aide sait montrer : des mots-clés, une réponse, et où aller. */
export type Aide = { mots: string[]; reponse: string; route: '/' | '/calendario' | '/menu' | '/ajustes'; repere: string; bouton: string }

export const aides: Aide[] = [
  { mots: ['reserv', 'nouvelle', 'ajouter un client', 'booker'], route: '/', repere: 'nouvelleReservation', bouton: 'Me montrer',
    reponse: 'Pour créer une réservation vous-même, touchez le + vert en haut à droite des Discussions. Vous pouvez aussi le faire depuis le Calendrier, avec le + en bas à droite.' },
  { mots: ['categor', 'liste', 'filtre', 'ranger', 'trier'], route: '/', repere: 'categorie', bouton: 'Me montrer',
    reponse: 'Touchez le + à droite des filtres (Action requise, Agent, Toutes, Perso). Pour les réordonner, faites glisser une puce à gauche ou à droite. Donnez un nom, cochez les discussions : c’est fait.' },
  { mots: ['dispo', 'libre', 'place', 'calendrier', 'planning', 'occup', 'agenda'], route: '/calendario', repere: 'moisCalendrier', bouton: 'Ouvrir le calendrier',
    reponse: 'Le Calendrier montre toutes les réservations, jour par jour. Touchez le nom du mois en haut pour voir le mois entier.' },
  { mots: ['prix', 'tarif', 'chambre', 'stock', 'photo'], route: '/ajustes', repere: 'chambres', bouton: 'Me montrer',
    reponse: 'Vos chambres, leurs photos et leurs prix se règlent dans Paramètres, à la ligne « Chambres et prix ».' },
  { mots: ['option', 'service', 'petit-dej', 'excursion', 'parking', 'extra'], route: '/ajustes', repere: 'options', bouton: 'Me montrer',
    reponse: 'Vos options (petit-déjeuner, parking, excursions…), leurs prix et leurs photos se règlent dans Paramètres, à la ligne « Options et services ».' },
  { mots: ['mercado', 'paiement en ligne', 'lien de paiement', 'lier'], route: '/ajustes', repere: 'mercadopago', bouton: 'Me montrer',
    reponse: 'Dans Paramètres, ligne « Mercado Pago », touchez « Lier mon compte ». Les liens de paiement partiront ensuite tout seuls.' },
  { mots: ['qui doit', 'impay', 'encaiss', 'argent', 'acompte', 'payer'], route: '/menu', repere: 'aEncaisser', bouton: 'Me montrer',
    reponse: 'Le tableau de bord, dans l’onglet Menu, liste qui doit encore payer, avec le montant et l’échéance.' },
  { mots: ['style', 'ton', 'ecri', 'comme moi', 'parle'], route: '/ajustes', repere: 'style', bouton: 'Me montrer',
    reponse: 'Dans Paramètres, ligne « Style d’écriture », choisissez les discussions dont l’assistant s’inspire pour écrire comme vous.' },
  { mots: ['instagram', 'insta', 'messenger', 'facebook', 'booking', 'mail', 'canal', 'canaux', 'airbnb'], route: '/ajustes', repere: 'canaux', bouton: 'Me montrer',
    reponse: 'Dans Paramètres, ligne « Autres canaux » : cochez Instagram, Messenger, Booking ou Mail. Tout arrivera dans Discussions.' },
  { mots: ['action', 'urgent', 'repondre', 'attend'], route: '/', repere: 'filtreAction', bouton: 'Me montrer',
    reponse: 'Les discussions qui vous attendent sont dans Discussions, sous le premier filtre : « Action requise ».' },
  { mots: ['whatsapp', 'numero', 'telephone', 'connect'], route: '/ajustes', repere: 'whatsapp', bouton: 'Me montrer',
    reponse: 'Dans Paramètres, ligne « WhatsApp » : vous y voyez le numéro branché et pouvez le changer.' },
]

export const suggestionsAide = ['Créer une réservation', 'Voir mes disponibilités', 'Changer mes prix', 'Lier Mercado Pago', 'Qui doit payer ?', 'Créer une catégorie']

/** Les statistiques par mois et par canal (écran Statistiques, depuis le Menu). */
/** Ce que l'analyse du site, de Booking et de Google « trouve », en démo. */
export const esquisse = {
  hotel: 'Hostal Los Andes',
  ville: 'Tilcara',
  type: 'Hostal',
  chambres: HOTEL.chambres,
  arrivee: '14 h',
  depart: '10 h',
  options: HOTEL.options,
  aime: HOTEL.aime,
  avis,
  sources: [
    { nom: 'Booking', trouve: `${HOTEL.chambres.length} types de chambre, ${HOTEL.chambres.reduce((n, c) => n + c.stock, 0)} unités, prix, photos` },
    { nom: 'Google', trouve: `${avis.nombre} avis, note ${avis.note}, adresse` },
    { nom: 'Instagram', trouve: 'Photos, ton des réponses' },
  ],
}

/* ── Remplissage cohérent du calendrier ──────────────────────────────────
 * Chaque unité (chambre ou lit) a sa propre ligne de temps : on y place
 * d'abord les séjours écrits à la main, puis des séjours générés, sans jamais
 * dépasser le stock. L'occupation d'une nuit n'est que le compte des séjours.
 */

/** Le stock de l'hôtel de démo, par type, repris de ses chambres. */
export const STOCK: Record<string, number> = Object.fromEntries(HOTEL.chambres.map((c) => [c.nom, c.stock]))
export const UNITES = Object.values(STOCK).reduce((a, b) => a + b, 0)
const CHAMBRE = Object.fromEntries(HOTEL.chambres.map((c) => [c.nom, c]))
/**
 * L'ordre de remplissage : les trois types d'origine d'abord, pour que les
 * séjours tirés au hasard restent ceux d'avant (Martín sur la dernière double…).
 */
const ORDRE_REMPLISSAGE = ['Double', 'Cabane 4', 'Dortoir']
const typesARemplir = [...ORDRE_REMPLISSAGE, ...Object.keys(STOCK).filter((t) => !ORDRE_REMPLISSAGE.includes(t))]

const PRENOMS = ['Sofía Ramos', 'Mateo Castro', 'Valentina Ortiz', 'Joaquín Romero', 'Camila Suárez', 'Tomás Herrera',
  'Martina Aguirre', 'Benjamín Molina', 'Lucas Benítez', 'Julieta Medina', 'Facundo Acosta', 'Florencia Rojas',
  'Santiago Vega', 'Paula Giménez', 'Ignacio Flores', 'Micaela Luna', 'Franco Cabrera', 'Rocío Sosa', 'Emilia Ruiz',
  'Gonzalo Peralta', 'Agustina Ríos', 'Nicolás Díaz', 'Carolina Paz', 'Bruno Ledesma', 'Abril Quiroga']

function plus(jour: string, n: number) {
  const [a, m, j] = jour.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, j + n)).toISOString().slice(0, 10)
}

/** Hasard reproductible : la démo est la même à chaque chargement. */
function hasard(graine: number) {
  let t = graine
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function genererSejours(): Sejour[] {
  const r = hasard(30102026)
  const AUJOURDHUI = '2026-10-30'
  // Les nuits prises, par unité.
  const unites: { type: string; nuits: Set<string> }[] = []
  for (const type of typesARemplir) for (let k = 0; k < STOCK[type]; k++) unites.push({ type, nuits: new Set() })
  const libre = (u: { nuits: Set<string> }, debut: string, nb: number) => {
    for (let k = 0; k < nb; k++) if (u.nuits.has(plus(debut, k))) return false
    return true
  }
  const prendre = (u: { nuits: Set<string> }, debut: string, nb: number) => { for (let k = 0; k < nb; k++) u.nuits.add(plus(debut, k)) }
  const nuitsDe = (s: Sejour) => {
    const [a, m, j] = s.debut.split('-').map(Number); const [a2, m2, j2] = s.fin.split('-').map(Number)
    return Math.round((Date.UTC(a2, m2 - 1, j2) - Date.UTC(a, m - 1, j)) / 86400000)
  }

  const tous: Sejour[] = []
  for (const s of sejoursFixes) {
    const u = unites.find((x) => x.type === s.chambre && libre(x, s.debut, nuitsDe(s)))
    if (!u) continue
    prendre(u, s.debut, nuitsDe(s))
    tous.push(s)
  }

  let n = 0
  for (const u of unites) {
    for (let jour = '2026-07-27'; jour < '2027-01-06';) {
      const jsem = new Date(jour + 'T00:00:00Z').getUTCDay()
      const weekend = jsem === 5 || jsem === 6
      const nb = weekend ? 2 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3)
      if (r() < (weekend ? 0.7 : 0.22) && libre(u, jour, nb)) {
        prendre(u, jour, nb)
        const qui = r()
        const canal: Sejour['canal'] = qui < 0.62 ? 'whatsapp' : qui < 0.8 ? 'instagram' : qui < 0.95 ? 'booking' : 'airbnb'
        const ical = canal === 'booking' || canal === 'airbnb'
        const futur = jour >= AUJOURDHUI
        const statut: Sejour['statut'] = ical ? 'bloque' : futur && r() < 0.2 ? 'attente' : 'confirmee'
        const ch = CHAMBRE[u.type]
        const montant = nb * Number(ch.prix)
        tous.push({
          id: `g${++n}`, nom: ical ? (canal === 'booking' ? 'Booking' : 'Airbnb') : PRENOMS[Math.floor(r() * PRENOMS.length)],
          chambre: u.type, debut: jour, fin: plus(jour, nb), statut, source: ical ? (canal === 'booking' ? 'Booking' : 'Airbnb') : undefined,
          canal, tel: canal === 'whatsapp' ? `+54 9 388 ${400 + Math.floor(r() * 500)}-${1000 + Math.floor(r() * 8999)}` : undefined,
          // Mêmes tirages qu'avant pour les types d'origine : une cabane de 4 tire, un lit ou une double non.
          adultes: ch.parLit || ch.capacite === 1 ? 1 : ch.capacite > 2 ? 2 + Math.floor(r() * (ch.capacite - 1)) : 2,
          enfants: ch.capacite > 2 && r() < 0.5 ? 1 : 0,
          options: r() < 0.5 ? ['Petit-déjeuner'] : [],
          montant, paye: statut === 'attente' ? Math.round(montant * 0.3 * Math.floor(r() * 2)) : montant,
        })
        jour = plus(jour, nb + (r() < 0.5 ? 0 : 1))
      } else {
        jour = plus(jour, 1)
      }
    }
  }
  return tous.sort((a, b) => a.debut.localeCompare(b.debut))
}

export const sejours: Sejour[] = genererSejours()

/** Unités occupées la nuit du `jour`, toujours ≤ stock. */
export function occupation(jour: string, liste = sejours) {
  return liste.filter((s) => s.debut <= jour && jour < s.fin).length
}

const JOURS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const JOURS_FR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
const AUJ = '2026-10-30'

/** Le tableau de bord (onglet Menu), calculé sur les mêmes séjours que le calendrier. */
export const tableau = {
  arrivees: sejours.filter((s) => s.debut === AUJ && s.statut !== 'bloque')
    .map((s) => ({ nom: s.nom, chambre: { es: s.chambre, fr: s.chambre }, nuits: Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 86400000), paye: s.paye >= s.montant })),
  departs: sejours.filter((s) => s.fin === AUJ).length,
  /** Unités libres ce soir, par type : stock − réservations − blocages. */
  libres: Object.entries(STOCK).map(([type, stock]) => ({
    type: { es: type, fr: type === 'Dortoir' ? 'Dortoir (lits)' : type },
    libres: stock - sejours.filter((s) => s.chambre === type && s.debut <= AUJ && AUJ < s.fin).length,
    stock,
  })),
  semaine: Array.from({ length: 7 }, (_, k) => {
    const j = plus(AUJ, k); const d = new Date(j + 'T00:00:00Z').getUTCDay()
    return { es: JOURS_ES[d], fr: JOURS_FR[d], occ: occupation(j) }
  }),
  totalUnites: UNITES,
}

/** Les statistiques par mois et par canal, comptées sur les séjours (par mois d'arrivée). */
export type CanalStat = 'whatsapp' | 'instagram' | 'booking' | 'airbnb'
const MOIS_STATS = [
  { cle: '2026-08', mois: 'Août 2026', reponse: '1 min 10', seul: 64 },
  { cle: '2026-09', mois: 'Septembre 2026', reponse: '52 s', seul: 73 },
  { cle: '2026-10', mois: 'Octobre 2026', reponse: '38 s', seul: 81 },
]
export const statsMois = MOIS_STATS.map((m) => {
  const du = sejours.filter((x) => x.debut.startsWith(m.cle))
  const canaux = Object.fromEntries((['whatsapp', 'instagram', 'booking', 'airbnb'] as CanalStat[]).map((c) => {
    const l = du.filter((x) => x.canal === c)
    return [c, { reservations: l.length, montant: l.reduce((n, x) => n + x.paye, 0) }]
  })) as Record<CanalStat, { reservations: number; montant: number }>
  const directs = du.filter((x) => x.canal === 'whatsapp' || x.canal === 'instagram').length
  return { mois: m.mois, reponse: m.reponse, seul: m.seul, demandes: Math.round(directs * 3.4), canaux }
})
