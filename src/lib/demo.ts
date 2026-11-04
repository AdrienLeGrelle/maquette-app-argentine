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
  /** Choix manuel : true = « Pour moi », false = confié à l'assistant ; absent = la règle décide. */
  pourMoi?: boolean
  /** L'hôtelier a repris la main : l'assistant ne répond plus sur ce fil. */
  pause?: boolean
  quand: Quand
  messages: Message[]
}

export const conversations: Conversation[] = [
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
      { de: 'huesped', heure: '13:15', texte: '¡Hola! ¿Tienen lugar del 21 al 24 de noviembre? Somos 2' },
      { de: 'hotel', heure: '13:16', lu: true, texte: '¡Hola Martín! Sí, para esas fechas tenemos una habitación doble libre: $68.000 por noche con desayuno. Son 3 noches, $204.000 en total. ¿Te la reservo?' },
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
    quand: { jour: 'hoy', heure: '12:48' },
    messages: [
      { de: 'huesped', heure: '12:30', texte: '¡Buenas! Quería reservar la cabaña para 4 del 15 al 17 de diciembre' },
      { de: 'hotel', heure: '12:31', lu: true, texte: '¡Hola Lucía! La cabaña para 4 está libre del 15 al 17/12: 2 noches, $190.000 en total. ¿Te la reservo?' },
      { de: 'huesped', heure: '12:45', texte: 'Dale, la reservo' },
      { de: 'hotel', heure: '12:48', lu: true, texte: '¡Genial! Te la dejo bloqueada hasta mañana a las 12:48. Para confirmarla, pagá acá con Mercado Pago: mpago.la/2xK9fQ' },
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
      { de: 'hotel', heure: '19:30', lu: false, texte: '¡Claro, Ramón! Con una seña de $45.000 te guardamos la habitación. Te mando el link de pago: mpago.la/9Hd2Lm' },
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
]

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
}

