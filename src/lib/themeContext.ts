import { createContext } from 'react'

export interface ThemeCtxValue {
  appDark: boolean
  landingDark: boolean
  toggleApp: () => void
  toggleLanding: () => void
}

export const ThemeCtx = createContext<ThemeCtxValue | null>(null)
