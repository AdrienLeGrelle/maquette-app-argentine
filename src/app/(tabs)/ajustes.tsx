import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Interrupteur } from '@/components/Formulaire'
import { LogoCanal } from '@/components/Logos'
import { Repere } from '@/components/Repere'
import { EcranOnglet } from '@/components/wa'
import { ETAPES_COMPLETES, ETAPES_RAPIDES, useEtat, type Etape } from '@/lib/etat'
import { nomRole } from '@/lib/equipe'
import { Avatar, Icon, type IconName } from '@/lib/icons'
import { telLisible } from '@/lib/tel'
import { num, useWa } from '@/lib/theme'

/**
 * Paramètres : l'avancement de la configuration en haut, puis chaque réglage
 * sur une ligne. Toucher une ligne ouvre l'étape du questionnaire.
 */
export default function Ajustes() {
  const wa = useWa()
  const { conecte, tel, recommencer, config, faites, agentLance, lancerAgent, regleContacts, setRegleContacts, equipe, membreVu, peut } = useEtat()
  // Le gérant voit tout ; un employé, seulement les réglages qu'on lui a ouverts.
  const gerant = !membreVu
  const fait = (e: Etape) => faites.includes(e)
  // Avant le lancement : le démarrage rapide. Après : ce qui reste de la configuration complète.
  const parcours = agentLance ? ETAPES_COMPLETES : ETAPES_RAPIDES
  const reste = parcours.filter((e) => !fait(e))
  const nFaites = parcours.length - reste.length
  const ouvrir = (etape: Etape) => router.push({ pathname: '/configurer', params: { etape } })
  const nCanaux = Object.values(config.canaux).filter(Boolean).length

  return (
    <EcranOnglet titre="Paramètres">
      <ScrollView contentContainerStyle={s.contenu}>
        {!peut('agent') ? null : !agentLance || reste.length > 0 ? (
          <View style={[s.banniere, { backgroundColor: wa.vertWash }]}>
            <Text style={[s.banniereTitre, { color: wa.vertEncre }]}>{agentLance ? 'Complétez la configuration' : 'Lancez votre agent'}</Text>
            <Text style={[s.banniereTexte, { color: wa.vertEncre }]}>
              {agentLance
                ? 'Votre agent tourne. Ajoutez vos règles, Mercado Pago, votre style et vos autres canaux pour qu’il fasse encore mieux.'
                : '4 questions simples, 2 minutes : ensuite il trie vos discussions et répond à vos voyageurs.'}
            </Text>
            <View style={s.progression}>
              {parcours.map((e) => <View key={e} style={[s.segment, { backgroundColor: fait(e) ? wa.vert : wa.fond }]} />)}
            </View>
            <Text style={[s.compte, num, { color: wa.vertEncre }]}>{nFaites} sur {parcours.length} étapes</Text>
            <Pressable onPress={() => (!agentLance && reste.length === 0 ? lancerAgent() : router.push({ pathname: '/configurer', params: { parcours: agentLance ? 'complet' : 'rapide', ...(reste[0] ? { etape: reste[0] } : {}) } }))}
                       accessibilityRole="button" style={({ pressed }) => [s.bouton, { backgroundColor: wa.vert, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={[s.boutonTexte, { color: wa.surVert }]}>{agentLance ? 'Continuer' : nFaites === 0 ? 'Commencer' : reste.length ? 'Continuer' : 'Lancer l’agent'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[s.pret, { backgroundColor: wa.vertWash }]}>
            <Icon name="checkPlain" size={20} color={wa.vertEncre} trait={2.5} />
            <Text style={[s.pretTexte, { color: wa.vertEncre }]}>Agent lancé, configuration complète.</Text>
          </View>
        )}

        <View style={[s.profil, { backgroundColor: wa.champ }]}>
          {membreVu ? <Avatar size={60} photo={membreVu.photo} fond={wa.avatar} icone={wa.avatarIcone} /> : (
            <View style={[s.avatar, { backgroundColor: wa.vert }]}>
              <Text style={[s.avatarTexte, { color: wa.surVert }]}>{(config.prenom || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={s.flex}>
            <Text style={[s.nom, { color: wa.encre }]}>{membreVu?.prenom ?? (config.prenom || 'Vous')}</Text>
            <Text style={[s.sous, { color: wa.gris }]}>
              {membreVu
                ? [nomRole(membreVu.acces), config.hotel].filter(Boolean).join(' · ')
                : config.hotel ? [config.hotel, config.ville].filter(Boolean).join(' · ') : 'Votre établissement'}
            </Text>
          </View>
        </View>

        {membreVu && !peut('chambres') && !peut('agent') && (
          <Text style={[s.sous, s.reserve, { color: wa.gris }]}>
            Les réglages de l’établissement sont gérés par {config.prenom || 'le gérant'}.
          </Text>
        )}

        {gerant && <Section>
          <Rangee cle="equipe" icon="users" titre="Équipe" onPress={() => router.push('/equipe')} dernier
                  apres={<Text style={[s.rangeeDetail, { color: wa.gris }]}>{equipe.length ? `${equipe.length} employé${equipe.length > 1 ? 's' : ''}` : 'Inviter'}</Text>} />
        </Section>}

        {(gerant || peut('chambres')) && <Section titre="Votre établissement">
          {gerant && <>
          <Rangee cle="vous" icon="user" titre="Vous" detail={config.prenom || undefined} fait={fait('vous')} onPress={() => ouvrir('vous')} />
          <Rangee cle="hotel" icon="building" titre="L’établissement" detail={config.hotel || undefined} fait={fait('hotel')} onPress={() => ouvrir('hotel')} />
          <Rangee cle="site" icon="globe" titre="Site, Booking, Google" detail={config.sansSite ? 'Rien en ligne' : config.analyse ? 'Analysés' : undefined} fait={fait('site')} onPress={() => ouvrir('site')} />
          </>}
          <Rangee cle="chambres" icon="bed" titre="Chambres et prix"
                  detail={config.chambres.length ? `${config.chambres.length} type${config.chambres.length > 1 ? 's' : ''}` : undefined}
                  fait={fait('chambres')} onPress={() => ouvrir('chambres')} />
          <Rangee cle="regles" icon="clock" titre="Arrivées, départs, paiement" detail={fait('regles') ? `${config.arrivee} – ${config.depart}` : undefined}
                  fait={fait('regles')} onPress={() => ouvrir('regles')} dernier />
        </Section>}

        {gerant && <Section titre="Paiements et canaux">
          <Rangee cle="whatsapp" icon="whatsapp" titre="WhatsApp" detail={conecte ? telLisible(tel) : 'Non connecté'} fait={conecte}
                  onPress={() => router.push('/conectar')} />
          <Rangee cle="mercadopago" icon="card" titre="Mercado Pago" detail={config.mercadoPago ? 'Compte lié' : undefined} fait={config.mercadoPago}
                  onPress={() => ouvrir('mercadopago')} />
          <Rangee cle="canaux" icon="chat" titre="Autres canaux" detail={nCanaux ? `${nCanaux} actif${nCanaux > 1 ? 's' : ''}` : undefined}
                  fait={fait('canaux')} onPress={() => ouvrir('canaux')} dernier
                  apres={(
                    <View style={s.logos}>
                      <LogoCanal nom="instagram" size={20} />
                      <LogoCanal nom="messenger" size={20} />
                      <LogoCanal nom="booking" size={20} />
                      <Text style={[s.suite, { color: wa.gris }]}>…</Text>
                    </View>
                  )} />
        </Section>}

        {peut('agent') && <Section titre="Assistant">
          <Rangee cle="style" icon="edit" titre="Style d’écriture"
                  detail={!fait('style') ? undefined : config.style === 'toutes' ? 'Toutes les discussions' : config.style === 'aucune' ? 'Ton neutre' : `${config.styleIds.length} choisies`}
                  fait={fait('style')} onPress={() => ouvrir('style')} dernier />
        </Section>}

        {gerant && <Section titre="Zone « Perso »">
          <View style={s.regle}>
            <Interrupteur label="Contacts enregistrés : pour moi" valeur={regleContacts} onChange={setRegleContacts}
                          sous="Banque, fournisseurs, équipe… L’assistant ne répond qu’aux numéros inconnus. Glissez une discussion à gauche pour changer au cas par cas." />
          </View>
        </Section>}

        {gerant && conecte && (
          <Section>
            <Rangee icon="logout" titre="Déconnecter WhatsApp (démo)" danger dernier
                    onPress={() => { recommencer(); router.navigate('/') }} />
          </Section>
        )}
      </ScrollView>
    </EcranOnglet>
  )
}

function Section({ titre, children }: { titre?: string; children: ReactNode }) {
  const wa = useWa()
  return (
    <View style={s.section}>
      {titre && <Text style={[s.sectionTitre, { color: wa.gris }]}>{titre}</Text>}
      <View style={[s.groupe, { backgroundColor: wa.champ }]}>{children}</View>
    </View>
  )
}

type RangeeProps = { cle?: string; icon: IconName; titre: string; detail?: string; fait?: boolean; onPress: () => void; dernier?: boolean; danger?: boolean; apres?: ReactNode }

function Rangee({ cle, icon, titre, detail, fait, onPress, dernier, danger, apres }: RangeeProps) {
  const wa = useWa()
  const encre = danger ? wa.danger : wa.encre
  const ligne = (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.rangee, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={22} color={encre} trait={1.7} />
      <View style={[s.rangeeCorps, !dernier && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: wa.ligne }]}>
        <Text style={[s.rangeeTitre, { color: encre }]}>{titre}</Text>
        {apres}
        {!danger && (fait
          ? <>{detail && <Text numberOfLines={1} style={[s.rangeeDetail, { color: wa.gris }]}>{detail}</Text>}<Icon name="checkPlain" size={18} color={wa.vert} trait={2.5} /></>
          : !apres && <Text style={[s.aFaire, { color: wa.vert }]}>À faire</Text>)}
        {!danger && <Icon name="chevR" size={16} color={wa.gris} />}
      </View>
    </Pressable>
  )
  return cle ? <Repere cle={cle} rayon={12}>{ligne}</Repere> : ligne
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  contenu: { padding: 16, gap: 20, paddingBottom: 40 },
  banniere: { borderRadius: 16, padding: 16, gap: 8 },
  banniereTitre: { fontSize: 20, fontWeight: '700' },
  banniereTexte: { fontSize: 15, lineHeight: 21 },
  progression: { flexDirection: 'row', gap: 4, marginTop: 6 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  compte: { fontSize: 13, fontWeight: '500' },
  bouton: { minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  boutonTexte: { fontSize: 17, fontWeight: '600' },
  pret: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14 },
  pretTexte: { fontSize: 16, fontWeight: '600' },
  profil: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarTexte: { fontSize: 24, fontWeight: '700' },
  nom: { fontSize: 20, fontWeight: '600' },
  sous: { fontSize: 15, marginTop: 2 },
  section: { gap: 6 },
  sectionTitre: { fontSize: 13, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3, marginLeft: 4 },
  groupe: { borderRadius: 14, paddingLeft: 16 },
  regle: { paddingRight: 14 },
  logos: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suite: { fontSize: 18, fontWeight: '700', marginLeft: 1, marginTop: -6 },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rangeeCorps: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50, paddingRight: 14 },
  rangeeTitre: { flex: 1, fontSize: 17 },
  rangeeDetail: { fontSize: 15, maxWidth: 140 },
  reserve: { textAlign: 'center', marginHorizontal: 16 },
  aFaire: { fontSize: 15, fontWeight: '500' },
})
