import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDUvGkDAhZmff2eiykdOdk9UOAmX8vPkpw",
  authDomain: "trashinova-portfolio.firebaseapp.com",
  projectId: "trashinova-portfolio",
  storageBucket: "trashinova-portfolio.appspot.com",
  messagingSenderId: "115063387557",
  appId: "1:115063387557:web:739422bf1989e1969ce44c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);