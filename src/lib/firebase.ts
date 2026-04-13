import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDhjOecioHObzsMfgX0suEX1IRraMcj0hU",
  authDomain: "cube-coin-mining-simulator.firebaseapp.com",
  projectId: "cube-coin-mining-simulator",
  storageBucket: "cube-coin-mining-simulator.firebasestorage.app",
  messagingSenderId: "501436679250",
  appId: "1:501436679250:web:f8dd3a335bea4509b6cb8b",
  measurementId: "G-P35KELVNR0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged };
