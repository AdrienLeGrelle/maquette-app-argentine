import { useId } from 'react'
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg'
import { marques } from '@/lib/theme'

/** Logos simplifiés des canaux, pour reconnaître d'un coup d'œil ce qu'on coche. */
export type Logo = 'whatsapp' | 'instagram' | 'messenger' | 'booking' | 'mail' | 'mercadopago'

export function LogoCanal({ nom, size = 36 }: { nom: Logo; size?: number }) {
  const b = marques.blanc
  // Un identifiant de dégradé propre à chaque logo : sur le web, deux logos
  // avec le même id se volent le dégradé et l'un s'affiche sans fond.
  const id = useId().replace(/:/g, '')
  switch (nom) {
    case 'whatsapp':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Rect width={36} height={36} rx={9} fill={marques.whatsapp} />
          <Path d="M18 8a10 10 0 0 0-8.6 15.1L8 28l5-1.3A10 10 0 1 0 18 8Z" fill="none" stroke={b} strokeWidth={2.2} strokeLinejoin="round" />
          <Path d="M14.5 13.5c.4-.6 1-.6 1.3 0l.8 1.8c.1.4 0 .7-.3 1l-.6.6c.6 1.3 1.6 2.3 2.9 2.9l.6-.6c.3-.3.6-.4 1-.3l1.8.8c.6.3.6.9 0 1.3-1 .9-2.4 1-3.6.4a9.5 9.5 0 0 1-4.3-4.3c-.6-1.2-.5-2.6.4-3.6Z" fill={b} />
        </Svg>
      )
    case 'instagram':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Defs>
            <LinearGradient id={`ig${id}`} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor={marques.instagram[0]} />
              <Stop offset="0.5" stopColor={marques.instagram[1]} />
              <Stop offset="1" stopColor={marques.instagram[2]} />
            </LinearGradient>
          </Defs>
          <Rect width={36} height={36} rx={9} fill={`url(#ig${id})`} />
          <Rect x={9} y={9} width={18} height={18} rx={5.5} fill="none" stroke={b} strokeWidth={2.2} />
          <Circle cx={18} cy={18} r={4.3} fill="none" stroke={b} strokeWidth={2.2} />
          <Circle cx={23.2} cy={12.8} r={1.3} fill={b} />
        </Svg>
      )
    case 'messenger':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Defs>
            <LinearGradient id={`ms${id}`} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor={marques.messenger[0]} />
              <Stop offset="1" stopColor={marques.messenger[1]} />
            </LinearGradient>
          </Defs>
          <Rect width={36} height={36} rx={9} fill={`url(#ms${id})`} />
          <Path d="M18 8c-5.6 0-10 4.1-10 9.6 0 2.9 1.2 5.4 3.2 7.1V28l3-1.6c1.2.3 2.5.5 3.8.5 5.6 0 10-4.1 10-9.6S23.6 8 18 8Z" fill={b} />
          <Path d="m12 20.5 4-4.3 2.2 2.2 3.8-2.2-4 4.3-2.2-2.2Z" fill={marques.messenger[1]} />
        </Svg>
      )
    case 'booking':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Rect width={36} height={36} rx={9} fill={marques.booking} />
          <SvgText x={10.5} y={26} fontSize={20} fontWeight="700" fill={b}>B</SvgText>
          <Circle cx={25.5} cy={24} r={2.4} fill={marques.bookingPoint} />
        </Svg>
      )
    case 'mercadopago':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Rect width={36} height={36} rx={9} fill={marques.mercadoPago} />
          <SvgText x={18} y={23} fontSize={13} fontWeight="800" fontFamily="Helvetica, Arial, sans-serif" fill={b} textAnchor="middle">mp</SvgText>
        </Svg>
      )
    case 'mail':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Rect width={36} height={36} rx={9} fill={marques.mail} />
          <Rect x={8} y={11} width={20} height={14} rx={2} fill="none" stroke={b} strokeWidth={2.2} />
          <Path d="m8.8 12 9.2 7 9.2-7" fill="none" stroke={b} strokeWidth={2.2} strokeLinejoin="round" />
        </Svg>
      )
  }
}
