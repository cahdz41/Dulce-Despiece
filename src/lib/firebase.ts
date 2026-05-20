import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAZK651e2tZhenVzlNn-B0SfWyrdrBqeBY',
  authDomain: 'despiece-dulce.firebaseapp.com',
  projectId: 'despiece-dulce',
  storageBucket: 'despiece-dulce.firebasestorage.app',
  messagingSenderId: '116845713878',
  appId: '1:116845713878:web:ffc9834c837cb9f9acac77',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
