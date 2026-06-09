// ============================================================
// Benin Cities Data - All 77 Communes Grouped by Department
// ============================================================

/**
 * Each commune entry:
 *   id        - Numeric identifier (1-77)
 *   name      - Commune name
 *   department- Department name
 *   lat       - Approximate latitude (decimal degrees)
 *   lng       - Approximate longitude (decimal degrees)
 */

const beninCities = [
  // =====================================================================
  // ALIBORI (6 communes)
  // =====================================================================
  {
    id: 1,
    name: 'Banikoara',
    department: 'Alibori',
    lat: 11.3000,
    lng: 2.4333,
  },
  {
    id: 2,
    name: 'Gogounou',
    department: 'Alibori',
    lat: 10.8333,
    lng: 2.8167,
  },
  {
    id: 3,
    name: 'Kandi',
    department: 'Alibori',
    lat: 11.1333,
    lng: 2.9333,
  },
  {
    id: 4,
    name: 'Karimama',
    department: 'Alibori',
    lat: 12.0667,
    lng: 3.1833,
  },
  {
    id: 5,
    name: 'Malanville',
    department: 'Alibori',
    lat: 11.8667,
    lng: 3.3833,
  },
  {
    id: 6,
    name: 'Segbana',
    department: 'Alibori',
    lat: 10.9333,
    lng: 3.7000,
  },

  // =====================================================================
  // ATACORA (9 communes)
  // =====================================================================
  {
    id: 7,
    name: 'Boukoumbé',
    department: 'Atacora',
    lat: 10.1833,
    lng: 1.1000,
  },
  {
    id: 8,
    name: 'Cobly',
    department: 'Atacora',
    lat: 10.2500,
    lng: 1.0667,
  },
  {
    id: 9,
    name: 'Kérou',
    department: 'Atacora',
    lat: 10.8167,
    lng: 1.3000,
  },
  {
    id: 10,
    name: 'Kouandé',
    department: 'Atacora',
    lat: 10.3333,
    lng: 1.6833,
  },
  {
    id: 11,
    name: 'Matéri',
    department: 'Atacora',
    lat: 10.7000,
    lng: 1.0667,
  },
  {
    id: 12,
    name: 'Natitingou',
    department: 'Atacora',
    lat: 10.3000,
    lng: 1.3833,
  },
  {
    id: 13,
    name: 'Pehonko',
    department: 'Atacora',
    lat: 10.1500,
    lng: 1.1500,
  },
  {
    id: 14,
    name: 'Tanguiéta',
    department: 'Atacora',
    lat: 10.6167,
    lng: 1.2667,
  },
  {
    id: 15,
    name: 'Toucountouna',
    department: 'Atacora',
    lat: 10.5000,
    lng: 1.3833,
  },

  // =====================================================================
  // ATLANTIQUE (8 communes)
  // =====================================================================
  {
    id: 16,
    name: 'Abomey-Calavi',
    department: 'Atlantique',
    lat: 6.4500,
    lng: 2.3500,
  },
  {
    id: 17,
    name: 'Allada',
    department: 'Atlantique',
    lat: 6.6500,
    lng: 2.1500,
  },
  {
    id: 18,
    name: 'Kpomassè',
    department: 'Atlantique',
    lat: 6.4000,
    lng: 1.8833,
  },
  {
    id: 19,
    name: 'Ouidah',
    department: 'Atlantique',
    lat: 6.3667,
    lng: 2.0833,
  },
  {
    id: 20,
    name: 'Sô-Ava',
    department: 'Atlantique',
    lat: 6.4833,
    lng: 2.4167,
  },
  {
    id: 21,
    name: 'Toffo',
    department: 'Atlantique',
    lat: 6.8500,
    lng: 2.0833,
  },
  {
    id: 22,
    name: 'Tori-Bossito',
    department: 'Atlantique',
    lat: 6.5333,
    lng: 2.2000,
  },
  {
    id: 23,
    name: 'Zè',
    department: 'Atlantique',
    lat: 6.6833,
    lng: 2.3500,
  },

  // =====================================================================
  // BORGOU (8 communes)
  // =====================================================================
  {
    id: 24,
    name: 'Bembéréké',
    department: 'Borgou',
    lat: 10.2333,
    lng: 2.6667,
  },
  {
    id: 25,
    name: 'Kalalé',
    department: 'Borgou',
    lat: 10.3000,
    lng: 3.3833,
  },
  {
    id: 26,
    name: "N'Dali",
    department: 'Borgou',
    lat: 10.4833,
    lng: 2.7500,
  },
  {
    id: 27,
    name: 'Nikki',
    department: 'Borgou',
    lat: 9.9333,
    lng: 3.2167,
  },
  {
    id: 28,
    name: 'Parakou',
    department: 'Borgou',
    lat: 9.3333,
    lng: 2.6167,
  },
  {
    id: 29,
    name: 'Pèrèrè',
    department: 'Borgou',
    lat: 9.8167,
    lng: 2.9833,
  },
  {
    id: 30,
    name: 'Sinendé',
    department: 'Borgou',
    lat: 10.3500,
    lng: 2.3833,
  },
  {
    id: 31,
    name: 'Tchaourou',
    department: 'Borgou',
    lat: 8.8833,
    lng: 2.6000,
  },

  // =====================================================================
  // COLLINES (6 communes)
  // =====================================================================
  {
    id: 32,
    name: 'Bantè',
    department: 'Collines',
    lat: 8.4167,
    lng: 1.8833,
  },
  {
    id: 33,
    name: 'Dassa-Zoumé',
    department: 'Collines',
    lat: 7.7500,
    lng: 2.1833,
  },
  {
    id: 34,
    name: 'Glazoué',
    department: 'Collines',
    lat: 7.9667,
    lng: 2.2333,
  },
  {
    id: 35,
    name: 'Ouèssè',
    department: 'Collines',
    lat: 8.4833,
    lng: 2.4333,
  },
  {
    id: 36,
    name: 'Savalou',
    department: 'Collines',
    lat: 7.9333,
    lng: 1.9667,
  },
  {
    id: 37,
    name: 'Savé',
    department: 'Collines',
    lat: 8.0333,
    lng: 2.4833,
  },

  // =====================================================================
  // COUFFO (5 communes)
  // =====================================================================
  {
    id: 38,
    name: 'Aplahoué',
    department: 'Couffo',
    lat: 6.9333,
    lng: 1.6833,
  },
  {
    id: 39,
    name: 'Djakotomey',
    department: 'Couffo',
    lat: 6.9000,
    lng: 1.7000,
  },
  {
    id: 40,
    name: 'Klouékanmè',
    department: 'Couffo',
    lat: 6.9833,
    lng: 1.7500,
  },
  {
    id: 41,
    name: 'Lalo',
    department: 'Couffo',
    lat: 6.9167,
    lng: 1.8833,
  },
  {
    id: 42,
    name: 'Toviklin',
    department: 'Couffo',
    lat: 6.8500,
    lng: 1.8000,
  },

  // =====================================================================
  // DONGA (4 communes)
  // =====================================================================
  {
    id: 43,
    name: 'Bassila',
    department: 'Donga',
    lat: 9.0167,
    lng: 1.6667,
  },
  {
    id: 44,
    name: 'Copargo',
    department: 'Donga',
    lat: 9.8333,
    lng: 1.5500,
  },
  {
    id: 45,
    name: 'Djougou',
    department: 'Donga',
    lat: 9.7000,
    lng: 1.6667,
  },
  {
    id: 46,
    name: 'Ouaké',
    department: 'Donga',
    lat: 9.6667,
    lng: 1.4000,
  },

  // =====================================================================
  // LITTORAL (1 commune)
  // =====================================================================
  {
    id: 47,
    name: 'Cotonou',
    department: 'Littoral',
    lat: 6.3667,
    lng: 2.4333,
  },

  // =====================================================================
  // MONO (6 communes)
  // =====================================================================
  {
    id: 48,
    name: 'Athiémè',
    department: 'Mono',
    lat: 6.5833,
    lng: 1.6667,
  },
  {
    id: 49,
    name: 'Bopa',
    department: 'Mono',
    lat: 6.6000,
    lng: 1.9833,
  },
  {
    id: 50,
    name: 'Comè',
    department: 'Mono',
    lat: 6.4000,
    lng: 1.8833,
  },
  {
    id: 51,
    name: 'Grand-Popo',
    department: 'Mono',
    lat: 6.2833,
    lng: 1.8333,
  },
  {
    id: 52,
    name: 'Houéyogbé',
    department: 'Mono',
    lat: 6.5500,
    lng: 1.8667,
  },
  {
    id: 53,
    name: 'Lokossa',
    department: 'Mono',
    lat: 6.6333,
    lng: 1.7167,
  },

  // =====================================================================
  // OUÉMÉ (10 communes)
  // =====================================================================
  {
    id: 54,
    name: 'Adjarra',
    department: 'Ouémé',
    lat: 6.5167,
    lng: 2.6667,
  },
  {
    id: 55,
    name: 'Adjohoun',
    department: 'Ouémé',
    lat: 6.7000,
    lng: 2.4833,
  },
  {
    id: 56,
    name: 'Aguégués',
    department: 'Ouémé',
    lat: 6.4833,
    lng: 2.5333,
  },
  {
    id: 57,
    name: 'Akpro-Missérété',
    department: 'Ouémé',
    lat: 6.5500,
    lng: 2.5833,
  },
  {
    id: 58,
    name: 'Avrankou',
    department: 'Ouémé',
    lat: 6.5667,
    lng: 2.6500,
  },
  {
    id: 59,
    name: 'Bonou',
    department: 'Ouémé',
    lat: 6.9167,
    lng: 2.4500,
  },
  {
    id: 60,
    name: 'Dangbo',
    department: 'Ouémé',
    lat: 6.5000,
    lng: 2.5500,
  },
  {
    id: 61,
    name: 'Porto-Novo',
    department: 'Ouémé',
    lat: 6.4833,
    lng: 2.6167,
  },
  {
    id: 62,
    name: 'Sèmè-Kpodji',
    department: 'Ouémé',
    lat: 6.3667,
    lng: 2.6000,
  },

  // =====================================================================
  // PLATEAU (5 communes)
  // =====================================================================
  {
    id: 63,
    name: 'Adja-Ouèrè',
    department: 'Plateau',
    lat: 6.6500,
    lng: 2.6667,
  },
  {
    id: 64,
    name: 'Ifangni',
    department: 'Plateau',
    lat: 6.6833,
    lng: 2.7333,
  },
  {
    id: 65,
    name: 'Kétou',
    department: 'Plateau',
    lat: 7.3667,
    lng: 2.6000,
  },
  {
    id: 66,
    name: 'Pobè',
    department: 'Plateau',
    lat: 6.9833,
    lng: 2.6667,
  },
  {
    id: 67,
    name: 'Sakété',
    department: 'Plateau',
    lat: 6.7333,
    lng: 2.6500,
  },

  // =====================================================================
  // ZOU (9 communes)
  // =====================================================================
  {
    id: 68,
    name: 'Abomey',
    department: 'Zou',
    lat: 7.1833,
    lng: 1.9833,
  },
  {
    id: 69,
    name: 'Agbangnizoun',
    department: 'Zou',
    lat: 7.1000,
    lng: 1.9667,
  },
  {
    id: 70,
    name: 'Bohicon',
    department: 'Zou',
    lat: 7.1833,
    lng: 2.0667,
  },
  {
    id: 71,
    name: 'Covè',
    department: 'Zou',
    lat: 7.2167,
    lng: 2.3000,
  },
  {
    id: 72,
    name: 'Djidja',
    department: 'Zou',
    lat: 7.3500,
    lng: 1.9333,
  },
  {
    id: 73,
    name: 'Ouinhi',
    department: 'Zou',
    lat: 7.0833,
    lng: 2.4833,
  },
  {
    id: 74,
    name: 'Za-Kpota',
    department: 'Zou',
    lat: 7.2333,
    lng: 2.2167,
  },
  {
    id: 75,
    name: 'Zagnanado',
    department: 'Zou',
    lat: 7.2667,
    lng: 2.4333,
  },
  {
    id: 76,
    name: 'Zogbodomey',
    department: 'Zou',
    lat: 7.1000,
    lng: 2.1000,
  },
];

