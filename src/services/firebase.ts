import { type FirebaseApp, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  type DatabaseReference,
  type DataSnapshot,
  child as dbChild,
  push as dbPush,
  ref as dbRef,
  update as dbUpdate,
  getDatabase,
  onValue,
  type Unsubscribe,
} from 'firebase/database'

const config = {
  apiKey: 'AIzaSyAdqcW0V8x6bJVmPr4TY6cdh77rt3FV1oY',
  authDomain: 'wundertodo-app.firebaseapp.com',
  databaseURL: 'https://wundertodo-app.firebaseio.com',
  projectId: 'wundertodo-app',
  storageBucket: 'wundertodo-app.appspot.com',
  messagingSenderId: '1060019824315',
  appId: '1:1060019824315:web:c2b8543673a0124731ab9e',
  measurementId: 'G-D21ESB91W5',
}

const app: FirebaseApp = initializeApp(config)
const db = getDatabase(app)
const auth = getAuth(app)

type ChildRefShim = {
  on: (event: 'value', callback: (snapshot: DataSnapshot) => void) => Unsubscribe
  push: (value: unknown) => Promise<DatabaseReference>
}

type DatabaseRefShim = {
  child: (path: string) => ChildRefShim
  update: (updates: Record<string, unknown>) => Promise<void>
}

export const databaseRef: DatabaseRefShim = {
  child: (path: string): ChildRefShim => {
    const nodeRef = dbChild(dbRef(db), path)
    return {
      on: (_event, callback) => onValue(nodeRef, callback),
      push: async (value: unknown) => dbPush(nodeRef, value),
    }
  },
  update: (updates: Record<string, unknown>) => dbUpdate(dbRef(db), updates),
}

export { app, auth }
