import { useEffect, useState } from 'react'
import { ThemeCtx } from './themeContext.js'

export function ThemeProvider({ children }) {
  const [appDark, setAppDark] = useState(() => {
    const v = localStorage.getItem('attsoft.appDark')
    return v == null ? true : v === '1'
  })
  const [landingDark, setLandingDark] = useState(() => {
    const v = localStorage.getItem('attsoft.landingDark')
    return v == null ? false : v === '1'
  })

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
