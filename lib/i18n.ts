
export type Language = 'en' | 'es' | 'nl' | 'pt';

export interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav_dashboard': {
    en: 'Command Center',
    es: 'Centro de Mando',
    nl: 'Commandocentrum',
    pt: 'Centro de Comando'
  },
  'nav_inventory': {
    en: 'Inventory Yield',
    es: 'Rendimiento de Inventario',
    nl: 'Voorraadrendement',
    pt: 'Rendimento de Inventário'
  },
  'nav_service': {
    en: 'Service Ledger',
    es: 'Libro de Servicio',
    nl: 'Serviceboek',
    pt: 'Livro de Serviço'
  },
  'nav_guests': {
    en: 'Guest Journeys',
    es: 'Viajes de Huéspedes',
    nl: 'Gastenreizen',
    pt: 'Jornadas de Hóspedes'
  },
  'nav_training': {
    en: 'Social & Training',
    es: 'Social y Capacitación',
    nl: 'Sociaal & Training',
    pt: 'Social e Treinamento'
  },
  'nav_admin': {
    en: 'Facility Admin',
    es: 'Admin de Instalación',
    nl: 'Facilitair Beheer',
    pt: 'Admin da Instalação'
  },
  // Common terms
  'btn_save': {
    en: 'Save Changes',
    es: 'Guardar Cambios',
    nl: 'Wijzigingen Opslaan',
    pt: 'Salvar Alterações'
  },
  'btn_cancel': {
    en: 'Cancel',
    es: 'Cancelar',
    nl: 'Annuleren',
    pt: 'Cancelar'
  },
  'status_active': {
    en: 'Active',
    es: 'Activo',
    nl: 'Actief',
    pt: 'Ativo'
  },
  'status_offline': {
    en: 'Offline',
    es: 'Fuera de línea',
    nl: 'Offline',
    pt: 'Offline'
  }
};

export const getTranslation = (key: string, lang: Language = 'en'): string => {
  if (!translations[key]) return key;
  return translations[key][lang] || translations[key]['en'];
};
