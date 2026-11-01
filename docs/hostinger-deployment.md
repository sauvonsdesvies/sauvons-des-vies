# Déploiement Hostinger

- Conserver `.npmrc` dans le dépôt. `include=dev` installe les outils nécessaires au build, même avec `NODE_ENV=production` : Tailwind/PostCSS, TypeScript et Prisma.
- Installer depuis `package-lock.json`, puis compiler avec `npm run build`. Ce script régénère le client Prisma avant Next.js. Démarrer avec `npm start`.
- Les variables de `.env.local` ne sont pas transmises automatiquement à Hostinger : les configurer dans l’espace d’hébergement, sans publier le fichier ni les clés.
- Le proxy peut présenter une URL interne HTTP à Next.js. Les routes de paiement valident l’origine publique et l’utilisent pour le retour HTTPS. Les requêtes d’un autre site restent refusées. `NEXT_PUBLIC_SITE_URL`, si renseignée, doit correspondre au domaine public.
- Autoriser le domaine dans FedaPay > Applications pour Checkout.js. Les secrets de webhook doivent correspondre à l’environnement marchand utilisé.

Après déploiement, vérifier `/demander-aide`, l’affichage CSS, et le lancement du paiement en sandbox. Les tests locaux avec services simulés ne valident pas une opération bancaire réelle. Aucun paiement réel n’est nécessaire pour diagnostiquer un refus d’origine : un corps JSON vide doit être refusé avec 400 (données invalides), sans appeler le prestataire.