const sejoursFixes: Sejour[] = [
  { id: 's1', nom: 'Agustina Vera', chambre: 'Double', debut: '2026-10-27', fin: '2026-10-29', statut: 'confirmee', canal: 'whatsapp', convId: 'agustina', tel: '+54 9 11 3391-7720', adultes: 2, enfants: 0, options: ['Petit-déjeuner'], montant: 136000, paye: 136000 },
  { id: 's2', nom: 'Agustín Ríos', chambre: 'Double', debut: '2026-10-30', fin: '2026-11-01', statut: 'confirmee', canal: 'instagram', adultes: 2, enfants: 0, options: ['Petit-déjeuner', 'Arrivée tardive (22 h)'], montant: 136000, paye: 136000 },
  { id: 's3', nom: 'Familia Paredes', chambre: 'Cabane 4', debut: '2026-10-30', fin: '2026-11-02', statut: 'attente', canal: 'whatsapp', tel: '+54 9 387 440-1278', adultes: 2, enfants: 2, options: ['Lit bébé'], montant: 285000, paye: 85500 },
  { id: 's4', nom: 'Booking', chambre: 'Double', debut: '2026-10-31', fin: '2026-11-02', statut: 'bloque', source: 'Booking', canal: 'booking', adultes: 2, enfants: 0, options: [], montant: 136000, paye: 136000 },
  { id: 's5', nom: 'Nahuel Quispe', chambre: 'Dortoir', debut: '2026-10-31', fin: '2026-11-01', statut: 'confirmee', canal: 'whatsapp', convId: 'nahuel', tel: '+54 9 388 430-2271', adultes: 1, enfants: 0, options: [], montant: 18000, paye: 18000 },
  { id: 's6', nom: 'Silvia Ruiz', chambre: 'Double', debut: '2026-11-02', fin: '2026-11-04', statut: 'confirmee', canal: 'whatsapp', convId: 'silvia', tel: '+54 9 351 702-4485', adultes: 2, enfants: 0, options: ['Petit-déjeuner'], montant: 136000, paye: 136000 },
  { id: 's7', nom: 'Airbnb', chambre: 'Dortoir', debut: '2026-11-06', fin: '2026-11-09', statut: 'bloque', source: 'Airbnb', canal: 'airbnb', adultes: 1, enfants: 0, options: [], montant: 54000, paye: 54000 },
  { id: 's8', nom: 'Ramón Díaz', chambre: 'Double', debut: '2026-11-07', fin: '2026-11-09', statut: 'attente', canal: 'whatsapp', convId: 'ramon', tel: '+54 9 388 619-0072', adultes: 2, enfants: 1, options: ['Animal (chien)'], montant: 136000, paye: 0 },
  { id: 's9', nom: 'Hilda Mamani', chambre: 'Cabane 4', debut: '2026-11-08', fin: '2026-11-10', statut: 'confirmee', canal: 'whatsapp', convId: 'hilda', tel: '+54 9 388 245-8813', adultes: 3, enfants: 1, options: ['Petit-déjeuner', 'Parking'], montant: 190000, paye: 190000 },
  { id: 's10', nom: 'Juan Pérez', chambre: 'Double', debut: '2026-11-12', fin: '2026-11-15', statut: 'confirmee', canal: 'instagram', adultes: 2, enfants: 0, options: [], montant: 204000, paye: 204000 },
  { id: 's11', nom: 'Carla Méndez', chambre: 'Dortoir', debut: '2026-11-20', fin: '2026-11-22', statut: 'confirmee', canal: 'whatsapp', tel: '+54 9 11 5520-3348', adultes: 1, enfants: 0, options: [], montant: 36000, paye: 36000 },
  { id: 's12', nom: 'Booking', chambre: 'Cabane 4', debut: '2026-11-27', fin: '2026-11-30', statut: 'bloque', source: 'Booking', canal: 'booking', adultes: 4, enfants: 0, options: [], montant: 285000, paye: 285000 },
  { id: 's13', nom: 'Lucía Fernández', chambre: 'Cabane 4', debut: '2026-12-15', fin: '2026-12-17', statut: 'attente', canal: 'whatsapp', convId: 'lucia', tel: '+54 9 381 566-0934', adultes: 4, enfants: 0, options: [], montant: 190000, paye: 0 },
]

/** Ce que l'assistant d'aide sait montrer : des mots-clés, une réponse, et où aller. */
export type Aide = { mots: string[]; reponse: string; route: '/' | '/calendario' | '/menu' | '/ajustes'; repere: string; bouton: string }