// =====================================================================
// Derived data
// =====================================================================

/** All 12 departments with their communes */
export const departments = [
  {
    name: 'Alibori',
    capital: 'Kandi',
    region: 'North',
    communes: beninCities.filter((c) => c.department === 'Alibori'),
  },
  {
    name: 'Atacora',
    capital: 'Natitingou',
    region: 'North',
    communes: beninCities.filter((c) => c.department === 'Atacora'),
  },
  {
    name: 'Atlantique',
    capital: 'Allada',
    region: 'South',
    communes: beninCities.filter((c) => c.department === 'Atlantique'),
  },
  {
    name: 'Borgou',
    capital: 'Parakou',
    region: 'North',
    communes: beninCities.filter((c) => c.department === 'Borgou'),
  },
  {
    name: 'Collines',
    capital: 'Dassa-Zoumé',
    region: 'Center',
    communes: beninCities.filter((c) => c.department === 'Collines'),
  },
  {
    name: 'Couffo',
    capital: 'Aplahoué',
    region: 'South',
    communes: beninCities.filter((c) => c.department === 'Couffo'),
  },
  {
    name: 'Donga',
    capital: 'Djougou',
    region: 'North',
    communes: beninCities.filter((c) => c.department === 'Donga'),
  },
  {
    name: 'Littoral',
    capital: 'Cotonou',
    region: 'South',
    communes: beninCities.filter((c) => c.department === 'Littoral'),
  },
  {
    name: 'Mono',
    capital: 'Lokossa',
    region: 'South',
    communes: beninCities.filter((c) => c.department === 'Mono'),
  },
  {
    name: 'Ouémé',
    capital: 'Porto-Novo',
    region: 'South',
    communes: beninCities.filter((c) => c.department === 'Ouémé'),
  },
  {
    name: 'Plateau',
    capital: 'Sakété',
    region: 'South',
    communes: beninCities.filter((c) => c.department === 'Plateau'),
  },
  {
    name: 'Zou',
    capital: 'Abomey',
    region: 'Center',
    communes: beninCities.filter((c) => c.department === 'Zou'),
  },
];

