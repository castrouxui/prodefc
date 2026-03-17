import {
  POINTS_EXACT_SCORE,
  POINTS_CORRECT_WINNER_AND_DIFF,
  POINTS_CORRECT_WINNER,
  POINTS_WRONG,
} from '@/config'

/**
 * Calcula los puntos de un pronóstico contra el resultado real.
 *
 * @param {{ home_pred: number, away_pred: number }} prediction
 * @param {{ home_score: number, away_score: number }} result
 * @returns {number} 0 | 1 | 2 | 3
 *
 * Reglas:
 *   3 pts → resultado exacto
 *   2 pts → ganador correcto + diferencia de goles correcta
 *   1 pt  → solo ganador correcto (o empate correcto sin diferencia)
 *   0 pts → error total
 */
export function calculatePoints(prediction, result) {
  const { home_pred, away_pred } = prediction
  const { home_score, away_score } = result

  // Exacto
  if (home_pred === home_score && away_pred === away_score) return POINTS_EXACT_SCORE

  const predDiff = home_pred - away_pred
  const resDiff  = home_score - away_score
  const predSign = Math.sign(predDiff)
  const resSign  = Math.sign(resDiff)

  // Ganador correcto + diferencia correcta
  if (predSign === resSign && predDiff === resDiff) return POINTS_CORRECT_WINNER_AND_DIFF

  // Solo ganador correcto (incluye empate acertado con resultado no exacto — imposible, pero cubierto)
  if (predSign === resSign) return POINTS_CORRECT_WINNER

  return POINTS_WRONG
}

/**
 * Calcula el ranking de un grupo a partir de sus predictions.
 *
 * @param {Array<{ user_id: string, points: number, profiles: { username: string, avatar_url: string } }>} predictions
 * @returns {Array<{ user_id: string, username: string, avatar_url: string, total: number, position: number }>}
 */
export function calculateRanking(predictions) {
  const totals = {}

  for (const p of predictions) {
    if (!totals[p.user_id]) {
      totals[p.user_id] = {
        user_id:    p.user_id,
        username:   p.profiles?.username ?? 'Usuario',
        avatar_url: p.profiles?.avatar_url ?? null,
        total:      0,
      }
    }
    totals[p.user_id].total += p.points ?? 0
  }

  return Object.values(totals)
    .sort((a, b) => b.total - a.total)
    .map((entry, i) => ({ ...entry, position: i + 1 }))
}
