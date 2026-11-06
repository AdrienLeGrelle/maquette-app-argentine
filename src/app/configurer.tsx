import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Champ, Coche, Compteur, Groupe, Interrupteur, Libelle, Note, Puces, Question } from '@/components/Formulaire'
import { LogoCanal, type Logo } from '@/components/Logos'
import { esquisse } from '@/lib/demo'
import { prixOption } from '@/lib/hotel'
import { ETAPES_COMPLETES, ETAPES_RAPIDES, useEtat, type Canal, type Etape } from '@/lib/etat'
import { AvatarVide, Icon } from '@/lib/icons'
import { telLisible } from '@/lib/tel'
import { StatusBar } from 'expo-status-bar'
import Svg, { Defs, LinearGradient as Degrade, Rect, Stop } from 'react-native-svg'
import { ThemeWa, degradeMiseEnRoute, marques, num, revolut, useWa } from '@/lib/theme'

/**
 * Le questionnaire de Paramètres : une question par écran, une barre de
 * progression, « Continuer » sous le pouce. On peut passer une étape et y
 * revenir depuis Paramètres.
 */
/** La mise en route, en sombre : une question à la fois, un seul gros bouton blanc. */
export default function Configurer() {
  return (
    <ThemeWa.Provider value={revolut}>
      <StatusBar style="light" />
      <View style={[s.flex, { backgroundColor: revolut.fond }]}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <Degrade id="fondMiseEnRoute" x1="0" y1="0" x2="0" y2="1">
              {degradeMiseEnRoute.map((c, k) => <Stop key={c} offset={k / (degradeMiseEnRoute.length - 1)} stopColor={c} />)}
            </Degrade>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#fondMiseEnRoute)" />
        </Svg>
        <Questionnaire />
      </View>
    </ThemeWa.Provider>
  )
}

