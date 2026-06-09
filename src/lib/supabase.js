// ============================================================
// BoutiKonect Supabase Client
// ============================================================

import { createClient } from '@supabase/supabase-js'

// -------------------------------------------------------------------
// Validate environment variables and provide helpful error messages
// -------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const missingVars = []
if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY')

let supabase

if (missingVars.length > 0) {
  const msg =
    'Supabase client cannot be initialized. Missing environment variable(s): ' +
    missingVars.join(', ') +
    '. Create a .env file in the project root and add:\n' +
    'VITE_SUPABASE_URL=your_supabase_project_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key'

  console.error(msg)

  const stubHandler = {
    get(_, prop) {
      return () => {
        throw new Error(
          `Supabase client not available (missing ${missingVars.join(', ')}). ` +
            `Called method/property: "${prop}". ${msg}`
        )
      }
    },
  }

  supabase = new Proxy({}, stubHandler)
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'bk-auth-token',
      flowType: 'implicit',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-application-name': 'boutikonect',
      },
    },
  })

  console.info('Supabase client initialized successfully for project:', supabaseUrl)
}

export { supabase }

// -------------------------------------------------------------------
// Helper: get the authenticated user (returns null if not logged in)
// -------------------------------------------------------------------
export async function getCurrentUser() {
  if (!supabaseUrl) return null
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// -------------------------------------------------------------------
// Helper: get the current session
// -------------------------------------------------------------------
export async function getCurrentSession() {
  if (!supabaseUrl) return null
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session) return null
  return session
}

// -------------------------------------------------------------------
// Helper: sign out and clear any persisted session data
// -------------------------------------------------------------------
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Sign out error:', error.message)
    throw error
  }
}

// -------------------------------------------------------------------
// Helper: refresh the session token
// -------------------------------------------------------------------
export async function refreshSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Session refresh error:', error.message)
      return null
    }
    return session
  } catch {
    return null
  }
}

export default supabase
