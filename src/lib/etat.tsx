import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { conversations as conversationsDemo, type Conversation } from '@/lib/demo'
import { equipeDemo, type Acces, type Membre } from '@/lib/equipe'

/**
 * État de la maquette, en mémoire : pas de back pour l'instant. Un
 * rechargement repart des données de démonstration, c'est voulu.
 */
export type Langue = 'es' | 'fr'

/** Une catégorie créée par l'hôtelier avec le « + » des filtres. */
export type Categorie = { id: string; nom: string; ids: string[] }

/** Les étapes du questionnaire de Paramètres, dans l'ordre. */
export const ETAPES = ['vous', 'site', 'hotel', 'chambres', 'regles', 'mercadopago', 'style', 'canaux'] as const
export type Etape = (typeof ETAPES)[number]
/** Le démarrage rapide : de quoi lancer l'agent. Le reste se complète ensuite. */
export const ETAPES_RAPIDES: Etape[] = ['vous', 'site', 'hotel', 'chambres']
export const ETAPES_COMPLETES: Etape[] = ['regles', 'mercadopago', 'style', 'canaux']

export type Chambre = { id: string; nom: string; stock: number; prix: string }
export type Canal = 'instagram' | 'messenger' | 'booking' | 'mail'

/** Ce que l'hôtelier renseigne dans Paramètres. */
export type Config = {
  prenom: string
  role: string | null
  hotel: string
  ville: string
  type: string | null
  site: string
  sansSite: boolean
  booking: string
  google: string
  /** L'analyse des pages en ligne a été faite : options et avis en viennent. */
  analyse: boolean
  options: string[]
  aime: string[]
  chambres: Chambre[]
  chambresDuSite: boolean
  arrivee: string
  depart: string
  animaux: boolean
  enfants: boolean
  paiement: string
  mercadoPago: boolean
  style: 'toutes' | 'selection' | 'aucune'
  styleIds: string[]
  canaux: Record<Canal, boolean>
}

const configVide: Config = {
  prenom: '', role: null, hotel: '', ville: '', type: null, site: '', sansSite: false, booking: '', google: '', analyse: false, options: [], aime: [],
  chambres: [], chambresDuSite: false, arrivee: '14 h', depart: '10 h', animaux: false, enfants: true,
  paiement: 'Le total', mercadoPago: false, style: 'toutes', styleIds: [],
  canaux: { instagram: false, messenger: false, booking: false, mail: false },
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

/** La démo s'ouvre déjà connectée, sur les discussions. */
const TEL_DEMO = '3884157729'

export function EtatProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>('fr')
  const [tel, setTel] = useState(TEL_DEMO)
  const [code, setCode] = useState<string | null>(null)
  const [conecte, setConecte] = useState(true)
  const [convs, setConvs] = useState(conversationsDemo)
  const [categories, setCategories] = useState<Categorie[]>([])
  const [config, setConfig] = useState(configVide)
  const [faites, setFaites] = useState<Etape[]>([])
  const [bulleFermee, setBulleFermee] = useState(false)
  const [montrer, setMontrer] = useState<string | null>(null)
  const [agentLance, setAgentLance] = useState(false)
  const [checkins, setCheckins] = useState<string[]>([])
  const [regleContacts, setRegleContacts] = useState(true)
  const [agent, setAgent] = useState<{ ouvert: boolean; question?: string; n: number }>({ ouvert: false, n: 0 })
  const [ordreFiltres, setOrdreFiltres] = useState(['action', 'agent', 'toutes', 'perso'])
  const [equipe, setEquipe] = useState(equipeDemo)
  const [vue, setVue] = useState<string | null>(null)
  // Un employé retiré de l'équipe : on revient à la vue du gérant.
  const membreVu = equipe.find((m) => m.id === vue)

  const valeur = useMemo<Etat>(() => ({
    langue, setLangue, tel, code, conecte, convs, categories, config, faites, bulleFermee, montrer, setMontrer, agentLance,
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
  }), [langue, tel, code, conecte, convs, categories, config, faites, bulleFermee, montrer, agentLance, checkins, regleContacts, agent, ordreFiltres, equipe, vue, membreVu])

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
