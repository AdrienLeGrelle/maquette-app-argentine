import * as ImagePicker from 'expo-image-picker'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Icon } from '@/lib/icons'
import { surPhoto, useWa } from '@/lib/theme'

/**
 * Les photos d'une chambre ou d'une option : une bande qui défile, la
 * première sert de couverture. « Ajouter » ouvre la galerie du téléphone
 * (plusieurs photos d'un coup) ; la croix en retire une.
 */
export function Photos({ photos, onChange, nom }: { photos: string[]; onChange: (photos: string[]) => void; nom: string }) {
  const wa = useWa()
  const ajouter = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 })
    if (!r.canceled) onChange([...photos, ...r.assets.map((a) => a.uri)])
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bande}>
      {photos.map((uri, k) => (
        <View key={`${uri}-${k}`} style={s.vignette}>
          <Image source={{ uri }} style={[s.image, { backgroundColor: wa.champ }]} accessibilityLabel={`${nom || 'Photo'}, photo ${k + 1}`} />
          {k === 0 && (
            <View style={[s.couverture, { backgroundColor: surPhoto.voile }]}>
              <Text style={[s.couvertureTexte, { color: surPhoto.encre }]}>Couverture</Text>
            </View>
          )}
          <Pressable onPress={() => onChange(photos.filter((_, i) => i !== k))} hitSlop={8} accessibilityRole="button"
                     accessibilityLabel={`Retirer la photo ${k + 1}`} style={[s.retirer, { backgroundColor: surPhoto.voile }]}>
            <Icon name="x" size={14} color={surPhoto.encre} trait={2.6} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={ajouter} accessibilityRole="button" accessibilityLabel={`Ajouter des photos${nom ? ` : ${nom}` : ''}`}
                 style={({ pressed }) => [s.ajouter, { borderColor: wa.chipBord, opacity: pressed ? 0.7 : 1 }]}>
        <Icon name="camera" size={22} color={wa.vert} />
        <Text style={[s.ajouterTexte, { color: wa.vert }]}>Ajouter</Text>
      </Pressable>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  bande: { gap: 8, paddingVertical: 12 },
  vignette: { width: 104, height: 78, borderRadius: 10, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  couverture: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: 3, alignItems: 'center' },
  couvertureTexte: { fontSize: 11, fontWeight: '600' },
  retirer: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  ajouter: { width: 104, height: 78, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  ajouterTexte: { fontSize: 13, fontWeight: '600' },
})
