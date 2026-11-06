import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { conversations as conversationsDemo, devis, sejours as sejoursDemo, type Conversation, type Message, type Sejour } from '@/lib/demo'
import { equipeDemo, type Acces, type Membre } from '@/lib/equipe'
import { configDemo, type Chambre, type OptionHotel } from '@/lib/hotel'
import { heurePlus, messageConfirmation, montantLien } from '@/lib/paiement'

/**
 * État de la maquette, en mémoire : pas de back pour l'instant. Un
 * rechargement repart des données de démonstration, c'est voulu.
 */
export type Langue = 'es' | 'fr'

/** Une catégorie créée par l'hôtelier avec le « + » des filtres. */
export type Categorie = { id: string; nom: string; ids: string[] }

/** Les étapes du questionnaire de Paramètres, dans l'ordre. */
export const ETAPES = ['vous', 'site', 'hotel', 'chambres', 'options', 'regles', 'mercadopago', 'style', 'canaux'] as const
export type Etape = (typeof ETAPES)[number]
/** Le démarrage rapide : de quoi lancer l'agent. Le reste se complète ensuite. */
export const ETAPES_RAPIDES: Etape[] = ['vous', 'site', 'hotel', 'chambres']
export const ETAPES_COMPLETES: Etape[] = ['options', 'regles', 'mercadopago', 'style', 'canaux']

export type { Chambre, OptionHotel }
export type Canal = 'instagram' | 'messenger' | 'booking' | 'mail'
/** La boîte que montre l'onglet Discussions : WhatsApp ou un canal branché. */
export type Boite = 'whatsapp' | Canal

/** Le canal d'une discussion ; sans précision, WhatsApp. */
export function canalDe(c: Conversation): Boite {
  return c.canal ?? 'whatsapp'
}

/** La notification qui descend en haut du téléphone : un paiement reçu, un lien expiré. */
export type Notif = { quoi: 'paye' | 'expire'; nom: string; montant: number; convId?: string; n: number }

/** Ce que l'hôtelier renseigne dans Paramètres. */
export type Config = {
  prenom: string
  role: string | null
  hotel: string
  type: string | null
  /** L'adresse exacte : rue et numéro, puis ce que la carte en déduit. */
  adresse: string
  ville: string
  province: string
  codePostal: string
  pays: string
  coords: { lat: number; lng: number }
  /** Comment venir, en une ou deux phrases. */
  acces: string
  presentation: string
  /** Les photos de l'établissement ; la première sert de couverture. */
  photos: string[]
  email: string
  instagram: string
  site: string
  sansSite: boolean
  booking: string
  google: string
  /** L'analyse des pages en ligne a été faite : options et avis en viennent. */
  analyse: boolean
  options: OptionHotel[]
  aime: string[]
  chambres: Chambre[]
  chambresDuSite: boolean
  arrivee: string
  depart: string
  animaux: boolean
  enfants: boolean
  paiement: string
  annulation: string
  /** Ce qu'il vaut mieux savoir avant de réserver (pas de restaurant à côté, l'altitude…). */
  aSavoir: string[]
  mercadoPago: boolean
  style: 'toutes' | 'selection' | 'aucune'
  styleIds: string[]
  canaux: Record<Canal, boolean>
  /** Les textes de l'hôtelier, traduits par Roomz pour le voyageur. */
  es: { presentation: string; acces: string; annulation: string; aSavoir: string[]; aime: string[] }
}

