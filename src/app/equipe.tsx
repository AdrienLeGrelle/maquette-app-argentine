import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FicheMembre } from '@/components/FicheMembre'
import { ACCES, nomRole, type Membre } from '@/lib/equipe'
import { useEtat } from '@/lib/etat'
import { Avatar, Icon } from '@/lib/icons'
import { telLisible } from '@/lib/tel'
import { useCal, useWa } from '@/lib/theme'

/** Où passe le tronc : au milieu de l'avatar du gérant. */
const TRONC = 40
/** Largeur de la colonne des branches, à gauche de chaque carte. */
const COLONNE = 62

/**
 * L'équipe, en arbre : le gérant en haut, qui a tout ; chaque employé est une
 * branche qui descend de lui. La dernière branche, en pointillés, en ajoute un.
 */
export default function Equipe() {
  const wa = useWa()
  const insets = useSafeAreaInsets()
  const { config, tel, equipe } = useEtat()
  // undefined : fiche fermée ; null : nouvel employé ; sinon l'employé ouvert.
  const [ouvert, setOuvert] = useState<Membre | null | undefined>(undefined)

  return (
    <View style={[s.flex, { backgroundColor: wa.fond }]}>
      <View style={[s.entete, { paddingTop: insets.top + 6, borderBottomColor: wa.ligne }]}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/ajustes'))} hitSlop={10}
                   accessibilityRole="button" accessibilityLabel="Retour" style={s.retour}>
          <Icon name="chevL" size={28} color={wa.encre} trait={2.2} />
        </Pressable>
        <Text style={[s.enteteTitre, { color: wa.encre }]}>Équipe</Text>
      </View>

      <ScrollView contentContainerStyle={[s.contenu, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={[s.intro, { color: wa.gris }]}>
          Tout le monde travaille sur le même calendrier : une chambre prise par l’un est prise pour tous.
        </Text>

        <View style={[s.carte, s.gerant, { backgroundColor: wa.champ }]}>
          <View style={[s.initiale, { backgroundColor: wa.vert }]}>
            <Text style={[s.initialeTexte, { color: wa.surVert }]}>{(config.prenom || 'V').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={s.flex}>
            <Text style={[s.nom, { color: wa.encre }]}>{config.prenom || 'Vous'}</Text>
            <Text style={[s.role, { color: wa.gris }]}>Gérant · tous les accès</Text>
            <Text style={[s.role, { color: wa.gris }]}>{telLisible(tel)}</Text>
          </View>
        </View>

        {equipe.map((m) => (
          <Branche key={m.id}>
            <Pressable onPress={() => setOuvert(m)} accessibilityRole="button" accessibilityLabel={`${m.prenom}, ${nomRole(m.acces)}`}
                       style={({ pressed }) => [s.carte, { backgroundColor: wa.champ, opacity: pressed ? 0.7 : 1 }]}>
              <Avatar size={44} photo={m.photo} fond={wa.avatar} icone={wa.avatarIcone} />
              <View style={[s.flex, s.corps]}>
                <Text numberOfLines={1} style={[s.nom, { color: wa.encre }]}>{m.prenom}</Text>
                <View style={s.ligneRole}>
                  <Text style={[s.role, { color: wa.gris }]}>{nomRole(m.acces)}</Text>
                  <Statut statut={m.statut} />
                </View>
                <View style={s.icones}>
                  {ACCES.filter((a) => m.acces.includes(a.cle)).map((a) => <Icon key={a.cle} name={a.icon} size={15} color={wa.gris} trait={1.8} />)}
                </View>
              </View>
              <Icon name="chevR" size={16} color={wa.gris} />
            </Pressable>
          </Branche>
        ))}

        <Branche derniere>
          <Pressable onPress={() => setOuvert(null)} accessibilityRole="button"
                     style={({ pressed }) => [s.carte, s.ajout, { borderColor: wa.vert, opacity: pressed ? 0.7 : 1 }]}>
            <View style={[s.plus, { backgroundColor: wa.vertWash }]}><Icon name="plus" size={22} color={wa.vertEncre} trait={2.2} /></View>
            <Text style={[s.ajoutTexte, { color: wa.vert }]}>Ajouter un employé</Text>
          </Pressable>
        </Branche>
      </ScrollView>

      {/* Une fiche neuve à chaque ouverture : la clé remet ses champs à zéro. */}
      <FicheMembre key={ouvert === undefined ? 'fermee' : ouvert?.id ?? 'nouveau'} membre={ouvert ?? undefined}
                   visible={ouvert !== undefined} onClose={() => setOuvert(undefined)} />
    </View>
  )
}

/** Une branche : le tronc qui descend, et le trait qui part vers la carte. */
function Branche({ children, derniere }: { children: React.ReactNode; derniere?: boolean }) {
  const wa = useWa()
  return (
    <View style={s.branche}>
      <View style={s.colonne}>
        <View style={[s.tronc, { backgroundColor: wa.chipBord }, derniere && s.troncFin]} />
        <View style={[s.rameau, { backgroundColor: wa.chipBord }]} />
      </View>
      <View style={s.flex}>{children}</View>
    </View>
  )
}

function Statut({ statut }: { statut: Membre['statut'] }) {
  const wa = useWa()
  const cal = useCal()
  const actif = statut === 'actif'
  return (
    <View style={[s.statut, { backgroundColor: actif ? wa.vertWash : cal.lavisAttente }]}>
      <Text style={[s.statutTexte, { color: actif ? wa.vertEncre : cal.texteAttente }]}>{actif ? 'Actif' : 'En attente'}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  retour: { minWidth: 36, minHeight: 44, justifyContent: 'center' },
  enteteTitre: { flex: 1, fontSize: 18, fontWeight: '600' },
  contenu: { padding: 16 },
  intro: { fontSize: 14, lineHeight: 19, marginBottom: 16, marginHorizontal: 4 },
  carte: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 12, marginVertical: 6 },
  gerant: { padding: 14, marginVertical: 0, gap: 14 },
  initiale: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  initialeTexte: { fontSize: 22, fontWeight: '700' },
  corps: { gap: 2 },
  ligneRole: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  nom: { fontSize: 17, fontWeight: '600' },
  role: { fontSize: 14 },
  icones: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statut: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statutTexte: { fontSize: 12, fontWeight: '600' },
  branche: { flexDirection: 'row' },
  colonne: { width: COLONNE },
  tronc: { position: 'absolute', left: TRONC - 1, width: 2, top: 0, bottom: 0 },
  troncFin: { bottom: '50%' },
  rameau: { position: 'absolute', left: TRONC - 1, right: 0, top: '50%', height: 2, marginTop: -1 },
  ajout: { borderWidth: 1.5, borderStyle: 'dashed' },
  plus: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ajoutTexte: { fontSize: 17, fontWeight: '600' },
})
