import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { EtatProvider } from '@/lib/etat'
import { useCouleurs } from '@/lib/theme'

export default function Layout() {
  const c = useCouleurs()
  return (
    <SafeAreaProvider>
      <EtatProvider>
        <StatusBar style="auto" />
        <CadreOrdinateur>
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
          </Stack>
        </CadreOrdinateur>
      </EtatProvider>
    </SafeAreaProvider>
  )
}

/** Sur ordinateur, l'app reste à la largeur d'un téléphone, centrée. */
function CadreOrdinateur({ children }: { children: React.ReactNode }) {
  const c = useCouleurs()
  const { width } = useWindowDimensions()
  if (Platform.OS !== 'web' || width < 600) return <>{children}</>
  return (
    <View style={[s.fond, { backgroundColor: c.surface3 }]}>
      <View style={[s.telephone, { backgroundColor: c.ground, borderColor: c.line }]}>
        {children}
        {/* Les fiches (nouvel employé, nouvelle catégorie) montent ici, dans le téléphone. */}
        <View nativeID="cadre-feuilles" pointerEvents="box-none" style={StyleSheet.absoluteFill} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  fond: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  telephone: {
    width: 400, maxHeight: 860, flex: 1, borderRadius: 32, borderWidth: 1, overflow: 'hidden',
    boxShadow: '0 24px 48px rgba(16,26,51,.12)',
  },
})
