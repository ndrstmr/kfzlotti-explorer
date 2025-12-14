/**
 * Fallback index data for offline-first experience
 * Contains a subset of common German KFZ codes for basic functionality
 * when the full data cannot be loaded
 */

import type { KfzIndex } from './schema';

export const FALLBACK_INDEX: KfzIndex = {
  version: 1,
  generated: '2024-01-01T00:00:00.000Z',
  source: 'Embedded fallback data',
  codeToIds: {
    'B': ['11000000'],
    'HH': ['02000000'],
    'M': ['09162000'],
    'K': ['05315000'],
    'F': ['06412000'],
    'S': ['08111000'],
    'D': ['05111000'],
    'H': ['03241001'],
    'L': ['14713000'],
    'N': ['09564000'],
    'HB': ['04011000'],
    'DO': ['05913000'],
    'E': ['05113000'],
    'DD': ['14612000'],
    'KI': ['01002000'],
    'A': ['09761000'],
  },
  features: {
    '11000000': { name: 'Berlin', ars: '11000000000000', kfzCodes: ['B'], center: [13.405, 52.52] },
    '02000000': { name: 'Hamburg', ars: '02000000000000', kfzCodes: ['HH'], center: [9.993, 53.551] },
    '09162000': { name: 'München', ars: '09162000000000', kfzCodes: ['M'], center: [11.576, 48.137] },
    '05315000': { name: 'Köln', ars: '05315000000000', kfzCodes: ['K'], center: [6.959, 50.938] },
    '06412000': { name: 'Frankfurt am Main', ars: '06412000000000', kfzCodes: ['F'], center: [8.682, 50.111] },
    '08111000': { name: 'Stuttgart', ars: '08111000000000', kfzCodes: ['S'], center: [9.183, 48.778] },
    '05111000': { name: 'Düsseldorf', ars: '05111000000000', kfzCodes: ['D'], center: [6.773, 51.227] },
    '03241001': { name: 'Hannover', ars: '03241001000000', kfzCodes: ['H'], center: [9.732, 52.375] },
    '14713000': { name: 'Leipzig', ars: '14713000000000', kfzCodes: ['L'], center: [12.373, 51.34] },
    '09564000': { name: 'Nürnberg', ars: '09564000000000', kfzCodes: ['N'], center: [11.078, 49.454] },
    '04011000': { name: 'Bremen', ars: '04011000000000', kfzCodes: ['HB'], center: [8.801, 53.079] },
    '05913000': { name: 'Dortmund', ars: '05913000000000', kfzCodes: ['DO'], center: [7.466, 51.514] },
    '05113000': { name: 'Essen', ars: '05113000000000', kfzCodes: ['E'], center: [7.011, 51.458] },
    '14612000': { name: 'Dresden', ars: '14612000000000', kfzCodes: ['DD'], center: [13.737, 51.05] },
    '01002000': { name: 'Kiel', ars: '01002000000000', kfzCodes: ['KI'], center: [10.139, 54.323] },
    '09761000': { name: 'Augsburg', ars: '09761000000000', kfzCodes: ['A'], center: [10.898, 48.371] },
  },
};