export const aides: Aide[] = [
  { mots: ['reserv', 'nouvelle', 'ajouter un client', 'booker'], route: '/', repere: 'nouvelleReservation', bouton: 'Me montrer',
    reponse: 'Pour créer une réservation vous-même, touchez le + vert en haut à droite des Discussions. Vous pouvez aussi le faire depuis le Calendrier, avec le + en bas à droite.' },
  { mots: ['categor', 'liste', 'filtre', 'ranger', 'trier'], route: '/', repere: 'categorie', bouton: 'Me montrer',
    reponse: 'Touchez le + à droite des filtres (Action requise, En cours, Toutes). Donnez un nom, cochez les discussions : c’est fait.' },
  { mots: ['dispo', 'libre', 'place', 'calendrier', 'planning', 'occup', 'agenda'], route: '/calendario', repere: 'moisCalendrier', bouton: 'Ouvrir le calendrier',
    reponse: 'Le Calendrier montre toutes les réservations, jour par jour. Touchez le nom du mois en haut pour voir le mois entier.' },
  { mots: ['prix', 'tarif', 'chambre', 'stock'], route: '/ajustes', repere: 'chambres', bouton: 'Me montrer',
    reponse: 'Vos chambres et vos prix se règlent dans Paramètres, à la ligne « Chambres et prix ».' },
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

/** Les types de chambre « trouvés » sur le site de l'hôtel, en démo. */
export const chambresDuSite = [
  { id: 'c1', nom: 'Double', stock: 3, prix: '68000' },
  { id: 'c2', nom: 'Cabane 4', stock: 2, prix: '95000' },
  { id: 'c3', nom: 'Dortoir (lit)', stock: 6, prix: '18000' },
]

/** Les statistiques par mois et par canal (écran Statistiques, depuis le Menu). */
/** Ce que l'analyse du site, de Booking et de Google « trouve », en démo. */
export const esquisse = {
  hotel: 'Hostal Los Andes',
  ville: 'Tilcara',
  type: 'Hostal',
  chambres: [
    { id: 'c1', nom: 'Double', stock: 6, prix: '68000' },
    { id: 'c2', nom: 'Twin', stock: 4, prix: '62000' },
    { id: 'c3', nom: 'Cabane 4', stock: 2, prix: '95000' },
    { id: 'c4', nom: 'Dortoir (lit)', stock: 6, prix: '18000' },
  ],
  arrivee: '14 h',
  depart: '10 h',
  options: ['Petit-déjeuner maison', 'Parking', 'Petits animaux acceptés', 'Excursions à cheval'],
  aime: ['Le calme et la vue sur les montagnes', 'Le petit-déjeuner maison', 'L’accueil chaleureux de l’équipe'],
  avis: { note: '4,7', nombre: 128 },
  sources: [
    { nom: 'Site internet', trouve: 'Description, photos, horaires' },
    { nom: 'Booking', trouve: '4 types de chambre, 18 unités, prix' },
    { nom: 'Google', trouve: '128 avis, note 4,7' },
  ],
}

/* ── Remplissage cohérent du calendrier ──────────────────────────────────
 * Chaque unité (chambre ou lit) a sa propre ligne de temps : on y place
 * d'abord les séjours écrits à la main, puis des séjours générés, sans jamais
 * dépasser le stock. L'occupation d'une nuit n'est que le compte des séjours.
 */

/** Le stock de l'hôtel de démo, par type. */
export const STOCK: Record<string, number> = { 'Double': 3, 'Cabane 4': 2, 'Dortoir': 6 }
export const UNITES = Object.values(STOCK).reduce((a, b) => a + b, 0)
const PRIX: Record<string, number> = { 'Double': 68000, 'Cabane 4': 95000, 'Dortoir': 18000 }

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
  for (const [type, n] of Object.entries(STOCK)) for (let k = 0; k < n; k++) unites.push({ type, nuits: new Set() })
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
        const montant = nb * PRIX[u.type]
        tous.push({
          id: `g${++n}`, nom: ical ? (canal === 'booking' ? 'Booking' : 'Airbnb') : PRENOMS[Math.floor(r() * PRENOMS.length)],
          chambre: u.type, debut: jour, fin: plus(jour, nb), statut, source: ical ? (canal === 'booking' ? 'Booking' : 'Airbnb') : undefined,
          canal, tel: canal === 'whatsapp' ? `+54 9 388 ${400 + Math.floor(r() * 500)}-${1000 + Math.floor(r() * 8999)}` : undefined,
          adultes: u.type === 'Dortoir' ? 1 : u.type === 'Cabane 4' ? 2 + Math.floor(r() * 3) : 2,
          enfants: u.type === 'Cabane 4' && r() < 0.5 ? 1 : 0,
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
export function occupation(jour: string) {
  return sejours.filter((s) => s.debut <= jour && jour < s.fin).length
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
  aEncaisser: sejours.filter((s) => s.statut === 'attente' && s.fin > AUJ && s.montant > s.paye)
    .map((s) => ({ id: s.id, debut: s.debut, nom: s.nom, montant: s.montant - s.paye, echeance: { es: `llega el ${s.debut.slice(8)}/${s.debut.slice(5, 7)}`, fr: `arrivée le ${s.debut.slice(8)}/${s.debut.slice(5, 7)}` } })),
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
