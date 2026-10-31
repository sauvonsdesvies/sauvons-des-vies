# Traduction des contenus publics

L’interface utilise les dictionnaires français, anglais, espagnol et allemand.
Les titres, descriptions, catégories et articles publiés utilisent DeepL côté serveur.

Ajouter `DEEPL_API_KEY` dans `.env.local` avec une vraie clé DeepL API, puis
redémarrer le serveur Next.js. Ne jamais utiliser de préfixe `NEXT_PUBLIC_` pour cette clé.
Ne pas enregistrer la clé dans Git ni la copier dans une conversation.

Documentation : https://developers.deepl.com/docs/api-reference/translate

Les clés finissant par `:fx` utilisent automatiquement l’API Free ; les autres
utilisent l’API Pro. Les comptes et quotas sont gérés dans le compte DeepL.
Aucun compte ni abonnement n’est créé par le projet.

Seuls les champs textuels des réponses publiques filtrées sont envoyés au service.
Les montants, identifiants, liens, photos, dates et données administratives sont conservés.
Les traductions sont réutilisées pendant 24 heures en mémoire serveur, avec une
limite de 3 000 textes. Une modification du texte source invalide sa traduction.
Le cache est réinitialisé au redémarrage du serveur.

Sans clé, en cas de quota épuisé ou de panne, le texte original reste affiché.
Aucune donnée en base n’est remplacée par une traduction automatique.
