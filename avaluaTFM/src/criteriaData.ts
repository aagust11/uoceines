/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Criterion } from './types.ts';

/**
 * 13 criteria for Section 2: Treball de Final de Màster (Weight 60% of overall)
 * Sum of weights is exactly 10.00
 */
export const TREBALL_CRITERIA: Criterion[] = [
  {
    id: 'pregunta',
    name: 'Definició de la pregunta de recerca (0,75/10)',
    weight: 0.75,
    levels: {
      1: 'Pregunta de recerca formulada de manera vaga o poc pertinent.',
      2: 'Pregunta de recerca formulada de manera adequada, però amb necessitat de més claredat o pertinença.',
      3: 'Pregunta de recerca clara i pertinent, amb petites àrees de millora.',
      4: 'Pregunta de recerca formulada amb claredat i pertinença màxima.'
    }
  },
  {
    id: 'context',
    name: 'Context i objectius de recerca (0,75/10)',
    weight: 0.75,
    levels: {
      1: 'Descripció insuficient del context i objectius, amb justificacions febles o poc convincents.',
      2: 'Descripció adequada del context i objectius, amb algunes mancances en la justificació.',
      3: 'Descripció bona del context i objectius, amb justificacions clares.',
      4: 'Descripció exhaustiva del context i objectius, amb justificacions, profundament convincent.'
    }
  },
  {
    id: 'planificacio',
    name: 'Planificació i implementació (0,75/10)',
    weight: 0.75,
    levels: {
      1: 'Gestió deficient del temps i recursos, amb implementació ineficaç.',
      2: 'Gestió acceptable del temps i recursos, però amb espai per millorar en eficàcia.',
      3: 'Gestió competent del temps i recursos, amb una implementació efectiva.',
      4: 'Gestió òptima del temps i recursos, amb implementació eficient del projecte.'
    }
  },
  {
    id: 'metodologia',
    name: 'Disseny metodològic (0,75/10)',
    weight: 0.75,
    levels: {
      1: 'Disseny poc alineat amb els objectius, necessitant revisió significativa.',
      2: 'Disseny adequat, però amb necessitat de més ajusts per a una alineació òptima.',
      3: 'Disseny ben alineat, amb petites millores possibles.',
      4: 'Disseny perfectament alineat amb els objectius.'
    }
  },
  {
    id: 'eines',
    name: "Selecció d'eines i tècniques (0,50/10)",
    weight: 0.50,
    levels: {
      1: "Selecció incoherent o poc pertinent, que requereix canvis importants.",
      2: "Selecció adequada, encara que manca certa coherència o pertinença.",
      3: "Bona selecció, amb algunes àrees per a una millora menor.",
      4: "Selecció d'eines i tècniques altament coherents i pertinents."
    }
  },
  {
    id: 'estrategia',
    name: "Aplicació de l'estratègia (0,50/10)",
    weight: 0.50,
    levels: {
      1: "Aplicació ineficient o ineficaç que necessita una revisió substancial.",
      2: "Aplicació correcta, però amb diverses àrees a millorar.",
      3: "Aplicació efectiva i correcta de l'estratègia.",
      4: "Aplicació efectiva i excel·lent de l'estratègia."
    }
  },
  {
    id: 'analisi',
    name: 'Anàlisi i interpretació de dades (0,50/10)',
    weight: 0.50,
    levels: {
      1: 'Anàlisi i interpretació dels resultats insuficients, amb manca de la claredat o la profunditat necessàries.',
      2: 'Anàlisi i interpretació adequades dels resultats, però amb necessitat de més detall o profunditat.',
      3: 'Bona anàlisi i interpretació dels resultats, amb claredat i profunditat adequades.',
      4: 'Anàlisi i interpretació dels resultats realitzades amb una profunditat i claredat excepcionals.'
    }
  },
  {
    id: 'exposicio',
    name: "Exposició d'idees (0,75/10)",
    weight: 0.75,
    levels: {
      1: 'Les idees manquen de claredat, fonamentació o argumentació sòlida, i els cal una revisió significativa per a una millor exposició.',
      2: 'Les idees són exposades de manera adequada, amb una argumentació bàsica i fonamentació, però mancades de profunditat o detall en algunes parts.',
      3: 'Les idees rellevants són ben exposades, amb una argumentació sòlida i fonamentació adequada, tot i que hi ha aspectes a millorar.',
      4: 'Les idees rellevants són presentades de manera excepcionalment clara, fonamentada i ben argumentada, tot mostrant un alt nivell de pensament crític.'
    }
  },
  {
    id: 'reflexio',
    name: 'Profunditat de la reflexió (0,75/10)',
    weight: 0.75,
    levels: {
      1: "Reflexió insuficient, amb necessitat de més anàlisi sobre les limitacions, resultats i el procés d'aprenentatge.",
      2: "Reflexió adequada, però manca de detall o profunditat en l'anàlisi de les limitacions i assoliments.",
      3: "Bona reflexió sobre la implementació, amb una comprensió clara de les limitacions i assoliments, encara que podria ser més detallada.",
      4: "Reflexió excepcionalment profunda sobre la implementació, incloent una anàlisi detallada de les limitacions i assoliments."
    }
  },
  {
    id: 'genere_rellevancia',
    name: 'Anàlisi de la rellevància del gènere (0,25/10)',
    weight: 0.25,
    levels: {
      1: "Anàlisi superficial o insuficient de la rellevància del gènere en l'objecte d'estudi.",
      2: "Anàlisi adequada, però amb necessitat de més detall o claredat sobre com el gènere afecta l'objecte d'estudi.",
      3: "Bona anàlisi de la rellevància del gènere en l'objecte d'estudi.",
      4: "Anàlisi excepcional de com el gènere afecta l'objecte d'estudi."
    }
  },
  {
    id: 'genere_documentacio',
    name: 'Revisió de documentació de gènere (0,25/10)',
    weight: 0.25,
    levels: {
      1: "Revisió limitada de la bibliografia de gènere. Cal una millora significativa en la profunditat de l'anàlisi crítica.",
      2: "Revisió suficient de la bibliografia, però amb mancances en l'anàlisi crítica.",
      3: "Revisió completa de la bibliografia de gènere, encara que podria haver-hi espai per a una major profunditat.",
      4: "Revisió exhaustiva i crítica de la bibliografia relacionada amb les diferències de gènere en l'àmbit investigat."
    }
  },
  {
    id: 'genere_metodologia',
    name: 'Metodologia i instruments sensibles al gènere (0,25/10)',
    weight: 0.25,
    levels: {
      1: "Metodologia i instruments amb poca o cap consideració de les diferències de gènere.",
      2: "Metodologia i instruments amb alguna consideració de gènere, però podrien ser més específics o detallats.",
      3: "Disseny adequat de metodologia i instruments amb consideració de les diferències de gènere.",
      4: "Metodologia i instruments excel·lentment dissenyats per a detectar i analitzar les diferències de gènere, amb una presentació clara de les dades desagregades per gènere."
    }
  },
  {
    id: 'genere_impactes',
    name: 'Consideració dels resultats i impactes de gènere (0,25/10)',
    weight: 0.25,
    levels: {
      1: "Poca comprensió de com el gènere pot afectar els resultats i els impactes de la recerca.",
      2: "Comprensió bàsica de com el gènere pot influir en els resultats i els impactes de la recerca.",
      3: "Bona comprensió de com el gènere pot afectar els resultats i os impactes de la recerca.",
      4: "Comprensió profunda de com els resultats i els impactes de l'estudi poden variar en funció del gènere."
    }
  }
];

