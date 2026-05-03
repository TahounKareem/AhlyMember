import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSfCfIvIThNQ7sH5ngUYjXAygD6Ph2zeQ",
  authDomain: "ahly-member.firebaseapp.com",
  projectId: "ahly-member",
  storageBucket: "ahly-member.appspot.com",
  messagingSenderId: "652654981170",
  appId: "1:652654981170:web:d7ab333e913e8fdaca8c2b",
  measurementId: "G-K2W79Z03XE"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
