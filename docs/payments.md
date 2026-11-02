# Parcours de don

Le bouton de campagne ouvre `/faire-un-don?campagne=<UUID>&montant=<montant facultatif>`.
Sans campagne, `/faire-un-don` renvoie vers les campagnes. Le serveur refuse les campagnes non actives, non publiées, hors période ou avec une devise différente de XOF.

Le formulaire propose 1 000, 2 500, 5 000, 10 000, 25 000 et 50 000 F CFA et un montant libre entier entre 100 et 10 000 000 F CFA. Seul le téléphone international est demandé. L'e-mail est facultatif dans l'API pour préserver les appels existants et n'apparaît plus dans le formulaire public. Sans e-mail, FedaPay reçoit une transaction sans objet customer ; son checkout officiel peut demander les renseignements nécessaires. Aucune identité n'est inventée. Les textes du parcours existent en français, anglais, allemand et espagnol.

## Configuration à effectuer par le propriétaire

Ne jamais préfixer les secrets par `NEXT_PUBLIC_`. Aucun fichier `.env` n'est modifié par cette mise à jour.

FedaPay : `FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_SECRET`, et une cle publique `FEDAPAY_PUBLIC_KEY` ou la variable existante `NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY` pour Checkout.js.
Kkiapay : `KKIAPAY_PUBLIC_KEY`, `KKIAPAY_PRIVATE_KEY`, `KKIAPAY_SECRET_KEY`, `KKIAPAY_WEBHOOK_SECRET`.

Les cles publiques existantes sont reconnues sans renommer les variables : FedaPay accepte aussi NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY ; Kkiapay accepte aussi NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY. Les secrets restent exclusivement sur le serveur. FEDAPAY_ENVIRONMENT vaut live ou sandbox. KKIAPAY_SANDBOX=true configure ensemble le widget et la verification serveur en test ; ce mode est refuse lorsque NODE_ENV=production. Utiliser une base et un compte marchands de test isoles, jamais la base de collecte publique, pour les essais sandbox. Aucun fichier .env n'est modifie automatiquement.

La migration additive `20261031200000_payment_checkout_fields` ajoute la table `PaymentMethodConfig`, `Donation.donorPhone` et les champs d'idempotence, d'expiration et de données techniques des transactions. Elle ne crée ni don ni moyen activé. Déployer cette migration sur chaque base avec `npm run db:deploy`. Sans configuration activée, l'API des moyens renvoie une liste vide avec HTTP 200 ; un problème de base conserve une réponse d'erreur et un message de réessai dans l'interface.

Enregistrer les URL HTTPS suivantes dans les tableaux de bord marchands :

- FedaPay : `/api/payments/webhooks/fedapay` ; la signature est vérifiée par `Webhook.constructEvent` du SDK officiel sur le corps brut.
- Kkiapay : `/api/payments/webhooks/kkiapay` ; `x-kkiapay-secret` est comparé au secret de webhook configuré, en temps constant.

Activer ensuite les lignes correspondantes dans `PaymentMethodConfig` avec leurs priorités (la plus petite gagne). Les clés seules ne créent aucune configuration Prisma. Les lignes désactivées, inconnues ou sans clés/secrets nécessaires sont ignorées. Les tables et contraintes uniques du schéma de paiement doivent être présentes dans la base déployée ; aucune migration destructive n'est effectuée ici.

Wave reste masqué : son routage dédié n'est pas implémenté dans les adaptateurs actuels. Il n'est jamais assimilé arbitrairement à Mobile Money.

## Confirmation

Une transaction et un don PENDING sont enregistrés avant l'appel du prestataire. La clé d'idempotence unique et le verrou du formulaire évitent les doubles créations. Une réponse perdue doit être retentée avec la même clé ; la réponse DUPLICATE_REQUEST ne crée aucun autre don. Une initialisation incertaine reste PENDING et nécessite un rapprochement : ne pas recréer arbitrairement une transaction pour la remplacer.

Le jeton de consultation aléatoire est renvoyé une fois au navigateur. Seul son SHA-256 est enregistré en base. Le navigateur le conserve dans `sessionStorage` pour l'onglet courant et le transmet par l'en-tête `x-payment-access-token`, jamais dans une URL. Sans ce jeton, le statut privé est inaccessible. Si le stockage est désactivé ou si le retour se fait dans un autre onglet, le webhook peut confirmer le don mais la page de retour ne peut pas afficher son statut privé.

Le retour FedaPay est construit côté serveur vers `/paiement/retour?transactionId=<UUID>` ; l'ancienne variable `FEDAPAY_CALLBACK_URL` reste un secours pour les appels internes sans origine. Un retour navigateur ne prouve jamais un paiement.

Le widget Kkiapay fournit un identifiant externe, transmis à la route de statut autorisée. Le serveur charge **kkiapay-nodejs-sdk**, vérifie la transaction et exige l'égalité de l'identifiant externe, du montant, de la devise et du `partnerId` interne. En l'absence de ces éléments dans la réponse officielle, la confirmation est refusée. Le webhook utilise la même vérification indépendante.

La transition vers CONFIRMED utilise des écritures conditionnelles dans une transaction Prisma. Les lectures publiques existantes additionnent seulement les dons CONFIRMED avec une date de confirmation. Aucun compteur supplémentaire n'est incrémenté. Les statuts PENDING, PROCESSING, FAILED, CANCELLED et EXPIRED ne contribuent pas à la collecte.

## Validation avant ouverture au public

`node scripts/test-payment-flow.cjs` utilise uniquement des doublures isolées : aucune écriture dans la base réelle, aucun appel financier. Il couvre les validations, la concurrence, le jeton de statut, les montants non confirmés, les répétitions de confirmation, les quatre langues, les priorités, l'absence de faux noms et le rejet des webhooks non authentifiés.

