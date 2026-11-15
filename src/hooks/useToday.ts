import { type Day, todayLocal } from '@shared/task-model'
import { useEffect, useState } from 'react'

/** The local calendar date, re-checked every minute so smart lists roll over at midnight. */
const useToday = (): Day => {
  const [today, setToday] = useState(todayLocal)
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayLocal()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return today
}

export { useToday }
