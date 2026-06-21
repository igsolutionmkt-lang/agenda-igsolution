// Disponibilidade / geração de horários a partir dos working_hours dos funcionários.

export interface DayHours { active: boolean; start?: string; end?: string }
export type WorkingHours = Record<string, DayHours>

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  '0': { active: false },
  '1': { active: true, start: '09:00', end: '18:00' },
  '2': { active: true, start: '09:00', end: '18:00' },
  '3': { active: true, start: '09:00', end: '18:00' },
  '4': { active: true, start: '09:00', end: '18:00' },
  '5': { active: true, start: '09:00', end: '18:00' },
  '6': { active: false },
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fromMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/**
 * Gera os horários de início possíveis para um dia, em passos de `step` minutos,
 * garantindo que o serviço (duração) cabe antes do fim do expediente.
 */
export function generateSlots(wh: WorkingHours | null | undefined, dateStr: string, durationMin: number, step = 30): string[] {
  if (!wh) wh = DEFAULT_WORKING_HOURS
  const day = new Date(dateStr + 'T00:00:00').getDay()
  const d = wh[String(day)]
  if (!d || !d.active || !d.start || !d.end) return []
  const start = toMin(d.start)
  const end = toMin(d.end)
  const slots: string[] = []
  for (let t = start; t + durationMin <= end; t += step) {
    slots.push(fromMin(t))
  }
  return slots
}

/** União de slots de vários funcionários (para "sem preferência"). */
export function unionSlots(whList: (WorkingHours | null | undefined)[], dateStr: string, durationMin: number, step = 30): string[] {
  const set = new Set<string>()
  for (const wh of whList) generateSlots(wh, dateStr, durationMin, step).forEach(s => set.add(s))
  return [...set].sort()
}
