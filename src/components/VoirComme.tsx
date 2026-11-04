import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { pesos } from '@/lib/demo'
import { nomRole } from '@/lib/equipe'
import { useEtat } from '@/lib/etat'
import { Avatar } from '@/lib/icons'
import { useCouleurs, useWa } from '@/lib/theme'

/**
 * Outil de démo, hors du téléphone (ordinateur seulement) : toucher une
 * personne de l'équipe montre l'app telle qu'elle la voit, avec ses accès.
 * N'existe pas dans la vraie app.
 */
export function VoirComme() {
  const c = useCouleurs()
  const wa = useWa()
  const { equipe, vue, setVue, config, sejours, payer, expirer } = useEtat()

  const choisir = (id: string | null) => {
    setVue(id)
    const m = equipe.find((x) => x.id === id)
    // Chacun arrive sur son premier écran : les discussions s'il y a accès, sinon l'accueil.
    router.replace(!m || m.acces.includes('discussions') ? '/' : '/menu')
  }

  const gerant = config.prenom || 'Gérant'
  const personnes = [
    { id: null, nom: gerant, role: 'Gérant', photo: undefined },
    ...equipe.map((m) => ({ id: m.id, nom: m.prenom, role: nomRole(m.acces), photo: m.photo })),
  ]

  // Les liens envoyés qui attendent leur paiement : on joue le retour de Mercado Pago à la main.
  const enAttente = sejours.filter((e) => e.lien && e.lien.etat !== 'payee')

  return (
    <View style={s.barre}>
      <Text style={[s.titre, { color: c.muted }]}>Démo · voir l’app comme</Text>
      <View style={s.personnes}>
        {personnes.map((p) => {
          const actif = vue === p.id || (p.id === null && !equipe.some((m) => m.id === vue))
          return (
            <Pressable key={p.id ?? 'gerant'} onPress={() => choisir(p.id)} accessibilityRole="radio" accessibilityState={{ checked: actif }}
                       style={({ pressed }) => [s.personne, { backgroundColor: actif ? c.accentWash : c.surface, borderColor: actif ? c.accent : c.line },
                                                pressed && { opacity: 0.7 }]}>
              {p.id === null ? (
                <View style={[s.initiale, { backgroundColor: wa.vert }]}>
                  <Text style={[s.initialeTexte, { color: wa.surVert }]}>{gerant.slice(0, 1).toUpperCase()}</Text>
                </View>
              ) : (
                <Avatar size={28} photo={p.photo} fond={wa.avatar} icone={wa.avatarIcone} />
              )}
              <View>
                <Text style={[s.nom, { color: actif ? c.onAccentWash : c.ink }]}>{p.nom}</Text>
                <Text style={[s.role, { color: c.muted }]}>{p.role}</Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      {enAttente.length > 0 && (
        <>
          <Text style={[s.titre, s.second, { color: c.muted }]}>Démo · paiements Mercado Pago</Text>
          <View style={s.personnes}>
            {enAttente.map((e) => (
              <View key={e.id} style={[s.personne, s.paiement, { backgroundColor: c.surface, borderColor: c.line }]}>
                <View>
                  <Text style={[s.nom, { color: c.ink }]}>{e.nom.split(' ')[0]}</Text>
                  <Text style={[s.role, { color: c.muted }]}>{pesos(e.lien!.montant)}</Text>
                </View>
                <Pressable onPress={() => payer(e.id)} accessibilityRole="button" accessibilityLabel={`Simuler le paiement de ${e.nom}`}
                           style={({ pressed }) => [s.action, { backgroundColor: c.okWash }, pressed && { opacity: 0.7 }]}>
                  <Text style={[s.actionTexte, { color: c.ok }]}>Payer</Text>
                </Pressable>
                <Pressable onPress={() => expirer(e.id)} accessibilityRole="button" accessibilityLabel={`Laisser expirer le lien de ${e.nom}`}
                           style={({ pressed }) => [s.action, { borderColor: c.line, borderWidth: 1 }, pressed && { opacity: 0.7 }]}>
                  <Text style={[s.actionTexte, { color: c.muted }]}>Expirer</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  barre: { alignItems: 'center', gap: 8, marginBottom: 14, maxWidth: 640 },
  titre: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  personnes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  personne: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingLeft: 4, paddingRight: 14, paddingVertical: 4 },
  initiale: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  initialeTexte: { fontSize: 13, fontWeight: '700' },
  nom: { fontSize: 14, fontWeight: '600' },
  role: { fontSize: 11 },
  second: { marginTop: 4 },
  paiement: { paddingLeft: 14, paddingRight: 6, gap: 10 },
  action: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actionTexte: { fontSize: 13, fontWeight: '600' },
})