Après configuration, tester réellement chaque moyen activé et chaque prestataire : redirection/retour, ouverture/fermeture du widget, réussite, attente, échec, annulation, expiration et livraison répétée des webhooks. Vérifier la forme réelle de la réponse de vérification Kkiapay (notamment devise et partnerId), la création FedaPay sans objet client et le retour dans le même onglet. Confirmer en base qu'un seul don est comptabilisé et que les statistiques publiques se mettent à jour.

Références : [SDK navigateur Kkiapay](https://docs.kkiapay.me/v1/plugin-et-sdk/sdk-javascript), [SDK serveur Kkiapay](https://github.com/kkiapay/nodejs-sdk), [webhooks Kkiapay](https://docs.kkiapay.me/v1/tableau-de-bord/webhook), [création FedaPay](https://docs.fedapay.com/api-reference/transactions/create).

## Présentation et réponses FedaPay

La page de don affiche des tuiles visuelles, un récapitulatif du montant et deux colonnes sur ordinateur, empilées sur mobile. Le footer est retiré uniquement sur `/faire-un-don`. Les marques des tuiles représentent les catégories disponibles ; le choix de l'opérateur dépend du parcours sécurisé du prestataire. Aucun champ de pays n'est ajouté au formulaire.

Les logos locaux de `public/images/payments` proviennent des visuels publiés sur [le site FedaPay](https://www.fedapay.com/). Aucun logo d'une méthode inactive n'est ajouté comme option de paiement.

L'adaptateur lit l'enveloppe officielle `v1/transaction`, les réponses de jeton directes et l'enveloppe `v1/token`. Lorsque la transaction fournit `currency_id`, la devise est obtenue auprès de `/currencies/{id}` et contrôlée avant confirmation. Elle n'est jamais déduite du montant ni remplacée par une devise supposée.

Les retours HTTP sont autorisés uniquement sur les hôtes locaux (`localhost`, `127.0.0.1`, `[::1]`) hors production. Les autres retours exigent HTTPS. Cette validation est exécutée avant la création d'un don en base.

La référence FedaPay est enregistrée dès la création distante, avant la génération du lien. Une requête répétée avec la même clé d'idempotence et les mêmes données peut reprendre cette transaction et générer un lien pour elle, sans nouveau don. Le jeton de consultation est alors renouvelé (seul son hash est conservé). Une tentative sans référence distante reste protégée contre la recréation aveugle : un rapprochement est nécessaire si l'état de la requête précédente est incertain.


## Paiement integre (novembre 2026)

FedaPay Checkout.js officiel (cdn.fedapay.com/checkout.js?v=1.1.7) ouvre maintenant la transaction deja creee par le serveur via transaction.id. Aucune seconde transaction n'est creee par notre interface. La cle publique correspond au meme environnement que la cle privee. Sans cle publique valide, la redirection securisee historique reste disponible. Le script est charge a la demande, une seule fois, avec delai limite et possibilite de reessai. Reouvrir le dialogue reprend la meme transaction. Le callback onComplete ne confirme rien : PaymentStatus demande la verification serveur avec le jeton prive de consultation.

Kkiapay conserve le widget officiel du paquet installe, limite a momo ou card selon le choix. Le numero et l'e-mail sont pre-remplis, aucun nom fictif n'est transmis. Des reception d'un identifiant externe, le bouton de reouverture disparait pour eviter une nouvelle operation, cet identifiant est conserve dans sessionStorage et le serveur verifie montant/devise/partnerId. Fermer un widget ne signifie pas que le don est annule : seul le statut distant est fiable. Les evenements navigateur ne peuvent jamais confirmer un don.

Les categories disponibles restent issues de PaymentMethodConfig et des secrets requis ; aucun nouvel operateur, prestataire ou Wave n'est active automatiquement. Les operateurs reels sont proposes par le checkout officiel selon pays, compte marchand et eligibilite. Les logos ne constituent pas une garantie universelle de disponibilite. Les cartes sont saisies exclusivement dans le composant du prestataire, jamais sur notre serveur. Une banque peut imposer une authentification ou une redirection. Le formulaire et les statuts de notre site restent disponibles en quatre langues ; les traductions propres aux widgets dependent du prestataire.

Avant mise en service de Checkout.js : autoriser le domaine dans FedaPay > Applications (y compris le domaine de test). Le nom ou d'autres informations peuvent etre exiges par le prestataire pour certaines operations : notre site n'invente aucune identite et ne contourne aucune obligation.

References officielles consultees :
- https://docs.fedapay.com/fr/introduction/checkoutjs (transaction.id, environment, locale, onComplete et autorisation du domaine)
- https://docs.fedapay.com/fr/payment-methods (operateurs et pays)
- https://docs.fedapay.com/api-reference/transactions/create (champs requis)
- https://docs.kkiapay.me/v1/plugin-et-sdk/sdk-javascript (widget, methode, partnerId, verification)

Tests automatises : node scripts/test-payment-flow.cjs (doublures explicites, pas de reseau ni ecriture reelle). Couvre les deux categories Kkiapay en sandbox, le meme environnement pour widget/verification, le refus sandbox en production, les quatre langues FedaPay, la reprise du meme ID, l'ouverture/reouverture du SDK officiel double, le rejet des cles privees/mauvaises configurations navigateur, et les controles financiers existants.

Restent a executer avec des identifiants sandbox et une base de test : carte et Mobile Money de chaque prestataire, authentification bancaire, refus/annulation/expiration, evenement webhook signe repete, mise a jour effective en PostgreSQL. Aucun paiement reel ne doit etre lance pour ces validations. Les tests isoles ne constituent pas une certification bancaire ni un test de bout en bout des plateformes marchandes.
