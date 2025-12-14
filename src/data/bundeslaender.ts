/**
 * German Bundesländer mapping
 * The first two digits of the ARS (Amtlicher Regionalschlüssel) identify the Bundesland
 */

import type { Bundesland } from './schema';

export const BUNDESLAENDER: Record<string, Bundesland> = {
  '01': { code: '01', name: 'Schleswig-Holstein', shortName: 'SH' },
  '02': { code: '02', name: 'Hamburg', shortName: 'HH' },
  '03': { code: '03', name: 'Niedersachsen', shortName: 'NI' },
  '04': { code: '04', name: 'Bremen', shortName: 'HB' },
  '05': { code: '05', name: 'Nordrhein-Westfalen', shortName: 'NW' },
  '06': { code: '06', name: 'Hessen', shortName: 'HE' },
  '07': { code: '07', name: 'Rheinland-Pfalz', shortName: 'RP' },
  '08': { code: '08', name: 'Baden-Württemberg', shortName: 'BW' },
  '09': { code: '09', name: 'Bayern', shortName: 'BY' },
  '10': { code: '10', name: 'Saarland', shortName: 'SL' },
  '11': { code: '11', name: 'Berlin', shortName: 'BE' },
  '12': { code: '12', name: 'Brandenburg', shortName: 'BB' },
  '13': { code: '13', name: 'Mecklenburg-Vorpommern', shortName: 'MV' },
  '14': { code: '14', name: 'Sachsen', shortName: 'SN' },
  '15': { code: '15', name: 'Sachsen-Anhalt', shortName: 'ST' },
  '16': { code: '16', name: 'Thüringen', shortName: 'TH' },
};

/**
 * Get Bundesland from ARS code
 * @param ars - The Amtlicher Regionalschlüssel (12 digits)
 * @returns The Bundesland or undefined if not found
 */
export function getBundeslandFromArs(ars: string): Bundesland | undefined {
  if (!ars || ars.length < 2) return undefined;
  const prefix = ars.substring(0, 2);
  return BUNDESLAENDER[prefix];
}

/**
 * Get all Bundesländer as array
 */
export function getAllBundeslaender(): Bundesland[] {
  return Object.values(BUNDESLAENDER);
}

/**
 * Get random Bundesländer for quiz (excluding one)
 * @param exclude - Bundesland code to exclude
 * @param count - Number of random Bundesländer to return
 */
export function getRandomBundeslaender(exclude: string, count: number): Bundesland[] {
  const available = Object.values(BUNDESLAENDER).filter(b => b.code !== exclude);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
