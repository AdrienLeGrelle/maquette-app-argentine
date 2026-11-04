import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Interrupteur } from '@/components/Formulaire'
import { ACCES, MODELES, nomRole, type Acces, type Membre } from '@/lib/equipe'
import { useEtat } from '@/lib/etat'
import { Avatar, Icon } from '@/lib/icons'
import { telChiffres, telComplet, telLisible } from '@/lib/tel'
import { useWa } from '@/lib/theme'

/**
 * Inviter un employé, ou changer ce qu'il peut faire : un prénom, son numéro
 * WhatsApp, un rôle tout prêt, puis les accès un par un. Il se connectera avec
 * le code reçu sur WhatsApp, jamais avec un mot de passe.
 */
export function FicheMembre({ membre, visible, onClose }: { membre?: Membre; visible: boolean; onClose: () => void }) {
  const wa = useWa()
  const insets = useSafeAreaInsets()
  const { enregistrerMembre, retirerMembre } = useEtat()
  const [prenom, setPrenom] = useState(membre?.prenom ?? '')
  const [tel, setTel] = useState(membre?.tel ?? '')
  const [acces, setAcces] = useState<Acces[]>(membre?.acces ?? MODELES[0].acces)
  const [renvoye, setRenvoye] = useState(false)

  const nouveau = !membre
  const pret = prenom.trim().length > 0 && telComplet(tel) && acces.length > 0
  const role = nomRole(acces)
  // On garde l'ordre de la liste des accès, quel que soit l'ordre des clics.
  const basculer = (a: Acces) => setAcces((as) => ACCES.map((x) => x.cle).filter((x) => (x === a ? !as.includes(a) : as.includes(x))))
  const valider = () => {
    if (!pret) return
    enregistrerMembre({ id: membre?.id ?? `m-${Date.now()}`, prenom: prenom.trim(), tel, acces, statut: membre?.statut ?? 'invite', photo: membre?.photo })
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.flex, { backgroundColor: wa.fond, paddingBottom: insets.bottom }]}>
        <View style={[s.entete, { borderBottomColor: wa.ligne }]}>
          <Pressable onPress={onClose} hitSlop={12}><Text style={[s.action, { color: wa.encre }]}>Annuler</Text></Pressable>
          <Text style={[s.titre, { color: wa.encre }]}>{nouveau ? 'Nouvel employé' : membre.prenom}</Text>
          <Pressable onPress={valider} hitSlop={12} disabled={!pret}>
            <Text style={[s.action, s.gras, { color: pret ? wa.vert : wa.gris }]}>{nouveau ? 'Inviter' : 'OK'}</Text>
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.contenu}>
          {nouveau ? (
            <>
              <View style={[s.champ, { backgroundColor: wa.champ }]}>
                <TextInput value={prenom} onChangeText={setPrenom} autoFocus placeholder="Prénom" autoCapitalize="words"
                           placeholderTextColor={wa.gris} style={[s.champTexte, { color: wa.encre }]} />
              </View>
              <View style={[s.champ, s.champTel, { backgroundColor: wa.champ }]}>
                <Icon name="whatsapp" size={20} color={wa.vert} trait={1.8} />
                <Text style={[s.prefixe, { color: wa.encre }]}>+54 9</Text>
                <TextInput value={tel} onChangeText={(v) => setTel(telChiffres(v).slice(0, 10))} keyboardType="phone-pad"
                           placeholder="388 412 3456" placeholderTextColor={wa.gris} accessibilityLabel="Numéro WhatsApp"
                           style={[s.champTexte, s.flex, { color: wa.encre }]} />
              </View>
              <Text style={[s.aide, { color: wa.gris }]}>Indicatif et numéro, sans le 0 ni le 15.</Text>
            </>
          ) : (
            <View style={s.portrait}>
              <Avatar size={72} photo={membre.photo} fond={wa.avatar} icone={wa.avatarIcone} />
              <Text style={[s.portraitTel, { color: wa.gris }]}>{telLisible(membre.tel)}</Text>
            </View>
          )}

          <Text style={[s.section, { color: wa.gris }]}>Son rôle</Text>
          <View style={s.modeles}>
            {[...MODELES.map((m) => m.nom), 'Sur mesure'].map((nom) => {
              const actif = role === nom
              const modele = MODELES.find((m) => m.nom === nom)
              return (
                <Pressable key={nom} onPress={() => modele && setAcces(modele.acces)} disabled={!modele}
                           accessibilityRole="radio" accessibilityState={{ checked: actif }}
                           style={[s.puce, actif ? { backgroundColor: wa.vertWash, borderColor: wa.vertWash } : { borderColor: wa.chipBord }, !modele && !actif && s.eteint]}>
                  <Text style={[s.puceTexte, { color: actif ? wa.vertEncre : wa.chipEncre }]}>{nom}</Text>
                </Pressable>
              )
            })}
          </View>

          <Text style={[s.section, { color: wa.gris }]}>Ce qu’il peut faire</Text>
          <View style={[s.groupe, { backgroundColor: wa.champ }]}>
            {ACCES.map((a, i) => (
              <View key={a.cle} style={i < ACCES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: wa.ligne }}>
                <Interrupteur label={a.titre} sous={a.sous} valeur={acces.includes(a.cle)} onChange={() => basculer(a.cle)}
                              avant={<Icon name={a.icon} size={20} color={wa.encre} trait={1.7} />} />
              </View>
            ))}
          </View>

          <Text style={[s.section, { color: wa.gris }]}>Réservé au gérant</Text>
          <View style={[s.groupe, { backgroundColor: wa.champ }]}>
            {['Inviter et gérer l’équipe', 'Vos discussions Perso'].map((titre, i) => (
              <View key={titre} style={[s.verrou, i === 0 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: wa.ligne }]}>
                <Icon name="lock" size={18} color={wa.gris} trait={1.8} />
                <Text style={[s.verrouTexte, { color: wa.gris }]}>{titre}</Text>
              </View>
            ))}
          </View>

          <View style={[s.note, { backgroundColor: wa.vertWash }]}>
            <Icon name="whatsapp" size={18} color={wa.vertEncre} trait={1.8} />
            <Text style={[s.noteTexte, { color: wa.vertEncre }]}>
              {nouveau
                ? `${prenom.trim() || 'Votre employé'} recevra un message WhatsApp de Roomz avec un code pour se connecter. Aucun mot de passe à retenir.`
                : membre.statut === 'invite'
                  ? `${membre.prenom} n’a pas encore tapé son code. Il le reçoit sur WhatsApp, valable dix minutes.`
                  : `${membre.prenom} se connecte avec un code reçu sur WhatsApp. Vos changements s’appliquent tout de suite.`}
            </Text>
          </View>

          {!nouveau && (
            <View style={[s.groupe, { backgroundColor: wa.champ }]}>
              {membre.statut === 'invite' && (
                <Pressable onPress={() => setRenvoye(true)} accessibilityRole="button"
                           style={[s.bouton, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: wa.ligne }]}>
                  <Text style={[s.boutonTexte, { color: wa.vert }]}>{renvoye ? 'Invitation renvoyée ✓' : 'Renvoyer l’invitation'}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => { retirerMembre(membre.id); onClose() }} accessibilityRole="button" style={s.bouton}>
                <Text style={[s.boutonTexte, { color: wa.danger }]}>Retirer de l’équipe</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: StyleSheet.hairlineWidth },
  titre: { fontSize: 17, fontWeight: '600' },
  action: { fontSize: 17 },
  gras: { fontWeight: '600' },
  contenu: { padding: 16, gap: 8, paddingBottom: 40 },
  portrait: { alignItems: 'center', gap: 6, marginBottom: 4 },
  portraitTel: { fontSize: 15 },
  champ: { borderRadius: 12, paddingHorizontal: 12, height: 48, justifyContent: 'center' },
  champTel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  champTexte: { fontSize: 17, height: 48 },
  prefixe: { fontSize: 17, fontWeight: '500' },
  aide: { fontSize: 13, marginLeft: 4 },
  section: { fontSize: 13, textTransform: 'uppercase', marginTop: 16, marginLeft: 4 },
  modeles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  puce: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  puceTexte: { fontSize: 15, fontWeight: '500' },
  eteint: { opacity: 0.5 },
  groupe: { borderRadius: 12, paddingHorizontal: 12 },
  verrou: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  verrouTexte: { fontSize: 16 },
  note: { flexDirection: 'row', gap: 10, borderRadius: 12, padding: 12, marginTop: 16, marginBottom: 8 },
  noteTexte: { flex: 1, fontSize: 14, lineHeight: 19 },
  bouton: { minHeight: 48, justifyContent: 'center' },
  boutonTexte: { fontSize: 17 },
})
