/**
 * Zimbabwe's cities and towns, as the first app listed them for a person's
 * location: the city or town box on sign up. Harare, where most people are,
 * is the one a box starts on.
 */

export const TOWNS = [
  'Banket',
  'Beitbridge',
  'Bikita',
  'Bindura',
  'Bulawayo',
  'Chegutu',
  'Chinhoyi',
  'Chipinge',
  'Chitungwiza',
  'Dema',
  'Epworth',
  'Filabusi',
  'Guruve',
  'Gwanda',
  'Gweru',
  'Harare',
  'Hwange',
  'Kadoma',
  'Kariba',
  'Karoi',
  'Kwekwe',
  'Lupane',
  'Marondera',
  'Masvingo',
  'Mt. Darwin',
  'Murehwa',
  'Mvuma',
  'Nkayi',
  'Norton',
  'Nyanga',
  'Plumtree',
  'Redcliff',
  'Rusape',
  'Ruwa',
  'Shamva',
  'Shurugwi',
  'Umzingwane',
  'Victoria Falls',
  'Zvishavane',
] as const;

export type Town = (typeof TOWNS)[number];

export const DEFAULT_TOWN: Town = 'Harare';
