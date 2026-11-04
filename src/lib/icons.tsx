import { Image } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

/** Le jeu d'icônes de la maquette (apps/web/src/lib/icons.tsx), en trait. */
const P = {
  whatsapp: 'M12 3a9 9 0 0 0-9 9 8.6 8.6 0 0 0 1.2 4.4L3 21l4.8-1.1A9 9 0 1 0 12 3Z',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 16v-4M12 8h.01',
  alert: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 8v4M12 16h.01',
  checkPlain: 'm20 6-11 11-5-5',
  chevL: 'm15 18-6-6 6-6',
  chevR: 'm9 18 6-6-6-6',
  chevD: 'm6 9 6 6 6-6',

  /* ── Discussions façon WhatsApp ── */
  dots: 'M6 12h.01M12 12h.01M18 12h.01',
  camera: 'M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18zM15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0',
  plus: 'M12 5v14M5 12h14',
  search: 'M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0m2 10-4.3-4.3',
  archive: 'M3 5h18v4H3zM5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4',
  pin: 'M14.5 3.5 20.5 9.5 17 11l-3 3 .5 4L13 19.5 4.5 11 6 9.5l4 .5 3-3zM8.8 15.2 3.5 20.5',
  checks: 'M1.5 12.5 5 16l8.5-8.5M10.5 16l8.5-8.5',
  check: 'm5 12.5 3.5 3.5L17 7.5',
  mic: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3M18 11a6 6 0 0 1-12 0M12 17v4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  calendar: 'M4 5h16v16H4zM16 3v4M8 3v4M4 10h16',
  send: 'm22 2-7 20-4-9-9-4Z',
  globe: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
  logout: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  building: 'M3 21h18M5 21V6l7-3 7 3v15M9 21v-5h6v5M9 10h.01M15 10h.01',
  dashboard: 'M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  play: 'M7 4.5v15l12-7.5z',
  arrivee: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  depart: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  card: 'M2 5h20v14H2zM2 10h20',
  bed: 'M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M7 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
  clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 2',
  sparkles: 'm12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z',
  trendUp: 'M22 7 13.5 15.5 8.5 10.5 2 17M16 7h6v6',
  x: 'M18 6 6 18M6 6l12 12',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  minus: 'M5 12h14',

  /* ── Instagram et Messenger ── */
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z',
  video: 'M3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM23 7l-7 5 7 5Z',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM10 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M21 15l-5-5L5 21',
  smile: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  like: 'M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7a2 2 0 0 1-1.9 1.4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z',
  plusRond: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 8v8M8 12h8',
  avion: 'M22 3 9.2 11.6M22 3l-7 18-3.8-8.4L3 9Z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  hand: 'M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8a8 8 0 0 0 16 0v-2a2 2 0 0 0-4 0',
} as const

export type IconName = keyof typeof P

type IconProps = { name: IconName; size?: number; color: string; plein?: boolean; trait?: number }

/** `plein` remplit la forme (l'onglet actif de WhatsApp est plein, les autres en trait). */
export function Icon({ name, size = 17, color, plein, trait = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={plein ? color : 'none'} stroke={color}
         strokeWidth={trait} strokeLinecap="round" strokeLinejoin="round">
      <Path d={P[name]} />
    </Svg>
  )
}

/** L'avatar par défaut de WhatsApp : une silhouette blanche sur un rond gris. */
export function AvatarVide({ size, fond, icone }: { size: number; fond: string; icone: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={24} fill={fond} />
      <Circle cx={24} cy={19} r={8} fill={icone} />
      <Path d="M8.5 40.5C11 33.5 17 30 24 30s13 3.5 15.5 10.5A23.9 23.9 0 0 1 24 48a23.9 23.9 0 0 1-15.5-7.5Z" fill={icone} />
    </Svg>
  )
}

/** La photo de profil d'un contact, ou la silhouette grise s'il n'en a pas. */
export function Avatar({ size, photo, fond, icone }: { size: number; photo?: string; fond: string; icone: string }) {
  if (!photo) return <AvatarVide size={size} fond={fond} icone={icone} />
  return <Image source={{ uri: photo }} accessibilityIgnoresInvertColors
                style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: fond }} />
}

/** Le logo : une bulle de conversation qui abrite une maison (apps/web/public/icon.svg). */
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path d="M112 0h288a112 112 0 0 1 112 112v288a112 112 0 0 1-112 112H112A112 112 0 0 1 0 400V112A112 112 0 0 1 112 0Z" fill="#1D4ED8" />
      <Path d="M256 92c-96 0-172 66-172 150 0 44 21 84 56 112l-14 66 70-34c19 6 39 9 60 9 96 0 172-66 172-153S352 92 256 92Z" fill="#fff" />
      <Path d="M184 236 256 180l72 56v86a10 10 0 0 1-10 10h-36v-58h-52v58h-36a10 10 0 0 1-10-10Z" fill="#1D4ED8" />
    </Svg>
  )
}
