import { useRef, useState, type ComponentRef } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Icon } from '@/lib/icons'
import { num, surPhoto, useCouleurs } from '@/lib/theme'

/**
 * Des photos qui défilent au doigt (ou avec les flèches sur ordinateur),
 * des points pour savoir où l'on est. Sans photo, une case sobre.
 */
export function Carrousel({ photos, hauteur, rayon = 0, label, compteur }: {
  photos: string[]; hauteur: number; rayon?: number; label: string; compteur?: boolean
}) {
  const c = useCouleurs()
  const ref = useRef<ComponentRef<typeof ScrollView>>(null)
  const [largeur, setLargeur] = useState(0)
  const [i, setI] = useState(0)
  const aller = (k: number) => {
    const n = Math.max(0, Math.min(photos.length - 1, k))
    ref.current?.scrollTo({ x: n * largeur, animated: true })
    setI(n)
  }

  return (
    <View onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
          style={[s.cadre, { height: hauteur, borderRadius: rayon, backgroundColor: c.surface3 }]}>
      {photos.length === 0 && <View style={s.vide}><Icon name="bed" size={30} color={c.muted} /></View>}
      {largeur > 0 && photos.length > 0 && (
        <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={32}
                    onScroll={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / largeur))}>
          {photos.map((uri, k) => (
            <Image key={`${uri}-${k}`} source={{ uri }} resizeMode="cover" accessibilityLabel={`${label}, ${k + 1}/${photos.length}`}
                   style={{ width: largeur, height: hauteur }} />
          ))}
        </ScrollView>
      )}
      {photos.length > 1 && (
        <>
          {i > 0 && (
            <Pressable onPress={() => aller(i - 1)} accessibilityRole="button" accessibilityLabel="Anterior"
                       style={[s.fleche, s.gauche, { backgroundColor: c.surface }]}>
              <Icon name="chevL" size={16} color={c.ink} trait={2.4} />
            </Pressable>
          )}
          {i < photos.length - 1 && (
            <Pressable onPress={() => aller(i + 1)} accessibilityRole="button" accessibilityLabel="Siguiente"
                       style={[s.fleche, s.droite, { backgroundColor: c.surface }]}>
              <Icon name="chevR" size={16} color={c.ink} trait={2.4} />
            </Pressable>
          )}
          {compteur ? (
            <View style={[s.compteur, { backgroundColor: surPhoto.voile }]}>
              <Text style={[s.compteurTexte, num, { color: surPhoto.encre }]}>{i + 1} / {photos.length}</Text>
            </View>
          ) : (
            <View style={s.points} pointerEvents="none">
              {photos.map((_, k) => (
                <View key={k} style={[s.point, { backgroundColor: surPhoto.encre, opacity: k === i ? 1 : 0.55 }, k === i && s.pointActif]} />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  cadre: { overflow: 'hidden', width: '100%' },
  vide: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fleche: {
    position: 'absolute', top: '50%', marginTop: -16, width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.18)',
  },
  gauche: { left: 10 },
  droite: { right: 10 },
  points: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  point: { width: 6, height: 6, borderRadius: 3 },
  pointActif: { width: 7, height: 7, borderRadius: 3.5 },
  compteur: { position: 'absolute', bottom: 12, right: 12, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  compteurTexte: { fontSize: 13, fontWeight: '600' },
})
