import { AUJOURDHUI, date, ecart, plusJours } from './dates'
import type { Sejour } from './demo'
import type { Chambre, OptionHotel } from './hotel'

/**
 * Les calculs de la page de réservation de l'hôtel. Tout part de ce que
 * l'hôtelier a rempli dans Roomz (chambres, stock, prix, options) et du
 * planning en direct : c'est le même calendrier que dans l'app.
 */

export type LangueSite = 'es' | 'fr'

/** Les nuits d'un séjour : de l'arrivée à la veille du départ. */
export function nuitsDe(debut: string, fin: string) {
  return Array.from({ length: Math.max(0, ecart(debut, fin)) }, (_, i) => plusJours(debut, i))
}

/** Unités d'un type prises la nuit `jour` : réservations, retenues et blocages iCal confondus. */
export function prises(type: string, jour: string, sejours: Sejour[]) {
  return sejours.filter((s) => s.chambre === type && s.debut <= jour && jour < s.fin).length
}

/** Un lit par personne en dortoir ; sinon une chambre pour le groupe. */
export function unitesPour(ch: Chambre, personnes: number) {
  return ch.parLit ? personnes : 1
}

export function convient(ch: Chambre, personnes: number) {
  return ch.stock > 0 && (ch.parLit ? personnes <= ch.stock : personnes <= ch.capacite)
}

/** Unités libres sur tout le séjour : le minimum nuit par nuit, jamais une moyenne. */
export function libresSur(ch: Chambre, debut: string, fin: string, sejours: Sejour[]) {
  const n = nuitsDe(debut, fin)
  return n.length ? Math.min(...n.map((j) => ch.stock - prises(ch.nom, j, sejours))) : 0
}

/** La nuit est ouverte s'il reste de quoi loger le groupe, quel que soit le type de chambre. */
export function nuitOuverte(chambres: Chambre[], personnes: number, jour: string, sejours: Sejour[]) {
  if (jour < AUJOURDHUI) return false
  return chambres.some((ch) => convient(ch, personnes) && ch.stock - prises(ch.nom, jour, sejours) >= unitesPour(ch, personnes))
}

/**
 * Le dernier départ possible depuis `arrivee` : un même type de chambre doit
 * rester libre chaque nuit jusque-là (on ne change pas de chambre en route).
 */
export function departMax(chambres: Chambre[], personnes: number, arrivee: string, sejours: Sejour[], limite = plusJours(arrivee, 60)) {
  let max = arrivee
  for (const ch of chambres) {
    if (!convient(ch, personnes)) continue
    const besoin = unitesPour(ch, personnes)
    let j = arrivee
    while (j < limite && ch.stock - prises(ch.nom, j, sejours) >= besoin) j = plusJours(j, 1)
    if (j > max) max = j
  }
  return max
}

/** Les chambres qu'on peut proposer pour ces dates et ce groupe, avec ce qu'il en reste. */
export function chambresLibres(chambres: Chambre[], personnes: number, debut: string, fin: string, sejours: Sejour[]) {
  return chambres
    .filter((ch) => convient(ch, personnes))
    .map((ch) => ({ ch, libres: libresSur(ch, debut, fin, sejours), besoin: unitesPour(ch, personnes) }))
    .filter((x) => x.libres >= x.besoin)
}

export function prixChambre(ch: Chambre, personnes: number, nuits: number) {
  return (Number(ch.prix) || 0) * nuits * (ch.parLit ? personnes : 1)
}

export function prixOptionSejour(o: OptionHotel, personnes: number, nuits: number) {
  switch (o.unite) {
    case 'nuitPersonne': return o.prix * personnes * nuits
    case 'personne': return o.prix * personnes
    case 'nuit': return o.prix * nuits
    default: return o.prix
  }
}

/* ── Les mots du voyageur ─────────────────────────────────────────────── */

const MOIS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const MOIS_COURTS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
const MOIS_COURTS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const JOURS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const JOURS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']

export function nomMois(mois: number, langue: LangueSite) {
  return (langue === 'es' ? MOIS_ES : MOIS_FR)[mois]
}

/** « vie 13 nov » / « ven. 13 nov. » */
export function jourCourt(iso: string, langue: LangueSite) {
  const d = date(iso)
  return `${(langue === 'es' ? JOURS_ES : JOURS_FR)[d.getUTCDay()]} ${d.getUTCDate()} ${(langue === 'es' ? MOIS_COURTS_ES : MOIS_COURTS_FR)[d.getUTCMonth()]}`
}

/** Le lien WhatsApp de l'hôtel, avec un premier message déjà écrit. */
export function lienWhatsApp(tel: string, texte: string) {
  return `https://wa.me/549${tel.replace(/\D/g, '')}?text=${encodeURIComponent(texte)}`
}

/** La carte OpenStreetMap autour de l'adresse, avec son repère : zoomable, déplaçable. */
export function lienCarte(lat: number, lng: number) {
  const d = 0.0035
  const bbox = [lng - d * 1.5, lat - d, lng + d * 1.5, lat + d].map((x) => x.toFixed(5)).join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

export function lienItineraire(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`
}
