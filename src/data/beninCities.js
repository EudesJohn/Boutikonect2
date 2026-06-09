/**
 * Benin cities/communes data organized by department.
 * Includes arrondissements for ALL communes (every commune in Benin
 * is divided into arrondissements).
 *
 * Source: Organisation administrative du Bénin
 *
 * @typedef {Object} BeninCity
 * @property {string} name - Commune name
 * @property {string} department - Department name
 * @property {string[]} arrondissements - List of arrondissements
 */
const beninCities = [
  // ===================================================================
  // ATLANTIQUE (8 communes)
  // ===================================================================
  {
    name: 'Abomey-Calavi',
    department: 'Atlantique',
    arrondissements: [
      'Abomey-Calavi Centre',
      'Akassato',
      'Godomey',
      'Hêvié',
      'Kpanroun',
      'Togba',
      'Zogbadjè',
    ],
  },
  {
    name: 'Allada',
    department: 'Atlantique',
    arrondissements: [
      'Allada Centre',
      'Agbanou',
      'Attogon',
      'Dékpo',
      'Sè',
      'Avakpa',
      'Sékou',
      'Togoudo',
    ],
  },
  {
    name: 'Kpomassè',
    department: 'Atlantique',
    arrondissements: [
      'Kpomassè Centre',
      'Dékanmey',
      'Sègbohouè',
      'Tokpa-Domè',
    ],
  },
  {
    name: 'Ouidah',
    department: 'Atlantique',
    arrondissements: [
      'Ouidah I',
      'Ouidah II',
      'Ouidah III',
      'Ouidah IV',
      'Djègbadji',
      'Pahou',
      'Savi',
    ],
  },
  {
    name: 'Sô-Ava',
    department: 'Atlantique',
    arrondissements: [
      'Sô-Ava Centre',
      'Ahomey-Lokpo',
      'Dékin',
      'Gonzoué',
      'Vékky',
    ],
  },
  {
    name: 'Toffo',
    department: 'Atlantique',
    arrondissements: [
      'Toffo Centre',
      'Agué',
      'Colli-Agbamè',
      'Coussi',
      'Damè',
      'Djingbé',
      'Houédo-Aguékon',
    ],
  },
  {
    name: 'Tori-Bossito',
    department: 'Atlantique',
    arrondissements: [
      'Tori-Bossito Centre',
      'Avamè',
      'Azohouè-Allada',
      'Ganhounmè',
      'Tori-Cada',
      'Zoungbonou',
    ],
  },
  {
    name: 'Zè',
    department: 'Atlantique',
    arrondissements: [
      'Zè Centre',
      'Adjan',
      'Dakwè',
      'Domey',
      'Guidigri',
      'Lokogba',
      'Sèdjè Dénou',
    ],
  },

  // ===================================================================
  // LITTORAL (1 commune)
  // ===================================================================
  {
    name: 'Cotonou',
    department: 'Littoral',
    arrondissements: [
      '1er Arrondissement',
      '2ème Arrondissement',
      '3ème Arrondissement',
      '4ème Arrondissement',
      '5ème Arrondissement',
      '6ème Arrondissement',
      '7ème Arrondissement',
      '8ème Arrondissement',
      '9ème Arrondissement',
      '10ème Arrondissement',
      '11ème Arrondissement',
      '12ème Arrondissement',
      '13ème Arrondissement',
    ],
  },

  // ===================================================================
  // OUÉMÉ (9 communes)
  // ===================================================================
  {
    name: 'Adjarra',
    department: 'Ouémé',
    arrondissements: [
      'Adjarra I',
      'Adjarra II',
      'Agblangandan',
      'Honmè',
      'Malanhoui',
    ],
  },
  {
    name: 'Adjohoun',
    department: 'Ouémé',
    arrondissements: [
      'Adjohoun Centre',
      'Awaguidi',
      'Azowlissè',
      'Dèmè',
      'Gangban',
      'Kodè',
      'Togbota',
    ],
  },
  {
    name: 'Aguégués',
    department: 'Ouémé',
    arrondissements: [
      'Aguégués Centre',
      'Avlékété',
      'Dékandji',
      'Ganhouto',
      'Houngla',
    ],
  },
  {
    name: 'Akpro-Missérété',
    department: 'Ouémé',
    arrondissements: [
      'Akpro-Missérété Centre',
      'Katagon',
      'Vakon',
      'Zoungbonou',
      'Zougon',
    ],
  },
  {
    name: 'Avrankou',
    department: 'Ouémé',
    arrondissements: [
      'Avrankou Centre',
      'Atchoukpa',
      'Djomon',
      'Goutin',
      'Ouanho',
      'Sado',
    ],
  },
  {
    name: 'Bonou',
    department: 'Ouémé',
    arrondissements: [
      'Bonou Centre',
      'Achoukpa',
      'Affamè',
      'Dédomè',
      'Houéda',
      'Kpankoun',
    ],
  },
  {
    name: 'Dangbo',
    department: 'Ouémé',
    arrondissements: [
      'Dangbo Centre',
      'Dékin',
      'Gbéko',
      'Houédomè',
      'Hozin',
      'Késsounou',
    ],
  },
  {
    name: 'Porto-Novo',
    department: 'Ouémé',
    arrondissements: [
      '1er Arrondissement',
      '2ème Arrondissement',
      '3ème Arrondissement',
      '4ème Arrondissement',
      '5ème Arrondissement',
    ],
  },
  {
    name: 'Sèmè-Kpodji',
    department: 'Ouémé',
    arrondissements: [
      'Sèmè-Kpodji Centre',
      'Agblangandan',
      'Ékpé',
      'Tohoué',
      'Village',
    ],
  },

  // ===================================================================
  // PLATEAU (5 communes)
  // ===================================================================
  {
    name: 'Adja-Ouèrè',
    department: 'Plateau',
    arrondissements: [
      'Adja-Ouèrè Centre',
      'Ikpinlè',
      'Kpankoun',
      'Massé',
      'Nissi',
      'Oko-Akaré',
    ],
  },
  {
    name: 'Ifangni',
    department: 'Plateau',
    arrondissements: [
      'Ifangni Centre',
      'Banigbé',
      'Daagbé',
      'Kétou',
      'Lagbé',
      'Massè',
    ],
  },
  {
    name: 'Kétou',
    department: 'Plateau',
    arrondissements: [
      'Kétou Centre',
      'Adékambi',
      'Idigny',
      'Kpankou',
      'Odomèta',
      'Okpoulé',
      'Tchemakou',
      'Wawa',
    ],
  },
  {
    name: 'Pobè',
    department: 'Plateau',
    arrondissements: [
      'Pobè Centre',
      'Ahoyéyé',
      'Issaba',
      'Kazizoun',
      'Kpoto',
      'Towéta',
    ],
  },
  {
    name: 'Sakété',
    department: 'Plateau',
    arrondissements: [
      'Sakété I',
      'Sakété II',
      'Ita-Djèhou',
      'Onigbolo',
      'Yoko',
    ],
  },

  // ===================================================================
  // COLLINES (6 communes)
  // ===================================================================
  {
    name: 'Bantè',
    department: 'Collines',
    arrondissements: [
      'Bantè Centre',
      'Agoua',
      'Akpassi',
      'Atokolibé',
      'Bobè',
      'Gouka',
      'Koko',
      'Loulé',
    ],
  },
  {
    name: 'Dassa-Zoumè',
    department: 'Collines',
    arrondissements: [
      'Dassa-Zoumè Centre',
      'Akofodjoulè',
      'Gobada',
      'Kpataba',
      'Lèma',
      'Paouignan',
      'Soclogbo',
      'Tré',
    ],
  },
  {
    name: 'Glazoué',
    department: 'Collines',
    arrondissements: [
      'Glazoué Centre',
      'Assanté',
      'Aklankpa',
      'Danté',
      'Gomè',
      'Kpakpalè',
      'Magoumi',
      'Outo',
      'Sèmèrè',
      'Zaffé',
    ],
  },
  {
    name: 'Ouèssè',
    department: 'Collines',
    arrondissements: [
      'Ouèssè Centre',
      'Challaogoi',
      'Djègbé',
      'Kaboua',
      'Kèmon',
      'Odègbè',
      'Tchabalmè',
    ],
  },
  {
    name: 'Savalou',
    department: 'Collines',
    arrondissements: [
      'Savalou Centre',
      'Djanra',
      'Gobada',
      'Kpataba',
      'Lèma',
      'Monkirou',
      'Orou-Koto',
      'Ouessè',
      'Tchetti',
    ],
  },
  {
    name: 'Savè',
    department: 'Collines',
    arrondissements: [
      'Savè Centre',
      'Adido',
      'Bèssin',
      'Kessounou',
      'Koûta',
      'Orou-Koto',
      'Ouokou',
    ],
  },

  // ===================================================================
  // ZOU (9 communes)
  // ===================================================================
  {
    name: 'Abomey',
    department: 'Zou',
    arrondissements: [
      'Abomey Centre',
      'Agbokpa',
      'Détohou',
      'Djègbé',
      'Hounli',
      'Sèhouè',
      'Vidolè',
      'Zounzonmè',
    ],
  },
  {
    name: 'Agbangnizoun',
    department: 'Zou',
    arrondissements: [
      'Agbangnizoun Centre',
      'Adahondjigon',
      'Adingningon',
      'Dèdomey',
      'Koumahouèdé',
      'Lissazounmè',
      'Saklo',
      'Sèdjè',
      'Sovè',
    ],
  },
  {
    name: 'Bohicon',
    department: 'Zou',
    arrondissements: [
      'Bohicon I',
      'Bohicon II',
      'Agongointo',
      'Gnamè',
      'Lissèzoun',
      'Ouassaho',
      'Passagon',
      'Sagon',
      'Zakanmè',
    ],
  },
  {
    name: 'Covè',
    department: 'Zou',
    arrondissements: [
      'Covè Centre',
      'Adogbé',
      'Gbokou',
      'Houin',
      'Lainta-Cogbé',
      'Naogon',
      'Solili',
      'Zogba',
    ],
  },
  {
    name: 'Djidja',
    department: 'Zou',
    arrondissements: [
      'Djidja Centre',
      'Agondji',
      'Agouna',
      'Dan',
      'Gobè',
      'Monsourou',
      'Mougnon',
      'Oungbégamè',
      'Outo',
    ],
  },
  {
    name: 'Ouinhi',
    department: 'Zou',
    arrondissements: [
      'Ouinhi Centre',
      'Dasso',
      'Hounmassi',
      'Sagon',
      'Tohoué',
    ],
  },
  {
    name: 'Zagnanado',
    department: 'Zou',
    arrondissements: [
      'Zagnanado Centre',
      'Agonli-Houégbo',
      'Banamè',
      'Don-Tan',
      'Dovi',
      'Kpédékpo',
    ],
  },
  {
    name: 'Za-Kpota',
    department: 'Zou',
    arrondissements: [
      'Za-Kpota Centre',
      'Allahé',
      'Assalin',
      'Dèdomey',
      'Houédomè',
      'Kpataba',
      'Kpindou',
      'Lissèzoun',
      'Saklo',
    ],
  },
  {
    name: 'Zogbodomey',
    department: 'Zou',
    arrondissements: [
      'Zogbodomey Centre',
      'Akiz',
      'Avlamè',
      'Cana I',
      'Cana II',
      'Dèmè',
      'Goutin',
      'Hla',
      'Kpataba',
      'Tokpa',
    ],
  },

  // ===================================================================
  // MONO (6 communes)
  // ===================================================================
  {
    name: 'Athiémé',
    department: 'Mono',
    arrondissements: [
      'Athiémé Centre',
      'Adohoun',
      'Atchannou',
      'Dédékpoé',
      'Kpakpamè',
      'Lonkly',
    ],
  },
  {
    name: 'Bopa',
    department: 'Mono',
    arrondissements: [
      'Bopa Centre',
      'Agbodji',
      'Badazoui',
      'Gbakpodji',
      'Lobogo',
      'Possotomè',
      'Yégodoé',
    ],
  },
  {
    name: 'Comè',
    department: 'Mono',
    arrondissements: [
      'Comè Centre',
      'Agatogbo',
      'Akodéha',
      'Dékin',
      'Ouladji',
      'Potohoué',
    ],
  },
  {
    name: 'Grand-Popo',
    department: 'Mono',
    arrondissements: [
      'Grand-Popo Centre',
      'Adjaha',
      'Agoué',
      'Avloh',
      'Doutou',
      'Gbékon',
    ],
  },
  {
    name: 'Houéyogbé',
    department: 'Mono',
    arrondissements: [
      'Houéyogbé Centre',
      'Dahé',
      'Doutou',
      'Honhoué',
      'Sé',
      'Zoungbonou',
    ],
  },
  {
    name: 'Lokossa',
    department: 'Mono',
    arrondissements: [
      'Lokossa Centre',
      'Adjinan',
      'Agamé',
      'Houin',
      'Kpataba',
      'Zébé',
    ],
  },

  // ===================================================================
  // COUFFO (6 communes)
  // ===================================================================
  {
    name: 'Aplahoué',
    department: 'Couffo',
    arrondissements: [
      'Aplahoué Centre',
      'Atomey',
      'Azové',
      'Dèkou',
      'Godohou',
      'Kissamey',
      'Logozouhé',
      'Zah',
    ],
  },
  {
    name: 'Djakotomey',
    department: 'Couffo',
    arrondissements: [
      'Djakotomey Centre',
      'Bètoumèy',
      'Goutin',
      'Houédjè',
      'Kokoh',
      'Lingbé',
      'Sèdjè',
      'Tchakou',
    ],
  },
  {
    name: 'Dogbo-Tota',
    department: 'Couffo',
    arrondissements: [
      'Dogbo-Tota Centre',
      'Ayomi',
      'Dèvè',
      'Honton',
      'Lokogohoué',
      'Madjrè',
      'Tota',
      'Totchangni',
    ],
  },
  {
    name: 'Klouékanmè',
    department: 'Couffo',
    arrondissements: [
      'Klouékanmè Centre',
      'Adjanhoun',
      'Ahokpa',
      'Djansou',
      'Lanta',
      'Tchikpé',
    ],
  },
  {
    name: 'Lalo',
    department: 'Couffo',
    arrondissements: [
      'Lalo Centre',
      'Adoukandji',
      'Ahodjinnou',
      'Ahomadégbé',
      'Banigbé',
      'Gnizounmè',
      'Hlassamè',
      'Tchito',
    ],
  },
  {
    name: 'Toviklin',
    department: 'Couffo',
    arrondissements: [
      'Toviklin Centre',
      'Adjido',
      'Avédjin',
      'Dokpo',
      'Doko',
      'Gbakpodji',
      'Gnito',
      'Kpataba',
      'Tchandré',
    ],
  },

  // ===================================================================
  // DONGA (4 communes)
  // ===================================================================
  {
    name: 'Bassila',
    department: 'Donga',
    arrondissements: [
      'Bassila Centre',
      'Alédjo',
      'Manigri',
      'Pénéssoulou',
      'Polakongo',
    ],
  },
  {
    name: 'Copargo',
    department: 'Donga',
    arrondissements: [
      'Copargo Centre',
      'Anandana',
      'Pabégou',
      'Singré',
      'Solo',
    ],
  },
  {
    name: 'Djougou',
    department: 'Donga',
    arrondissements: [
      'Djougou I',
      'Djougou II',
      'Djougou III',
      'Bariénou',
      'Bassa',
      'Kopargo',
      'Pélébina',
      'Sawhouna',
      'Toui',
    ],
  },
  {
    name: 'Ouaké',
    department: 'Donga',
    arrondissements: [
      'Ouaké Centre',
      'Bajou',
      'Kémèdé',
      'Korou',
      'Manté',
      'Roumongui',
      'Toufa',
    ],
  },

  // ===================================================================
  // ATACORA (9 communes)
  // ===================================================================
  {
    name: 'Boukoumbé',
    department: 'Atacora',
    arrondissements: [
      'Boukoumbé Centre',
      'Dipokar',
      'Korantière',
      'Kouffagou',
      'Manta',
      'Natta',
      'Tabota',
    ],
  },
  {
    name: 'Cobly',
    department: 'Atacora',
    arrondissements: [
      'Cobly Centre',
      'Datori',
      'Kountouri',
      'Sèkwa',
      'Tchakalakou',
    ],
  },
  {
    name: 'Kérou',
    department: 'Atacora',
    arrondissements: [
      'Kérou Centre',
      'Brignamaro',
      'Firou',
      'Kassou',
      'Kotopounga',
      'Tchotchogh',
    ],
  },
  {
    name: 'Kouandé',
    department: 'Atacora',
    arrondissements: [
      'Kouandé Centre',
      'Birni',
      'Chabikouma',
      'Dango',
      'Fô-Tancé',
      'Kossou',
      'Oroukayo',
    ],
  },
  {
    name: 'Matéri',
    department: 'Atacora',
    arrondissements: [
      'Matéri Centre',
      'Dassari',
      'Gouandé',
      'Nodi',
      'Tantéga',
      'Tchianhoun-Cossi',
    ],
  },
  {
    name: 'Natitingou',
    department: 'Atacora',
    arrondissements: [
      'Natitingou I',
      'Natitingou II',
      'Natitingou III',
      'Kotopounga',
      'Koundri',
      'Péporiyakou',
      'Tantchogou',
      'Tchantpi',
      'Toumbountou',
    ],
  },
  {
    name: 'Péhunco',
    department: 'Atacora',
    arrondissements: [
      'Péhunco Centre',
      'Gnémasson',
      'Gobèrè',
      'Komon',
      'Mons',
      'Touga',
    ],
  },
  {
    name: 'Tanguiéta',
    department: 'Atacora',
    arrondissements: [
      'Tanguiéta Centre',
      'Bohicon',
      'Cotiakou',
      "N'Dahonta",
      'Taiakou',
      'Tanongou',
      'Toucountouna',
    ],
  },
  {
    name: 'Toucountouna',
    department: 'Atacora',
    arrondissements: [
      'Toucountouna Centre',
      'Kouarfa',
      'Kouaténa',
      'Niaré',
      'Tanta',
      'Tantchou',
    ],
  },

  // ===================================================================
  // BORGOU (8 communes)
  // ===================================================================
  {
    name: 'Bembéréké',
    department: 'Borgou',
    arrondissements: [
      'Bembéréké Centre',
      'Bèrouwou',
      'Bouanri',
      'Gania',
      'Gassi',
      'Ina',
      'Samon',
      'Sinagourou',
    ],
  },
  {
    name: 'Kalalé',
    department: 'Borgou',
    arrondissements: [
      'Kalalé Centre',
      'Basso',
      'Donga',
      'Gogounou',
      'Guémé',
      'Kaboré',
      'Kika',
      'Tèrou',
    ],
  },
  {
    name: "N'Dali",
    department: 'Borgou',
    arrondissements: [
      "N'Dali Centre",
      'Biro',
      'Bougnrou',
      'Gogounou',
      'Kpérou',
      'Ouénou',
      'Sirarou',
    ],
  },
  {
    name: 'Nikki',
    department: 'Borgou',
    arrondissements: [
      'Nikki Centre',
      'Alafiarou',
      'Bérou',
      'Gnonkourakali',
      'Ouénou',
      'Samon',
      'Soumon',
    ],
  },
  {
    name: 'Parakou',
    department: 'Borgou',
    arrondissements: [
      '1er Arrondissement',
      '2ème Arrondissement',
      '3ème Arrondissement',
    ],
  },
  {
    name: 'Pèrèrè',
    department: 'Borgou',
    arrondissements: [
      'Pèrèrè Centre',
      'Alaou',
      'Bèrètingou',
      'Bérou',
      'Gahpota',
      'Guèmou',
      'Mantanou',
      'Sontou',
      'Tébou',
    ],
  },
  {
    name: 'Sinendé',
    department: 'Borgou',
    arrondissements: [
      'Sinendé Centre',
      'Bèssassi',
      'Kazaboua',
      'Kouarou',
      "N'Drou",
      'Sèrèkali',
    ],
  },
  {
    name: 'Tchaourou',
    department: 'Borgou',
    arrondissements: [
      'Tchaourou Centre',
      'Alafiarou',
      'Bétérou',
      'Goro',
      'Kparatèrè',
      'Sanson',
      'Saraké',
      'Sérou',
    ],
  },

  // ===================================================================
  // ALIBORI (6 communes)
  // ===================================================================
  {
    name: 'Banikoara',
    department: 'Alibori',
    arrondissements: [
      'Banikoara Centre',
      'Dê',
      'Founougo',
      'Goumori',
      'Kokoh',
      'Kokiborou',
      'Monnè',
      'Ounet',
      'Sompérékou',
    ],
  },
  {
    name: 'Gogounou',
    department: 'Alibori',
    arrondissements: [
      'Gogounou Centre',
      'Bagou',
      'Gounarou',
      'Ouara',
      'Sori',
      'Zougou-Pantrossi',
    ],
  },
  {
    name: 'Kandi',
    department: 'Alibori',
    arrondissements: [
      'Kandi I',
      'Kandi II',
      'Kandi III',
      'Angaradébou',
      'Bensekou',
      'Donwari',
      'Kassakou',
      'Saah',
      'Sam',
      'Sonse',
    ],
  },
  {
    name: 'Karimama',
    department: 'Alibori',
    arrondissements: [
      'Karimama Centre',
      'Birni',
      'Kompa',
      'Léro',
      'Orou Guiaro',
    ],
  },
  {
    name: 'Malanville',
    department: 'Alibori',
    arrondissements: [
      'Malanville Centre',
      'Garou',
      'Guéné',
      'Mandécali',
      'Tomboutou',
    ],
  },
  {
    name: 'Ségbana',
    department: 'Alibori',
    arrondissements: [
      'Ségbana Centre',
      'Libantè',
      'Liboussou',
      'Lougou',
      'Sokotindji',
      'Tomboutou',
    ],
  },
];

export default beninCities;

/**
 * Get arrondissements for a given commune name.
 * @param {string} cityName - The commune name
 * @returns {string[]} Array of arrondissement names
 */
export function getArrondissements(cityName) {
  const city = beninCities.find((c) => c.name === cityName);
  return city?.arrondissements || [];
}
