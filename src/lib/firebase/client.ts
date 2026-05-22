import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy-auth-domain',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy-storage-bucket',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'dummy-sender-id',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'dummy-app-id',
}

let appInstance: any = null
let authInstance: any = null

function getClientAuth() {
  if (authInstance) return authInstance
  if (!appInstance) {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  }
  authInstance = getAuth(appInstance)
  return authInstance
}

export const auth: ReturnType<typeof getAuth> = new Proxy({} as any, {
  get(target, prop) {
    const clientAuth = getClientAuth()
    const val = (clientAuth as any)[prop]
    if (typeof val === 'function') {
      return val.bind(clientAuth)
    }
    return val
  },
})

export function getFirebaseApp() {
  if (!appInstance) {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  }
  return appInstance
}
