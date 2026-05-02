import { Fragment } from 'react'
import { useTheme } from '../lib/useTheme.ts'
import { NavIcon } from './icons.tsx'

interface Props {
  here?: string
  crumbPath?: ReadonlyArray<string>
}

export function Topbar({ here = 'Inicio', crumbPath = ['Operación', 'Inicio'] }: Props) {
  const { appDark, toggleApp } = useTheme()
  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbPath.slice(0, -1).map((c, i) => (
          <Fragment key={i}>
            <span>{c}</span>
            <span className="sep">/</span>
          </Fragment>
        ))}
        <span className="here">{here}</span>
      </div>
      <div className="topbar-spacer" />
      <div className="search">
        {NavIcon.search}
        Buscar clientes, citas, servicios…
        <kbd>⌘K</kbd>
      </div>
      <button className="icon-btn" onClick={toggleApp} aria-label="Cambiar tema">
        {appDark ? NavIcon.sun : NavIcon.moon}
      </button>
      <button className="icon-btn" aria-label="Notificaciones">{NavIcon.bell}</button>
      <button className="btn-grad">{NavIcon.plus} Nueva cita</button>
    </header>
  )
}
