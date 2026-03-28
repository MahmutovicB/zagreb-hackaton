'use client'

import { createContext, useContext } from 'react'

export type Lang = 'hr' | 'en'
export const LangContext = createContext<Lang>('hr')
export const useLang = () => useContext(LangContext)
