import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NouvelleCategorie } from '@/components/NouvelleCategorie'
import { Points } from '@/components/Points'
import { BoutonAgent } from '@/components/Agent'
import { Glisser } from '@/components/Glisser'
import { Repere } from '@/components/Repere'
import type { Conversation } from '@/lib/demo'
import { estPourMoi, useEtat, useT, type Categorie } from '@/lib/etat'
import { Avatar, Icon, type IconName } from '@/lib/icons'
import { useWa } from '@/lib/theme'

/** `action`, `encours`, `toutes`, ou l'id d'une catégorie créée par l'hôtelier. */
type Filtre = string

/**
 * Le premier écran : les conversations WhatsApp, comme dans WhatsApp. On
 * arrive sur « Action requise », la seule liste que l'hôtelier doit lire.
 */
export default function Discussions() {
  const wa = useWa()
  const t = useT()
  const { conecte, convs, categories, agentLance, regleContacts, mettrePourMoi } = useEtat()
  // Agent pas encore lancé : rien n'est trié, on ne montre que « Toutes ».
  const [filtre, setFiltre] = useState<Filtre>(agentLance ? 'action' : 'toutes')
  const verrouille = !agentLance && (filtre === 'action' || filtre === 'encours')
  const [recherche, setRecherche] = useState('')
  const [creation, setCreation] = useState(false)

  const moi = (c: Conversation) => estPourMoi(c, regleContacts)
  const nPourMoi = convs.filter(moi).length
  const nAction = convs.filter((c) => !moi(c) && garde(c, 'action', categories)).length
  const q = recherche.trim().toLowerCase()
  // « Pour moi » sort de toutes les listes : on ne la voit qu'en l'ouvrant.
  const liste = convs.filter((c) => (filtre === 'pourmoi' ? moi(c) : !moi(c) && garde(c, filtre, categories)) && (!q || c.nom.toLowerCase().includes(q)))

  return (
    <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: wa.fond }]}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={s.haut}>
          <Rond icon="dots" />
          <View style={s.hautDroite}>
            <Rond icon="camera" />
            <Repere cle="nouvelleReservation" rayon={24}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('Nueva reserva', 'Nouvelle réservation')}
                         style={[s.rond, { backgroundColor: wa.vert }]}>
                <Icon name="plus" size={22} color={wa.surVert} trait={2.4} />
              </Pressable>
            </Repere>
          </View>
        </View>

        <View style={s.titreLigne}>
          <Text accessibilityRole="header" style={[s.titre, { color: wa.encre }]}>{t('Chats', 'Discussions')}</Text>
          <BoutonAgent />
        </View>

        <View style={[s.champ, { backgroundColor: wa.champ }]}>
          <Icon name="search" size={18} color={wa.gris} />
          <TextInput value={recherche} onChangeText={setRecherche} placeholder={t('Buscar', 'Rechercher')}
                     placeholderTextColor={wa.gris} style={[s.champTexte, { color: wa.encre }]} />
        </View>

        {conecte ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtres} style={s.filtresZone}>
              <Repere cle="filtreAction" rayon={22}>
                <Chip actif={filtre === 'action'} eteint={!agentLance} onPress={() => setFiltre('action')}
                      label={t('Te toca', 'Action requise') + (agentLance && nAction > 0 ? ` ${nAction}` : '')} />
              </Repere>
              <Chip actif={filtre === 'encours'} eteint={!agentLance} onPress={() => setFiltre('encours')} label={t('En curso', 'En cours')} points={agentLance} />
              <Chip actif={filtre === 'toutes'} onPress={() => setFiltre('toutes')} label={t('Todos', 'Toutes')} />
              {categories.map((cat) => (
                <Chip key={cat.id} actif={filtre === cat.id} onPress={() => setFiltre(cat.id)} label={cat.nom} />
              ))}
              <Repere cle="categorie" rayon={22}>
                <Pressable onPress={() => setCreation(true)} accessibilityRole="button"
                           accessibilityLabel={t('Crear una categoría', 'Créer une catégorie')}
                           style={[s.chip, s.chipPlus, { borderColor: wa.chipBord }]}>
                  <Icon name="plus" size={18} color={wa.chipEncre} />
                </Pressable>
              </Repere>
            </ScrollView>

            <Pressable onPress={() => setFiltre(filtre === 'pourmoi' ? (agentLance ? 'action' : 'toutes') : 'pourmoi')} accessibilityRole="button" style={s.archives}>
              <View style={s.archivesIcone}><Icon name="lock" size={21} color={filtre === 'pourmoi' ? wa.zoneMoi : wa.gris} trait={1.6} /></View>
              <View style={[s.archivesCorps, { borderBottomColor: wa.ligne }]}>
                <Text style={[s.archivesTexte, { color: filtre === 'pourmoi' ? wa.zoneMoi : wa.encre }]}>Pour moi</Text>
                <Text style={[s.heure, { color: wa.gris }]}>{filtre === 'pourmoi' ? 'Fermer' : nPourMoi}</Text>
              </View>
            </Pressable>
            {filtre === 'pourmoi' && (
              <Text style={[s.pourMoiNote, { color: wa.gris }]}>
                L’assistant ne répond jamais ici. Glissez une discussion vers la gauche pour la rendre à l’assistant.
              </Text>
            )}
            {verrouille ? (
              <View style={[s.verrou, { backgroundColor: wa.champ }]}>
                <Icon name="sparkles" size={28} color={wa.vert} plein />
                <Text style={[s.connecterTitre, { color: wa.encre, textAlign: 'center' }]}>Configurez votre agent</Text>
                <Text style={[s.apercu, s.verrouTexte, { color: wa.gris }]}>
                  {filtre === 'action'
                    ? 'Une fois lancé, il range ici les discussions qui ont besoin de vous.'
                    : 'Une fois lancé, vous verrez ici les discussions qu’il mène pour vous.'}
                </Text>
                <Pressable onPress={() => router.push({ pathname: '/configurer', params: { parcours: 'rapide' } })} accessibilityRole="button"
                           style={[s.connecterBouton, { backgroundColor: wa.vert }]}>
                  <Text style={[s.connecterBoutonTexte, { color: wa.surVert }]}>Configurer mon agent</Text>
                </Pressable>
              </View>
            ) : liste.map((c) => (
              <Glisser key={c.id} icon={moi(c) ? 'sparkles' : 'lock'} couleur={moi(c) ? wa.vert : wa.zoneMoi}
                       label={moi(c) ? 'À l’assistant' : 'Pour moi'} onAction={() => mettrePourMoi(c.id, !moi(c))}>
                <Ligne c={c} />
              </Glisser>
            ))}
            {!verrouille && liste.length === 0 && (
              <Text style={[s.vide, { color: wa.gris }]}>
                {filtre === 'action'
                  ? t('Nada que hacer por ahora: el asistente se ocupa.', 'Rien à faire pour l’instant : l’assistant s’en occupe.')
                  : t('No hay chats acá.', 'Aucune discussion ici.')}
              </Text>
            )}
          </>
        ) : (
          <View style={[s.connecter, { borderColor: wa.ligne }]}>
            <Icon name="whatsapp" size={28} color={wa.vert} />
            <Text style={[s.connecterTitre, { color: wa.encre }]}>{t('Conectá tu WhatsApp', 'Connectez votre WhatsApp')}</Text>
            <Text style={[s.apercu, { color: wa.gris, textAlign: 'center' }]}>
              {t('Para ver acá los chats de tus huéspedes.', 'Pour voir ici les discussions de vos voyageurs.')}
            </Text>
            <Pressable onPress={() => router.push('/conectar')} style={[s.connecterBouton, { backgroundColor: wa.vert }]}>
              <Text style={[s.connecterBoutonTexte, { color: wa.surVert }]}>{t('Conectar', 'Connecter')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <NouvelleCategorie visible={creation} onClose={(id) => { setCreation(false); if (id) setFiltre(id) }} />
    </SafeAreaView>
  )
}

