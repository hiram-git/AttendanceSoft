import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeCtx } from './themeContext.ts'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appDark, setAppDark] = useState<boolean>(true)
  const [landingDark, setLandingDark] = useState<boolean>(false)

  useEffect(() => {
    const a = localStorage.getItem('attsoft.appDark')
    if (a != null) setAppDark(a === '1')
    const l = localStorage.getItem('attsoft.landingDark')
    if (l != null) setLandingDark(l === '1')
  }, [])

  useEffect(() => {
    localStorage.setItem('attsoft.appDark', appDark ? '1' : '0')
  }, [appDark])
  useEffect(() => {
    localStorage.setItem('attsoft.landingDark', landingDark ? '1' : '0')
  }, [landingDark])

  return (
    <ThemeCtx.Provider
      value={{
        appDark,
        landingDark,
        toggleApp: () => setAppDark((v) => !v),
        toggleLanding: () => setLandingDark((v) => !v),
      }}
    >
      {children}
    </ThemeCtx.Provider>
  )
}