type Etat = {
  langue: Langue
  setLangue: (l: Langue) => void
  /** Les dix chiffres saisis : indicatif régional + numéro, sans 0 ni 15. */
  tel: string
  code: string | null
  conecte: boolean
  demanderCode: (tel: string) => void
  connecter: () => void
  recommencer: () => void
  convs: Conversation[]
  lire: (id: string) => void
  envoyer: (id: string, texte: string) => void
  categories: Categorie[]
  ajouterCategorie: (nom: string, ids: string[]) => string
  config: Config
  majConfig: (c: Partial<Config>) => void
  faites: Etape[]
  marquerFaite: (e: Etape) => void
  /** La bulle « Commencez ici » au-dessus de Paramètres, fermée à la main. */
  bulleFermee: boolean
  fermerBulle: () => void
  /** Le bouton que l'assistant d'aide fait clignoter, le temps de le trouver. */
  montrer: string | null
  setMontrer: (cle: string | null) => void
  /** Tant que l'agent n'est pas lancé, Roomz ne trie ni ne répond : seule « Toutes » est active. */
  agentLance: boolean
  lancerAgent: () => void
  /** Les séjours dont l'arrivée a été faite (check-in). */
  checkins: string[]
  basculerCheckin: (id: string) => void
  /** Règle : les contacts enregistrés vont dans « Perso ». */
  regleContacts: boolean
  setRegleContacts: (v: boolean) => void
  mettrePourMoi: (id: string, v: boolean) => void
  reprendreMain: (id: string, v: boolean) => void
  /** Confier une discussion à l'agent : elle quitte « Perso » et l'agent reprend la main. */
  confierAgent: (id: string) => void
  /** L'ordre des puces de filtre, que l'hôtelier change en les faisant glisser. */
  ordreFiltres: string[]
  setOrdreFiltres: (o: string[]) => void
  /** Le demi-écran de l'assistant ; `question` est posée dès l'ouverture. */
  agent: { ouvert: boolean; question?: string; n: number }
  ouvrirAgent: (question?: string) => void
  fermerAgent: () => void
  /** Les employés invités par le gérant. */
  equipe: Membre[]
  enregistrerMembre: (m: Membre) => void
  retirerMembre: (id: string) => void
  /**
   * Outil de démo : l'app vue par un employé (son id), ou par le gérant (null).
   * N'existe que dans la maquette, pour montrer ce que chacun voit.
   */
  vue: string | null
  setVue: (id: string | null) => void
  /** L'employé dont on regarde l'app, s'il y en a un. */
  membreVu?: Membre
  /** Ce que la personne qui tient l'app a le droit de voir. Le gérant voit tout. */
  peut: (a: Acces) => boolean
  /** Le planning : réservations, retenues et blocages. Roomz en est la source de vérité. */
  sejours: Sejour[]
  /** Envoyer le lien de paiement préparé pour ce fil : la chambre est retenue trente minutes. */
  envoyerLien: (convId: string) => void
  /** Le retour du paiement (le webhook, simulé) : seul lui confirme la réservation. */
  payer: (sejourId: string) => void
  /** Personne n'a payé : le lien expire et la chambre est libérée. */
  expirer: (sejourId: string) => void
  notif: Notif | null
  fermerNotif: () => void
  /** Les boîtes branchées, WhatsApp en premier. */
  boites: Boite[]
  /** La boîte affichée dans Discussions ; revient à WhatsApp si son canal est débranché. */
  boite: Boite
  setBoite: (b: Boite) => void
}

/** « Perso » : l'assistant ne répond jamais. Le choix manuel l'emporte sur la règle. */
export function estPourMoi(c: Conversation, regleContacts: boolean) {
  return c.pourMoi ?? (regleContacts && !!c.enregistre)
}

const Ctx = createContext<Etat | null>(null)

/** Code d'association de WhatsApp : huit caractères, sans 0/O ni 1/I. */
function codeAuHasard() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = ''
  for (let i = 0; i < 8; i++) c += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `${c.slice(0, 4)}-${c.slice(4)}`
}

function maintenant() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Ajouter au fil d'un séjour : on ouvre la journée d'aujourd'hui si le fil datait d'un autre jour. */
function ajouterAuFil(cs: Conversation[], convId: string, nouveaux: Message[], change: Partial<Conversation>): Conversation[] {
  return cs.map((c) => (c.id !== convId ? c : {
    ...c, ...change,
    quand: { jour: 'hoy', heure: nouveaux[0].heure },
    messages: [...c.messages, ...nouveaux.map((m, i) => (i === 0 && c.quand.jour !== 'hoy' ? { ...m, jour: 'Aujourd’hui' } : m))],
  }))
}

/** La démo s'ouvre déjà connectée, sur les discussions. */
const TEL_DEMO = '3884157729'