function garde(c: Conversation, f: Filtre, categories: Categorie[]) {
  if (f === 'toutes') return true
  if (f === 'action') return c.colonne === 'action'
  if (f === 'encours') return !!c.enCours && !c.pause
  return categories.find((cat) => cat.id === f)?.ids.includes(c.id) ?? false
}

function Chip({ label, actif, onPress, points, eteint }: { label: string; actif: boolean; onPress: () => void; points?: boolean; eteint?: boolean }) {
  const wa = useWa()
  const encre = actif && !eteint ? wa.vertEncre : wa.chipEncre
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: actif }}
               style={[s.chip, actif && !eteint ? { backgroundColor: wa.vertWash, borderColor: wa.vertWash } : { borderColor: wa.chipBord }, eteint && { opacity: actif ? 0.7 : 0.4 }]}>
      <Text style={[s.chipTexte, { color: encre }]}>{label}</Text>
      {points && <Points color={encre} taille={4} />}
    </Pressable>
  )
}

function Rond({ icon }: { icon: IconName }) {
  const wa = useWa()
  return (
    <Pressable accessibilityRole="button" style={[s.rond, { backgroundColor: wa.bouton }]}>
      <Icon name={icon} size={icon === 'dots' ? 22 : 20} color={wa.encre} trait={icon === 'dots' ? 3 : 1.8} />
    </Pressable>
  )
}

