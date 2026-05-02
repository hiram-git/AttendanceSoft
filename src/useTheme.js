import { useContext } from 'react'
import { ThemeCtx } from './themeContext.js'

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme outside ThemeProvider')
  return ctx
}