/**
 * Criteria for Section 3: Defensa Vídeo (Scored only by Avaluador Extern)
 * Sum of weights is exactly 2.00
 */
export const VIDEO_CRITERIA: Criterion[] = [
  {
    id: 'video_estructura',
    name: 'Vídeo: estructura de la presentació (0,75/10)',
    weight: 0.75,
    levels: {
      1: "Estructura pobra o confusa que dificulta la comprensió del missatge per part de l'audiència.",
      2: "Estructura acceptable però amb algunes àrees que necessiten millorar la claredat o la coherència.",
      3: "Presentació ben estructurada, amb introducció, desenvolupament i conclusió clars, i amb bones transicions entre les parts.",
      4: "Presentació amb una estructura excepcionalment clara i lògica, amb transicions suaus que faciliten una comprensió profunda del contingut."
    }
  },
  {
    id: 'video_sintesi',
    name: 'Vídeo: capacitat de síntesi (0,75/10)',
    weight: 0.75,
    levels: {
      1: "Mancances en la tria d'aspectes clau, amb tendència a perdre's en detalls innecessaris o a deixar de banda informació important.",
      2: "Capacitat de síntesi adequada, però amb necessitat d'alguna millora en la claredat d'aspectes clau.",
      3: "Bona capacitat per destacar els punts importants de manera concisa, sense oblidar els aspectes clau.",
      4: "Demostració d'una excepcional habilitat per condensar informació complexa en apartats fàcilment comprensibles, de manera aprofundida."
    }
  },
  {
    id: 'video_verbals',
    name: 'Vídeo: habilitats comunicatives verbals (0,50/10)',
    weight: 0.50,
    levels: {
      1: "Comunicació verbal deficient, amb problemes en articulació, en l'ús del llenguatge o el manteniment de l'interès de l'audiència.",
      2: "Comunicació verbal acceptable, però amb necessitat de millora en la claredat, l'articulació o l'adaptació al públic.",
      3: "Comunicació verbal efectiva, amb bona articulació i ús adequat del llenguatge, que permet mantenir força bé l'atenció constant de l'audiència.",
      4: "Comunicació verbal d'alta qualitat, amb articulació clara, i un ús del llenguatge precís i adaptat a l'audiència, que permet mantenir una atenció constant."
    }
  }
];

