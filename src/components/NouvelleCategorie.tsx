import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feuille } from '@/components/Feuille'
import { useEtat, useT } from '@/lib/etat'
import { AvatarVide, Icon } from '@/lib/icons'
import { useWa } from '@/lib/theme'

/**
 * Le « + » des filtres : comme « Nouvelle liste » dans WhatsApp, un nom puis
 * les discussions à y mettre. Ferme en rendant l'id créé, ou rien.
 */
export function NouvelleCategorie({ visible, onClose }: { visible: boolean; onClose: (id?: string) => void }) {
  const wa = useWa()
  const t = useT()
  const insets = useSafeAreaInsets()
  const { convs, ajouterCategorie } = useEtat()
  const [nom, setNom] = useState('')
  const [choisis, setChoisis] = useState<string[]>([])

  const fermer = (id?: string) => { setNom(''); setChoisis([]); onClose(id) }
  const creer = () => { if (nom.trim()) fermer(ajouterCategorie(nom.trim(), choisis)) }
  const basculer = (id: string) => setChoisis((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]))

  return (
    <Feuille visible={visible} onClose={() => fermer()}>
      <View style={[s.flex, { backgroundColor: wa.fond, paddingBottom: insets.bottom }]}>
        <View style={[s.entete, { borderBottomColor: wa.ligne }]}>
          <Pressable onPress={() => fermer()} hitSlop={12}><Text style={[s.action, { color: wa.encre }]}>{t('Cancelar', 'Annuler')}</Text></Pressable>
          <Text style={[s.titre, { color: wa.encre }]}>{t('Nueva categoría', 'Nouvelle catégorie')}</Text>
          <Pressable onPress={creer} hitSlop={12} disabled={!nom.trim()}>
            <Text style={[s.action, s.gras, { color: nom.trim() ? wa.vert : wa.gris }]}>{t('Crear', 'Créer')}</Text>
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.contenu}>
          <View style={[s.champ, { backgroundColor: wa.champ }]}>
            <TextInput value={nom} onChangeText={setNom} autoFocus onSubmitEditing={creer}
                       placeholder={t('Nombre, por ejemplo «Grupos»', 'Nom, par exemple « Groupes »')}
                       placeholderTextColor={wa.gris} style={[s.champTexte, { color: wa.encre }]} />
          </View>

          <Text style={[s.section, { color: wa.gris }]}>{t('Agregar chats', 'Ajouter des discussions')}</Text>
          <View style={[s.groupe, { backgroundColor: wa.champ }]}>
            {convs.map((c, i) => {
              const pris = choisis.includes(c.id)
              return (
                <Pressable key={c.id} onPress={() => basculer(c.id)} accessibilityRole="checkbox" accessibilityState={{ checked: pris }} style={s.ligne}>
                  <AvatarVide size={36} fond={wa.avatar} icone={wa.avatarIcone} />
                  <View style={[s.ligneCorps, i < convs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: wa.ligne }]}>
                    <Text style={[s.nom, { color: wa.encre }]}>{c.nom}</Text>
                    <View style={[s.case, pris ? { backgroundColor: wa.vert, borderColor: wa.vert } : { borderColor: wa.chipBord }]}>
                      {pris && <Icon name="checkPlain" size={14} color={wa.surVert} trait={3} />}
                    </View>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </View>
    </Feuille>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth },
  titre: { fontSize: 17, fontWeight: '600' },
  action: { fontSize: 17 },
  gras: { fontWeight: '600' },
  contenu: { padding: 16, gap: 8 },
  champ: { borderRadius: 12, paddingHorizontal: 12, height: 44, justifyContent: 'center' },
  champTexte: { fontSize: 17, height: 44 },
  section: { fontSize: 13, textTransform: 'uppercase', marginTop: 16, marginLeft: 4 },
  groupe: { borderRadius: 12, paddingLeft: 12 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ligneCorps: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingRight: 12 },
  nom: { flex: 1, fontSize: 17 },
  case: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
})
