import { Stack, usePathname } from 'expo-router'
import { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Notification } from '@/components/Notification'
import { VoirComme } from '@/components/VoirComme'
import { EtatProvider } from '@/lib/etat'
import { useCouleurs } from '@/lib/theme'

export default function Layout() {
  const c = useCouleurs()
  // La page de réservation de l'hôtel est un site pour les voyageurs : plein écran, sans l'app autour.
  const site = usePathname().startsWith('/sitio')
  return (
    <SafeAreaProvider>
      <EtatProvider>
        <StatusBar style="auto" />
        <CadreOrdinateur pleinEcran={site}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: c.ground },
              headerStyle: { backgroundColor: c.ground },
              headerTintColor: c.accentInk,
              headerTitleStyle: { color: c.ink },
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="conectar" options={{ title: 'Roomz' }} />
            <Stack.Screen name="numero" options={{ headerShown: true }} />
            <Stack.Screen name="codigo" options={{ headerShown: true }} />
            <Stack.Screen name="listo" options={{ gestureEnabled: false }} />
            <Stack.Screen name="sitio" options={{ title: 'Reservar' }} />
          </Stack>
          {!site && <Notification />}
        </CadreOrdinateur>
      </EtatProvider>
    </SafeAreaProvider>
  )
}

/** L'écran d'un iPhone 13, en points : la maquette montre ce que montre le téléphone. */
const IPHONE = { largeur: 390, hauteur: 844 }

/**
 * Sur ordinateur, l'app tient dans un iPhone 13, centré. Si la fenêtre est
 * trop basse, tout le téléphone rapetisse, sans jamais se tasser : on voit
 * toujours la même chose que sur le vrai.
 */
function CadreOrdinateur({ children, pleinEcran }: { children: React.ReactNode; pleinEcran?: boolean }) {
  const c = useCouleurs()
  const { width } = useWindowDimensions()
  const [place, setPlace] = useState<{ width: number; height: number } | null>(null)
  if (Platform.OS !== 'web' || width < 600) return <>{children}</>
  const k = place ? Math.min(1, place.width / IPHONE.largeur, place.height / IPHONE.hauteur) : 1
  // Plein écran (la page de l'hôtel) : mêmes boîtes, autre style. Changer d'arbre remonterait toute la navigation.
  return (
    <View style={[s.fond, { backgroundColor: c.surface3 }, pleinEcran && s.sansMarge]}>
      {!pleinEcran && <VoirComme />}
      <View style={s.place} onLayout={(e) => setPlace(e.nativeEvent.layout)}>
        <View style={pleinEcran ? s.plein : { width: IPHONE.largeur * k, height: IPHONE.hauteur * k }}>
          <View style={pleinEcran ? [s.plein, { backgroundColor: c.ground }]
            : [s.telephone, { transform: [{ scale: k }], backgroundColor: c.ground, borderColor: c.line }]}>
            {children}
            {/* Les fiches (nouvel employé, nouvelle catégorie) montent ici, dans le téléphone. */}
            <View nativeID="cadre-feuilles" pointerEvents="box-none" style={StyleSheet.absoluteFill} />
          </View>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  fond: { flex: 1, alignItems: 'center', padding: 24 },
  place: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  sansMarge: { padding: 0 },
  plein: { flex: 1, alignSelf: 'stretch', overflow: 'hidden' },
  telephone: {
    width: IPHONE.largeur, height: IPHONE.hauteur, transformOrigin: 'top left',
    borderRadius: 44, borderWidth: 1, overflow: 'hidden', boxShadow: '0 24px 48px rgba(16,26,51,.12)',
  },
})