/**
 * Criteria for Section 3: Defensa Presencial (Scored only by Avaluador Extern)
 * Sum of weights is exactly 8.00
 */
export const DEFENSA_CRITERIA: Criterion[] = [
  {
    id: 'defensa_claredat',
    name: 'Defensa: claredat de les respostes (4,00/10)',
    weight: 4.00,
    levels: {
      1: 'Respostes poc clares, desorganitzades o confuses.',
      2: 'Respostes generalment clares però amb mancances en l\'estructuració, la claredat i la coherència.',
      3: 'Respostes clares, ben organitzades i amb una bona estructura.',
      4: 'Respostes molt clares, coherents, cohesionades i ben estructurades.'
    }
  },
  {
    id: 'defensa_argumentacio',
    name: "Defensa: qualitat de l'argumentació (3,00/10)",
    weight: 3.00,
    levels: {
      1: 'Argumentació feble, poc fonamentada o lògicament inconsistent.',
      2: 'Argumentació acceptable però amb necessitat de més profunditat, detall o fonamentació.',
      3: 'Argumentació sòlida i ben fonamentada però mancada dels detalls propis de l\'excel·lència.',
      4: 'Argumentació d\'alta qualitat, amb raonaments lògics, profunds i ben fonamentats.'
    }
  },
  {
    id: 'defensa_informacio',
    name: 'Defensa: aportació informació addicional (1,00/10)',
    weight: 1.00,
    levels: {
      1: 'Manca d\'informació addicional, de referències o d\'aportacions no pertinents o mal referenciades.',
      2: 'Aportacions addicionals amb referenciació o rellevància limitades.',
      3: 'Informació addicional que és útil i ben referenciada però que no demostra excel·lència en el coneixement del tema tractat.',
      4: 'Informació addicional rellevant i ben referenciada que enriqueix la resposta i mostra un coneixement ampli del tema tractat.'
    }
  }
];
