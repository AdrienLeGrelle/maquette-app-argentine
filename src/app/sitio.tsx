import { useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react'
import {
  Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type LayoutChangeEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CalendrierDispo } from '@/components/sitio/CalendrierDispo'
import { Carrousel } from '@/components/sitio/Carrousel'
import { Carte } from '@/components/sitio/Carte'
import { ecart } from '@/lib/dates'
import { pesos } from '@/lib/demo'
import { useEtat } from '@/lib/etat'
import { avis, type Chambre, type OptionHotel } from '@/lib/hotel'
import { Icon, type IconName } from '@/lib/icons'
import { montantLien } from '@/lib/paiement'
import {
  chambresLibres, departMax, jourCourt, lienItineraire, lienWhatsApp, nuitOuverte, prixChambre, prixOptionSejour, type LangueSite,
} from '@/lib/sitio'
import { marques, num, useCouleurs } from '@/lib/theme'

/**
 * La page de réservation de l'hôtel : un seul modèle pour tous les hôtels,
 * rempli avec ce que l'hôtelier a saisi dans Roomz. Tout sur une seule page,
 * sans étapes (retour d'Hermine) : qui on est, les chambres, les extras, ce
 * qu'il faut savoir, les disponibilités en direct, le panier, le plan.
 *
 * Elle parle au voyageur dans sa langue (espagnol d'Argentine par défaut).
 * Sur la dernière unité d'une catégorie, elle n'encaisse pas seule : elle
 * passe la main à l'hôtelier sur WhatsApp, comme l'assistant.
 */

type Etape =
  | { quoi: 'panier' }
  | { quoi: 'retenue'; ids: string[]; jusqua: string; montant: number }
  | { quoi: 'confirmee'; montant: number }
  | { quoi: 'demande' }

const TYPES_ES: Record<string, string> = {
  'Hôtel': 'Hotel', 'Hostal': 'Hostal', 'Cabañas': 'Cabañas', 'Gîte': 'Casa de huéspedes', 'Glamping': 'Glamping', 'Auberge de jeunesse': 'Albergue',
}

const UNITES_ES: Record<OptionHotel['unite'], [string, string]> = {
  nuitPersonne: ['por persona y por noche', 'par personne et par nuit'],
  personne: ['por persona', 'par personne'],
  nuit: ['por noche', 'par nuit'],
  sejour: ['por estadía', 'par séjour'],
}

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' })

export default function Sitio() {
  const c = useCouleurs()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { config, sejours, tel, reserverEnLigne, payerEnLigne } = useEtat()
  const [langue, setLangue] = useState<LangueSite>('es')
  const t = (es: string, fr: string) => (langue === 'es' ? es : fr)
  const tx = (es: string | undefined, fr: string) => (langue === 'es' && es ? es : fr)

  const large = width >= 900
  const marge = large ? 40 : 20
  const contenu = Math.min(width, 1160) - marge * 2

  // Le séjour en cours de composition.
  const [personnes, setPersonnes] = useState(2)
  const [debut, setDebut] = useState<string | null>(null)
  const [fin, setFin] = useState<string | null>(null)
  const [choix, setChoix] = useState<string | null>(null)
  const [extras, setExtras] = useState<string[]>([])
  const [nom, setNom] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [etape, setEtape] = useState<Etape>({ quoi: 'panier' })

  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  // Où commence chaque section, pour y descendre depuis l'en-tête ou la barre du bas.
  const [positions, setPositions] = useState<Record<string, number>>({})
  const repere = (cle: string) => (e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y
    setPositions((p) => (p[cle] === y ? p : { ...p, [cle]: y }))
  }
  const aller = (cle: string) => scroll.current?.scrollTo({ y: Math.max(0, (positions[cle] ?? 0) - 76), animated: true })

  const chambres = config.chambres.filter((ch) => ch.stock > 0)
  const capaciteMax = Math.max(1, ...chambres.map((ch) => (ch.parLit ? ch.stock : ch.capacite)))
  const nuits = debut && fin ? ecart(debut, fin) : 0
  const libres = useMemo(() => (debut && fin ? chambresLibres(chambres, personnes, debut, fin, sejours) : []), [chambres, personnes, debut, fin, sejours])
  // La chambre regardée reste choisie si elle est libre à ces dates ; sinon, s'il n'en reste qu'une, c'est elle.
  const choisie = libres.find((x) => x.ch.id === choix) ?? (libres.length === 1 ? libres[0] : null)
  const dMax = debut && !fin ? departMax(chambres, personnes, debut, sejours) : null
  const lignesExtras = config.options.filter((o) => extras.includes(o.id)).map((o) => ({ o, prix: prixOptionSejour(o, personnes, nuits) }))
  const prixCh = choisie ? prixChambre(choisie.ch, personnes, nuits) : 0
  const total = choisie ? prixCh + lignesExtras.reduce((n, x) => n + x.prix, 0) : 0
  const aPayer = montantLien(total, config.paiement)
  const surPlace = config.paiement === 'Sur place'
  // La dernière unité de la catégorie : la page ne confirme pas seule.
  const derniere = !!choisie && choisie.libres - choisie.besoin === 0
  const prixMin = Math.min(...chambres.map((ch) => Number(ch.prix) || 0))
  const pret = nom.trim().length > 1 && whatsapp.replace(/\D/g, '').length >= 8

  const nomChambre = (ch: Chambre) => tx(ch.es?.nom, ch.nom)
  const nomOption = (o: OptionHotel) => tx(o.es?.nom, o.nom)
  const prixOptionTexte = (o: OptionHotel) => (o.prix ? `${pesos(o.prix)} ${t(...UNITES_ES[o.unite])}` : t('Sin cargo', 'Offert'))
  const capaciteTexte = (ch: Chambre) => (ch.parLit
    ? t(`Cama en dormitorio de ${ch.stock}`, `Lit en dortoir de ${ch.stock}`)
    : t(`Hasta ${ch.capacite} persona${ch.capacite > 1 ? 's' : ''}`, `Jusqu’à ${ch.capacite} personne${ch.capacite > 1 ? 's' : ''}`))

  const choisirDates = (d: string | null, f: string | null) => { setDebut(d); setFin(f); setEtape({ quoi: 'panier' }) }
  const basculerExtra = (id: string) => setExtras((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))
  const recommencer = () => { setDebut(null); setFin(null); setChoix(null); setExtras([]); setEtape({ quoi: 'panier' }) }

  // Sur le web : le titre de l'onglet et la fiche lisible par Google, ChatGPT ou Gemini.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    const avant = document.title
    document.title = `${config.hotel} · ${config.ville}`
    const fiche = document.createElement('script')
    fiche.type = 'application/ld+json'
    fiche.text = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'LodgingBusiness', name: config.hotel, description: config.es.presentation || config.presentation,
      image: config.photos, priceRange: `$${prixMin}+`, checkinTime: config.arrivee, checkoutTime: config.depart,
      address: { '@type': 'PostalAddress', streetAddress: config.adresse, addressLocality: config.ville, addressRegion: config.province, postalCode: config.codePostal, addressCountry: 'AR' },
      geo: { '@type': 'GeoCoordinates', latitude: config.coords.lat, longitude: config.coords.lng },
      aggregateRating: config.analyse ? { '@type': 'AggregateRating', ratingValue: avis.note.replace(',', '.'), reviewCount: avis.nombre } : undefined,
    })
    document.head.appendChild(fiche)
    return () => { document.title = avant; fiche.remove() }
  }, [config, prixMin])

  const payer = () => {
    if (!choisie || !debut || !fin) return
    const r = reserverEnLigne({
      nom: nom.trim(), tel: whatsapp.trim(), chambre: choisie.ch.nom, debut, fin, unites: choisie.besoin, personnes,
      options: lignesExtras.map((x) => x.o.nom), montant: total, sansPaiement: surPlace,
    })
    setEtape(surPlace ? { quoi: 'demande' } : { quoi: 'retenue', ...r })
  }

  const messageDerniere = choisie && debut && fin
    ? t(`¡Hola! Quisiera reservar ${nomChambre(choisie.ch).toLowerCase()} del ${jourCourt(debut, 'es')} al ${jourCourt(fin, 'es')}, para ${personnes} persona${personnes > 1 ? 's' : ''}. Soy ${nom || '…'}.`,
      `Bonjour ! Je voudrais réserver ${nomChambre(choisie.ch).toLowerCase()} du ${jourCourt(debut, 'fr')} au ${jourCourt(fin, 'fr')}, pour ${personnes} personne${personnes > 1 ? 's' : ''}. Je suis ${nom || '…'}.`)
    : ''

  const sectionStyle = { width: contenu, marginTop: large ? 88 : 56 }
  const colonnesChambres = large ? 2 : 1
  const largeurCarte = (contenu - (colonnesChambres - 1) * 24) / colonnesChambres
  const colonnesExtras = large ? 3 : 1
  const largeurExtra = (contenu - (colonnesExtras - 1) * 16) / colonnesExtras
  const hauteurEntete = 64 + insets.top

  return (
    <View style={[s.page, { backgroundColor: c.surface }]}>
      <ScrollView ref={scroll} contentContainerStyle={[s.defile, { paddingTop: hauteurEntete, paddingBottom: large ? 0 : 96 + insets.bottom }]}>
        {/* ── Photos ─────────────────────────────────────────────── */}
        <View onLayout={repere('haut')} style={large ? { width: contenu, marginTop: 24 } : { width }}>
          {large ? (
            <View style={[s.mosaique, { height: Math.min(480, contenu * 0.42) }]}>
              <Image source={{ uri: config.photos[0] }} style={[s.mosaiqueGrande, { backgroundColor: c.surface3 }]} accessibilityLabel={config.hotel} />
              <View style={s.mosaiqueDroite}>
                {[1, 2, 3, 4].map((k) => (
                  <Image key={k} source={{ uri: config.photos[k] ?? config.photos[0] }} accessibilityLabel={`${config.hotel}, ${k + 1}`}
                         style={[s.mosaiquePetite, { backgroundColor: c.surface3 }]} />
                ))}
              </View>
            </View>
          ) : (
            <Carrousel photos={config.photos} hauteur={300} label={config.hotel} compteur />
          )}
        </View>

        {/* ── Qui on est ─────────────────────────────────────────── */}
        <View style={{ width: contenu, marginTop: large ? 40 : 24 }}>
          <View style={large ? s.presentationLarge : undefined}>
            <View style={large ? s.flex : undefined}>
              <Text accessibilityRole="header" style={[s.h1, { color: c.ink, fontFamily: serif, fontSize: large ? 48 : 34, lineHeight: large ? 56 : 40 }]}>
                {config.hotel}
              </Text>
              <Text style={[s.lieu, { color: c.ink2 }]}>
                {[langue === 'es' ? TYPES_ES[config.type ?? ''] ?? config.type : config.type, `${config.ville}, ${config.province}`].filter(Boolean).join(' · ')}
                {config.analyse ? `  ·  ★ ${avis.note} (${avis.nombre} ${t('opiniones', 'avis')})` : ''}
              </Text>
              <Text style={[s.presentation, { color: c.ink2 }]}>{tx(config.es.presentation, config.presentation)}</Text>
            </View>
            <View style={[s.faits, large && s.faitsLarge, { borderColor: c.line }]}>
              <Fait icon="clock" texte={t(`Llegada desde las ${config.arrivee} · salida hasta las ${config.depart}`, `Arrivée dès ${config.arrivee} · départ avant ${config.depart}`)} />
              {config.enfants && <Fait icon="users" texte={t('Familias y chicos, bienvenidos', 'Familles et enfants bienvenus')} />}
              {config.animaux && <Fait icon="check" texte={t('Mascotas bienvenidas', 'Animaux acceptés')} />}
              {config.mercadoPago && <Fait icon="card" texte={t('Pago seguro con Mercado Pago', 'Paiement sécurisé par Mercado Pago')} />}
              <Fait icon="whatsapp" texte={t('Te respondemos por WhatsApp', 'On vous répond sur WhatsApp')} />
            </View>
          </View>
          {(langue === 'es' ? config.es.aime : config.aime).length > 0 && (
            <View style={s.aime}>
              {(langue === 'es' ? config.es.aime : config.aime).map((x) => (
                <View key={x} style={[s.aimePuce, { backgroundColor: c.surface3 }]}>
                  <Text style={[s.aimeTexte, { color: c.ink2 }]}>« {x} »</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Chambres ───────────────────────────────────────────── */}
        <View onLayout={repere('chambres')} style={sectionStyle}>
          <TitreSection titre={t('Habitaciones', 'Chambres')} sous={t('Elegí la que va con tu viaje.', 'Choisissez celle qui va avec votre voyage.')} />
          <View style={[s.grille, { gap: 24 }]}>
            {chambres.map((ch) => (
              <View key={ch.id} style={[s.carteChambre, { width: largeurCarte }]}>
                <Carrousel photos={ch.photos} hauteur={large ? 260 : 240} rayon={16} label={nomChambre(ch)} />
                <View style={s.carteCorps}>
                  <View style={s.carteHaut}>
                    <Text style={[s.h3, { color: c.ink }]}>{nomChambre(ch)}</Text>
                    <Text style={[s.prixDesde, num, { color: c.ink }]}>
                      {pesos(Number(ch.prix) || 0)}<Text style={[s.parNuit, { color: c.muted }]}> / {ch.parLit ? t('cama', 'lit') : t('noche', 'nuit')}</Text>
                    </Text>
                  </View>
                  <Text style={[s.meta, { color: c.muted }]}>{[capaciteTexte(ch), tx(ch.es?.lits, ch.lits)].filter(Boolean).join(' · ')}</Text>
                  {!!ch.description && <Text style={[s.texte, { color: c.ink2 }]}>{tx(ch.es?.description, ch.description)}</Text>}
                  {(ch.es?.equipements ?? ch.equipements).length > 0 && (
                    <Text style={[s.equip, { color: c.muted }]}>{(langue === 'es' ? ch.es?.equipements ?? ch.equipements : ch.equipements).join('  ·  ')}</Text>
                  )}
                  <View style={s.carteBas} />
                  <Bouton kind="contour" onPress={() => {
                    setChoix(ch.id)
                    if (ch.parLit ? personnes > ch.stock : personnes > ch.capacite) setPersonnes(ch.parLit ? 1 : ch.capacite)
                    aller('dispo')
                  }}>{t('Ver disponibilidad', 'Voir les disponibilités')}</Bouton>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Extras ─────────────────────────────────────────────── */}
        {config.options.length > 0 && (
          <View onLayout={repere('extras')} style={sectionStyle}>
            <TitreSection titre={t('Servicios y extras', 'Services et extras')} sous={t('Sumalos a tu reserva con un toque.', 'Ajoutez-les à votre réservation d’un toucher.')} />
            <View style={[s.grille, { gap: 16 }]}>
              {config.options.map((o) => {
                const pris = extras.includes(o.id)
                return (
                  <View key={o.id} style={[large ? s.extraLarge : s.extra, { width: largeurExtra, borderColor: c.line }]}>
                    {large
                      ? <Carrousel photos={o.photos} hauteur={170} label={nomOption(o)} />
                      : <Image source={{ uri: o.photos[0] }} style={[s.extraVignette, { backgroundColor: c.surface3 }]} accessibilityLabel={nomOption(o)} />}
                    <View style={[s.flex, large && s.extraCorps]}>
                      <Text style={[s.extraNom, { color: c.ink }]}>{nomOption(o)}</Text>
                      {!!o.detail && <Text style={[s.extraDetail, { color: c.muted }]}>{tx(o.es?.detail, o.detail)}</Text>}
                      <View style={s.extraBas}>
                        <Text style={[s.extraPrix, num, { color: c.ink }]}>{prixOptionTexte(o)}</Text>
                        <Pressable onPress={() => basculerExtra(o.id)} accessibilityRole="checkbox" accessibilityState={{ checked: pris }}
                                   style={({ pressed }) => [s.ajout, pris ? { backgroundColor: c.ink, borderColor: c.ink } : { borderColor: c.lineStrong }, pressed && { opacity: 0.7 }]}>
                          {pris && <Icon name="checkPlain" size={14} color={c.surface} trait={2.6} />}
                          <Text style={[s.ajoutTexte, { color: pris ? c.surface : c.ink }]}>{pris ? t('Agregado', 'Ajouté') : t('Agregar', 'Ajouter')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* ── Bon à savoir ───────────────────────────────────────── */}
        <View onLayout={repere('savoir')} style={sectionStyle}>
          <TitreSection titre={t('Bueno saber antes de reservar', 'Bon à savoir avant de réserver')} />
          <View style={[large && s.deuxColonnes, { gap: large ? 48 : 28 }]}>
            <View style={s.flex}>
              {(langue === 'es' ? config.es.aSavoir : config.aSavoir).map((x) => (
                <View key={x} style={[s.savoir, { borderBottomColor: c.line }]}>
                  <Icon name="info" size={18} color={c.ink} />
                  <Text style={[s.savoirTexte, { color: c.ink2 }]}>{x}</Text>
                </View>
              ))}
            </View>
            <View style={s.flex}>
              <Condition titre={t('Llegada y salida', 'Arrivée et départ')}
                         texte={t(`Llegada desde las ${config.arrivee}. Salida hasta las ${config.depart}.`, `Arrivée dès ${config.arrivee}. Départ avant ${config.depart}.`)} />
              <Condition titre={t('Pago', 'Paiement')} texte={textePaiement(config.paiement, t)} />
              {!!config.annulation && <Condition titre={t('Cancelación', 'Annulation')} texte={tx(config.es.annulation, config.annulation)} dernier />}
            </View>
          </View>
        </View>

        {/* ── Disponibilités et panier ───────────────────────────── */}
        <View onLayout={repere('dispo')} style={sectionStyle}>
          <TitreSection titre={t('Disponibilidad', 'Disponibilités')}
                        sous={t('En tiempo real: lo que ves libre, está libre.', 'En direct : ce qui est libre l’est vraiment.')} />
          <View style={[large && s.deuxColonnes, { gap: large ? 48 : 32, alignItems: large ? 'flex-start' : 'stretch' }]}>
            <View style={s.flex}>
              <View style={[s.voyageurs, { borderColor: c.line }]}>
                <View style={s.flex}>
                  <Text style={[s.voyageursTitre, { color: c.ink }]}>{t('Huéspedes', 'Voyageurs')}</Text>
                  <Text style={[s.meta, { color: c.muted }]}>{t('Contando a los chicos', 'Enfants compris')}</Text>
                </View>
                <Compteur valeur={personnes} min={1} max={capaciteMax} onChange={(n) => { setPersonnes(n); setEtape({ quoi: 'panier' }) }} />
              </View>

              <View style={s.calendrier}>
                <CalendrierDispo mois={large ? 2 : 1} debut={debut} fin={fin} onChange={choisirDates} langue={langue} departMax={dMax}
                                 ouverte={(j) => nuitOuverte(chambres, personnes, j, sejours)} />
              </View>

              <View style={[s.selection, { borderTopColor: c.line }]}>
                <Text style={[s.selectionTexte, num, { color: c.ink }]}>
                  {debut && fin
                    ? `${jourCourt(debut, langue)} → ${jourCourt(fin, langue)} · ${nuits} ${nuits > 1 ? t('noches', 'nuits') : t('noche', 'nuit')}`
                    : debut ? t('Ahora, la fecha de salida', 'Maintenant, la date de départ') : t('Tocá tu fecha de llegada', 'Touchez votre date d’arrivée')}
                </Text>
                {debut && (
                  <Pressable onPress={() => choisirDates(null, null)} accessibilityRole="button" hitSlop={8}>
                    <Text style={[s.lien, { color: c.ink }]}>{t('Borrar', 'Effacer')}</Text>
                  </Pressable>
                )}
              </View>
              <Text style={[s.legende, { color: c.muted }]}>{t('Las fechas tachadas están completas.', 'Les dates barrées sont complètes.')}</Text>

              {debut && fin && (
                <View style={s.resultats}>
                  {libres.length === 0 ? (
                    <Text style={[s.texte, { color: c.ink2 }]}>
                      {t(`No queda lugar para ${personnes} en esas fechas. Probá otras, o escribinos y buscamos una solución.`,
                        `Plus de place pour ${personnes} à ces dates. Essayez-en d’autres, ou écrivez-nous.`)}
                    </Text>
                  ) : libres.map(({ ch, libres: reste, besoin }) => {
                    const actif = ch.id === choisie?.ch.id
                    return (
                      <Pressable key={ch.id} onPress={() => { setChoix(ch.id); setEtape({ quoi: 'panier' }) }} accessibilityRole="radio" accessibilityState={{ checked: actif }}
                                 style={({ pressed }) => [s.resultat, { borderColor: actif ? c.ink : c.line, borderWidth: actif ? 2 : 1 }, pressed && { opacity: 0.8 }]}>
                        <Image source={{ uri: ch.photos[0] }} style={[s.resultatImage, { backgroundColor: c.surface3 }]} />
                        <View style={s.flex}>
                          <Text style={[s.resultatNom, { color: c.ink }]}>{nomChambre(ch)}</Text>
                          <Text style={[s.meta, { color: c.muted }]}>{capaciteTexte(ch)}</Text>
                          {reste - besoin === 0
                            ? <Text style={[s.reste, { color: c.warnInk }]}>{t('¡Última disponible!', 'Dernière disponible')}</Text>
                            : reste - besoin <= 2 && <Text style={[s.reste, { color: c.warnInk }]}>{t(`Quedan ${reste}`, `Plus que ${reste}`)}</Text>}
                        </View>
                        <View style={s.resultatPrix}>
                          <Text style={[s.resultatTotal, num, { color: c.ink }]}>{pesos(prixChambre(ch, personnes, nuits))}</Text>
                          <Text style={[s.meta, { color: c.muted }]}>{nuits} {nuits > 1 ? t('noches', 'nuits') : t('noche', 'nuit')}</Text>
                        </View>
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </View>

            {/* Le panier */}
            <View onLayout={repere('panier')} style={[s.panier, large && { width: 380 }, { borderColor: c.line, backgroundColor: c.surface }]}>
              <Text style={[s.panierTitre, { color: c.ink, fontFamily: serif }]}>{t('Tu reserva', 'Votre réservation')}</Text>

              {etape.quoi === 'confirmee' ? (
                <View style={s.etat}>
                  <View style={[s.rond, { backgroundColor: c.okWash }]}><Icon name="checkPlain" size={30} color={c.ok} trait={2.8} /></View>
                  <Text style={[s.etatTitre, { color: c.ink }]}>{t(`¡Listo, ${nom.split(' ')[0]}! Tu reserva está confirmada.`, `C’est fait, ${nom.split(' ')[0]} ! Votre réservation est confirmée.`)}</Text>
                  <Text style={[s.texte, { color: c.ink2 }]}>
                    {t(`Recibimos ${pesos(etape.montant)}. Te mandamos la confirmación por WhatsApp.`, `Nous avons reçu ${pesos(etape.montant)}. La confirmation part sur WhatsApp.`)}
                  </Text>
                  <Bouton kind="contour" onPress={() => { recommencer(); setNom(''); setWhatsapp('') }}>{t('Hacer otra reserva', 'Faire une autre réservation')}</Bouton>
                </View>
              ) : etape.quoi === 'demande' ? (
                <View style={s.etat}>
                  <View style={[s.rond, { backgroundColor: c.okWash }]}><Icon name="send" size={26} color={c.ok} /></View>
                  <Text style={[s.etatTitre, { color: c.ink }]}>{t('¡Pedido enviado!', 'Demande envoyée !')}</Text>
                  <Text style={[s.texte, { color: c.ink2 }]}>{t('Te confirmamos por WhatsApp en un rato.', 'On vous confirme sur WhatsApp très vite.')}</Text>
                  <Bouton kind="contour" onPress={recommencer}>{t('Hacer otra reserva', 'Faire une autre réservation')}</Bouton>
                </View>
              ) : etape.quoi === 'retenue' ? (
                <View style={s.etat}>
                  <View style={[s.retenue, { backgroundColor: c.warnWash, borderColor: c.warnLine }]}>
                    <Icon name="clock" size={18} color={c.warnInk} />
                    <Text style={[s.retenueTexte, { color: c.warnInk }]}>
                      {t(`Te guardamos ${nomChambre(choisie?.ch ?? chambres[0]).toLowerCase()} hasta las ${etape.jusqua}.`, `On vous garde la chambre jusqu’à ${etape.jusqua}.`)}
                    </Text>
                  </View>
                  <View style={[s.mp, { borderColor: c.line }]}>
                    <View style={[s.mpHaut, { backgroundColor: marques.mercadoPago }]}>
                      <Text style={[s.mpMarque, { color: marques.blanc }]}>Mercado Pago</Text>
                    </View>
                    <View style={s.mpCorps}>
                      <Text style={[s.meta, { color: c.muted }]}>{config.hotel}</Text>
                      <Text style={[s.mpMontant, num, { color: c.ink }]}>{pesos(etape.montant)}</Text>
                      <Bouton couleur={marques.mercadoPago} onPress={() => { payerEnLigne(etape.ids); setEtape({ quoi: 'confirmee', montant: etape.montant }) }}>
                        {t('Pagar', 'Payer')}
                      </Bouton>
                      <Text style={[s.legende, { color: c.muted, textAlign: 'center' }]}>{t('Demostración: no se cobra nada.', 'Démonstration : rien n’est débité.')}</Text>
                    </View>
                  </View>
                </View>
              ) : !choisie || !debut || !fin ? (
                <Text style={[s.texte, { color: c.muted }]}>
                  {debut && fin
                    ? t('Elegí una habitación y el total aparece acá.', 'Choisissez une chambre : le total s’affiche ici.')
                    : t('Elegí tus fechas y una habitación: el total aparece acá.', 'Choisissez vos dates et une chambre : le total s’affiche ici.')}
                </Text>
              ) : (
                <>
                  <View style={s.panierChambre}>
                    <Image source={{ uri: choisie.ch.photos[0] }} style={[s.panierImage, { backgroundColor: c.surface3 }]} />
                    <View style={s.flex}>
                      <Text style={[s.resultatNom, { color: c.ink }]}>{nomChambre(choisie.ch)}</Text>
                      <Text style={[s.meta, num, { color: c.muted }]}>
                        {jourCourt(debut, langue)} → {jourCourt(fin, langue)} · {personnes} {personnes > 1 ? t('personas', 'personnes') : t('persona', 'personne')}
                      </Text>
                    </View>
                  </View>

                  <View style={[s.lignes, { borderTopColor: c.line }]}>
                    <Ligne libelle={`${pesos(Number(choisie.ch.prix))} × ${nuits} ${nuits > 1 ? t('noches', 'nuits') : t('noche', 'nuit')}${choisie.ch.parLit ? ` × ${personnes}` : ''}`} montant={prixCh} />
                    {lignesExtras.map(({ o, prix }) => <Ligne key={o.id} libelle={nomOption(o)} montant={prix} gratuit={t('Sin cargo', 'Offert')} />)}
                  </View>

                  <Text style={[s.extrasTitre, { color: c.ink }]}>{t('Extras', 'Extras')}</Text>
                  {config.options.map((o) => {
                    const pris = extras.includes(o.id)
                    return (
                      <Pressable key={o.id} onPress={() => basculerExtra(o.id)} accessibilityRole="checkbox" accessibilityState={{ checked: pris }} style={s.coche}>
                        <View style={[s.case, pris ? { backgroundColor: c.ink, borderColor: c.ink } : { borderColor: c.lineStrong }]}>
                          {pris && <Icon name="checkPlain" size={13} color={c.surface} trait={3} />}
                        </View>
                        <Text style={[s.cocheTexte, { color: c.ink2 }]}>{nomOption(o)}</Text>
                        <Text style={[s.cochePrix, num, { color: c.muted }]}>{o.prix ? pesos(prixOptionSejour(o, personnes, nuits)) : t('Sin cargo', 'Offert')}</Text>
                      </Pressable>
                    )
                  })}

                  <View style={[s.lignes, { borderTopColor: c.line }]}>
                    <View style={s.ligne}>
                      <Text style={[s.totalTexte, { color: c.ink }]}>Total</Text>
                      <Text style={[s.totalTexte, num, { color: c.ink }]}>{pesos(total)}</Text>
                    </View>
                    {!surPlace && aPayer < total && (
                      <>
                        <Ligne libelle={t(`Hoy pagás la seña (${Math.round((aPayer / total) * 100)} %)`, `Acompte aujourd’hui (${Math.round((aPayer / total) * 100)} %)`)} montant={aPayer} fort />
                        <Ligne libelle={t('El resto, al llegar', 'Le reste, à l’arrivée')} montant={total - aPayer} />
                      </>
                    )}
                    {surPlace && <Text style={[s.meta, { color: c.muted }]}>{t('Se paga al llegar.', 'À régler sur place.')}</Text>}
                  </View>

                  {derniere ? (
                    <View style={s.formulaire}>
                      <View style={[s.retenue, { backgroundColor: c.warnWash, borderColor: c.warnLine }]}>
                        <Icon name="info" size={18} color={c.warnInk} />
                        <Text style={[s.retenueTexte, { color: c.warnInk }]}>
                          {t('Es la última para esas fechas: te la confirmamos personalmente por WhatsApp.', 'C’est la dernière à ces dates : on vous la confirme en personne sur WhatsApp.')}
                        </Text>
                      </View>
                      <Bouton couleur={marques.whatsapp} icon="whatsapp" onPress={() => Linking.openURL(lienWhatsApp(tel, messageDerniere))}>
                        {t('Reservar por WhatsApp', 'Réserver sur WhatsApp')}
                      </Bouton>
                    </View>
                  ) : (
                    <View style={s.formulaire}>
                      <Champ valeur={nom} onChange={setNom} placeholder={t('Nombre y apellido', 'Prénom et nom')} />
                      <Champ valeur={whatsapp} onChange={setWhatsapp} placeholder={t('Tu WhatsApp (ej. 388 412-3456)', 'Votre WhatsApp')} tel />
                      <Bouton couleur={surPlace ? c.ink : marques.mercadoPago} onPress={payer} desactive={!pret}>
                        {surPlace ? t('Pedir la reserva', 'Demander la réservation')
                          : t(`Pagar ${pesos(aPayer)} con Mercado Pago`, `Payer ${pesos(aPayer)} avec Mercado Pago`)}
                      </Bouton>
                      {!!config.annulation && <Text style={[s.legende, { color: c.muted }]}>{tx(config.es.annulation, config.annulation)}</Text>}
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* ── Comment venir ──────────────────────────────────────── */}
        <View onLayout={repere('lieu')} style={sectionStyle}>
          <TitreSection titre={t('Cómo llegar', 'Comment venir')} sous={`${config.adresse}, ${config.codePostal} ${config.ville}, ${config.province}`} />
          {!!config.acces && <Text style={[s.texte, { color: c.ink2, marginBottom: 20 }]}>{tx(config.es.acces, config.acces)}</Text>}
          <Carte lat={config.coords.lat} lng={config.coords.lng} hauteur={large ? 440 : 320} titre={t(`Mapa de ${config.hotel}`, `Plan d’accès à ${config.hotel}`)} />
          <View style={s.carteActions}>
            <Bouton kind="contour" icon="pin" onPress={() => Linking.openURL(lienItineraire(config.coords.lat, config.coords.lng))}>
              {t('Abrir en Google Maps', 'Ouvrir dans Google Maps')}
            </Bouton>
          </View>
        </View>

        {/* ── Pied de page ───────────────────────────────────────── */}
        <View style={[s.pied, { width: contenu, borderTopColor: c.line }]}>
          <View style={[large && s.deuxColonnes, { gap: 20 }]}>
            <View style={s.flex}>
              <Text style={[s.piedNom, { color: c.ink, fontFamily: serif }]}>{config.hotel}</Text>
              <Text style={[s.meta, { color: c.muted }]}>{config.adresse} · {config.ville}, {config.province}</Text>
            </View>
            <View style={s.piedLiens}>
              <LienPied texte="WhatsApp" onPress={() => Linking.openURL(lienWhatsApp(tel, t('¡Hola! Quería hacer una consulta.', 'Bonjour ! J’ai une question.')))} />
              {!!config.instagram && <LienPied texte="Instagram" onPress={() => Linking.openURL(`https://instagram.com/${config.instagram.replace('@', '')}`)} />}
              {!!config.email && <LienPied texte={config.email} onPress={() => Linking.openURL(`mailto:${config.email}`)} />}
            </View>
          </View>
          <Text style={[s.credit, { color: c.muted }]}>{t('Reservá directo, sin comisiones · Página hecha con Roomz', 'Réservez en direct, sans commission · Page faite avec Roomz')}</Text>
        </View>
      </ScrollView>

      {/* ── En-tête fixe ─────────────────────────────────────────── */}
      <View style={[s.entete, { paddingTop: insets.top, height: hauteurEntete, backgroundColor: c.surface, borderBottomColor: c.line }]}>
        <View style={[s.enteteDedans, { width: contenu }]}>
          <Pressable onPress={() => scroll.current?.scrollTo({ y: 0, animated: true })} accessibilityRole="link" style={s.flexCourt}>
            <Text numberOfLines={1} style={[s.marque, { color: c.ink, fontFamily: serif }]}>{config.hotel}</Text>
          </Pressable>
          {large && (
            <View style={s.nav}>
              {[['chambres', t('Habitaciones', 'Chambres')], ['extras', t('Servicios', 'Services')], ['dispo', t('Disponibilidad', 'Disponibilités')], ['lieu', t('Cómo llegar', 'Accès')]].map(([cle, texte]) => (
                <Pressable key={cle} onPress={() => aller(cle)} accessibilityRole="link">
                  <Text style={[s.navTexte, { color: c.ink2 }]}>{texte}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={s.enteteDroite}>
            <View style={[s.langues, { borderColor: c.line }]}>
              {(['es', 'fr'] as const).map((l) => (
                <Pressable key={l} onPress={() => setLangue(l)} accessibilityRole="radio" accessibilityState={{ checked: langue === l }}
                           style={[s.langue, langue === l && { backgroundColor: c.surface3 }]}>
                  <Text style={[s.langueTexte, { color: langue === l ? c.ink : c.muted }]}>{l.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            {large && <Bouton petit onPress={() => aller('dispo')}>{t('Reservar', 'Réserver')}</Bouton>}
          </View>
        </View>
      </View>

      {/* ── Barre du bas, sur téléphone ──────────────────────────── */}
      {!large && etape.quoi !== 'confirmee' && (
        <View style={[s.barre, { paddingBottom: 12 + insets.bottom, backgroundColor: c.surface, borderTopColor: c.line }]}>
          <View style={s.flex}>
            {total > 0 ? (
              <>
                <Text style={[s.barrePrix, num, { color: c.ink }]}>{pesos(total)}</Text>
                <Text style={[s.meta, { color: c.muted }]}>{nuits} {nuits > 1 ? t('noches', 'nuits') : t('noche', 'nuit')} · {nomChambre(choisie!.ch)}</Text>
              </>
            ) : (
              <>
                <Text style={[s.meta, { color: c.muted }]}>{t('Desde', 'Dès')}</Text>
                <Text style={[s.barrePrix, num, { color: c.ink }]}>{pesos(prixMin)} <Text style={[s.parNuit, { color: c.muted }]}>/ {t('noche', 'nuit')}</Text></Text>
              </>
            )}
          </View>
          <Bouton petit onPress={() => aller(total > 0 ? 'panier' : 'dispo')}>{total > 0 ? t('Reservar', 'Réserver') : t('Ver fechas', 'Voir les dates')}</Bouton>
        </View>
      )}
    </View>
  )
}

function textePaiement(regle: string, t: (es: string, fr: string) => string) {
  if (regle.includes('30')) return t('Seña del 30 % al reservar, con Mercado Pago. El resto, al llegar.', 'Acompte de 30 % à la réservation, par Mercado Pago. Le reste à l’arrivée.')
  if (regle.includes('50')) return t('Seña del 50 % al reservar, con Mercado Pago. El resto, al llegar.', 'Acompte de 50 % à la réservation, par Mercado Pago. Le reste à l’arrivée.')
  if (regle === 'Sur place') return t('Se paga al llegar.', 'On paie sur place.')
  return t('Se paga el total al reservar, con Mercado Pago.', 'Le total se règle à la réservation, par Mercado Pago.')
}

function TitreSection({ titre, sous }: { titre: string; sous?: string }) {
  const c = useCouleurs()
  return (
    <View style={s.titreSection}>
      <Text accessibilityRole="header" style={[s.h2, { color: c.ink, fontFamily: serif }]}>{titre}</Text>
      {!!sous && <Text style={[s.sousSection, { color: c.muted }]}>{sous}</Text>}
    </View>
  )
}

function Fait({ icon, texte }: { icon: IconName; texte: string }) {
  const c = useCouleurs()
  return (
    <View style={s.fait}>
      <Icon name={icon} size={18} color={c.ink} />
      <Text style={[s.faitTexte, { color: c.ink2 }]}>{texte}</Text>
    </View>
  )
}

function Condition({ titre, texte, dernier }: { titre: string; texte: string; dernier?: boolean }) {
  const c = useCouleurs()
  return (
    <View style={[s.condition, !dernier && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line }]}>
      <Text style={[s.conditionTitre, { color: c.ink }]}>{titre}</Text>
      <Text style={[s.texte, { color: c.ink2 }]}>{texte}</Text>
    </View>
  )
}

function Ligne({ libelle, montant, fort, gratuit }: { libelle: string; montant: number; fort?: boolean; gratuit?: string }) {
  const c = useCouleurs()
  return (
    <View style={s.ligne}>
      <Text style={[s.ligneTexte, { color: fort ? c.ink : c.ink2, fontWeight: fort ? '700' : '400' }]}>{libelle}</Text>
      <Text style={[s.ligneTexte, num, { color: fort ? c.ink : c.ink2, fontWeight: fort ? '700' : '400' }]}>{montant || !gratuit ? pesos(montant) : gratuit}</Text>
    </View>
  )
}

function Compteur({ valeur, onChange, min, max }: { valeur: number; onChange: (n: number) => void; min: number; max: number }) {
  const c = useCouleurs()
  const bouton = (signe: 'minus' | 'plus', cible: number, off: boolean) => (
    <Pressable onPress={() => onChange(cible)} disabled={off} accessibilityRole="button" accessibilityLabel={signe === 'plus' ? 'Más' : 'Menos'}
               style={({ pressed }) => [s.compteurBouton, { borderColor: c.lineStrong, opacity: off ? 0.3 : pressed ? 0.6 : 1 }]}>
      <Icon name={signe} size={16} color={c.ink} trait={2.2} />
    </Pressable>
  )
  return (
    <View style={s.compteur}>
      {bouton('minus', valeur - 1, valeur <= min)}
      <Text style={[s.compteurValeur, num, { color: c.ink }]}>{valeur}</Text>
      {bouton('plus', valeur + 1, valeur >= max)}
    </View>
  )
}

function Champ({ valeur, onChange, placeholder, tel }: { valeur: string; onChange: (v: string) => void; placeholder: string; tel?: boolean }) {
  const c = useCouleurs()
  return (
    <TextInput value={valeur} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.muted} accessibilityLabel={placeholder}
               keyboardType={tel ? 'phone-pad' : 'default'} autoComplete={tel ? 'tel' : 'name'}
               style={[s.champ, { borderColor: c.lineStrong, color: c.ink, backgroundColor: c.surface }]} />
  )
}

function Bouton({ children, onPress, kind = 'plein', couleur, icon, petit, desactive }: {
  children: ReactNode; onPress: () => void; kind?: 'plein' | 'contour'; couleur?: string; icon?: IconName; petit?: boolean; desactive?: boolean
}) {
  const c = useCouleurs()
  const fond = kind === 'contour' ? 'transparent' : couleur ?? c.ink
  const encre = kind === 'contour' ? c.ink : couleur ? marques.blanc : c.surface
  return (
    <Pressable onPress={onPress} disabled={desactive} accessibilityRole="button" accessibilityState={{ disabled: !!desactive }}
               style={({ pressed }) => [s.bouton, petit && s.boutonPetit, { backgroundColor: fond, opacity: desactive ? 0.35 : pressed ? 0.85 : 1 },
                                        kind === 'contour' && { borderWidth: 1, borderColor: c.ink }]}>
      {icon && <Icon name={icon} size={18} color={encre} />}
      <Text style={[s.boutonTexte, petit && s.boutonTextePetit, { color: encre }]}>{children}</Text>
    </Pressable>
  )
}

function LienPied({ texte, onPress }: { texte: string; onPress: () => void }) {
  const c = useCouleurs()
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={6}>
      <Text style={[s.lien, { color: c.ink }]}>{texte}</Text>
    </Pressable>
  )
}

const s = StyleSheet.create({
  page: { flex: 1 },
  flex: { flex: 1 },
  flexCourt: { flexShrink: 1 },
  defile: { alignItems: 'center' },
  entete: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  enteteDedans: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 24 },
  marque: { fontSize: 21, letterSpacing: -0.2 },
  nav: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 28 },
  navTexte: { fontSize: 15, fontWeight: '500' },
  enteteDroite: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 12 },
  langues: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, padding: 3 },
  langue: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  langueTexte: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },

  mosaique: { flexDirection: 'row', gap: 8, borderRadius: 20, overflow: 'hidden' },
  mosaiqueGrande: { flex: 1, height: '100%' },
  mosaiqueDroite: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mosaiquePetite: { width: '48.9%', height: '48.6%' },

  presentationLarge: { flexDirection: 'row', gap: 56, alignItems: 'flex-start' },
  h1: { letterSpacing: -0.5 },
  lieu: { fontSize: 16, marginTop: 8 },
  presentation: { fontSize: 18, lineHeight: 28, marginTop: 20, maxWidth: 640 },
  faits: { gap: 14, marginTop: 28, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth },
  faitsLarge: { width: 340, marginTop: 8, paddingTop: 0, paddingLeft: 32, borderTopWidth: 0, borderLeftWidth: StyleSheet.hairlineWidth },
  fait: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faitTexte: { flex: 1, fontSize: 15, lineHeight: 21 },
  aime: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 28 },
  aimePuce: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  aimeTexte: { fontSize: 14, fontStyle: 'italic' },

  titreSection: { marginBottom: 28, gap: 6 },
  h2: { fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  sousSection: { fontSize: 16, lineHeight: 23 },
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
  carteChambre: { flexDirection: 'column' },
  carteCorps: { flex: 1, paddingTop: 16, gap: 8 },
  carteBas: { flex: 1 },
  carteHaut: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  h3: { flex: 1, fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  prixDesde: { fontSize: 17, fontWeight: '700' },
  parNuit: { fontSize: 14, fontWeight: '400' },
  meta: { fontSize: 14, lineHeight: 20 },
  texte: { fontSize: 16, lineHeight: 25 },
  equip: { fontSize: 13, lineHeight: 19, marginBottom: 6 },

  extra: { flexDirection: 'row', gap: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 12 },
  extraLarge: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: 'hidden' },
  extraCorps: { padding: 16 },
  extraVignette: { width: 88, height: 88, borderRadius: 12 },
  extraNom: { fontSize: 16, fontWeight: '700' },
  extraDetail: { fontSize: 14, lineHeight: 19, marginTop: 3 },
  extraBas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 10 },
  extraPrix: { flexShrink: 1, fontSize: 14, fontWeight: '600' },
  ajout: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, minHeight: 34 },
  ajoutTexte: { fontSize: 14, fontWeight: '600' },

  deuxColonnes: { flexDirection: 'row' },
  savoir: { flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
  savoirTexte: { flex: 1, fontSize: 16, lineHeight: 24 },
  condition: { paddingVertical: 14, gap: 4 },
  conditionTitre: { fontSize: 15, fontWeight: '700' },

  voyageurs: { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14 },
  voyageursTitre: { fontSize: 16, fontWeight: '700' },
  compteur: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  compteurBouton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  compteurValeur: { fontSize: 17, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  calendrier: { marginTop: 28 },
  selection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  selectionTexte: { flex: 1, fontSize: 16, fontWeight: '600' },
  lien: { fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
  legende: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  resultats: { gap: 12, marginTop: 24 },
  resultat: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 12 },
  resultatImage: { width: 72, height: 72, borderRadius: 12 },
  resultatNom: { fontSize: 16, fontWeight: '700' },
  reste: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  resultatPrix: { alignItems: 'flex-end' },
  resultatTotal: { fontSize: 16, fontWeight: '700' },

  panier: { borderWidth: 1, borderRadius: 20, padding: 22, gap: 14, boxShadow: '0 6px 24px rgba(16,26,51,.08)' },
  panierTitre: { fontSize: 24 },
  panierChambre: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  panierImage: { width: 64, height: 64, borderRadius: 12 },
  lignes: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 8 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  ligneTexte: { fontSize: 15, lineHeight: 21, flexShrink: 1 },
  totalTexte: { fontSize: 18, fontWeight: '700' },
  extrasTitre: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  coche: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  case: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cocheTexte: { flex: 1, fontSize: 15 },
  cochePrix: { fontSize: 14 },
  formulaire: { gap: 10, marginTop: 4 },
  champ: { borderWidth: 1, borderRadius: 12, minHeight: 50, paddingHorizontal: 14, fontSize: 16 },
  etat: { gap: 14 },
  rond: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  etatTitre: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  retenue: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 12 },
  retenueTexte: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  mp: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  mpHaut: { paddingVertical: 12, paddingHorizontal: 16 },
  mpMarque: { fontSize: 16, fontWeight: '800' },
  mpCorps: { padding: 16, gap: 10 },
  mpMontant: { fontSize: 30, fontWeight: '700' },

  carteActions: { flexDirection: 'row', marginTop: 16 },
  pied: { marginTop: 88, paddingTop: 32, paddingBottom: 48, borderTopWidth: StyleSheet.hairlineWidth, gap: 24 },
  piedNom: { fontSize: 24, marginBottom: 4 },
  piedLiens: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'center' },
  credit: { fontSize: 13 },

  bouton: { minHeight: 50, borderRadius: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch' },
  boutonPetit: { minHeight: 42, borderRadius: 999, paddingHorizontal: 18, alignSelf: 'auto' },
  boutonTexte: { fontSize: 16, fontWeight: '700' },
  boutonTextePetit: { fontSize: 15 },
  barre: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  barrePrix: { fontSize: 18, fontWeight: '700' },
})
