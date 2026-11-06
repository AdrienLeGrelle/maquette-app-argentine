import type { Config } from './etat'

/**
 * L'hôtel de démonstration, tel qu'un hôtelier bien installé l'a rempli dans
 * Roomz : ses chambres avec leurs photos, ses prix à la nuit, ses options, son
 * adresse exacte, ses règles. C'est la seule source : le calendrier, les
 * messages au voyageur et, demain, sa page de réservation partent d'ici.
 *
 * L'hôtelier écrit dans sa langue. `es` est ce que Roomz montre au voyageur,
 * traduit dans la sienne (espagnol d'Argentine par défaut).
 */

/** Une photo libre d'Unsplash, recadrée à la volée. */
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=70&auto=format&fit=crop`

export type Chambre = {
  id: string
  /** Comme l'hôtelier la compte : « Double », « Cabane 4 ». C'est aussi son nom dans le calendrier. */
  nom: string
  /** Unités de ce type ; des lits pour un dortoir. */
  stock: number
  /** Une nuit, en pesos ; par lit pour un dortoir. En texte, comme le champ qui le saisit. */
  prix: string
  /** Personnes par unité. */
  capacite: number
  /** Dortoir : on réserve des lits, un par personne. */
  parLit?: boolean
  lits: string
  description: string
  equipements: string[]
  /** La première est celle qu'on montre d'abord. */
  photos: string[]
  es?: { nom: string; lits: string; description: string; equipements: string[] }
}

/** Comment une option se compte : `prix` × personnes × nuits, par personne, par nuit ou une fois. */
export type Unite = 'nuitPersonne' | 'personne' | 'nuit' | 'sejour'

export const UNITES_OPTION: { cle: Unite; fr: string; es: string }[] = [
  { cle: 'nuitPersonne', fr: 'Par personne et par nuit', es: 'por persona y por noche' },
  { cle: 'personne', fr: 'Par personne', es: 'por persona' },
  { cle: 'nuit', fr: 'Par nuit', es: 'por noche' },
  { cle: 'sejour', fr: 'Par séjour', es: 'por estadía' },
]

export type OptionHotel = {
  id: string
  /** Le nom que reprennent les réservations (« Petit-déjeuner », « Lit bébé »). */
  nom: string
  /** En pesos ; 0 : offert. */
  prix: number
  unite: Unite
  detail?: string
  photo?: string
  es?: { nom: string; detail?: string }
}

/** Ce que l'hôtelier voit sous une option : « 35 000 $ par personne » ou « Offert ». */
export function prixOption(o: OptionHotel) {
  if (!o.prix) return 'Offert'
  const unite = UNITES_OPTION.find((u) => u.cle === o.unite)?.fr.toLowerCase() ?? ''
  return `$ ${o.prix.toLocaleString('es-AR')} ${unite}`
}

const chambres: Chambre[] = [
  {
    id: 'simple', nom: 'Simple', stock: 2, prix: '42000', capacite: 1,
    lits: '1 lit simple',
    description: 'Petite chambre calme qui donne sur le patio, idéale pour voyager seul.',
    equipements: ['Salle de bain privée', 'Wifi', 'Chauffage'],
    photos: [photo('1522771739844-6a9f6d5f14af'), photo('1513694203232-719a280e022f'), photo('1584132967334-10e028bd69f7')],
    es: {
      nom: 'Habitación simple', lits: '1 cama individual',
      description: 'Habitación chica y tranquila que da al patio, ideal si viajás solo.',
      equipements: ['Baño privado', 'Wifi', 'Calefacción'],
    },
  },
  {
    id: 'double', nom: 'Double', stock: 3, prix: '68000', capacite: 2,
    lits: '1 lit double',
    description: 'Chambre lumineuse avec un grand lit, autour du patio fleuri.',
    equipements: ['Salle de bain privée', 'Wifi', 'Chauffage', 'Serviettes'],
    photos: [photo('1566665797739-1674de7a421a'), photo('1582719478250-c89cae4dc85b'), photo('1584132967334-10e028bd69f7')],
    es: {
      nom: 'Habitación doble', lits: '1 cama matrimonial',
      description: 'Habitación luminosa con cama matrimonial, alrededor del patio con flores.',
      equipements: ['Baño privado', 'Wifi', 'Calefacción', 'Toallas'],
    },
  },
  {
    id: 'twin', nom: 'Twin', stock: 2, prix: '64000', capacite: 2,
    lits: '2 lits simples',
    description: 'Deux lits séparés, pour des amis ou des collègues de voyage.',
    equipements: ['Salle de bain privée', 'Wifi', 'Chauffage'],
    photos: [photo('1595576508898-0ad5c879a061'), photo('1584132967334-10e028bd69f7')],
    es: {
      nom: 'Habitación twin', lits: '2 camas individuales',
      description: 'Dos camas separadas, para amigos o compañeros de viaje.',
      equipements: ['Baño privado', 'Wifi', 'Calefacción'],
    },
  },
  {
    id: 'superieure', nom: 'Supérieure', stock: 2, prix: '88000', capacite: 2,
    lits: '1 grand lit',
    description: 'Au premier étage, une grande baie vitrée face aux montagnes, une baignoire et un coin salon.',
    equipements: ['Vue sur les montagnes', 'Baignoire', 'Wifi', 'Chauffage', 'Bouilloire et maté'],
    photos: [photo('1568495248636-6432b97bd949'), photo('1631049307264-da0ec9d70304'), photo('1552321554-5fefe8c9ef14')],
    es: {
      nom: 'Habitación superior con vista', lits: '1 cama king',
      description: 'En el primer piso, con un ventanal frente a los cerros, bañera y rincón de estar.',
      equipements: ['Vista a los cerros', 'Bañera', 'Wifi', 'Calefacción', 'Pava eléctrica y mate'],
    },
  },
  {
    id: 'familiale', nom: 'Familiale', stock: 1, prix: '110000', capacite: 4,
    lits: '1 lit double et 2 lits superposés',
    description: 'Deux espaces : le lit double d’un côté, les lits superposés de l’autre. Les enfants adorent.',
    equipements: ['Salle de bain privée', 'Wifi', 'Chauffage', 'Lit bébé sur demande'],
    photos: [photo('1590490360182-c33d57733427'), photo('1505693416388-ac5ce068fe85')],
    es: {
      nom: 'Habitación familiar', lits: '1 cama matrimonial y 1 cucheta',
      description: 'Dos ambientes: la cama matrimonial de un lado, la cucheta del otro. A los chicos les encanta.',
      equipements: ['Baño privado', 'Wifi', 'Calefacción', 'Cuna a pedido'],
    },
  },
  {
    id: 'cabane', nom: 'Cabane 4', stock: 2, prix: '95000', capacite: 4,
    lits: '1 lit double et 2 lits simples',
    description: 'Cabane indépendante en bois et adobe au fond du jardin, avec cuisine équipée et terrasse.',
    equipements: ['Cuisine équipée', 'Terrasse', 'Parrilla', 'Salle de bain privée', 'Wifi'],
    photos: [photo('1542718610-a1d656d1884c'), photo('1611892440504-42a792e24d32'), photo('1556911220-bff31c812dba')],
    es: {
      nom: 'Cabaña para 4', lits: '1 cama matrimonial y 2 individuales',
      description: 'Cabaña independiente de madera y adobe al fondo del jardín, con cocina equipada y galería.',
      equipements: ['Cocina equipada', 'Galería', 'Parrilla', 'Baño privado', 'Wifi'],
    },
  },
  {
    id: 'dortoir', nom: 'Dortoir', stock: 6, prix: '18000', capacite: 1, parLit: true,
    lits: '6 lits superposés',
    description: 'Dortoir mixte de 6 lits, un casier avec cadenas par lit. Salle de bain partagée.',
    equipements: ['Casier', 'Draps fournis', 'Wifi', 'Salle de bain partagée'],
    photos: [photo('1555854877-bab0e564b8d5'), photo('1520277739336-7bf67edfa768')],
    es: {
      nom: 'Cama en dormitorio compartido', lits: '6 camas en cuchetas',
      description: 'Dormitorio mixto de 6 camas, cada una con su locker con candado. Baño compartido.',
      equipements: ['Locker', 'Ropa de cama', 'Wifi', 'Baño compartido'],
    },
  },
]

const options: OptionHotel[] = [
  { id: 'petitdej', nom: 'Petit-déjeuner', prix: 0, unite: 'nuitPersonne', detail: 'Fait maison, de 8 h à 10 h 30 au comedor',
    photo: photo('1533089860892-a7c6f0a88666'), es: { nom: 'Desayuno casero', detail: 'De 8 a 10:30, en el comedor' } },
  { id: 'diner', nom: 'Dîner régional', prix: 16000, unite: 'personne', detail: 'Locro, empanadas, humita… à réserver la veille',
    photo: photo('1544148103-0773bf10d330'), es: { nom: 'Cena regional', detail: 'Locro, empanadas, humita… reservando el día anterior' } },
  { id: 'cheval', nom: 'Excursion à cheval', prix: 35000, unite: 'personne', detail: 'Une demi-journée jusqu’à la Garganta del Diablo, avec un guide',
    photo: photo('1553284965-83fd3e82fa5a'), es: { nom: 'Cabalgata', detail: 'Medio día hasta la Garganta del Diablo, con guía' } },
  { id: 'transfert', nom: 'Transfert depuis le terminal', prix: 6000, unite: 'sejour', detail: 'On vient vous chercher avec vos bagages',
    es: { nom: 'Traslado desde la terminal', detail: 'Te buscamos con tu equipaje' } },
  { id: 'parking', nom: 'Parking', prix: 0, unite: 'sejour', detail: 'Couvert, devant l’entrée',
    es: { nom: 'Cochera', detail: 'Cubierta, frente a la entrada' } },
  { id: 'tardive', nom: 'Arrivée tardive (22 h)', prix: 0, unite: 'sejour', detail: 'Prévenez-nous : la clé vous attend',
    es: { nom: 'Llegada tarde (22 h)', detail: 'Avisanos y te dejamos la llave' } },
  { id: 'depart', nom: 'Départ tardif (14 h)', prix: 15000, unite: 'sejour', detail: 'Selon les arrivées du jour',
    es: { nom: 'Salida tardía (14 h)', detail: 'Según las llegadas del día' } },
  { id: 'bebe', nom: 'Lit bébé', prix: 0, unite: 'sejour',
    es: { nom: 'Cuna' } },
  { id: 'animal', nom: 'Animal (chien)', prix: 5000, unite: 'nuit', detail: 'Les petits chiens sont les bienvenus',
    es: { nom: 'Mascota (perro)', detail: 'Los perros chicos son bienvenidos' } },
]

/** Les avis trouvés sur Google à la mise en route. */
export const avis = { note: '4,7', nombre: 128 }

export const HOTEL = {
  chambres,
  options,
  photos: [
    photo('1523217582562-09d0def993a6'),
    photo('1469474968028-56623f02e42e'),
    photo('1560185007-cde436f6a4d0'),
    photo('1504754524776-8f4f37790ca0'),
    photo('1502672260266-1c1ef2d93688'),
  ],
  aime: ['Le calme et la vue sur les montagnes', 'Le petit-déjeuner maison', 'L’accueil chaleureux de l’équipe'],
}

/** La configuration d'un hôtelier qui a tout rempli : c'est l'état de départ de la démo. */
export const configDemo: Config = {
  prenom: 'Claire',
  role: 'Propriétaire',
  hotel: 'Hostal Los Andes',
  type: 'Hostal',
  adresse: 'Calle Belgrano 455',
  ville: 'Tilcara',
  province: 'Jujuy',
  codePostal: 'Y4624',
  pays: 'Argentine',
  coords: { lat: -23.5779, lng: -65.3937 },
  acces: 'À 10 minutes à pied de la place et du terminal de bus, en remontant la calle Belgrano. On peut venir vous chercher.',
  presentation: 'Un hostal en adobe à Tilcara, à dix minutes à pied de la place. Patio fleuri, petit-déjeuner maison et vue sur les montagnes de la Quebrada de Humahuaca.',
  photos: HOTEL.photos,
  email: 'hostallosandes.tilcara@gmail.com',
  instagram: '@hostallosandes.tilcara',
  site: '',
  sansSite: false,
  booking: 'booking.com/hotel/ar/hostal-los-andes-tilcara',
  google: 'Hostal Los Andes, Tilcara',
  analyse: true,
  options: HOTEL.options,
  aime: HOTEL.aime,
  chambres: HOTEL.chambres,
  chambresDuSite: true,
  arrivee: '14 h',
  depart: '10 h',
  animaux: true,
  enfants: true,
  paiement: 'Un acompte de 30 %',
  annulation: 'Gratuite jusqu’à 15 jours avant l’arrivée. Après, l’acompte est conservé.',
  aSavoir: [
    'Pas de restaurant à moins de 10 minutes à pied : le dîner régional se réserve à l’hostal.',
    'Tilcara est à 2 465 m d’altitude : prévoyez une première journée tranquille.',
    'Les 200 derniers mètres sont en terre, praticables en voiture.',
    'Pas de télévision dans les chambres ; le wifi passe partout.',
    'On paie par Mercado Pago, en espèces ou par virement.',
  ],
  mercadoPago: true,
  style: 'selection',
  styleIds: ['silvia', 'hilda', 'agustina', 'lucia'],
  canaux: { instagram: true, messenger: true, booking: true, mail: true },
  es: {
    presentation: 'Un hostal de adobe en Tilcara, a diez minutos a pie de la plaza. Patio con flores, desayuno casero y vista a los cerros de la Quebrada de Humahuaca.',
    acces: 'A 10 minutos a pie de la plaza y de la terminal, subiendo por calle Belgrano. Si querés, te buscamos.',
    annulation: 'Gratis hasta 15 días antes de la llegada. Después, la seña no se devuelve.',
    aSavoir: [
      'No hay restaurantes a menos de 10 minutos a pie: la cena regional se reserva en el hostal.',
      'Tilcara está a 2.465 m de altura: tomate el primer día con calma.',
      'Los últimos 200 metros son de tierra, se llega bien en auto.',
      'No hay tele en las habitaciones; el wifi llega a todos lados.',
      'Se paga con Mercado Pago, en efectivo o por transferencia.',
    ],
    aime: ['La tranquilidad y la vista a los cerros', 'El desayuno casero', 'La calidez del equipo'],
  },
}
