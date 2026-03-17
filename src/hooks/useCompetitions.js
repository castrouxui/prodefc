import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { UCL_LOGO_URL, WC2026_LOGO_URL } from '@/config'

// Fallback estático si la tabla competitions aún no existe en producción
const FALLBACK_COMPETITIONS = [
  {
    key:      'UCL',
    name:     'UEFA Champions League',
    logo_url: UCL_LOGO_URL,
    season:   '2024/25',
    status:   'active',
    api_id:   2,
  },
  {
    key:      'WC2026',
    name:     'FIFA World Cup 2026',
    logo_url: WC2026_LOGO_URL,
    season:   '2026',
    status:   'coming_soon',
    api_id:   1,
  },
]

export function useCompetitions() {
  return useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: true })

      // Si la tabla todavía no existe usamos el fallback
      if (error) return FALLBACK_COMPETITIONS
      return data?.length ? data : FALLBACK_COMPETITIONS
    },
    staleTime: 1000 * 60 * 60, // 1 hora — competencias raramente cambian
  })
}

/** Devuelve la competencia activa (status = 'active') */
export function useActiveCompetition() {
  const { data: competitions = [] } = useCompetitions()
  return competitions.find(c => c.status === 'active') ?? FALLBACK_COMPETITIONS[0]
}

/** Devuelve las competencias con status = 'coming_soon' */
export function useComingSoonCompetitions() {
  const { data: competitions = [] } = useCompetitions()
  return competitions.filter(c => c.status === 'coming_soon')
}
