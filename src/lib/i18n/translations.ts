
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  type Language,
} from "./config";

/**
 * ==========================================================
 * FONDATION SAUVONS DES VIES
 * TRADUCTIONS PUBLIQUES — FR / EN / ES / DE
 * ==========================================================
 *
 * - Administration : français uniquement
 * - Espace public : quatre langues
 * - Aucune dépendance à React ou à Prisma
 * - Compatible serveur et navigateur
 * - Clés strictement identiques dans chaque langue
 *
 * Les contenus dynamiques des campagnes, publications
 * et bénéficiaires doivent être traduits séparément
 * lorsqu'ils proviennent de la base de données.
 */

export const translations = {
  fr: {
    common: {
      foundationName: "Fondation Sauvons des Vies",
      home: "Accueil",
      donate: "Faire un don",
      donateNow: "Faire un don maintenant",
      learnMore: "En savoir plus",
      discover: "Découvrir",
      discoverMore: "Découvrir davantage",
      viewAll: "Voir tout",
      viewDetails: "Voir les détails",
      readMore: "Lire la suite",
      readArticle: "Lire l'article",
      seeAll: "Tout voir",
      back: "Retour",
      next: "Suivant",
      previous: "Précédent",
      continue: "Continuer",
      cancel: "Annuler",
      confirm: "Confirmer",
      close: "Fermer",
      open: "Ouvrir",
      send: "Envoyer",
      submit: "Soumettre",
      save: "Enregistrer",
      search: "Rechercher",
      filter: "Filtrer",
      reset: "Réinitialiser",
      loading: "Chargement...",
      error: "Une erreur est survenue.",
      retry: "Réessayer",
      success: "Opération effectuée avec succès.",
      required: "Champ obligatoire",
      optional: "Facultatif",
      email: "Adresse e-mail",
      phone: "Téléphone",
      name: "Nom",
      firstName: "Prénom",
      lastName: "Nom de famille",
      message: "Message",
      subject: "Objet",
      date: "Date",
      location: "Localisation",
      country: "Pays",
      city: "Ville",
      amount: "Montant",
      currency: "Devise",
      status: "Statut",
      share: "Partager",
      noResults: "Aucun résultat trouvé.",
      all: "Tous",
      yes: "Oui",
      no: "Non",
      days: "jours",
      day: "jour",
      of: "sur",
      collected: "Collecté",
      goal: "Objectif",
      remaining: "Restant",
      verified: "Vérifié",
      active: "Actif",
      completed: "Terminé",
      published: "Publié",
      urgent: "Urgent",
      secure: "Sécurisé",
      transparency: "Transparence",
    },

    navigation: {
      home: "Accueil",
      campaigns: "Campagnes",
      causes: "Nos causes",
      news: "Journaux / Actualités",
      requestHelp: "Demander de l'aide",
      transparency: "Transparence",
      about: "À propos",
      contact: "Contact",
      donate: "Faire un don",
      mainNavigation: "Navigation principale",
      mobileNavigation: "Navigation mobile",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
      mainMenu: "Menu principal",
      skipToContent: "Aller au contenu principal",
    },

    language: {
      label: "Langue du site",
      select: "Choisir la langue",
      change: "Changer de langue",
      current: "Langue actuelle",
      french: "Français",
      english: "Anglais",
      spanish: "Espagnol",
      german: "Allemand",
    },

    home: {
      hero: {
        badge: "Ensemble, sauvons des vies",
        title: "Chaque vie mérite une chance.",
        description:
          "Unissons nos forces pour aider les personnes confrontées à des difficultés médicales et sociales. Chaque geste de solidarité peut faire la différence.",
        primaryButton: "Faire un don",
        secondaryButton: "Découvrir nos campagnes",
      },
      statistics: {
        title: "Notre engagement en chiffres",
        campaigns: "Campagnes actives",
        beneficiaries: "Bénéficiaires aidés",
        verifiedCases: "Dossiers vérifiés",
      },
      urgentCampaigns: {
        eyebrow: "Agir maintenant",
        title: "Campagnes urgentes",
        description:
          "Découvrez les situations qui nécessitent un soutien prioritaire.",
        viewAll: "Voir toutes les campagnes",
        noCampaigns:
          "Aucune campagne urgente n'est disponible actuellement.",
      },
      causes: {
        eyebrow: "Nos engagements",
        title: "Les causes que nous soutenons",
        description:
          "Nous accompagnons les personnes vulnérables à travers des actions concrètes et responsables.",
        viewAll: "Découvrir toutes nos causes",
      },
      howItWorks: {
        eyebrow: "Notre fonctionnement",
        title: "Comment fonctionne notre aide ?",
        description:
          "Un processus structuré pour vérifier les besoins et orienter les ressources vers les bénéficiaires.",
        step1Title: "Demande d'aide",
        step1Description:
          "Une personne ou sa famille transmet une demande accompagnée des justificatifs nécessaires.",
        step2Title: "Vérification du dossier",
        step2Description:
          "La fondation examine les informations et les documents avant de valider une campagne.",
        step3Title: "Collecte des dons",
        step3Description:
          "Les donateurs contribuent à une campagne publiée et suivie par la fondation.",
        step4Title: "Paiement et suivi",
        step4Description:
          "Les fonds sont affectés aux dépenses validées, avec paiement direct aux établissements ou prestataires concernés.",
      },
      news: {
        eyebrow: "Nos actualités",
        title: "Journaux et actualités",
        description:
          "Suivez les actions, les campagnes et les informations publiées par la fondation.",
        viewAll: "Voir toutes les actualités",
        noNews: "Aucune actualité publiée pour le moment.",
      },
      trust: {
        eyebrow: "Votre confiance compte",
        title: "Une solidarité fondée sur la transparence",
        description:
          "Nous vérifions les dossiers et suivons l'utilisation des dons pour soutenir des besoins réels.",
        verifiedCases: "Dossiers examinés",
        directPayments: "Paiements directs aux prestataires",
        responsibleMonitoring: "Suivi responsable des actions",
        button: "Découvrir notre transparence",
      },
      finalCta: {
        title: "Ensemble, nous pouvons changer des vies.",
        description:
          "Votre soutien peut contribuer à financer des soins et à accompagner les personnes qui en ont besoin.",
        donate: "Faire un don",
        requestHelp: "Demander de l'aide",
      },
    },

    campaigns: {
      title: "Nos campagnes",
      description:
        "Découvrez les campagnes solidaires et soutenez les personnes qui ont besoin d'aide.",
      allCampaigns: "Toutes les campagnes",
      activeCampaigns: "Campagnes actives",
      urgentCampaigns: "Campagnes urgentes",
      completedCampaigns: "Campagnes terminées",
      targetAmount: "Objectif de collecte",
      collectedAmount: "Montant collecté",
      remainingAmount: "Montant restant",
      progress: "Progression de la collecte",
      donors: "Donateurs",
      donations: "Dons",
      donateToCampaign: "Soutenir cette campagne",
      shareCampaign: "Partager cette campagne",
      campaignDetails: "Détails de la campagne",
      beneficiary: "Bénéficiaire",
      category: "Catégorie",
      publicationDate: "Date de publication",
      noCampaigns: "Aucune campagne disponible actuellement.",
      noResults: "Aucune campagne ne correspond à votre recherche.",
      verifiedCampaign: "Campagne vérifiée",
      campaignCompleted: "Campagne terminée",
      campaignUnavailable: "Cette campagne n'est pas disponible.",
    },

    causes: {
      title: "Nos causes",
      description:
        "Découvrez les domaines dans lesquels la fondation intervient pour soutenir les personnes vulnérables.",
      medical: "Aide médicale",
      medicalDescription:
        "Soutien aux personnes ayant besoin de soins, d'interventions chirurgicales ou d'une prise en charge hospitalière.",
      food: "Aide alimentaire",
      foodDescription:
        "Soutien alimentaire aux personnes et familles en situation de précarité.",
      children: "Protection des enfants",
      childrenDescription:
        "Accompagnement des enfants vulnérables et soutien à leurs besoins essentiels.",
      education: "Éducation",
      educationDescription:
        "Soutien à l'accès à la scolarisation et aux ressources éducatives essentielles.",
      housing: "Hébergement d'urgence",
      housingDescription:
        "Accompagnement des personnes confrontées à une situation urgente de logement.",
      families: "Soutien aux familles",
      familiesDescription:
        "Aide aux familles traversant des difficultés importantes.",
      discoverCampaigns: "Découvrir les campagnes",
    },

    requestHelp: {
      title: "Demander de l'aide",
      description:
        "Présentez votre situation afin que la fondation puisse examiner votre demande.",
      introduction:
        "Chaque demande est examinée selon les informations et les justificatifs fournis.",
      personalInformation: "Informations personnelles",
      contactInformation: "Coordonnées",
      situation: "Votre situation",
      helpCategory: "Type d'aide demandée",
      descriptionLabel: "Description de votre besoin",
      descriptionPlaceholder:
        "Expliquez votre situation et l'aide dont vous avez besoin.",
      supportingDocuments: "Documents justificatifs",
      uploadDocuments: "Ajouter des documents",
      submitRequest: "Envoyer ma demande",
      consent:
        "Je confirme que les informations transmises sont exactes et j'accepte leur examen dans le cadre de ma demande.",
      submissionSuccess:
        "Votre demande a été transmise. Elle sera examinée par la fondation.",
      submissionError:
        "Votre demande n'a pas pu être envoyée. Veuillez réessayer.",
      reviewNotice:
        "L'envoi d'une demande ne garantit pas son acceptation ou son financement.",
      confidentiality:
        "Les informations transmises doivent être utilisées uniquement pour le traitement autorisé de votre demande.",
    },

    donations: {
      title: "Faire un don",
      description:
        "Participez à une action solidaire en soutenant une campagne.",
      chooseCampaign: "Choisir une campagne",
      chooseAmount: "Choisir un montant",
      customAmount: "Autre montant",
      donationAmount: "Montant du don",
      donorInformation: "Informations du donateur",
      anonymousDonation: "Faire un don anonyme",
      paymentMethod: "Moyen de paiement",
      paymentSummary: "Récapitulatif du don",
      total: "Total",
      continueToPayment: "Continuer vers le paiement",
      confirmDonation: "Confirmer le don",
      securePayment: "Paiement sécurisé",
      paymentPending: "Paiement en attente de confirmation",
      paymentConfirmed: "Paiement confirmé",
      paymentFailed: "Le paiement n'a pas abouti.",
      thankYou: "Merci pour votre générosité.",
      receipt: "Reçu de don",
      donationReference: "Référence du don",
      noPaymentMethods:
        "Aucun moyen de paiement n'est disponible actuellement.",
    },

    news: {
      title: "Journaux et actualités",
      description:
        "Découvrez les publications et les actions de la fondation.",
      latestNews: "Dernières actualités",
      allNews: "Toutes les actualités",
      categories: "Catégories",
      author: "Auteur",
      publishedOn: "Publié le",
      readArticle: "Lire l'article",
      relatedArticles: "Articles similaires",
      noArticles: "Aucune publication disponible actuellement.",
      shareArticle: "Partager cet article",
    },

    transparency: {
      title: "Transparence",
      description:
        "Découvrez notre méthode de vérification, de collecte et de suivi des aides.",
      verificationTitle: "Vérification des dossiers",
      verificationDescription:
        "Les demandes sont examinées avant la publication d'une campagne.",
      donationsTitle: "Suivi des dons",
      donationsDescription:
        "Les dons confirmés sont suivis pour permettre une affectation conforme aux campagnes concernées.",
      paymentsTitle: "Paiements directs",
      paymentsDescription:
        "Lorsque cela est applicable, les paiements sont effectués directement aux hôpitaux ou prestataires concernés.",
      reportingTitle: "Informations et suivi",
      reportingDescription:
        "Les actions et résultats vérifiés peuvent être communiqués dans le respect des autorisations nécessaires.",
      reports: "Rapports et publications",
      learnMore: "En savoir plus",
    },

    about: {
      title: "À propos de la fondation",
      description:
        "Découvrez notre mission, nos engagements et notre approche de la solidarité.",
      missionTitle: "Notre mission",
      missionDescription:
        "Mobiliser la solidarité pour accompagner les personnes confrontées à des besoins médicaux et sociaux importants.",
      visionTitle: "Notre vision",
      visionDescription:
        "Contribuer à une société dans laquelle davantage de personnes vulnérables peuvent recevoir une aide adaptée.",
      valuesTitle: "Nos valeurs",
      solidarity: "Solidarité",
      transparency: "Transparence",
      responsibility: "Responsabilité",
      dignity: "Dignité",
      commitment: "Engagement",
      contactUs: "Nous contacter",
    },

    contact: {
      title: "Contactez-nous",
      description:
        "Vous avez une question ou souhaitez contacter la fondation ?",
      formTitle: "Envoyer un message",
      name: "Nom complet",
      email: "Adresse e-mail",
      phone: "Téléphone",
      subject: "Objet du message",
      message: "Votre message",
      sendMessage: "Envoyer le message",
      successMessage: "Votre message a été envoyé.",
      errorMessage:
        "Impossible d'envoyer votre message. Veuillez réessayer.",
      contactInformation: "Nos coordonnées",
      location: "Localisation",
      country: "Bénin",
      openingHours: "Horaires",
    },

    footer: {
      description:
        "Ensemble, sauvons des vies et apportons un soutien concret aux personnes et aux familles qui en ont le plus besoin.",
      quickLinks: "Liens rapides",
      information: "Informations",
      stayConnected: "Restons en contact",
      stayConnectedDescription:
        "Suivez nos actions, nos campagnes et les nouvelles de la fondation.",
      newsletter: "Newsletter",
      newsletterPlaceholder: "Votre adresse e-mail",
      newsletterUnavailable: "Inscription bientôt disponible",
      followUs: "Suivez-nous",
      contact: "Contact",
      donate: "Faire un don",
      allRightsReserved: "Tous droits réservés.",
      motto: "Solidarité • Transparence • Espoir",
      country: "Bénin",
    },

    accessibility: {
      logoAlt: "Logo de la Fondation Sauvons des Vies",
      mainNavigation: "Navigation principale",
      mobileNavigation: "Navigation mobile",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
      skipToContent: "Aller au contenu principal",
      changeLanguage: "Changer de langue",
      closeDialog: "Fermer la fenêtre",
      previousImage: "Image précédente",
      nextImage: "Image suivante",
    },
  },

  en: {
    common: {
      foundationName: "Fondation Sauvons des Vies",
      home: "Home",
      donate: "Donate",
      donateNow: "Donate now",
      learnMore: "Learn more",
      discover: "Discover",
      discoverMore: "Discover more",
      viewAll: "View all",
      viewDetails: "View details",
      readMore: "Read more",
      readArticle: "Read article",
      seeAll: "See all",
      back: "Back",
      next: "Next",
      previous: "Previous",
      continue: "Continue",
      cancel: "Cancel",
      confirm: "Confirm",
      close: "Close",
      open: "Open",
      send: "Send",
      submit: "Submit",
      save: "Save",
      search: "Search",
      filter: "Filter",
      reset: "Reset",
      loading: "Loading...",
      error: "An error occurred.",
      retry: "Try again",
      success: "Operation completed successfully.",
      required: "Required field",
      optional: "Optional",
      email: "Email address",
      phone: "Phone",
      name: "Name",
      firstName: "First name",
      lastName: "Last name",
      message: "Message",
      subject: "Subject",
      date: "Date",
      location: "Location",
      country: "Country",
      city: "City",
      amount: "Amount",
      currency: "Currency",
      status: "Status",
      share: "Share",
      noResults: "No results found.",
      all: "All",
      yes: "Yes",
      no: "No",
      days: "days",
      day: "day",
      of: "of",
      collected: "Raised",
      goal: "Goal",
      remaining: "Remaining",
      verified: "Verified",
      active: "Active",
      completed: "Completed",
      published: "Published",
      urgent: "Urgent",
      secure: "Secure",
      transparency: "Transparency",
    },

    navigation: {
      home: "Home",
      campaigns: "Campaigns",
      causes: "Our causes",
      news: "News & Updates",
      requestHelp: "Request help",
      transparency: "Transparency",
      about: "About us",
      contact: "Contact",
      donate: "Donate",
      mainNavigation: "Main navigation",
      mobileNavigation: "Mobile navigation",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      mainMenu: "Main menu",
      skipToContent: "Skip to main content",
    },

    language: {
      label: "Website language",
      select: "Choose language",
      change: "Change language",
      current: "Current language",
      french: "French",
      english: "English",
      spanish: "Spanish",
      german: "German",
    },

    home: {
      hero: {
        badge: "Together, we save lives",
        title: "Every life deserves a chance.",
        description:
          "Join us in helping people facing medical and social difficulties. Every act of solidarity can make a difference.",
        primaryButton: "Donate",
        secondaryButton: "Explore our campaigns",
      },
      statistics: {
        title: "Our commitment in numbers",
        campaigns: "Active campaigns",
        beneficiaries: "People helped",
        verifiedCases: "Verified cases",
      },
      urgentCampaigns: {
        eyebrow: "Act now",
        title: "Urgent campaigns",
        description:
          "Discover situations that need priority support.",
        viewAll: "View all campaigns",
        noCampaigns:
          "No urgent campaigns are currently available.",
      },
      causes: {
        eyebrow: "Our commitments",
        title: "The causes we support",
        description:
          "We support vulnerable people through concrete and responsible action.",
        viewAll: "Explore all our causes",
      },
      howItWorks: {
        eyebrow: "How we work",
        title: "How does our assistance work?",
        description:
          "A structured process to verify needs and direct resources to beneficiaries.",
        step1Title: "Request for assistance",
        step1Description:
          "An individual or family submits a request with the necessary supporting documents.",
        step2Title: "Case verification",
        step2Description:
          "The foundation reviews the information and documents before approving a campaign.",
        step3Title: "Fundraising",
        step3Description:
          "Donors contribute to a published campaign monitored by the foundation.",
        step4Title: "Payment and follow-up",
        step4Description:
          "Funds are allocated to approved expenses, with direct payments to the relevant institutions or service providers.",
      },
      news: {
        eyebrow: "Our news",
        title: "News and updates",
        description:
          "Follow the foundation's actions, campaigns and published updates.",
        viewAll: "View all news",
        noNews: "No news has been published yet.",
      },
      trust: {
        eyebrow: "Your trust matters",
        title: "Solidarity built on transparency",
        description:
          "We verify cases and monitor the use of donations to support genuine needs.",
        verifiedCases: "Reviewed cases",
        directPayments: "Direct payments to providers",
        responsibleMonitoring: "Responsible action monitoring",
        button: "Explore our transparency",
      },
      finalCta: {
        title: "Together, we can change lives.",
        description:
          "Your support can help fund healthcare and assist people in need.",
        donate: "Donate",
        requestHelp: "Request help",
      },
    },

    campaigns: {
      title: "Our campaigns",
      description:
        "Explore solidarity campaigns and support people in need.",
      allCampaigns: "All campaigns",
      activeCampaigns: "Active campaigns",
      urgentCampaigns: "Urgent campaigns",
      completedCampaigns: "Completed campaigns",
      targetAmount: "Fundraising goal",
      collectedAmount: "Amount raised",
      remainingAmount: "Amount remaining",
      progress: "Fundraising progress",
      donors: "Donors",
      donations: "Donations",
      donateToCampaign: "Support this campaign",
      shareCampaign: "Share this campaign",
      campaignDetails: "Campaign details",
      beneficiary: "Beneficiary",
      category: "Category",
      publicationDate: "Publication date",
      noCampaigns: "No campaigns are currently available.",
      noResults: "No campaigns match your search.",
      verifiedCampaign: "Verified campaign",
      campaignCompleted: "Campaign completed",
      campaignUnavailable: "This campaign is unavailable.",
    },

    causes: {
      title: "Our causes",
      description:
        "Discover the areas where the foundation supports vulnerable people.",
      medical: "Medical assistance",
      medicalDescription:
        "Support for people needing healthcare, surgery or hospital treatment.",
      food: "Food assistance",
      foodDescription:
        "Food support for individuals and families experiencing hardship.",
      children: "Child protection",
      childrenDescription:
        "Support for vulnerable children and their essential needs.",
      education: "Education",
      educationDescription:
        "Support for access to schooling and essential educational resources.",
      housing: "Emergency housing",
      housingDescription:
        "Assistance for people facing urgent housing needs.",
      families: "Family support",
      familiesDescription:
        "Assistance for families experiencing significant difficulties.",
      discoverCampaigns: "Explore campaigns",
    },

    requestHelp: {
      title: "Request assistance",
      description:
        "Describe your situation so the foundation can review your request.",
      introduction:
        "Each request is reviewed based on the information and supporting documents provided.",
      personalInformation: "Personal information",
      contactInformation: "Contact details",
      situation: "Your situation",
      helpCategory: "Type of assistance requested",
      descriptionLabel: "Description of your need",
      descriptionPlaceholder:
        "Explain your situation and the assistance you need.",
      supportingDocuments: "Supporting documents",
      uploadDocuments: "Add documents",
      submitRequest: "Submit my request",
      consent:
        "I confirm that the information provided is accurate and consent to its review as part of my request.",
      submissionSuccess:
        "Your request has been submitted. The foundation will review it.",
      submissionError:
        "Your request could not be submitted. Please try again.",
      reviewNotice:
        "Submitting a request does not guarantee approval or funding.",
      confidentiality:
        "Submitted information must be used only for the authorized processing of your request.",
    },

    donations: {
      title: "Donate",
      description:
        "Take part in a solidarity initiative by supporting a campaign.",
      chooseCampaign: "Choose a campaign",
      chooseAmount: "Choose an amount",
      customAmount: "Other amount",
      donationAmount: "Donation amount",
      donorInformation: "Donor information",
      anonymousDonation: "Donate anonymously",
      paymentMethod: "Payment method",
      paymentSummary: "Donation summary",
      total: "Total",
      continueToPayment: "Continue to payment",
      confirmDonation: "Confirm donation",
      securePayment: "Secure payment",
      paymentPending: "Payment awaiting confirmation",
      paymentConfirmed: "Payment confirmed",
      paymentFailed: "Payment was unsuccessful.",
      thankYou: "Thank you for your generosity.",
      receipt: "Donation receipt",
      donationReference: "Donation reference",
      noPaymentMethods:
        "No payment methods are currently available.",
    },

    news: {
      title: "News and updates",
      description:
        "Discover the foundation's publications and activities.",
      latestNews: "Latest news",
      allNews: "All news",
      categories: "Categories",
      author: "Author",
      publishedOn: "Published on",
      readArticle: "Read article",
      relatedArticles: "Related articles",
      noArticles: "No publications are currently available.",
      shareArticle: "Share this article",
    },

    transparency: {
      title: "Transparency",
      description:
        "Learn about our verification, fundraising and assistance monitoring processes.",
      verificationTitle: "Case verification",
      verificationDescription:
        "Requests are reviewed before a campaign is published.",
      donationsTitle: "Donation tracking",
      donationsDescription:
        "Confirmed donations are tracked to support appropriate allocation to the relevant campaigns.",
      paymentsTitle: "Direct payments",
      paymentsDescription:
        "Where applicable, payments are made directly to the relevant hospitals or service providers.",
      reportingTitle: "Information and follow-up",
      reportingDescription:
        "Verified actions and outcomes may be shared with the necessary permissions.",
      reports: "Reports and publications",
      learnMore: "Learn more",
    },

    about: {
      title: "About the foundation",
      description:
        "Discover our mission, commitments and approach to solidarity.",
      missionTitle: "Our mission",
      missionDescription:
        "Mobilize solidarity to support people facing significant medical and social needs.",
      visionTitle: "Our vision",
      visionDescription:
        "Help build a society where more vulnerable people can receive appropriate assistance.",
      valuesTitle: "Our values",
      solidarity: "Solidarity",
      transparency: "Transparency",
      responsibility: "Responsibility",
      dignity: "Dignity",
      commitment: "Commitment",
      contactUs: "Contact us",
    },

    contact: {
      title: "Contact us",
      description:
        "Have a question or want to contact the foundation?",
      formTitle: "Send a message",
      name: "Full name",
      email: "Email address",
      phone: "Phone",
      subject: "Message subject",
      message: "Your message",
      sendMessage: "Send message",
      successMessage: "Your message has been sent.",
      errorMessage:
        "Unable to send your message. Please try again.",
      contactInformation: "Contact information",
      location: "Location",
      country: "France",
      openingHours: "Opening hours",
    },

    footer: {
      description:
        "Together, we save lives and provide practical support to people and families who need it most.",
      quickLinks: "Quick links",
      information: "Information",
      stayConnected: "Stay connected",
      stayConnectedDescription:
        "Follow our actions, campaigns and the latest news from the foundation.",
      newsletter: "Newsletter",
      newsletterPlaceholder: "Your email address",
      newsletterUnavailable: "Subscription coming soon",
      followUs: "Follow us",
      contact: "Contact",
      donate: "Donate",
      allRightsReserved: "All rights reserved.",
      motto: "Solidarity • Transparency • Hope",
      country: "France",
    },

    accessibility: {
      logoAlt: "Fondation Sauvons des Vies logo",
      mainNavigation: "Main navigation",
      mobileNavigation: "Mobile navigation",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      skipToContent: "Skip to main content",
      changeLanguage: "Change language",
      closeDialog: "Close dialog",
      previousImage: "Previous image",
      nextImage: "Next image",
    },
  },

  es: {
    common: {
      foundationName: "Fondation Sauvons des Vies",
      home: "Inicio",
      donate: "Donar",
      donateNow: "Donar ahora",
      learnMore: "Más información",
      discover: "Descubrir",
      discoverMore: "Descubrir más",
      viewAll: "Ver todo",
      viewDetails: "Ver detalles",
      readMore: "Leer más",
      readArticle: "Leer artículo",
      seeAll: "Ver todo",
      back: "Volver",
      next: "Siguiente",
      previous: "Anterior",
      continue: "Continuar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      close: "Cerrar",
      open: "Abrir",
      send: "Enviar",
      submit: "Enviar",
      save: "Guardar",
      search: "Buscar",
      filter: "Filtrar",
      reset: "Restablecer",
      loading: "Cargando...",
      error: "Se ha producido un error.",
      retry: "Reintentar",
      success: "Operación realizada correctamente.",
      required: "Campo obligatorio",
      optional: "Opcional",
      email: "Correo electrónico",
      phone: "Teléfono",
      name: "Nombre",
      firstName: "Nombre",
      lastName: "Apellido",
      message: "Mensaje",
      subject: "Asunto",
      date: "Fecha",
      location: "Ubicación",
      country: "País",
      city: "Ciudad",
      amount: "Importe",
      currency: "Moneda",
      status: "Estado",
      share: "Compartir",
      noResults: "No se encontraron resultados.",
      all: "Todos",
      yes: "Sí",
      no: "No",
      days: "días",
      day: "día",
      of: "de",
      collected: "Recaudado",
      goal: "Objetivo",
      remaining: "Restante",
      verified: "Verificado",
      active: "Activo",
      completed: "Finalizado",
      published: "Publicado",
      urgent: "Urgente",
      secure: "Seguro",
      transparency: "Transparencia",
    },

    navigation: {
      home: "Inicio",
      campaigns: "Campañas",
      causes: "Nuestras causas",
      news: "Noticias y actualidad",
      requestHelp: "Solicitar ayuda",
      transparency: "Transparencia",
      about: "Quiénes somos",
      contact: "Contacto",
      donate: "Donar",
      mainNavigation: "Navegación principal",
      mobileNavigation: "Navegación móvil",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      mainMenu: "Menú principal",
      skipToContent: "Ir al contenido principal",
    },

    language: {
      label: "Idioma del sitio",
      select: "Elegir idioma",
      change: "Cambiar idioma",
      current: "Idioma actual",
      french: "Francés",
      english: "Inglés",
      spanish: "Español",
      german: "Alemán",
    },

    home: {
      hero: {
        badge: "Juntos salvamos vidas",
        title: "Cada vida merece una oportunidad.",
        description:
          "Unamos nuestras fuerzas para ayudar a personas que enfrentan dificultades médicas y sociales. Cada gesto solidario puede marcar la diferencia.",
        primaryButton: "Donar",
        secondaryButton: "Descubrir nuestras campañas",
      },
      statistics: {
        title: "Nuestro compromiso en cifras",
        campaigns: "Campañas activas",
        beneficiaries: "Beneficiarios ayudados",
        verifiedCases: "Casos verificados",
      },
      urgentCampaigns: {
        eyebrow: "Actúa ahora",
        title: "Campañas urgentes",
        description:
          "Descubre las situaciones que necesitan apoyo prioritario.",
        viewAll: "Ver todas las campañas",
        noCampaigns:
          "Actualmente no hay campañas urgentes disponibles.",
      },
      causes: {
        eyebrow: "Nuestros compromisos",
        title: "Las causas que apoyamos",
        description:
          "Apoyamos a personas vulnerables mediante acciones concretas y responsables.",
        viewAll: "Descubrir todas nuestras causas",
      },
      howItWorks: {
        eyebrow: "Cómo trabajamos",
        title: "¿Cómo funciona nuestra ayuda?",
        description:
          "Un proceso estructurado para verificar las necesidades y dirigir los recursos a los beneficiarios.",
        step1Title: "Solicitud de ayuda",
        step1Description:
          "Una persona o su familia presenta una solicitud con los documentos justificativos necesarios.",
        step2Title: "Verificación del expediente",
        step2Description:
          "La fundación revisa la información y los documentos antes de aprobar una campaña.",
        step3Title: "Recaudación de donaciones",
        step3Description:
          "Los donantes contribuyen a una campaña publicada y supervisada por la fundación.",
        step4Title: "Pago y seguimiento",
        step4Description:
          "Los fondos se destinan a gastos aprobados, mediante pagos directos a los centros o proveedores correspondientes.",
      },
      news: {
        eyebrow: "Nuestras noticias",
        title: "Noticias y actualidad",
        description:
          "Sigue las acciones, campañas y publicaciones de la fundación.",
        viewAll: "Ver todas las noticias",
        noNews: "Todavía no se han publicado noticias.",
      },
      trust: {
        eyebrow: "Tu confianza importa",
        title: "Solidaridad basada en la transparencia",
        description:
          "Verificamos los expedientes y supervisamos el uso de las donaciones para atender necesidades reales.",
        verifiedCases: "Expedientes revisados",
        directPayments: "Pagos directos a proveedores",
        responsibleMonitoring: "Seguimiento responsable",
        button: "Descubrir nuestra transparencia",
      },
      finalCta: {
        title: "Juntos podemos cambiar vidas.",
        description:
          "Tu apoyo puede contribuir a financiar tratamientos médicos y ayudar a quienes lo necesitan.",
        donate: "Donar",
        requestHelp: "Solicitar ayuda",
      },
    },

    campaigns: {
      title: "Nuestras campañas",
      description:
        "Descubre campañas solidarias y apoya a personas que necesitan ayuda.",
      allCampaigns: "Todas las campañas",
      activeCampaigns: "Campañas activas",
      urgentCampaigns: "Campañas urgentes",
      completedCampaigns: "Campañas finalizadas",
      targetAmount: "Objetivo de recaudación",
      collectedAmount: "Importe recaudado",
      remainingAmount: "Importe restante",
      progress: "Progreso de recaudación",
      donors: "Donantes",
      donations: "Donaciones",
      donateToCampaign: "Apoyar esta campaña",
      shareCampaign: "Compartir esta campaña",
      campaignDetails: "Detalles de la campaña",
      beneficiary: "Beneficiario",
      category: "Categoría",
      publicationDate: "Fecha de publicación",
      noCampaigns: "Actualmente no hay campañas disponibles.",
      noResults: "Ninguna campaña coincide con tu búsqueda.",
      verifiedCampaign: "Campaña verificada",
      campaignCompleted: "Campaña finalizada",
      campaignUnavailable: "Esta campaña no está disponible.",
    },

    causes: {
      title: "Nuestras causas",
      description:
        "Descubre las áreas en las que la fundación ayuda a personas vulnerables.",
      medical: "Ayuda médica",
      medicalDescription:
        "Apoyo a personas que necesitan atención médica, cirugía o tratamiento hospitalario.",
      food: "Ayuda alimentaria",
      foodDescription:
        "Apoyo alimentario para personas y familias en situación de vulnerabilidad.",
      children: "Protección infantil",
      childrenDescription:
        "Acompañamiento de niños vulnerables y apoyo a sus necesidades esenciales.",
      education: "Educación",
      educationDescription:
        "Apoyo al acceso a la escolarización y a recursos educativos esenciales.",
      housing: "Alojamiento de emergencia",
      housingDescription:
        "Asistencia a personas con necesidades urgentes de alojamiento.",
      families: "Apoyo a las familias",
      familiesDescription:
        "Ayuda a familias que atraviesan dificultades importantes.",
      discoverCampaigns: "Descubrir campañas",
    },

    requestHelp: {
      title: "Solicitar ayuda",
      description:
        "Describe tu situación para que la fundación pueda evaluar tu solicitud.",
      introduction:
        "Cada solicitud se examina según la información y los documentos justificativos proporcionados.",
      personalInformation: "Datos personales",
      contactInformation: "Datos de contacto",
      situation: "Tu situación",
      helpCategory: "Tipo de ayuda solicitada",
      descriptionLabel: "Descripción de tu necesidad",
      descriptionPlaceholder:
        "Explica tu situación y la ayuda que necesitas.",
      supportingDocuments: "Documentos justificativos",
      uploadDocuments: "Añadir documentos",
      submitRequest: "Enviar mi solicitud",
      consent:
        "Confirmo que la información proporcionada es correcta y acepto su evaluación como parte de mi solicitud.",
      submissionSuccess:
        "Tu solicitud se ha enviado. La fundación la examinará.",
      submissionError:
        "No se pudo enviar tu solicitud. Inténtalo de nuevo.",
      reviewNotice:
        "Enviar una solicitud no garantiza su aprobación ni financiación.",
      confidentiality:
        "La información enviada debe utilizarse únicamente para el tratamiento autorizado de tu solicitud.",
    },

    donations: {
      title: "Donar",
      description:
        "Participa en una acción solidaria apoyando una campaña.",
      chooseCampaign: "Elegir una campaña",
      chooseAmount: "Elegir un importe",
      customAmount: "Otro importe",
      donationAmount: "Importe de la donación",
      donorInformation: "Datos del donante",
      anonymousDonation: "Donar de forma anónima",
      paymentMethod: "Método de pago",
      paymentSummary: "Resumen de la donación",
      total: "Total",
      continueToPayment: "Continuar al pago",
      confirmDonation: "Confirmar donación",
      securePayment: "Pago seguro",
      paymentPending: "Pago pendiente de confirmación",
      paymentConfirmed: "Pago confirmado",
      paymentFailed: "El pago no se ha completado.",
      thankYou: "Gracias por tu generosidad.",
      receipt: "Recibo de donación",
      donationReference: "Referencia de donación",
      noPaymentMethods:
        "Actualmente no hay métodos de pago disponibles.",
    },

    news: {
      title: "Noticias y actualidad",
      description:
        "Descubre las publicaciones y actividades de la fundación.",
      latestNews: "Últimas noticias",
      allNews: "Todas las noticias",
      categories: "Categorías",
      author: "Autor",
      publishedOn: "Publicado el",
      readArticle: "Leer artículo",
      relatedArticles: "Artículos relacionados",
      noArticles: "Actualmente no hay publicaciones disponibles.",
      shareArticle: "Compartir artículo",
    },

    transparency: {
      title: "Transparencia",
      description:
        "Conoce nuestros procesos de verificación, recaudación y seguimiento de ayudas.",
      verificationTitle: "Verificación de expedientes",
      verificationDescription:
        "Las solicitudes se examinan antes de publicar una campaña.",
      donationsTitle: "Seguimiento de donaciones",
      donationsDescription:
        "Las donaciones confirmadas se supervisan para facilitar su asignación adecuada a las campañas correspondientes.",
      paymentsTitle: "Pagos directos",
      paymentsDescription:
        "Cuando corresponde, los pagos se realizan directamente a hospitales o proveedores.",
      reportingTitle: "Información y seguimiento",
      reportingDescription:
        "Las acciones y resultados verificados pueden comunicarse con las autorizaciones necesarias.",
      reports: "Informes y publicaciones",
      learnMore: "Más información",
    },

    about: {
      title: "Sobre la fundación",
      description:
        "Descubre nuestra misión, compromisos y enfoque solidario.",
      missionTitle: "Nuestra misión",
      missionDescription:
        "Movilizar la solidaridad para ayudar a personas con necesidades médicas y sociales importantes.",
      visionTitle: "Nuestra visión",
      visionDescription:
        "Contribuir a una sociedad donde más personas vulnerables puedan recibir ayuda adecuada.",
      valuesTitle: "Nuestros valores",
      solidarity: "Solidaridad",
      transparency: "Transparencia",
      responsibility: "Responsabilidad",
      dignity: "Dignidad",
      commitment: "Compromiso",
      contactUs: "Contáctanos",
    },

    contact: {
      title: "Contacto",
      description:
        "¿Tienes alguna pregunta o deseas contactar con la fundación?",
      formTitle: "Enviar un mensaje",
      name: "Nombre completo",
      email: "Correo electrónico",
      phone: "Teléfono",
      subject: "Asunto del mensaje",
      message: "Tu mensaje",
      sendMessage: "Enviar mensaje",
      successMessage: "Tu mensaje se ha enviado.",
      errorMessage:
        "No se pudo enviar tu mensaje. Inténtalo de nuevo.",
      contactInformation: "Datos de contacto",
      location: "Ubicación",
      country: "Benín",
      openingHours: "Horario de atención",
    },

    footer: {
      description:
        "Juntos salvamos vidas y brindamos apoyo concreto a las personas y familias que más lo necesitan.",
      quickLinks: "Enlaces rápidos",
      information: "Información",
      stayConnected: "Mantengámonos en contacto",
      stayConnectedDescription:
        "Sigue nuestras acciones, campañas y noticias de la fundación.",
      newsletter: "Boletín informativo",
      newsletterPlaceholder: "Tu correo electrónico",
      newsletterUnavailable: "Suscripción próximamente",
      followUs: "Síguenos",
      contact: "Contacto",
      donate: "Donar",
      allRightsReserved: "Todos los derechos reservados.",
      motto: "Solidaridad • Transparencia • Esperanza",
      country: "Benín",
    },

    accessibility: {
      logoAlt: "Logotipo de Fondation Sauvons des Vies",
      mainNavigation: "Navegación principal",
      mobileNavigation: "Navegación móvil",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      skipToContent: "Ir al contenido principal",
      changeLanguage: "Cambiar idioma",
      closeDialog: "Cerrar ventana",
      previousImage: "Imagen anterior",
      nextImage: "Imagen siguiente",
    },
  },

  de: {
    common: {
      foundationName: "Fondation Sauvons des Vies",
      home: "Startseite",
      donate: "Jetzt spenden",
      donateNow: "Jetzt spenden",
      learnMore: "Mehr erfahren",
      discover: "Entdecken",
      discoverMore: "Mehr entdecken",
      viewAll: "Alle anzeigen",
      viewDetails: "Details ansehen",
      readMore: "Weiterlesen",
      readArticle: "Artikel lesen",
      seeAll: "Alle ansehen",
      back: "Zurück",
      next: "Weiter",
      previous: "Zurück",
      continue: "Fortfahren",
      cancel: "Abbrechen",
      confirm: "Bestätigen",
      close: "Schließen",
      open: "Öffnen",
      send: "Senden",
      submit: "Absenden",
      save: "Speichern",
      search: "Suchen",
      filter: "Filtern",
      reset: "Zurücksetzen",
      loading: "Wird geladen...",
      error: "Ein Fehler ist aufgetreten.",
      retry: "Erneut versuchen",
      success: "Vorgang erfolgreich abgeschlossen.",
      required: "Pflichtfeld",
      optional: "Optional",
      email: "E-Mail-Adresse",
      phone: "Telefon",
      name: "Name",
      firstName: "Vorname",
      lastName: "Nachname",
      message: "Nachricht",
      subject: "Betreff",
      date: "Datum",
      location: "Standort",
      country: "Land",
      city: "Stadt",
      amount: "Betrag",
      currency: "Währung",
      status: "Status",
      share: "Teilen",
      noResults: "Keine Ergebnisse gefunden.",
      all: "Alle",
      yes: "Ja",
      no: "Nein",
      days: "Tage",
      day: "Tag",
      of: "von",
      collected: "Gesammelt",
      goal: "Ziel",
      remaining: "Verbleibend",
      verified: "Geprüft",
      active: "Aktiv",
      completed: "Abgeschlossen",
      published: "Veröffentlicht",
      urgent: "Dringend",
      secure: "Sicher",
      transparency: "Transparenz",
    },

    navigation: {
      home: "Startseite",
      campaigns: "Kampagnen",
      causes: "Unsere Anliegen",
      news: "Aktuelles / Nachrichten",
      requestHelp: "Hilfe beantragen",
      transparency: "Transparenz",
      about: "Über uns",
      contact: "Kontakt",
      donate: "Jetzt spenden",
      mainNavigation: "Hauptnavigation",
      mobileNavigation: "Mobile Navigation",
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
      mainMenu: "Hauptmenü",
      skipToContent: "Zum Hauptinhalt springen",
    },

    language: {
      label: "Sprache der Website",
      select: "Sprache auswählen",
      change: "Sprache ändern",
      current: "Aktuelle Sprache",
      french: "Französisch",
      english: "Englisch",
      spanish: "Spanisch",
      german: "Deutsch",
    },

    home: {
      hero: {
        badge: "Gemeinsam retten wir Leben",
        title: "Jedes Leben verdient eine Chance.",
        description:
          "Helfen Sie mit, Menschen in medizinischen und sozialen Notlagen zu unterstützen. Jede solidarische Geste kann etwas bewirken.",
        primaryButton: "Jetzt spenden",
        secondaryButton: "Unsere Kampagnen entdecken",
      },
      statistics: {
        title: "Unser Engagement in Zahlen",
        campaigns: "Aktive Kampagnen",
        beneficiaries: "Unterstützte Menschen",
        verifiedCases: "Geprüfte Fälle",
      },
      urgentCampaigns: {
        eyebrow: "Jetzt helfen",
        title: "Dringende Kampagnen",
        description:
          "Entdecken Sie Situationen, die vorrangige Unterstützung benötigen.",
        viewAll: "Alle Kampagnen ansehen",
        noCampaigns:
          "Derzeit sind keine dringenden Kampagnen verfügbar.",
      },
      causes: {
        eyebrow: "Unser Engagement",
        title: "Die Anliegen, die wir unterstützen",
        description:
          "Wir unterstützen bedürftige Menschen durch konkrete und verantwortungsvolle Maßnahmen.",
        viewAll: "Alle Anliegen entdecken",
      },
      howItWorks: {
        eyebrow: "Unsere Arbeitsweise",
        title: "Wie funktioniert unsere Hilfe?",
        description:
          "Ein strukturierter Prozess zur Prüfung des Bedarfs und zur gezielten Unterstützung der Begünstigten.",
        step1Title: "Hilfsantrag",
        step1Description:
          "Eine Person oder Familie reicht einen Antrag mit den erforderlichen Nachweisen ein.",
        step2Title: "Prüfung des Antrags",
        step2Description:
          "Die Stiftung prüft die Angaben und Unterlagen, bevor eine Kampagne genehmigt wird.",
        step3Title: "Spendensammlung",
        step3Description:
          "Spender unterstützen eine veröffentlichte Kampagne, die von der Stiftung begleitet wird.",
        step4Title: "Zahlung und Nachverfolgung",
        step4Description:
          "Die Mittel werden für genehmigte Ausgaben eingesetzt und direkt an die zuständigen Einrichtungen oder Dienstleister gezahlt.",
      },
      news: {
        eyebrow: "Unsere Neuigkeiten",
        title: "Nachrichten und Aktuelles",
        description:
          "Verfolgen Sie die Aktivitäten, Kampagnen und Veröffentlichungen der Stiftung.",
        viewAll: "Alle Nachrichten ansehen",
        noNews: "Bisher wurden keine Nachrichten veröffentlicht.",
      },
      trust: {
        eyebrow: "Ihr Vertrauen zählt",
        title: "Solidarität auf der Grundlage von Transparenz",
        description:
          "Wir prüfen die Fälle und überwachen die Verwendung der Spenden, um tatsächliche Bedürfnisse zu unterstützen.",
        verifiedCases: "Geprüfte Anträge",
        directPayments: "Direktzahlungen an Dienstleister",
        responsibleMonitoring: "Verantwortungsvolle Nachverfolgung",
        button: "Mehr über unsere Transparenz erfahren",
      },
      finalCta: {
        title: "Gemeinsam können wir Leben verändern.",
        description:
          "Ihre Unterstützung kann dazu beitragen, medizinische Behandlungen zu finanzieren und Menschen in Not zu helfen.",
        donate: "Jetzt spenden",
        requestHelp: "Hilfe beantragen",
      },
    },

    campaigns: {
      title: "Unsere Kampagnen",
      description:
        "Entdecken Sie Hilfskampagnen und unterstützen Sie Menschen in Not.",
      allCampaigns: "Alle Kampagnen",
      activeCampaigns: "Aktive Kampagnen",
      urgentCampaigns: "Dringende Kampagnen",
      completedCampaigns: "Abgeschlossene Kampagnen",
      targetAmount: "Spendenziel",
      collectedAmount: "Gesammelter Betrag",
      remainingAmount: "Verbleibender Betrag",
      progress: "Spendenfortschritt",
      donors: "Spender",
      donations: "Spenden",
      donateToCampaign: "Diese Kampagne unterstützen",
      shareCampaign: "Kampagne teilen",
      campaignDetails: "Kampagnendetails",
      beneficiary: "Begünstigte Person",
      category: "Kategorie",
      publicationDate: "Veröffentlichungsdatum",
      noCampaigns: "Derzeit sind keine Kampagnen verfügbar.",
      noResults: "Keine Kampagne entspricht Ihrer Suche.",
      verifiedCampaign: "Geprüfte Kampagne",
      campaignCompleted: "Kampagne abgeschlossen",
      campaignUnavailable: "Diese Kampagne ist nicht verfügbar.",
    },

    causes: {
      title: "Unsere Anliegen",
      description:
        "Entdecken Sie die Bereiche, in denen die Stiftung bedürftige Menschen unterstützt.",
      medical: "Medizinische Hilfe",
      medicalDescription:
        "Unterstützung für Menschen, die medizinische Versorgung, Operationen oder Krankenhausbehandlungen benötigen.",
      food: "Lebensmittelhilfe",
      foodDescription:
        "Lebensmittelunterstützung für Menschen und Familien in schwierigen Lebenssituationen.",
      children: "Kinderschutz",
      childrenDescription:
        "Begleitung bedürftiger Kinder und Unterstützung ihrer grundlegenden Bedürfnisse.",
      education: "Bildung",
      educationDescription:
        "Unterstützung beim Zugang zu Schulbildung und wichtigen Lernmaterialien.",
      housing: "Notunterkunft",
      housingDescription:
        "Unterstützung für Menschen mit dringendem Unterkunftsbedarf.",
      families: "Familienhilfe",
      familiesDescription:
        "Hilfe für Familien in besonders schwierigen Situationen.",
      discoverCampaigns: "Kampagnen entdecken",
    },

    requestHelp: {
      title: "Hilfe beantragen",
      description:
        "Beschreiben Sie Ihre Situation, damit die Stiftung Ihren Antrag prüfen kann.",
      introduction:
        "Jeder Antrag wird anhand der eingereichten Angaben und Nachweise geprüft.",
      personalInformation: "Persönliche Angaben",
      contactInformation: "Kontaktdaten",
      situation: "Ihre Situation",
      helpCategory: "Art der benötigten Hilfe",
      descriptionLabel: "Beschreibung Ihres Anliegens",
      descriptionPlaceholder:
        "Beschreiben Sie Ihre Situation und die benötigte Unterstützung.",
      supportingDocuments: "Nachweise",
      uploadDocuments: "Dokumente hinzufügen",
      submitRequest: "Antrag absenden",
      consent:
        "Ich bestätige, dass meine Angaben korrekt sind, und stimme ihrer Prüfung im Rahmen meines Antrags zu.",
      submissionSuccess:
        "Ihr Antrag wurde eingereicht und wird von der Stiftung geprüft.",
      submissionError:
        "Ihr Antrag konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
      reviewNotice:
        "Die Einreichung eines Antrags garantiert weder eine Genehmigung noch eine Finanzierung.",
      confidentiality:
        "Die übermittelten Informationen dürfen nur zur genehmigten Bearbeitung Ihres Antrags verwendet werden.",
    },

    donations: {
      title: "Spenden",
      description:
        "Unterstützen Sie eine Hilfskampagne mit Ihrer Spende.",
      chooseCampaign: "Kampagne auswählen",
      chooseAmount: "Betrag auswählen",
      customAmount: "Anderer Betrag",
      donationAmount: "Spendenbetrag",
      donorInformation: "Angaben zum Spender",
      anonymousDonation: "Anonym spenden",
      paymentMethod: "Zahlungsmethode",
      paymentSummary: "Spendenübersicht",
      total: "Gesamtbetrag",
      continueToPayment: "Weiter zur Zahlung",
      confirmDonation: "Spende bestätigen",
      securePayment: "Sichere Zahlung",
      paymentPending: "Zahlung wartet auf Bestätigung",
      paymentConfirmed: "Zahlung bestätigt",
      paymentFailed: "Die Zahlung war nicht erfolgreich.",
      thankYou: "Vielen Dank für Ihre Großzügigkeit.",
      receipt: "Spendenbeleg",
      donationReference: "Spendenreferenz",
      noPaymentMethods:
        "Derzeit sind keine Zahlungsmethoden verfügbar.",
    },

    news: {
      title: "Nachrichten und Aktuelles",
      description:
        "Entdecken Sie die Veröffentlichungen und Aktivitäten der Stiftung.",
      latestNews: "Neueste Nachrichten",
      allNews: "Alle Nachrichten",
      categories: "Kategorien",
      author: "Autor",
      publishedOn: "Veröffentlicht am",
      readArticle: "Artikel lesen",
      relatedArticles: "Ähnliche Artikel",
      noArticles:
        "Derzeit sind keine Veröffentlichungen verfügbar.",
      shareArticle: "Artikel teilen",
    },

    transparency: {
      title: "Transparenz",
      description:
        "Erfahren Sie mehr über unsere Prüfungs-, Spenden- und Nachverfolgungsverfahren.",
      verificationTitle: "Prüfung der Anträge",
      verificationDescription:
        "Anträge werden vor der Veröffentlichung einer Kampagne geprüft.",
      donationsTitle: "Spendenverfolgung",
      donationsDescription:
        "Bestätigte Spenden werden erfasst, um ihre ordnungsgemäße Zuordnung zu den jeweiligen Kampagnen zu unterstützen.",
      paymentsTitle: "Direktzahlungen",
      paymentsDescription:
        "Soweit anwendbar, erfolgen Zahlungen direkt an Krankenhäuser oder Dienstleister.",
      reportingTitle: "Information und Nachverfolgung",
      reportingDescription:
        "Geprüfte Maßnahmen und Ergebnisse können mit den erforderlichen Genehmigungen veröffentlicht werden.",
      reports: "Berichte und Veröffentlichungen",
      learnMore: "Mehr erfahren",
    },

    about: {
      title: "Über die Stiftung",
      description:
        "Erfahren Sie mehr über unsere Mission, unsere Werte und unser Engagement.",
      missionTitle: "Unsere Mission",
      missionDescription:
        "Solidarität mobilisieren, um Menschen mit erheblichen medizinischen und sozialen Bedürfnissen zu unterstützen.",
      visionTitle: "Unsere Vision",
      visionDescription:
        "Zu einer Gesellschaft beitragen, in der mehr bedürftige Menschen angemessene Unterstützung erhalten können.",
      valuesTitle: "Unsere Werte",
      solidarity: "Solidarität",
      transparency: "Transparenz",
      responsibility: "Verantwortung",
      dignity: "Würde",
      commitment: "Engagement",
      contactUs: "Kontaktieren Sie uns",
    },

    contact: {
      title: "Kontakt",
      description:
        "Haben Sie Fragen oder möchten Sie die Stiftung kontaktieren?",
      formTitle: "Nachricht senden",
      name: "Vollständiger Name",
      email: "E-Mail-Adresse",
      phone: "Telefon",
      subject: "Betreff der Nachricht",
      message: "Ihre Nachricht",
      sendMessage: "Nachricht senden",
      successMessage: "Ihre Nachricht wurde gesendet.",
      errorMessage:
        "Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
      contactInformation: "Kontaktdaten",
      location: "Standort",
      country: "France",
      openingHours: "Öffnungszeiten",
    },

    footer: {
      description:
        "Gemeinsam retten wir Leben und unterstützen Menschen und Familien, die unsere Hilfe besonders benötigen.",
      quickLinks: "Schnellzugriff",
      information: "Informationen",
      stayConnected: "Bleiben Sie in Kontakt",
      stayConnectedDescription:
        "Verfolgen Sie unsere Aktivitäten, Kampagnen und Neuigkeiten der Stiftung.",
      newsletter: "Newsletter",
      newsletterPlaceholder: "Ihre E-Mail-Adresse",
      newsletterUnavailable: "Anmeldung bald verfügbar",
      followUs: "Folgen Sie uns",
      contact: "Kontakt",
      donate: "Jetzt spenden",
      allRightsReserved: "Alle Rechte vorbehalten.",
      motto: "Solidarität • Transparenz • Hoffnung",
      country: "France",
    },

    accessibility: {
      logoAlt: "Logo der Fondation Sauvons des Vies",
      mainNavigation: "Hauptnavigation",
      mobileNavigation: "Mobile Navigation",
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
      skipToContent: "Zum Hauptinhalt springen",
      changeLanguage: "Sprache ändern",
      closeDialog: "Dialog schließen",
      previousImage: "Vorheriges Bild",
      nextImage: "Nächstes Bild",
    },
  },
} as const satisfies Record<
  Language,
  Record<string, Record<string, string | Record<string, string>>>