export function EtatProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>('fr')
  const [tel, setTel] = useState(TEL_DEMO)
  const [code, setCode] = useState<string | null>(null)
  const [conecte, setConecte] = useState(true)
  const [convs, setConvs] = useState(conversationsDemo)
  const [categories, setCategories] = useState<Categorie[]>([])
  // La démo s'ouvre sur un hôtel entièrement configuré, agent lancé.
  const [config, setConfig] = useState(configDemo)
  const [faites, setFaites] = useState<Etape[]>([...ETAPES])
  const [bulleFermee, setBulleFermee] = useState(false)
  const [montrer, setMontrer] = useState<string | null>(null)
  const [agentLance, setAgentLance] = useState(true)
  const [checkins, setCheckins] = useState<string[]>([])
  const [regleContacts, setRegleContacts] = useState(true)
  const [agent, setAgent] = useState<{ ouvert: boolean; question?: string; n: number }>({ ouvert: false, n: 0 })
  const [ordreFiltres, setOrdreFiltres] = useState(['action', 'agent', 'toutes', 'perso'])
  const [equipe, setEquipe] = useState(equipeDemo)
  const [vue, setVue] = useState<string | null>(null)
  const [sejours, setSejours] = useState(sejoursDemo)
  const [notif, setNotif] = useState<Notif | null>(null)
  const [boiteChoisie, setBoite] = useState<Boite>('whatsapp')
  const boites = useMemo<Boite[]>(() => ['whatsapp', ...(['messenger', 'instagram', 'mail', 'booking'] as Canal[]).filter((k) => config.canaux[k])], [config.canaux])
  const boite = boites.includes(boiteChoisie) ? boiteChoisie : 'whatsapp'
  // Un employé retiré de l'équipe : on revient à la vue du gérant.
  const membreVu = equipe.find((m) => m.id === vue)

  const valeur = useMemo<Etat>(() => ({
    langue, setLangue, tel, code, conecte, convs, categories, config, faites, bulleFermee, montrer, setMontrer, agentLance, sejours, notif,
    fermerNotif: () => setNotif(null),
    boites, boite, setBoite,
    envoyerLien: (convId) => {
      const d = devis[convId]
      const c = convs.find((x) => x.id === convId)
      if (!d || !c) return
      const heure = maintenant()
      const jusqua = heurePlus(heure, 30)
      const id = `lien-${convId}`
      const lien = { etat: 'retenue' as const, heure, jusqua, montant: montantLien(d.montant, config.paiement) }
      setSejours((ss) => [...ss, { id, nom: c.nom, ...d, statut: 'attente' as const, canal: 'whatsapp' as const, convId, tel: c.tel, options: [], paye: 0, lien }]
        .sort((a, b) => a.debut.localeCompare(b.debut)))
      setConvs((cs) => ajouterAuFil(cs, convId, [{ de: 'hotel', heure, lu: false, lien: { sejour: id, ...d, total: d.montant, montant: lien.montant } }, { de: 'hotel', heure, etape: { quoi: 'retenue', jusqua } }],
        { colonne: 'unpaid', enCours: true, ecrit: false }))
    },
    payer: (sejourId) => {
      const e = sejours.find((x) => x.id === sejourId)
      if (!e?.lien) return
      const heure = maintenant()
      const montant = e.lien.montant
      setSejours((ss) => ss.map((x) => (x.id !== sejourId || !x.lien ? x
        : { ...x, statut: 'confirmee', paye: Math.min(x.montant, x.paye + montant), lien: { ...x.lien, etat: 'payee' } })))
      if (e.convId) {
        const c = convs.find((x) => x.id === e.convId)
        // Le voyageur reçoit sa confirmation, sauf si l'hôtelier a repris la main sur ce fil.
        const confirmation: Message[] = c && !c.pause ? [{ de: 'hotel', heure, lu: false, texte: messageConfirmation(e, config.arrivee) }] : []
        setConvs((cs) => ajouterAuFil(cs, e.convId!, [{ de: 'hotel', heure, etape: { quoi: 'paye', montant } }, { de: 'hotel', heure, etape: { quoi: 'confirmee' } }, ...confirmation],
          { colonne: 'paid', enCours: false, ecrit: false }))
      }
      setNotif((n) => ({ quoi: 'paye', nom: e.nom, montant, convId: e.convId, n: (n?.n ?? 0) + 1 }))
    },
    expirer: (sejourId) => {
      const e = sejours.find((x) => x.id === sejourId)
      if (!e?.lien) return
      setSejours((ss) => ss.filter((x) => x.id !== sejourId))
      if (e.convId) setConvs((cs) => ajouterAuFil(cs, e.convId!, [{ de: 'hotel', heure: maintenant(), etape: { quoi: 'expire' } }], { colonne: 'other', enCours: false, ecrit: false }))
      setNotif((n) => ({ quoi: 'expire', nom: e.nom, montant: e.lien!.montant, convId: e.convId, n: (n?.n ?? 0) + 1 }))
    },
    lancerAgent: () => setAgentLance(true),
    checkins, regleContacts, setRegleContacts, agent, ordreFiltres, setOrdreFiltres, equipe, vue, setVue, membreVu,
    peut: (a) => !membreVu || membreVu.acces.includes(a),
    // Nouveau : ajouté au bout de la branche. Existant : modifié sur place.
    enregistrerMembre: (m) => setEquipe((es) => (es.some((e) => e.id === m.id) ? es.map((e) => (e.id === m.id ? m : e)) : [...es, m])),
    retirerMembre: (id) => setEquipe((es) => es.filter((e) => e.id !== id)),
    confierAgent: (id) => setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, pourMoi: false, pause: false, enCours: true } : c))),
    ouvrirAgent: (question) => setAgent((a) => ({ ouvert: true, question, n: a.n + 1 })),
    fermerAgent: () => setAgent((a) => ({ ...a, ouvert: false, question: undefined })),
    mettrePourMoi: (id, v) => setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, pourMoi: v, ecrit: v ? false : c.ecrit } : c))),
    reprendreMain: (id, v) => setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, pause: v, ecrit: v ? false : c.ecrit } : c))),
    basculerCheckin: (id) => setCheckins((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id])),
    majConfig: (c) => setConfig((ancien) => ({ ...ancien, ...c })),
    marquerFaite: (e) => setFaites((fs) => (fs.includes(e) ? fs : [...fs, e])),
    fermerBulle: () => setBulleFermee(true),
    demanderCode: (t) => { setTel(t); setCode(codeAuHasard()); setConecte(false) },
    connecter: () => setConecte(true),
    recommencer: () => { setTel(''); setCode(null); setConecte(false) },
    // Rien à lire : on rend le même tableau, sans nouveau rendu.
    lire: (id) => setConvs((cs) => (cs.some((c) => c.id === id && c.nonLus > 0)
      ? cs.map((c) => (c.id === id ? { ...c, nonLus: 0 } : c))
      : cs)),
    // Répondre soi-même : le fil quitte « Action requise », l'hôtelier a la main.
    envoyer: (id, texte) => {
      const heure = maintenant()
      setConvs((cs) => cs.map((c) => (c.id !== id ? c : {
        ...c,
        colonne: c.colonne === 'action' ? 'other' : c.colonne,
        ecrit: false,
        pause: true,
        quand: { jour: 'hoy', heure },
        // Répondre à un fil d'un autre jour ouvre la journée d'aujourd'hui.
        messages: [...c.messages, { de: 'hotel', heure, texte, lu: false, jour: c.quand.jour === 'hoy' ? undefined : 'Aujourd’hui' }],
      })))
    },
    ajouterCategorie: (nom, ids) => {
      const id = `cat-${Date.now()}`
      setCategories((cats) => [...cats, { id, nom, ids }])
      return id
    },
  }), [langue, tel, code, conecte, convs, categories, config, faites, bulleFermee, montrer, agentLance, checkins, regleContacts, agent, ordreFiltres, equipe, vue, membreVu, sejours, notif, boites, boite])

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

export function useEtat() {
  const e = useContext(Ctx)
  if (!e) throw new Error('useEtat hors de EtatProvider')
  return e
}

/** `t('Hola', 'Bonjour')` : espagnol d'Argentine par défaut, français au choix. */
export function useT() {
  const { langue } = useEtat()
  return (es: string, fr: string) => (langue === 'fr' ? fr : es)
}