function Ligne({ c }: { c: Conversation }) {
  const wa = useWa()
  const t = useT()
  const { agentLance } = useEtat()
  const ecrit = c.ecrit && agentLance && !c.pause
  const q = c.quand
  const quand = q.jour === 'date' ? q.date : q.jour === 'semaine' ? t(q.es, q.fr) : q.jour === 'ayer' ? t('Ayer', 'Hier') : q.heure
  const nonLu = c.nonLus > 0
  const d = c.messages[c.messages.length - 1]

  return (
    <Pressable onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
               style={({ pressed }) => [s.ligne, pressed && { backgroundColor: wa.champ }]}>
      <Avatar size={54} photo={c.photo} fond={wa.avatar} icone={wa.avatarIcone} />
      <View style={[s.corps, { borderBottomColor: wa.ligne }]}>
        <View style={s.rangee}>
          <Text numberOfLines={1} style={[s.nom, { color: wa.encre }]}>{c.nom}</Text>
          <Text style={[s.heure, { color: nonLu || ecrit ? wa.vert : wa.gris }]}>{quand}</Text>
        </View>
        <View style={s.rangee}>
          {ecrit ? (
            <View style={s.ecrit}>
              <Text style={[s.ecritTexte, { color: wa.vert }]}>{t('El asistente está escribiendo', 'L’assistant écrit')}</Text>
              <Points color={wa.vert} taille={4} />
            </View>
          ) : (
            <Text numberOfLines={2} style={[s.apercu, { color: wa.gris }]}>
              {d.de === 'hotel' && <><Icon name="checks" size={16} color={d.lu ? wa.lu : wa.gris} />{' '}</>}
              {d.vocal
                ? <><Icon name="mic" size={15} color={wa.vert} plein />{' '}{t(`Mensaje de voz (${d.vocal})`, `Message vocal (${d.vocal})`)}</>
                : d.texte}
            </Text>
          )}
          <View style={s.marques}>
            {c.epingle && <Icon name="pin" size={17} color={wa.gris} plein />}
            {nonLu && <View style={[s.badge, { backgroundColor: wa.vert }]}><Text style={[s.badgeTexte, { color: wa.surVert }]}>{c.nonLus}</Text></View>}
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  haut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6 },
  hautDroite: { flexDirection: 'row', gap: 12 },
  rond: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titreLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 14, marginTop: 10, marginBottom: 8 },
  titre: { fontSize: 34, fontWeight: '700', letterSpacing: 0.3, paddingHorizontal: 16 },
  champ: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 10, height: 38 },
  champTexte: { flex: 1, fontSize: 17, height: 38 },
  filtres: { gap: 8, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center' },
  filtresZone: { overflow: 'visible' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, height: 32, flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipPlus: { paddingHorizontal: 0, width: 32, justifyContent: 'center' },
  chipTexte: { fontSize: 15, fontWeight: '500' },
  archives: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  archivesIcone: { width: 54, alignItems: 'center' },
  archivesCorps: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 12, paddingRight: 16, height: 48, borderBottomWidth: StyleSheet.hairlineWidth },
  archivesTexte: { fontSize: 17, fontWeight: '500' },
  ligne: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  corps: { flex: 1, marginLeft: 12, paddingRight: 16, paddingVertical: 12, minHeight: 80, justifyContent: 'center', gap: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  rangee: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nom: { flex: 1, fontSize: 17, fontWeight: '600' },
  heure: { fontSize: 15 },
  apercu: { flex: 1, fontSize: 15, lineHeight: 20 },
  ecrit: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 20 },
  ecritTexte: { fontSize: 15, lineHeight: 20 },
  marques: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeTexte: { fontSize: 13, fontWeight: '600' },
  vide: { textAlign: 'center', paddingVertical: 48, paddingHorizontal: 32, fontSize: 15, lineHeight: 21 },
  pourMoiNote: { fontSize: 13, lineHeight: 18, paddingHorizontal: 16, paddingVertical: 8, textAlign: 'center' },
  verrou: { margin: 16, padding: 24, borderRadius: 16, alignItems: 'center', gap: 10 },
  verrouTexte: { flex: 0, textAlign: 'center' },
  connecter: { margin: 16, marginTop: 24, padding: 24, borderWidth: 1, borderRadius: 16, alignItems: 'center', gap: 8 },
  connecterTitre: { fontSize: 20, fontWeight: '700' },
  connecterBouton: { marginTop: 8, borderRadius: 999, paddingHorizontal: 24, height: 44, justifyContent: 'center' },
  connecterBoutonTexte: { fontSize: 17, fontWeight: '600' },
})
