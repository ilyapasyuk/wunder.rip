import firebase from 'firebase'
import 'firebase/database'

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

firebase.initializeApp(config)
firebase.analytics()
export const databaseRef = firebase.database().ref()
export default firebase
