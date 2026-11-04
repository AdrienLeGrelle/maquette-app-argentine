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

/**
 * Le canal en trait, pour la barre du bas : même famille que les autres
 * icônes de l'onglet. Le combiné de WhatsApp est plein, pour qu'on le
 * reconnaisse même petit.
 */
export function IconeCanal({ canal, size = 26, color, actif }: { canal: Logo; size?: number; color: string; actif?: boolean }) {
  const trait = actif ? 2.1 : 1.6
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={trait} strokeLinecap="round" strokeLinejoin="round">
      {canal === 'whatsapp' && (
        <>
          <Path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" />
          <Path d={COMBINE} fill={color} stroke="none" />
        </>
      )}
      {canal === 'instagram' && <Path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17.3 6.7h.01" />}
      {canal === 'messenger' && (
        <>
          <Path d="M12 3C7 3 3 6.7 3 11.4c0 2.6 1.2 4.9 3.2 6.5V21l2.9-1.6c.9.3 1.9.4 2.9.4 5 0 9-3.7 9-8.4S17 3 12 3Z" />
          <Path d="m7.5 13.6 3.1-3.3 2.4 2.2 3.5-2.2-3.1 3.3-2.4-2.2Z" fill={color} strokeWidth={1.2} />
        </>
      )}
      {canal === 'mail' && <Path d="M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1ZM3.5 6.5 12 13l8.5-6.5" />}
      {canal === 'booking' && <Path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM9 7v10h4.2a2.6 2.6 0 0 0 0-5.2H9M9 7h3.4a2.4 2.4 0 0 1 0 4.8" />}
    </Svg>
  )
}

/** Le combiné de WhatsApp, posé dans la bulle de 24 px. */
const COMBINE = 'M8.85 7.95c.36-.54.9-.54 1.17 0l.72 1.62c.09.36 0 .63-.27.9l-.54.54c.54 1.17 1.44 2.07 2.61 2.61l.54-.54c.27-.27.54-.36.9-.27l1.62.72c.54.27.54.81 0 1.17-.9.81-2.16.9-3.24.36a8.55 8.55 0 0 1-3.87-3.87c-.54-1.08-.45-2.34.36-3.24Z'
