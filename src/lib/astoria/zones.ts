import type { HeartRateZoneKey, HeartRateZonesDisplay, HeartRateZonesData } from '@/types/astoria'

export interface HeartRateZoneDefinition {
  key: HeartRateZoneKey
  label: string
  name: string
  subtitle: string
  intensity: string
  heartRate: string
  description: string
  barClass: string
  dotClass: string
}

export const HEART_RATE_ZONE_DEFINITIONS: HeartRateZoneDefinition[] = [
  {
    key: 'zone0',
    label: 'Zone 0',
    name: 'Very Light',
    subtitle: 'Recovery / Warm-up',
    intensity: '0–50% effort',
    heartRate: 'Up to 95 bpm',
    description: 'Easy movement, stretching, walking. Minimal cardiovascular load.',
    barClass: 'bg-gray-600',
    dotClass: 'bg-gray-600',
  },
  {
    key: 'zone1',
    label: 'Zone 1',
    name: 'Light',
    subtitle: 'Aerobic base',
    intensity: '50–60% effort',
    heartRate: '95–114 bpm',
    description: 'Comfortable pace with steady breathing. Ideal for recovery runs or long endurance work.',
    barClass: 'bg-blue-400',
    dotClass: 'bg-blue-400',
  },
  {
    key: 'zone2',
    label: 'Zone 2',
    name: 'Moderate',
    subtitle: 'Aerobic endurance',
    intensity: '60–70% effort',
    heartRate: '114–133 bpm',
    description: 'Sustainable pace that builds aerobic capacity and efficient fat utilisation.',
    barClass: 'bg-green-400',
    dotClass: 'bg-green-400',
  },
  {
    key: 'zone3',
    label: 'Zone 3',
    name: 'Hard',
    subtitle: 'Threshold / Tempo',
    intensity: '70–80% effort',
    heartRate: '133–152 bpm',
    description: 'Challenging but repeatable efforts that improve efficiency and stamina.',
    barClass: 'bg-yellow-400',
    dotClass: 'bg-yellow-400',
  },
  {
    key: 'zone4',
    label: 'Zone 4',
    name: 'Very Hard',
    subtitle: 'Anaerobic',
    intensity: '80–90% effort',
    heartRate: '152–171 bpm',
    description: 'High exertion intervals that build power, lactate tolerance, and VO₂ max.',
    barClass: 'bg-orange-400',
    dotClass: 'bg-orange-400',
  },
  {
    key: 'zone5',
    label: 'Zone 5',
    name: 'Maximum Effort',
    subtitle: 'Sprint / Max HR',
    intensity: '90–100% effort',
    heartRate: '171–190 bpm',
    description: 'Peak intensity sprints and finishing kicks. Reserved for short, maximal bursts.',
    barClass: 'bg-red-500',
    dotClass: 'bg-red-500',
  },
]

const ZONE_ALIASES: Record<HeartRateZoneKey, string[]> = {
  zone0: ['zone0_seconds', 'rest_seconds', 'zone0', 'rest'],
  zone1: ['zone1_seconds', 'light_seconds', 'zone1', 'light'],
  zone2: ['zone2_seconds', 'moderate_seconds', 'zone2', 'moderate'],
  zone3: ['zone3_seconds', 'hard_seconds', 'zone3', 'hard'],
  zone4: ['zone4_seconds', 'peak_seconds', 'zone4', 'peak'],
  zone5: ['zone5_seconds', 'max_seconds', 'zone5', 'max'],
}

const NORMALISE_VALUE = (value: number, key: string) => {
  if (Number.isNaN(value) || value <= 0) return 0
  // Values with `_seconds` are already expressed in seconds. Everything else is minutes.
  return key.endsWith('_seconds') ? value : value * 60
}

export function extractZoneDurations(zones?: HeartRateZonesData | null): HeartRateZonesDisplay {
  const result = HEART_RATE_ZONE_DEFINITIONS.reduce((acc, zone) => {
    acc[zone.key] = 0
    return acc
  }, {} as HeartRateZonesDisplay)

  if (!zones) {
    return result
  }

  for (const zone of HEART_RATE_ZONE_DEFINITIONS) {
    const aliases = ZONE_ALIASES[zone.key]
    let total = 0
    for (const alias of aliases) {
      const raw = (zones as Record<string, number | undefined>)[alias]
      if (raw == null) continue
      total += NORMALISE_VALUE(raw, alias)
    }
    result[zone.key] = total
  }

  return result
}

export function aggregateZoneDurations(runs: { heart_rate_zones?: HeartRateZonesData | null }[]): HeartRateZonesDisplay {
  const aggregate = HEART_RATE_ZONE_DEFINITIONS.reduce((acc, zone) => {
    acc[zone.key] = 0
    return acc
  }, {} as HeartRateZonesDisplay)

  for (const run of runs) {
    const durations = extractZoneDurations(run.heart_rate_zones)
    for (const zone of HEART_RATE_ZONE_DEFINITIONS) {
      aggregate[zone.key] += durations[zone.key]
    }
  }

  return aggregate
}
