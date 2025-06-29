export type Language = "en" | "es" | "fr";

export interface Translations {
  // Header
  teams: string;
  yourPlan: string;

  // Navigation
  currentPlan: string;
  availablePackages: string;
  viewBills: string;

  // User menu
  myAccount: string;
  profile: string;
  security: string;
  termsOfUse: string;
  logOut: string;

  // Database management
  databases: string;
  newDatabase: string;
  databaseName: string;
  addDocument: string;
  processDocuments: string;
  processing: string;
  renameDatabase: string;
  deleteDatabase: string;
  confirmDelete: string;
  dragDropFiles: string;
  documents: string;
  pages: string;

  // Document viewer
  documentViewer: string;
  searchInDocument: string;
  selectDocument: string;
  page: string;
  of: string;

  // Chat
  chatWithTia: string;
  askQuestion: string;
  searchChat: string;
  savedChats: string;
  saveCurrent: string;
  settings: string;

  // Settings
  changeLanguage: string;
  adjustFontSize: string;
  customizeAppearance: string;
  privacySettings: string;
  language: string;
  fontSize: string;
  appearance: string;
  theme: string;
  light: string;
  dark: string;
  auto: string;
  shareUsage: string;
  saveHistory: string;
  allowAnalytics: string;

  // General
  save: string;
  cancel: string;
  close: string;
  delete: string;
  edit: string;
  upload: string;
  send: string;
  loading: string;
  error: string;
  success: string;

  // Footer
  footerText: string;
  rightsReserved: string;

  // File upload
  uploadFiles: string;
  dragDropHere: string;
  myDocuments: string;

  // Chat messages
  timestamp: string;
  references: string;
  chatSessionName: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    teams: "Teams",
    yourPlan: "Your Plan",

    // Navigation
    currentPlan: "Current Plan",
    availablePackages: "Available Packages",
    viewBills: "View Bills",

    // User menu
    myAccount: "My Account",
    profile: "Profile",
    security: "Security",
    termsOfUse: "Terms of Use",
    logOut: "Log out",

    // Database management
    databases: "Databases",
    newDatabase: "New Database",
    databaseName: "Database name",
    addDocument: "Add Document",
    processDocuments: "Process Documents",
    processing: "Processing",
    renameDatabase: "Rename Database",
    deleteDatabase: "Delete Database",
    confirmDelete: "Are you sure you want to delete this?",
    dragDropFiles: "Or drag & drop files here",
    documents: "documents",
    pages: "pages",

    // Document viewer
    documentViewer: "Document Viewer",
    searchInDocument: "Search in document...",
    selectDocument: "Select a document to view its content",
    page: "Page",
    of: "of",

    // Chat
    chatWithTia: "Chat with Tia",
    askQuestion: "Ask Tia a question...",
    searchChat: "Search chat...",
    savedChats: "Saved Chats",
    saveCurrent: "Save Current",
    settings: "Settings",

    // Settings
    changeLanguage: "Change Language",
    adjustFontSize: "Adjust Font Size",
    customizeAppearance: "Customize Appearance",
    privacySettings: "Privacy Settings",
    language: "Language",
    fontSize: "Font Size",
    appearance: "Appearance",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    auto: "Auto",
    shareUsage: "Share usage data",
    saveHistory: "Save chat history",
    allowAnalytics: "Allow analytics",

    // General
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    upload: "Upload",
    send: "Send",
    loading: "Loading...",
    error: "Error",
    success: "Success",

    // Footer
    footerText: "Tia es una creación de Softia.ca",
    rightsReserved: "All rights reserved",

    // File upload
    uploadFiles: "Upload Files",
    dragDropHere: "Or drag & drop here",
    myDocuments: "My Documents",