function Questionnaire() {
  const wa = useWa()
  const insets = useSafeAreaInsets()
  const { etape, parcours } = useLocalSearchParams<{ etape?: string; parcours?: string }>()
  // Deux parcours : le démarrage rapide (de quoi lancer l'agent), puis la configuration complète.
  const rapide = parcours !== 'complet' && !ETAPES_COMPLETES.includes(etape as Etape)
  const ETAPES = rapide ? ETAPES_RAPIDES : ETAPES_COMPLETES
  const [i, setI] = useState(Math.max(0, ETAPES.indexOf(etape as Etape)))
  const [fini, setFini] = useState(false)
  const { marquerFaite } = useEtat()
  const e = ETAPES[i]
  const dernier = i === ETAPES.length - 1

  const continuer = () => {
    marquerFaite(e)
    if (dernier) setFini(true)
    else setI(i + 1)
  }
  const passer = () => (dernier ? setFini(true) : setI(i + 1))
  const fermer = () => (router.canGoBack() ? router.back() : router.replace('/ajustes'))

  if (fini) return <Fin onFermer={fermer} rapide={rapide} />

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.entete, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => (i > 0 ? setI(i - 1) : fermer())} hitSlop={10} accessibilityRole="button"
                   accessibilityLabel={i > 0 ? 'Étape précédente' : 'Fermer'} style={s.enteteBouton}>
          <Icon name={i > 0 ? 'chevL' : 'x'} size={26} color={wa.encre} />
        </Pressable>
        <View style={s.progression} accessibilityRole="progressbar" accessibilityLabel={`Étape ${i + 1} sur ${ETAPES.length}`}>
          {ETAPES.map((x, k) => <View key={x} style={[s.segment, { backgroundColor: k <= i ? wa.vert : wa.champ }]} />)}
        </View>
        <Pressable onPress={fermer} hitSlop={10} accessibilityRole="button" style={s.enteteBouton}>
          <Text style={[s.fermer, { color: wa.gris }]}>Plus tard</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
        <Text style={[s.etape, { color: wa.vert }]}>{rapide ? 'Démarrage rapide' : 'Configuration complète'} · {i + 1} sur {ETAPES.length}</Text>
        <Contenu etape={e} />
      </ScrollView>

      <View style={[s.pied, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: wa.ligne }]}>
        <Pressable onPress={continuer} accessibilityRole="button" style={({ pressed }) => [s.bouton, { backgroundColor: wa.vert, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[s.boutonTexte, { color: wa.surVert }]}>{dernier ? (rapide ? 'C’est tout pour démarrer' : 'Terminer') : 'Continuer'}</Text>
        </Pressable>
        <Pressable onPress={passer} accessibilityRole="button" style={s.passer}>
          <Text style={[s.passerTexte, { color: wa.gris }]}>Passer cette étape</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

function Contenu({ etape }: { etape: Etape }) {
  const wa = useWa()
  const { config, majConfig, convs, conecte, tel } = useEtat()
  const [liaison, setLiaison] = useState(false)

  switch (etape) {
    case 'vous':
      return (
        <Bloc>
          <Question titre="Faisons connaissance" sous="Pour que l’assistant sache au nom de qui il répond." />
          <Champ label="Votre prénom" value={config.prenom} onChangeText={(prenom) => majConfig({ prenom })} placeholder="Hermine" autoFocus />
          <Libelle>Vous êtes…</Libelle>
          <Puces options={['Propriétaire', 'Gérant', 'Employé']} valeur={config.role} onChange={(role) => majConfig({ role })} />
        </Bloc>
      )
    case 'hotel':
      return (
        <Bloc>
          <Question titre="Votre établissement" sous="Le nom que vos voyageurs connaissent." />
          <Champ label="Nom" value={config.hotel} onChangeText={(hotel) => majConfig({ hotel })} placeholder="Hostal Los Andes" />
          <Champ label="Ville" value={config.ville} onChangeText={(ville) => majConfig({ ville })} placeholder="Tilcara" />
          <Libelle>C’est plutôt…</Libelle>
          <Puces options={['Hôtel', 'Hostal', 'Cabañas', 'Gîte', 'Glamping', 'Auberge de jeunesse']} valeur={config.type} onChange={(type) => majConfig({ type })} />
        </Bloc>
      )
    case 'site':
      return <Analyse />
    case 'chambres': {
      const maj = (id: string, c: Partial<(typeof config.chambres)[number]>) =>
        majConfig({ chambres: config.chambres.map((x) => (x.id === id ? { ...x, ...c } : x)) })
      return (
        <Bloc>
          <Question titre="Vos chambres et vos prix" sous="Par type, comme vous les comptez : 3 doubles, 2 cabanes…" />
          {config.chambresDuSite && <Note ok>{`Trouvé sur Booking${config.site ? ' et votre site' : ''}. Vérifiez et corrigez si besoin.`}</Note>}
          {config.chambres.map((c) => (
            <Groupe key={c.id}>
              <View style={s.chambreHaut}>
                <TextInput value={c.nom} onChangeText={(nom) => maj(c.id, { nom })} placeholder="Double, cabane, dortoir…"
                           placeholderTextColor={wa.gris} accessibilityLabel="Type de chambre" style={[s.chambreNom, { color: wa.encre }]} />
                <Pressable onPress={() => majConfig({ chambres: config.chambres.filter((x) => x.id !== c.id) })} hitSlop={10} accessibilityLabel="Supprimer">
                  <Icon name="x" size={20} color={wa.gris} />
                </Pressable>
              </View>
              <View style={[s.chambreLigne, { borderTopColor: wa.ligne }]}>
                <Text style={[s.chambreLabel, { color: wa.encre }]}>Combien ?</Text>
                <Compteur valeur={c.stock} onChange={(stock) => maj(c.id, { stock })} />
              </View>
              <View style={[s.chambreLigne, { borderTopColor: wa.ligne }]}>
                <Text style={[s.chambreLabel, { color: wa.encre }]}>Prix par nuit</Text>
                <View style={[s.prix, { backgroundColor: wa.champ }]}>
                  <Text style={[s.prixDevise, { color: wa.gris }]}>$</Text>
                  <TextInput value={c.prix} onChangeText={(prix) => maj(c.id, { prix: prix.replace(/\D/g, '') })} keyboardType="number-pad"
                             placeholder="0" placeholderTextColor={wa.gris} accessibilityLabel="Prix par nuit en pesos"
                             style={[s.prixChamp, num, { color: wa.encre }]} />
                </View>
              </View>
            </Groupe>
          ))}
          <Pressable onPress={() => majConfig({ chambres: [...config.chambres, { id: `c${Date.now()}`, nom: '', stock: 1, prix: '', capacite: 2, lits: '', description: '', equipements: [], photos: [] }] })}
                     accessibilityRole="button" style={[s.ajouter, { borderColor: wa.chipBord }]}>
            <Icon name="plus" size={20} color={wa.vert} />
            <Text style={[s.ajouterTexte, { color: wa.vert }]}>Ajouter un type de chambre</Text>
          </Pressable>
        </Bloc>
      )
    }
    case 'regles':
      return (
        <Bloc>
          <Question titre="Arrivées, départs et paiement" sous="L’assistant le dira à chaque voyageur." />
          <Libelle>Arrivée à partir de</Libelle>
          <Puces options={['12 h', '13 h', '14 h', '15 h', '16 h']} valeur={config.arrivee} onChange={(arrivee) => majConfig({ arrivee })} />
          <Libelle>Départ avant</Libelle>
          <Puces options={['10 h', '11 h', '12 h']} valeur={config.depart} onChange={(depart) => majConfig({ depart })} />
          <Groupe>
            <Interrupteur label="Animaux acceptés" valeur={config.animaux} onChange={(animaux) => majConfig({ animaux })} />
            <View style={[s.separateur, { backgroundColor: wa.ligne }]} />
            <Interrupteur label="Enfants bienvenus" valeur={config.enfants} onChange={(enfants) => majConfig({ enfants })} />
          </Groupe>
          <Libelle>Pour réserver, le voyageur paie…</Libelle>
          <Puces options={['Le total', 'Un acompte de 30 %', 'Un acompte de 50 %', 'Sur place']} valeur={config.paiement} onChange={(paiement) => majConfig({ paiement })} />
        </Bloc>
      )
    case 'mercadopago': {
      const lier = () => {
        setLiaison(true)
        setTimeout(() => { setLiaison(false); majConfig({ mercadoPago: true }) }, 1200)
      }
      return (
        <Bloc>
          <Question titre="Recevez les paiements avec Mercado Pago"
                    sous="Quand un voyageur réserve, Roomz lui envoie un lien de paiement. L’argent arrive directement sur votre compte, sans commission de Roomz." />
          {config.mercadoPago ? (
            <>
              <Note ok>Votre compte Mercado Pago est lié.</Note>
              <Pressable onPress={() => majConfig({ mercadoPago: false })} style={s.passer}>
                <Text style={[s.passerTexte, { color: wa.gris }]}>Délier le compte</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={lier} disabled={liaison} accessibilityRole="button"
                       style={({ pressed }) => [s.bouton, { backgroundColor: marques.mercadoPago, opacity: pressed ? 0.85 : 1 }]}>
              {liaison ? <ActivityIndicator color={marques.blanc} />
                : <Text style={[s.boutonTexte, { color: marques.blanc }]}>Lier mon compte Mercado Pago</Text>}
            </Pressable>
          )}
          <Note>Sans compte lié, l’assistant ne peut pas encaisser : les réservations restent « à payer ». En démo, aucun compte n’est réellement lié.</Note>
        </Bloc>
      )
    }
    case 'style': {
      const basculer = (id: string) => majConfig({ styleIds: config.styleIds.includes(id) ? config.styleIds.filter((x) => x !== id) : [...config.styleIds, id] })
      return (
        <Bloc>
          <Question titre="Comment l’assistant doit-il écrire ?" sous="Il s’inspire de vos discussions pour écrire comme vous : même ton, mêmes formules." />
          <Groupe>
            <Coche rond label="Toutes mes discussions" sous="Le plus fidèle à votre façon d’écrire." valeur={config.style === 'toutes'} onChange={() => majConfig({ style: 'toutes' })} />
            <View style={[s.separateur, { backgroundColor: wa.ligne }]} />
            <Coche rond label="Celles que je choisis" sous="4 à 6 discussions suffisent." valeur={config.style === 'selection'} onChange={() => majConfig({ style: 'selection' })} />
            <View style={[s.separateur, { backgroundColor: wa.ligne }]} />
            <Coche rond label="Aucune" sous="Un ton neutre et poli." valeur={config.style === 'aucune'} onChange={() => majConfig({ style: 'aucune' })} />
          </Groupe>
          {config.style === 'selection' && (
            <>
              <Libelle>{`${config.styleIds.length} choisie${config.styleIds.length > 1 ? 's' : ''}`}</Libelle>
              <Groupe>
                {convs.map((c, k) => (
                  <View key={c.id}>
                    {k > 0 && <View style={[s.separateur, { backgroundColor: wa.ligne }]} />}
                    <Pressable onPress={() => basculer(c.id)} accessibilityRole="checkbox" accessibilityState={{ checked: config.styleIds.includes(c.id) }} style={s.conv}>
                      <AvatarVide size={34} fond={wa.avatar} icone={wa.avatarIcone} />
                      <Text style={[s.convNom, { color: wa.encre }]}>{c.nom}</Text>
                      <View style={[s.caseConv, config.styleIds.includes(c.id) ? { backgroundColor: wa.vert, borderColor: wa.vert } : { borderColor: wa.chipBord }]}>
                        {config.styleIds.includes(c.id) && <Icon name="checkPlain" size={14} color={wa.surVert} trait={3} />}
                      </View>
                    </Pressable>
                  </View>
                ))}
              </Groupe>
            </>
          )}
        </Bloc>
      )
    }
    case 'canaux': {
      const canaux: { cle: Canal; logo: Logo; nom: string; sous: string }[] = [
        { cle: 'instagram', logo: 'instagram', nom: 'Instagram', sous: 'Messages privés et commentaires' },
        { cle: 'messenger', logo: 'messenger', nom: 'Messenger', sous: 'Messages de votre page Facebook' },
        { cle: 'booking', logo: 'booking', nom: 'Booking', sous: 'Messages et calendrier' },
        { cle: 'mail', logo: 'mail', nom: 'Mail', sous: 'Demandes reçues par e-mail' },
      ]
      return (
        <Bloc>
          <Question titre="Où vous écrivent vos voyageurs ?" sous="Cochez vos autres canaux : tous les messages arriveront dans Discussions." />
          <Groupe>
            <View style={s.canal}>
              <LogoCanal nom="whatsapp" size={34} />
              <View style={s.flex}>
                <Text style={[s.convNom, { color: wa.encre }]}>WhatsApp</Text>
                <Text style={[s.canalSous, { color: wa.gris }]}>{conecte ? `Branché · ${telLisible(tel)}` : 'Non connecté'}</Text>
              </View>
              {conecte && <Icon name="checkPlain" size={20} color={wa.vert} trait={2.5} />}
            </View>
            {canaux.map((c) => (
              <View key={c.cle}>
                <View style={[s.separateur, { backgroundColor: wa.ligne }]} />
                <Interrupteur label={c.nom} sous={c.sous} valeur={config.canaux[c.cle]} avant={<LogoCanal nom={c.logo} size={34} />}
                              onChange={(v) => majConfig({ canaux: { ...config.canaux, [c.cle]: v } })} />
              </View>
            ))}
          </Groupe>
        </Bloc>
      )
    }
  }
}

/**
 * Site, Booking, Google : on colle ce qu'on a, Roomz lit tout et prépare une
 * première esquisse de l'hôtel. Simple en surface, chaque partie se déplie.
 */
function Analyse() {
  const wa = useWa()
  const { config, majConfig } = useEtat()
  const [phase, setPhase] = useState<'saisie' | 'cours' | 'fini'>(config.analyse ? 'fini' : 'saisie')
  const [lues, setLues] = useState(0)
  const quelqueChose = !!(config.site.trim() || config.booking.trim() || config.google.trim())

  // Une source lue toutes les 800 ms ; à la dernière, l'esquisse remplit la config.
  useEffect(() => {
    if (phase !== 'cours') return
    const t = setTimeout(() => {
      if (lues + 1 < esquisse.sources.length) { setLues(lues + 1); return }
      majConfig({
        analyse: true, hotel: config.hotel || esquisse.hotel, ville: config.ville || esquisse.ville, type: config.type ?? esquisse.type,
        chambres: esquisse.chambres, chambresDuSite: true, arrivee: esquisse.arrivee, depart: esquisse.depart,
        options: esquisse.options, aime: esquisse.aime,
      })
      setLues(esquisse.sources.length)
      setPhase('fini')
    }, 800)
    return () => clearTimeout(t)
  }, [phase, lues, config, majConfig])

  if (phase === 'saisie') {
    return (
      <Bloc>
        <Question titre="Où vous trouve-t-on en ligne ?" sous="Collez ce que vous avez. Roomz lit tout et prépare une première version de votre hôtel : vous n’aurez qu’à vérifier." />
        <Champ label="Site internet" value={config.site} onChangeText={(site) => majConfig({ site, sansSite: false })}
               placeholder="www.monhotel.com" keyboardType="url" autoCapitalize="none" autoCorrect={false} />
        <Champ label="Page Booking" value={config.booking} onChangeText={(booking) => majConfig({ booking, sansSite: false })}
               placeholder="booking.com/hotel/ar/…" keyboardType="url" autoCapitalize="none" autoCorrect={false} />
        <Champ label="Fiche Google (nom ou lien)" value={config.google} onChangeText={(google) => majConfig({ google, sansSite: false })}
               placeholder="Hostal Los Andes, Tilcara" autoCorrect={false} />
        <Pressable onPress={() => { setLues(0); setPhase('cours') }} disabled={!quelqueChose} accessibilityRole="button"
                   style={[s.bouton, { backgroundColor: quelqueChose ? wa.vert : wa.chipBord }]}>
          <Text style={[s.boutonTexte, { color: wa.surVert }]}>Analyser</Text>
        </Pressable>
        <Coche label="Je n’ai rien de tout ça" valeur={config.sansSite}
               onChange={(sansSite) => majConfig({ sansSite, site: '', booking: '', google: '' })} />
        {config.sansSite && <Note>Aucun problème : vous remplirez vos chambres juste après, en quelques touchers.</Note>}
      </Bloc>
    )
  }

  if (phase === 'cours') {
    return (
      <Bloc>
        <Question titre="Lecture en cours…" sous="Roomz rassemble ce qui existe déjà sur vous." />
        <Groupe>
          {esquisse.sources.map((src, k) => (
            <View key={src.nom} style={[s.source, k > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: wa.ligne }]}>
              {k < lues ? <Icon name="checkPlain" size={20} color={wa.vert} trait={2.6} />
                : k === lues ? <ActivityIndicator color={wa.vert} /> : <View style={s.attente} />}
              <View style={s.flex}>
                <Text style={[s.sourceNom, { color: wa.encre }]}>{src.nom}</Text>
                {k < lues && <Text style={[s.sourceSous, { color: wa.gris }]}>{src.trouve}</Text>}
              </View>
            </View>
          ))}
        </Groupe>
      </Bloc>
    )
  }

  const unites = config.chambres.reduce((n, c) => n + c.stock, 0)
  return (
    <Bloc>
      <Question titre="Votre première esquisse" sous="Tout est modifiable. Touchez une ligne pour voir le détail." />
      <Groupe>
        <Depliable titre={[config.hotel, config.ville].filter(Boolean).join(' · ')} resume={config.type ?? undefined}>
          <Text style={[s.detail, { color: wa.gris }]}>Repris de votre fiche Google et de Booking.</Text>
        </Depliable>
        <Depliable titre={`${unites} unités · ${config.chambres.length} types`} resume="Chambres et prix">
          {config.chambres.map((c) => (
            <Text key={c.id} style={[s.detail, num, { color: wa.encre }]}>{c.nom} × {c.stock} · ${Number(c.prix).toLocaleString('es-AR')} / nuit</Text>
          ))}
        </Depliable>
        <Depliable titre={`Arrivée ${config.arrivee} · départ ${config.depart}`} resume="Horaires" />
        <Depliable titre={`${config.options.length} options`} resume="Services">
          {config.options.map((o) => <Text key={o.id} style={[s.detail, { color: wa.encre }]}>• {o.nom} · {prixOption(o)}</Text>)}
        </Depliable>
        <Depliable titre="Ce que vos voyageurs aiment" resume={`${esquisse.avis.nombre} avis Google · ${esquisse.avis.note} ★`} dernier>
          {config.aime.map((o) => <Text key={o} style={[s.detail, { color: wa.encre }]}>« {o} »</Text>)}
          <Text style={[s.detail, { color: wa.gris }]}>L’assistant s’en servira pour donner envie.</Text>
        </Depliable>
      </Groupe>
      <Pressable onPress={() => { majConfig({ analyse: false }); setPhase('saisie') }} style={s.passer}>
        <Text style={[s.passerTexte, { color: wa.gris }]}>Changer les liens et relancer</Text>
      </Pressable>
    </Bloc>
  )
}

function Depliable({ titre, resume, children, dernier }: { titre: string; resume?: string; children?: ReactNode; dernier?: boolean }) {
  const wa = useWa()
  const [ouvert, setOuvert] = useState(false)
  return (
    <View style={!dernier && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: wa.ligne }}>
      <Pressable onPress={() => children && setOuvert(!ouvert)} accessibilityRole="button" accessibilityState={{ expanded: ouvert }} style={s.depliable}>
        <View style={s.flex}>
          <Text style={[s.depliableTitre, { color: wa.encre }]}>{titre}</Text>
          {resume && <Text style={[s.sourceSous, { color: wa.gris }]}>{resume}</Text>}
        </View>
        <Icon name="checkPlain" size={18} color={wa.vert} trait={2.5} />
        {children && <View style={{ transform: [{ rotate: ouvert ? '180deg' : '0deg' }] }}><Icon name="chevD" size={18} color={wa.gris} /></View>}
      </Pressable>
      {ouvert && <View style={s.depliableCorps}>{children}</View>}
    </View>
  )
}