// =====================================================================
// Lookup utilities
// =====================================================================

/**
 * Get a commune by its id.
 * @param {number} id - Commune id (1-77)
 * @returns {object|undefined} The commune object or undefined
 */
export function getCommuneById(id) {
  return beninCities.find((c) => c.id === id);
}

/**
 * Get all communes for a given department.
 * @param {string} department - Department name (e.g., 'Ouémé')
 * @returns {Array} Array of commune objects
 */
export function getCommunesByDepartment(department) {
  return beninCities.filter((c) => c.department === department);
}

/**
 * Get a department object by name.
 * @param {string} name - Department name
 * @returns {object|undefined} Department object with name, capital, region, and communes
 */
export function getDepartmentByName(name) {
  return departments.find((d) => d.name === name);
}

/**
 * Search communes by name (case-insensitive partial match).
 * @param {string} query - Search string
 * @returns {Array} Matching commune objects
 */
export function searchCommunes(query) {
  if (!query || typeof query !== 'string') return [];
  const q = query.toLowerCase().trim();
  return beninCities.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.department.toLowerCase().includes(q)
  );
}

// =====================================================================
// Departments list (flat, for pickers / selects)
// =====================================================================
export const departmentList = departments.map(({ name, capital, region }) => ({
  name,
  capital,
  region,
}));

export default beninCities;
