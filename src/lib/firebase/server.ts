import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY

// Clean up any escaped newline characters in private keys
const formattedPrivateKey = privateKey ? privateKey.replace(/\\n/g, '\n') : undefined

let appInstance: any = null

function getAdminApp() {
  if (appInstance) return appInstance
  if (getApps().length > 0) {
    appInstance = getApp()
    return appInstance
  }

  if (projectId && clientEmail && formattedPrivateKey) {
    appInstance = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    })
    return appInstance
  }

  // During compilation/build phase when env vars are missing, we initialize with a minimal config
  // to prevent errors at initialization time. Real database calls will only happen at runtime.
  appInstance = initializeApp({
    projectId: projectId || 'dummy-project-id',
  })
  return appInstance
}

// Export adminDb and adminAuth as Proxies to lazy-load them on first method access.
// This prevents Next.js compilation/build phase errors when environment variables are missing.
export const adminDb: ReturnType<typeof getFirestore> = new Proxy({} as any, {
  get(target, prop) {
    const app = getAdminApp()
    const db = getFirestore(app)
    const val = (db as any)[prop]
    if (typeof val === 'function') {
      return val.bind(db)
    }
    return val
  },
})

export const adminAuth: ReturnType<typeof getAuth> = new Proxy({} as any, {
  get(target, prop) {
    const app = getAdminApp()
    const auth = getAuth(app)
    const val = (auth as any)[prop]
    if (typeof val === 'function') {
      return val.bind(auth)
    }
    return val
  },
})

export function getFirebaseAdminApp() {
  return getAdminApp()
}
