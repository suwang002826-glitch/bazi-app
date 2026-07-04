export interface CoreInput {
  solar_time: string
  longitude: number
  latitude: number
  use_dst: boolean
  use_true_solar: boolean
}

export interface CorePillar {
  text: string
  stem: string
  branch: string
  stem_ten_god: string
  hidden_stems: string[]
  hidden_ten_gods: string[]
  nayin: string
  kong_wang: string[]
}

export interface CoreResult {
  year: string
  month: string
  day: string
  hour: string
  pillars: Record<'year' | 'month' | 'day' | 'hour', CorePillar>
  hidden_stems: Record<'year' | 'month' | 'day' | 'hour', string[]>
  ten_gods: {
    stems: Record<'year' | 'month' | 'day' | 'hour', string>
    hidden: Record<'year' | 'month' | 'day' | 'hour', string[]>
  }
  nayin: Record<'year' | 'month' | 'day' | 'hour', string>
  kong_wang: Record<'year' | 'month' | 'day' | 'hour', string[]>
  meta: {
    adjusted_time: string
  }
}

export function calculateBaZi(input: CoreInput): CoreResult
