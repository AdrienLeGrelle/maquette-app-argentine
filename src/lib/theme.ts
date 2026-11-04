import { createContext, useContext } from 'react'
import { useColorScheme } from 'react-native'

/**
 * Les variables de `apps/web/src/styles/mockup.css`, la maquette validée par
 * Charles et Hermine. Aucune couleur en dur dans un écran : tout passe par ici.
 */
const clair = {
  ground: '#F4F6FB',
  surface: '#FFFFFF',
  surface3: '#F0F3FA',
  line: '#E3E8F2',
  lineStrong: '#7D89A3',
  ink: '#101A33',
  ink2: '#3D4A66',
  muted: '#56627C',
  accent: '#1D4ED8',
  /** Texte et liens couleur accent : plus clair en mode sombre, pour rester lisible. */
  accentInk: '#1D4ED8',
  onAccent: '#FFFFFF',
  accentWash: '#DCE6FB',
  onAccentWash: '#1E40AF',
  ok: '#15803D',
  okWash: '#E6F5EC',
  okLine: '#BCE3CB',
  warn: '#B45309',
  warnInk: '#92400E',
  warnWash: '#FDF0DC',
  warnLine: '#F0D2A0',
  bad: '#C62828',
  info: '#1D4ED8',
  infoWash: '#E6EDFD',
  infoLine: '#C3D4FA',
}

export type Couleurs = typeof clair

const sombre: Couleurs = {
  ground: '#0A0F1C',
  surface: '#141C2E',
  surface3: '#1B2438',
  line: '#26314A',
  lineStrong: '#5B6A88',
  ink: '#E9EFFB',
  ink2: '#BFCBE2',
  muted: '#8C99B4',
  accent: '#3B6FE0',
  accentInk: '#7CA5FF',
  onAccent: '#FFFFFF',
  accentWash: '#22346B',
  onAccentWash: '#DCE6FB',
  ok: '#4ADE80',
  okWash: '#10301F',
  okLine: '#1E5636',
  warn: '#FBBF24',
  warnInk: '#FBBF24',
  warnWash: '#33260B',
  warnLine: '#5C4514',
  bad: '#F87171',
  info: '#7CA5FF',
  infoWash: '#141F3D',
  infoLine: '#26386B',
}

export function useCouleurs(): Couleurs {
  return useColorScheme() === 'dark' ? sombre : clair
}

/**
 * Le visuel de WhatsApp (iOS), demandé à l'identique pour les discussions :
 * l'hôtelier doit s'y sentir chez lui. Ces couleurs ne valent que pour les
 * écrans qui imitent WhatsApp ; ailleurs, la palette Roomz ci-dessus.
 */
const waClair = {
  fond: '#FFFFFF',
  encre: '#000000',
  gris: '#8E8E93',
  ligne: '#E5E5EA',
  vert: '#1DAA61',
  vertWash: '#D9FDD3',
  vertEncre: '#0B5F35',
  surVert: '#FFFFFF',
  danger: '#FF3B30',
  zoneMoi: '#3478F6',
  chipBord: '#D1D1D6',
  chipEncre: '#5E5E62',
  champ: '#EFEFF0',
  bouton: '#F2F2F4',
  barre: '#F8F8F8',
  avatar: '#DFE5E7',
  avatarIcone: '#FFFFFF',
  papier: '#EFE7DE',
  bulleOut: '#D9FDD3',
  bulleIn: '#FFFFFF',
  bulleMeta: '#667781',
  lu: '#53BDEB',
  saisie: '#FFFFFF',
  pastille: '#FFFFFF',
}

export type CouleursWa = typeof waClair

const waSombre: CouleursWa = {
  fond: '#000000',
  encre: '#FFFFFF',
  gris: '#8E8E93',
  ligne: '#262628',
  vert: '#21C063',
  vertWash: '#103529',
  vertEncre: '#D9FDD3',
  surVert: '#FFFFFF',
  danger: '#FF453A',
  zoneMoi: '#3D8BFF',
  chipBord: '#3A3A3C',
  chipEncre: '#AEAEB2',
  champ: '#1C1C1E',
  bouton: '#1C1C1E',
  barre: '#121212',
  avatar: '#3A3A3C',
  avatarIcone: '#8E8E93',
  papier: '#0B141A',
  bulleOut: '#144D37',
  bulleIn: '#1F2C34',
  bulleMeta: '#8696A0',
  lu: '#53BDEB',
  saisie: '#1F2C34',
  pastille: '#1F2C34',
}

/**
 * Palette de la mise en route, à la Revolut : un dégradé bleu-vert profond
 * (voir `degradeMiseEnRoute`), des cartes translucides, un seul bouton blanc.
 * Les couleurs restent douces ; le vert de l'app teinte le haut du dégradé.
 */