function Bloc({ children }: { children: ReactNode }) {
  return <View style={s.bloc}>{children}</View>
}

function Fin({ onFermer, rapide }: { onFermer: () => void; rapide: boolean }) {
  const wa = useWa()
  const insets = useSafeAreaInsets()
  const { config, lancerAgent } = useEtat()
  const allerAuxDiscussions = () => { if (router.canDismiss()) router.dismissAll(); router.navigate('/') }
  return (
    <View style={[s.flex, s.fin, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={s.finCentre}>
        <View style={[s.finRond, { backgroundColor: wa.vertWash }]}><Icon name={rapide ? 'sparkles' : 'checkPlain'} size={44} color={wa.vert} trait={2.6} /></View>
        <Text style={[s.finTitre, { color: wa.encre }]}>
          {rapide ? 'Votre agent est prêt à démarrer' : config.hotel ? `${config.hotel} est prêt` : 'Votre hôtel est prêt'}
        </Text>
        <Text style={[s.finTexte, { color: wa.gris }]}>
          {rapide
            ? 'Il connaît vos chambres et vos prix. Une fois lancé, il trie vos discussions et répond à vos voyageurs. Vous pourrez compléter le reste (paiement, style, canaux) quand vous voulez.'
            : 'L’assistant connaît maintenant vos règles, votre façon d’écrire et tous vos canaux.'}
        </Text>
      </View>
      <Pressable onPress={() => { if (rapide) lancerAgent(); allerAuxDiscussions() }} accessibilityRole="button"
                 style={({ pressed }) => [s.bouton, { backgroundColor: wa.vert, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={[s.boutonTexte, { color: wa.surVert }]}>{rapide ? 'Lancer l’agent' : 'Voir mes discussions'}</Text>
      </Pressable>
      <Pressable onPress={onFermer} style={s.passer}>
        <Text style={[s.passerTexte, { color: wa.gris }]}>{rapide ? 'Pas maintenant' : 'Revenir aux paramètres'}</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingBottom: 8 },
  enteteBouton: { minWidth: 36, minHeight: 40, justifyContent: 'center' },
  fermer: { fontSize: 15 },
  progression: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  contenu: { padding: 20, paddingTop: 12, paddingBottom: 32 },
  etape: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  bloc: { gap: 12 },
  pied: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 2 },
  bouton: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  boutonTexte: { fontSize: 17, fontWeight: '600' },
  passer: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  passerTexte: { fontSize: 15 },
  separateur: { height: StyleSheet.hairlineWidth },
  source: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  attente: { width: 20, height: 20 },
  sourceNom: { fontSize: 16, fontWeight: '500' },
  sourceSous: { fontSize: 13, marginTop: 2 },
  depliable: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, paddingVertical: 8 },
  depliableTitre: { fontSize: 16, fontWeight: '600' },
  depliableCorps: { paddingBottom: 12, gap: 4 },
  detail: { fontSize: 15, lineHeight: 21 },
  chambreHaut: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52 },
  chambreNom: { flex: 1, fontSize: 18, fontWeight: '600', minHeight: 44 },
  chambreLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 58, borderTopWidth: StyleSheet.hairlineWidth },
  chambreLabel: { fontSize: 16 },
  prix: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 10, minWidth: 130 },
  prixDevise: { fontSize: 17 },
  prixChamp: { flex: 1, fontSize: 17, minHeight: 42, paddingHorizontal: 6, textAlign: 'right' },
  ajouter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, minHeight: 52 },
  ajouterTexte: { fontSize: 16, fontWeight: '600' },
  conv: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  convNom: { flex: 1, fontSize: 17 },
  caseConv: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  canal: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 },
  canalSous: { fontSize: 14, marginTop: 2 },
  fin: { paddingHorizontal: 20, justifyContent: 'space-between' },
  finCentre: { flex: 1, justifyContent: 'center', gap: 14 },
  finRond: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  finTitre: { fontSize: 30, fontWeight: '700' },
  finTexte: { fontSize: 17, lineHeight: 24 },
})