    // Chat messages
    timestamp: "Timestamp",
    references: "References",
    chatSessionName: "Chat Session",
  },

  es: {
    // Header
    teams: "Equipos",
    yourPlan: "Tu Plan",

    // Navigation
    currentPlan: "Plan Actual",
    availablePackages: "Paquetes Disponibles",
    viewBills: "Ver Facturas",

    // User menu
    myAccount: "Mi Cuenta",
    profile: "Perfil",
    security: "Seguridad",
    termsOfUse: "Términos de Uso",
    logOut: "Cerrar sesión",

    // Database management
    databases: "Bases de Datos",
    newDatabase: "Nueva Base de Datos",
    databaseName: "Nombre de la base de datos",
    addDocument: "Agregar Documento",
    processDocuments: "Procesar Documentos",
    processing: "Procesando",
    renameDatabase: "Renombrar Base de Datos",
    deleteDatabase: "Eliminar Base de Datos",
    confirmDelete: "¿Estás seguro de que quieres eliminar esto?",
    dragDropFiles: "O arrastra y suelta archivos aquí",
    documents: "documentos",
    pages: "páginas",

    // Document viewer
    documentViewer: "Visor de Documentos",
    searchInDocument: "Buscar en documento...",
    selectDocument: "Selecciona un documento para ver su contenido",
    page: "Página",
    of: "de",

    // Chat
    chatWithTia: "Chat con Tia",
    askQuestion: "Pregúntale a Tia...",
    searchChat: "Buscar en chat...",
    savedChats: "Chats Guardados",
    saveCurrent: "Guardar Actual",
    settings: "Configuración",

    // Settings
    changeLanguage: "Cambiar Idioma",
    adjustFontSize: "Ajustar Tamaño de Fuente",
    customizeAppearance: "Personalizar Apariencia",
    privacySettings: "Configuración de Privacidad",
    language: "Idioma",
    fontSize: "Tamaño de Fuente",
    appearance: "Apariencia",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    auto: "Automático",
    shareUsage: "Compartir datos de uso",
    saveHistory: "Guardar historial de chat",
    allowAnalytics: "Permitir análisis",

    // General
    save: "Guardar",
    cancel: "Cancelar",
    close: "Cerrar",
    delete: "Eliminar",
    edit: "Editar",
    upload: "Subir",
    send: "Enviar",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",

    // Footer
    footerText: "Tia es una creación de Softia.ca",
    rightsReserved: "Todos los derechos reservados",

    // File upload
    uploadFiles: "Subir Archivos",
    dragDropHere: "O arrastra y suelta aquí",
    myDocuments: "Mis Documentos",

    // Chat messages
    timestamp: "Marca de tiempo",
    references: "Referencias",
    chatSessionName: "Sesión de Chat",
  },

  fr: {
    // Header
    teams: "Équipes",
    yourPlan: "Votre Plan",

    // Navigation
    currentPlan: "Plan Actuel",
    availablePackages: "Packages Disponibles",
    viewBills: "Voir les Factures",

    // User menu
    myAccount: "Mon Compte",
    profile: "Profil",
    security: "Sécurité",
    termsOfUse: "Conditions d'Utilisation",
    logOut: "Se déconnecter",

    // Database management
    databases: "Bases de Données",
    newDatabase: "Nouvelle Base de Données",
    databaseName: "Nom de la base de données",
    addDocument: "Ajouter Document",
    processDocuments: "Traiter Documents",
    processing: "En cours",
    renameDatabase: "Renommer Base de Données",
    deleteDatabase: "Supprimer Base de Données",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer ceci?",
    dragDropFiles: "Ou glissez-déposez les fichiers ici",
    documents: "documents",
    pages: "pages",

    // Document viewer
    documentViewer: "Visionneuse de Documents",
    searchInDocument: "Rechercher dans le document...",
    selectDocument: "Sélectionnez un document pour voir son contenu",
    page: "Page",
    of: "de",

    // Chat
    chatWithTia: "Chat avec Tia",
    askQuestion: "Demandez à Tia...",
    searchChat: "Rechercher dans le chat...",
    savedChats: "Chats Sauvegardés",
    saveCurrent: "Sauvegarder Actuel",
    settings: "Paramètres",

    // Settings
    changeLanguage: "Changer la Langue",
    adjustFontSize: "Ajuster la Taille de Police",
    customizeAppearance: "Personnaliser l'Apparence",
    privacySettings: "Paramètres de Confidentialité",
    language: "Langue",
    fontSize: "Taille de Police",
    appearance: "Apparence",
    theme: "Thème",
    light: "Clair",
    dark: "Sombre",
    auto: "Automatique",
    shareUsage: "Partager les données d'utilisation",
    saveHistory: "Sauvegarder historique de chat",
    allowAnalytics: "Autoriser l'analyse",

    // General
    save: "Sauvegarder",
    cancel: "Annuler",
    close: "Fermer",
    delete: "Supprimer",
    edit: "Modifier",
    upload: "Télécharger",
    send: "Envoyer",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",

    // Footer
    footerText: "Tia es una creación de Softia.ca",
    rightsReserved: "Tous droits réservés",

    // File upload
    uploadFiles: "Télécharger Fichiers",
    dragDropHere: "Ou glissez-déposez ici",
    myDocuments: "Mes Documents",

    // Chat messages
    timestamp: "Horodatage",
    references: "Références",
    chatSessionName: "Session de Chat",
  },
};

export function useTranslation(language: Language) {
  return translations[language];
}
