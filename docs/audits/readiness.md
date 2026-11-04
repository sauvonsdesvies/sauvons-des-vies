# Contrôle avant ouverture publique — 4 novembre 2026

## Résultats confirmés

- Douze pages publiques et pages de don contrôlées sur `sauvonsdesvies.com` : HTTP 200.
- Mobile Money et carte bancaire : affichés par l'API de production.
- Dix-sept sources d'images contrôlées : sept téléchargements ont dépassé 25 secondes avant correction, concernant notamment quatre photos originales et leurs URL de diffusion.
- Correction locale : conversion WebP, redimensionnement sans recadrage, cache mémoire borné à 10 Mo, regroupement des demandes identiques et conservation de la dernière image valide en cas de panne. Les fichiers originaux Supabase ne sont pas modifiés.
- Les quatre photos originales qui avaient expiré sont validées avec la correction locale : 213 720, 251 506, 54 206 et 253 696 octets en WebP, toutes HTTP 200. La dernière a nécessité un nouveau contrôle après un premier échec. Première récupération entre 19 et 26 secondes ; récupération suivante depuis le cache mesurée à 1 ms pour les deux photos principales. Voir `local-image-validation.json`.
- L'API des méthodes ne déclare plus l'e-mail obligatoire, conformément au formulaire actuel.
- Tests isolés : images, accueil multilingue, origine Hostinger, authentification et paiement. Aucun paiement réel, email réel ou changement de données de collecte effectué pendant l'audit.
- TypeScript, ESLint et compilation des 61 pages : réussis.

## Points restant à valider avant encaissement

1. Déployer les corrections, puis recontrôler les images depuis un navigateur mobile et PC. Le cache mémoire est propre à chaque processus et se vide au redémarrage ; le premier chargement reste dépendant de Supabase. Les téléchargements/traitements sont limités à deux simultanément pour limiter la mémoire utilisée sur Hostinger.
2. Effectuer un test sandbox officiel FedaPay : lancement sans e-mail, retour, vérification serveur, signature du webhook, annulation/échec et livraison répétée. Les tests isolés ne prouvent pas la configuration du compte marchand ni la validité des clés Hostinger.
3. Kkiapay : `KKIAPAY_WEBHOOK_SECRET` manque dans la configuration locale. Ne pas présenter cette intégration comme prête.
4. Le paiement existant traite uniquement XOF. Les collectes en EUR ou autres devises affichent une indisponibilité de paiement en ligne ; aucune conversion automatique n'a été inventée.
5. Une publication de test technique sur TypeScript reste publique. La retirer ou la remplacer depuis l'administration avant l'ouverture.
6. Vérifier le remplacement des secrets précédemment exposés, puis la réception réelle du code administrateur.

Les fichiers JSON joints contiennent uniquement les observations publiques et les mesures, aucune clé ni donnée bancaire.
