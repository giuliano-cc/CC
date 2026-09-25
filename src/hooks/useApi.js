import { useCallback, useEffect, useState } from 'react'

/**
 * Esegue una funzione asincrona (tipicamente una chiamata API) e ne traccia
 * gli stati di loading/error/data, in modo uniforme in tutta l'app.
 */
export function useApi(apiFn, deps = []) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiFn()
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    execute().catch(() => {})
  }, [execute])

  return { data, setData, isLoading, error, refetch: execute }
}