>;

// ----------------------------------------------------------
// TYPES PUBLICS
// ----------------------------------------------------------

export type TranslationDictionary =
  typeof translations.fr;

export type TranslationSection =
  keyof TranslationDictionary;

export type TranslationKey<
  Section extends TranslationSection
> = keyof TranslationDictionary[Section];

// ----------------------------------------------------------
// OBTENIR LE DICTIONNAIRE D'UNE LANGUE
// ----------------------------------------------------------

export function getTranslations(
  language: Language | string | null | undefined
) {
  const normalized = normalizeLanguage(language);

  return translations[normalized] ?? translations[DEFAULT_LANGUAGE];
}

// ----------------------------------------------------------
// OBTENIR UNE TRADUCTION PAR CHEMIN
// Exemples :
// t("fr", "navigation.home")
// t("en", "home.hero.title")
// ----------------------------------------------------------

export function translate(
  language: Language | string | null | undefined,
  key: string
): string {
  const dictionary = getTranslations(language);

  const parts = key.split(".").filter(Boolean);

  if (parts.length === 0) {
    return key;
  }

  let current: unknown = dictionary;

  for (const part of parts) {
    if (
      current === null ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(
        current,
        part
      )
    ) {
      return key;
    }

    current = (
      current as Record<string, unknown>
    )[part];
  }

  return typeof current === "string"
    ? current
    : key;
}

// ----------------------------------------------------------
// TRADUCTION AVEC VARIABLES
// Exemple :
// interpolate("Bonjour {name}", { name: "Jean" })
// ----------------------------------------------------------

export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(
    /\{([a-zA-Z0-9_]+)\}/g,
    (match, variable: string) => {
      const value = values[variable];

      return value === undefined
        ? match
        : String(value);
    }
  );
}

// ----------------------------------------------------------
// TRADUCTION AVEC VARIABLES
// ----------------------------------------------------------

export function translateWithValues(
  language: Language | string | null | undefined,
  key: string,
  values: Record<string, string | number>
): string {
  return interpolate(
    translate(language, key),
    values
  );
}

// ----------------------------------------------------------
// EXPORT PAR DÉFAUT
// ----------------------------------------------------------

export default translations;
