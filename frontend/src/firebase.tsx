import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const FIREBASE_CREDENTIALS = {
  apiKey: 'AIzaSyCp5jzdQHCYXUC4hdkSH5humduGbHVLey8',
  authDomain: 'virtual-meet-rtc.firebaseapp.com',
  projectId: 'virtual-meet-rtc',
  storageBucket: 'virtual-meet-rtc.appspot.com',
  messagingSenderId: '134930753150',
  appId: '1:134930753150:web:f2c895c73a1d233ec4da2f',
  measurementId: 'G-75RBG6BECP',
};

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CREDENTIALS);
}
export const firestore = firebase.firestore();
