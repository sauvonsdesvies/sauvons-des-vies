# Déploiement Hostinger

## Connexion administrateur

Les trois routes de connexion, vérification OTP et déconnexion partagent la même validation d'origine. Derrière le proxy Hostinger, l'origine HTTPS du navigateur est acceptée lorsqu'elle correspond au `Host` public, ou aux en-têtes de proxy avec `Sec-Fetch-Site: same-origin`. Les requêtes provenant d'un autre site sont refusées. `ADMIN_ALLOWED_ORIGIN` est facultative quand le domaine public est transmis correctement ; si renseignée, utiliser l'origine HTTPS actuelle, sans chemin. Une ancienne valeur locale ne bloque plus une requête correspondant au domaine public. Les cookies sécurisés, le mot de passe, le code OTP et les limites d'essais restent obligatoires.

Un retour 401 de `/api/admin/auth/connexion` signifie que l'adresse email ou le mot de passe ne correspond pas aux variables du serveur. Les comptes administrateurs de cette route sont configurés par `ADMIN_EMAIL` et `ADMIN_PASSWORD_HASH`, pas par un compte Supabase Auth. Un retour 503 indique une configuration invalide ou un envoi d'email indisponible ; les journaux serveur distinguent ces cas sans afficher les secrets.

- Vérifier dans Hostinger que `ADMIN_EMAIL` correspond exactement à l'adresse utilisée pour se connecter.
- `ADMIN_PASSWORD_HASH` doit contenir le hash bcrypt complet du mot de passe voulu (60 caractères, commençant par `$2a$`, `$2b$` ou `$2y$`), jamais le mot de passe en clair. Ne pas ajouter de guillemets dans le champ de valeur de l'interface Hostinger et conserver tous les caractères `$`.
- Dans un fichier `.env.local` lu par Next.js, échapper chaque dollar du hash avec un antislash (`\$`) : Next.js développe les références aux variables, ce qui peut autrement altérer le hash. Ne pas appliquer cet échappement aux valeurs saisies directement dans Hostinger.
- Vérifier `AUTH_SECRET` (au moins 32 caractères), `ADMIN_ALLOWED_ORIGIN` (origine HTTPS exacte du site), `RESEND_API_KEY` et `MAIL_FROM` (expéditeur autorisé chez Resend).
- Exécuter `node scripts/check-admin-auth-config.cjs` dans l'environnement concerné : seuls les noms et résultats de validation sont affichés. Un résultat OK valide le format, pas la correspondance avec le mot de passe saisi ni la délivrabilité des emails.
- Redémarrer/redéployer l'application après modification des variables Hostinger. Après cinq tentatives, attendre 15 minutes avant de réessayer. Ne pas publier les identifiants ni le hash dans les journaux ou le chat.

## Ressources du build

`next.config.ts` limite le build à deux workers (`experimental.cpus: 2`), sans worker threads (`workerThreads: false`). `staticGenerationMaxConcurrency: 1` limite chaque worker à une page en cours. Le journal du build doit donc annoncer deux workers, et non 55. Si ce n’est pas le cas, vérifier que Hostinger compile le commit contenant cette configuration.

Un SIGABRT signale un arrêt natif. Un nombre élevé de workers peut épuiser la mémoire ou les threads disponibles, mais le signal seul ne permet pas d’identifier le module responsable. Si le crash persiste avec deux workers, récupérer le journal brut complet et les limites mémoire du conteneur. Ne pas imposer un heap de 4 Go à un conteneur dont la mémoire disponible est inférieure.

Le projet conserve `cacheComponents: true`. Les lectures Prisma des pages publiques s’exécutent après `connection()` dans une limite `Suspense`, et les pages protégées attendent la session/cookies avant leurs requêtes. Ne pas ajouter `dynamic = "force-dynamic"` : cette configuration est incompatible avec Cache Components dans la version installée. Les pages statiques restent prérendues.

La branche Node.js 22 est compatible à partir de 22.12, minimum indiqué par Prisma 7.10.1. Ne pas copier `node_modules` de Windows vers Hostinger : npm doit installer les variantes Linux de Sharp/Lightning CSS. Ne pas désactiver les dépendances optionnelles natives (`--omit=optional`). Prisma utilise l’adaptateur PostgreSQL existant ; aucune mise à jour de dépendance ni migration de base n’est nécessaire pour limiter les workers.

Validation locale : TypeScript passe ; le build termine les 60 pages avec deux workers, y compris avec `DATABASE_URL` et `DIRECT_URL` temporairement dirigées vers un port PostgreSQL local inaccessible pour le processus de build Next.js. Aucun fichier d’environnement ni donnée Supabase n’est modifié. Les tests natifs Sharp et Lightning CSS passent sous Windows ; les paquets Linux optionnels figurent dans le lockfile. Leur exécution sur le conteneur Hostinger reste à vérifier lors du redéploiement.

## Installation et configuration

- Conserver `.npmrc` dans le dépôt. `include=dev` installe les outils nécessaires au build, même avec `NODE_ENV=production` : Tailwind/PostCSS, TypeScript et Prisma.
- Installer depuis `package-lock.json`, puis compiler avec `npm run build`. Ce script régénère le client Prisma avant Next.js. Démarrer avec `npm start`.
- Les variables de `.env.local` ne sont pas transmises automatiquement à Hostinger : les configurer dans l’espace d’hébergement, sans publier le fichier ni les clés.
- Le proxy peut présenter une URL interne HTTP à Next.js. Les routes de paiement valident l’origine publique et l’utilisent pour le retour HTTPS. Les requêtes d’un autre site restent refusées. `NEXT_PUBLIC_SITE_URL`, si renseignée, doit correspondre au domaine public.
- Autoriser le domaine dans FedaPay > Applications pour Checkout.js. Les secrets de webhook doivent correspondre à l’environnement marchand utilisé.

Après déploiement, vérifier `/demander-aide`, l’affichage CSS, et le lancement du paiement en sandbox. Les tests locaux avec services simulés ne valident pas une opération bancaire réelle. Aucun paiement réel n’est nécessaire pour diagnostiquer un refus d’origine : un corps JSON vide doit être refusé avec 400 (données invalides), sans appeler le prestataire.
