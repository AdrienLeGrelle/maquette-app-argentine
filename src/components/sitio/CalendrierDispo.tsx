import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AUJOURDHUI, INITIALES, casesDuMois, date } from '@/lib/dates'
import { Icon } from '@/lib/icons'
import { nomMois, type LangueSite } from '@/lib/sitio'
import { num, useCouleurs } from '@/lib/theme'

type Props = {
  /** Un mois sur téléphone, deux côte à côte sur ordinateur. */
  mois: 1 | 2
  debut: string | null
  fin: string | null
  onChange: (debut: string | null, fin: string | null) => void
  /** Il reste de quoi loger le groupe cette nuit-là. */
  ouverte: (jour: string) => boolean
  /** Une fois l'arrivée choisie : le dernier départ possible sans changer de chambre. */
  departMax: string | null
  langue: LangueSite
}

/**
 * Le calendrier des disponibilités, en direct sur le planning de l'hôtel.
 * Un toucher pour l'arrivée, un pour le départ. Les nuits complètes sont
 * barrées ; une fois l'arrivée posée, seuls les départs possibles restent.
 */
export function CalendrierDispo({ mois, debut, fin, onChange, ouverte, departMax, langue }: Props) {
  const c = useCouleurs()
  const auj = date(AUJOURDHUI)
  // En fin de mois, on ouvre sur le mois suivant : un mois presque passé n'apprend rien. La flèche y ramène.
  const finDeMois = new Date(Date.UTC(auj.getUTCFullYear(), auj.getUTCMonth() + 1, 0)).getUTCDate() - auj.getUTCDate() < 10
  const depart = debut ? date(debut) : new Date(Date.UTC(auj.getUTCFullYear(), auj.getUTCMonth() + (finDeMois && mois === 1 ? 1 : 0), 1))
  const [premier, setPremier] = useState({ a: depart.getUTCFullYear(), m: depart.getUTCMonth() })
  const [largeur, setLargeur] = useState(0)
  const auPremier = premier.a === auj.getUTCFullYear() && premier.m === auj.getUTCMonth()
  const decaler = (n: number) => setPremier(({ a, m }) => ({ a: a + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }))
  const ecartMois = 40
  const largeurMois = mois === 2 ? (largeur - ecartMois) / 2 : largeur
  const choixDepart = !!debut && !fin

  const toucher = (j: string) => {
    if (choixDepart && j > debut! && departMax && j <= departMax) return onChange(debut, j)
    if (ouverte(j)) onChange(j, null)
  }

  const blocs = Array.from({ length: mois }, (_, k) => {
    const m = (premier.m + k) % 12
    const a = premier.a + Math.floor((premier.m + k) / 12)
    return { a, m, cases: casesDuMois(a, m) }
  })

  return (
    <View onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}>
      <View style={s.navigation}>
        <Pressable onPress={() => decaler(-1)} disabled={auPremier} accessibilityRole="button" accessibilityLabel={langue === 'es' ? 'Mes anterior' : 'Mois précédent'}
                   style={({ pressed }) => [s.navBouton, { borderColor: c.line, opacity: auPremier ? 0.3 : pressed ? 0.6 : 1 }]}>
          <Icon name="chevL" size={16} color={c.ink} trait={2.2} />
        </Pressable>
        <Pressable onPress={() => decaler(1)} accessibilityRole="button" accessibilityLabel={langue === 'es' ? 'Mes siguiente' : 'Mois suivant'}
                   style={({ pressed }) => [s.navBouton, { borderColor: c.line, opacity: pressed ? 0.6 : 1 }]}>
          <Icon name="chevR" size={16} color={c.ink} trait={2.2} />
        </Pressable>
      </View>

      {largeur > 0 && (
        <View style={[s.mois, { gap: ecartMois }]}>
          {blocs.map(({ a, m, cases }) => (
            <View key={`${a}-${m}`} style={{ width: largeurMois }}>
              <Text style={[s.titreMois, { color: c.ink }]}>
                {nomMois(m, langue).charAt(0).toUpperCase() + nomMois(m, langue).slice(1)} {a}
              </Text>
              <View style={s.ligne}>
                {INITIALES.map((x, k) => (
                  <Text key={k} style={[s.initiale, { width: largeurMois / 7, color: c.muted }]}>{x}</Text>
                ))}
              </View>
              <View style={s.grille}>
                {cases.map((j, k) => {
                  const w = largeurMois / 7
                  if (!j) return <View key={`v${k}`} style={{ width: w, height: 46 }} />
                  const passe = j < AUJOURDHUI
                  const bout = j === debut || j === fin
                  const dedans = !!debut && !!fin && j > debut && j < fin
                  const departOk = choixDepart && j > debut! && !!departMax && j <= departMax
                  const libre = !passe && ouverte(j)
                  // Pendant le choix du départ : les départs possibles, ou une arrivée plus tôt pour recommencer.
                  const actif = !passe && (bout || (choixDepart ? departOk || (libre && j < debut!) : libre))
                  const barre = !passe && !libre && !departOk && !bout
                  return (
                    <Pressable key={j} onPress={() => toucher(j)} disabled={!actif || j === debut && !fin}
                               accessibilityRole="button" accessibilityState={{ selected: bout, disabled: !actif }}
                               accessibilityLabel={`${date(j).getUTCDate()} ${nomMois(m, langue)}${barre ? (langue === 'es' ? ', completo' : ', complet') : ''}`}
                               style={{ width: w, height: 46, alignItems: 'center', justifyContent: 'center' }}>
                      {(dedans || (bout && debut && fin && debut !== fin)) && (
                        <View style={[s.bande, { backgroundColor: c.surface3 },
                          j === debut ? { left: '50%' } : j === fin ? { right: '50%' } : null]} />
                      )}
                      <View style={[s.jour, bout && { backgroundColor: c.ink }]}>
                        <Text style={[s.jourTexte, num, {
                          color: bout ? c.ground : actif ? c.ink : c.muted,
                          opacity: passe ? 0.35 : actif || bout ? 1 : 0.5,
                          textDecorationLine: barre ? 'line-through' : 'none',
                          fontWeight: bout ? '700' : actif ? '600' : '400',
                        }]}>
                          {date(j).getUTCDate()}
                        </Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  navigation: { position: 'absolute', top: -4, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  navBouton: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mois: { flexDirection: 'row' },
  titreMois: { fontSize: 16, fontWeight: '700', textAlign: 'center', height: 26, marginBottom: 14 },
  ligne: { flexDirection: 'row', marginBottom: 4 },
  initiale: { textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
  bande: { position: 'absolute', top: 3, bottom: 3, left: 0, right: 0 },
  jour: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  jourTexte: { fontSize: 15 },
})
