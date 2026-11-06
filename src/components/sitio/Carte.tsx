import { createElement } from 'react'
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon } from '@/lib/icons'
import { lienCarte, lienItineraire } from '@/lib/sitio'
import { useCouleurs } from '@/lib/theme'

/**
 * La carte du lieu, à partir des coordonnées de l'adresse : on zoome, on
 * dézoome, on se déplace (OpenStreetMap). Sur téléphone natif, un bouton
 * ouvre l'itinéraire.
 */
export function Carte({ lat, lng, hauteur, titre }: { lat: number; lng: number; hauteur: number; titre: string }) {
  const c = useCouleurs()
  if (Platform.OS === 'web') {
    return (
      <View style={[s.cadre, { height: hauteur, borderColor: c.line, backgroundColor: c.surface3 }]}>
        {createElement('iframe', {
          src: lienCarte(lat, lng), title: titre, loading: 'lazy',
          style: { border: 0, width: '100%', height: '100%', display: 'block' },
        })}
      </View>
    )
  }
  return (
    <Pressable onPress={() => Linking.openURL(lienItineraire(lat, lng))} accessibilityRole="link"
               style={[s.cadre, s.natif, { height: hauteur, borderColor: c.line, backgroundColor: c.surface3 }]}>
      <Icon name="pin" size={28} color={c.ink} />
      <Text style={[s.natifTexte, { color: c.ink }]}>{titre}</Text>
    </Pressable>
  )
}

const s = StyleSheet.create({
  cadre: { width: '100%', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  natif: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  natifTexte: { fontSize: 16, fontWeight: '600' },
})
