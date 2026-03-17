import { LOCALE } from '@/config'

/**
 * Formatea una fecha ISO a string legible en español.
 * Ej: "Mié 9 abr · 21:00"
 */
export function formatMatchDate(isoString) {
  const date = new Date(isoString)
  const day  = date.toLocaleDateString(LOCALE, { weekday: 'short' })
  const num  = date.getDate()
  const mon  = date.toLocaleDateString(LOCALE, { month: 'short' })
  const time = date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
  return `${capitalize(day)} ${num} ${mon} · ${time}`
}

/**
 * Devuelve true si el partido ya empezó (no se puede pronosticar).
 */
export function isMatchLocked(isoString) {
  return new Date(isoString) <= new Date()
}

/**
 * Devuelve la etiqueta de estado del partido.
 */
export function matchStatusLabel(status) {
  const labels = {
    scheduled: 'Próximo',
    live:      'En vivo',
    finished:  'Final',
  }
  return labels[status] ?? status
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