export const revolut: CouleursWa = {
  fond: '#0B1A20',
  encre: '#FFFFFF',
  gris: 'rgba(255,255,255,0.62)',
  ligne: 'rgba(255,255,255,0.10)',
  vert: '#FFFFFF',
  vertWash: '#FFFFFF',
  vertEncre: '#0B1A20',
  surVert: '#0B1A20',
  danger: '#FF8A8A',
  zoneMoi: '#8EC5FF',
  chipBord: 'rgba(255,255,255,0.20)',
  chipEncre: 'rgba(255,255,255,0.88)',
  champ: 'rgba(255,255,255,0.09)',
  bouton: 'rgba(255,255,255,0.09)',
  barre: 'transparent',
  avatar: 'rgba(255,255,255,0.14)',
  avatarIcone: 'rgba(255,255,255,0.6)',
  papier: 'transparent',
  bulleOut: 'rgba(255,255,255,0.14)',
  bulleIn: 'rgba(255,255,255,0.09)',
  bulleMeta: 'rgba(255,255,255,0.62)',
  lu: '#8EC5FF',
  saisie: 'rgba(255,255,255,0.09)',
  pastille: 'rgba(255,255,255,0.09)',
}

/** Le dégradé de fond de la mise en route, du haut vers le bas. */
export const degradeMiseEnRoute = ['#17484A', '#0F2A31', '#0A161B']

/** Force une palette pour un écran entier (la mise en route en sombre). */
export const ThemeWa = createContext<CouleursWa | null>(null)

export function useWa(): CouleursWa {
  const force = useContext(ThemeWa)
  const sombre = useColorScheme() === 'dark'
  return force ?? (sombre ? waSombre : waClair)
}

/** Échelle de la refonte (docs/refonte/02-systeme-visuel.md). */
export const taille = {
  caption: 13,
  meta: 15,
  body: 16,
  label: 17,
  title: 20,
  headline: 24,
  display: 34,
}

export const espace = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 12: 48 }

export const rayon = { sm: 8, md: 12, lg: 16, xl: 28, pill: 999 }

/** Hauteurs tactiles : jamais moins de 48 px sous le pouce. */
export const tap = { btn: 52, field: 52 }

/** Chiffres tabulaires, l'équivalent de `.num`. */
export const num = { fontVariant: ['tabular-nums' as const] }

/**
 * Le calendrier, dessiné comme Google Agenda. Les réservations gardent les
 * teintes de statut de CLAUDE.md : vert confirmée, ambre à payer, gris pour
 * un blocage importé (Booking, Airbnb).
 */
const calClair = {
  fond: '#FFFFFF',
  encre: '#1F1F1F',
  gris: '#444746',
  ligne: '#E1E3E1',
  aujourdhui: '#0B57D0',
  surAujourdhui: '#FFFFFF',
  choisi: '#D3E3FD',
  fab: '#C2E7FF',
  surFab: '#001D35',
  confirmee: '#1DAA61',
  attente: '#E59A2E',
  bloque: '#9AA0A6',
  surEvenement: '#FFFFFF',
  /** Cartes de réservation : un lavis doux par statut, et son texte. */
  lavisConfirmee: '#EAF7EF',
  /** Le client est arrivé : le même vert, un cran plus soutenu. */
  lavisArrive: '#8FD4A9',
  lavisAttente: '#FDF4E6',
  lavisBloque: '#F3F4F5',
  texteConfirmee: '#0F6B3A',
  texteAttente: '#8A4B0B',
  texteBloque: '#5F6368',
  /** Anneau de remplissage : calme, ça se remplit, complet. */
  occCalme: '#1E8E3E',
  occTendu: '#E37400',
  occComplet: '#C5221F',
  piste: '#E1E3E1',
}

export type CouleursCal = typeof calClair

const calSombre: CouleursCal = {
  fond: '#131314',
  encre: '#E3E3E3',
  gris: '#C4C7C5',
  ligne: '#444746',
  aujourdhui: '#A8C7FA',
  surAujourdhui: '#062E6F',
  choisi: '#004A77',
  fab: '#004A77',
  surFab: '#C2E7FF',
  confirmee: '#21C063',
  attente: '#F0A93E',
  bloque: '#80868B',
  surEvenement: '#FFFFFF',
  lavisConfirmee: '#14291E',
  lavisArrive: '#2A6B45',
  lavisAttente: '#2D2416',
  lavisBloque: '#202124',
  texteConfirmee: '#8BE0AE',
  texteAttente: '#F6C77E',
  texteBloque: '#BDC1C6',
  occCalme: '#81C995',
  occTendu: '#FDD663',
  occComplet: '#F28B82',
  piste: '#3C4043',
}

export function useCal(): CouleursCal {
  return useColorScheme() === 'dark' ? calSombre : calClair
}

/** Couleurs de marque des canaux, pour leurs logos seulement. */
export const marques = {
  instagram: ['#F58529', '#DD2A7B', '#8134AF'],
  messenger: ['#00B2FF', '#A033FF'],
  booking: '#003580',
  bookingPoint: '#009FE3',
  mail: '#5F6368',
  whatsapp: '#25D366',
  mercadoPago: '#009EE3',
  blanc: '#FFFFFF',
}
