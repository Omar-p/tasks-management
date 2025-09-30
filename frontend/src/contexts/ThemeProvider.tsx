import {createContext, useContext, useEffect, useState} from 'react'
import {getItem, setItem} from '@/lib/localStorage'
import {createTheme, ThemeProvider as MuiThemeProvider} from '@mui/material/styles'
import {CssBaseline} from '@mui/material'

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeProviderState>({
  theme: 'system',
  setTheme: () => {
  },
})

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

// ✅ define your MUI themes once
const lightMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {main: '#001081'},   // Blue
    secondary: {main: '#1eed93'}, // Green
  },
})

const darkMuiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {main: '#1eed93'},   // Green pops
    secondary: {main: '#4c6ef5'}, // Softer blue
    background: {default: '#0b0f19', paper: '#141a29'},
  },
})

export function ThemeProvider({
                                children,
                                defaultTheme = 'system',
                                storageKey = 'tasks-management-theme',
                              }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
      getItem(storageKey) ?? defaultTheme,
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
      root.classList.add(systemTheme)
      setItem(storageKey, systemTheme)
      return
    }

    root.classList.add(theme)
    setItem(storageKey, theme)
  }, [theme, storageKey])

  // ✅ pick MUI theme based on your context
  const muiTheme =
      theme === 'dark' ? darkMuiTheme : theme === 'light' ? lightMuiTheme : lightMuiTheme

  return (
      <ThemeContext.Provider value={{theme, setTheme}}>
        <MuiThemeProvider theme={muiTheme}>
          <CssBaseline/>
          {children}
        </MuiThemeProvider>
      </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
