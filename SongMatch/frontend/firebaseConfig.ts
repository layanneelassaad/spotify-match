// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyB65cDS-XalPUooJ6iadmK1ZElJAeHqnWY",
  authDomain: "songmatcher-85e83.firebaseapp.com",
  projectId: "songmatcher-85e83",
  storageBucket: "songmatcher-85e83.appspot.com",
  messagingSenderId: "954324188385",
  appId: "1:954324188385:web:731bb1e4c7c0cdd5204ba0",
};

const app = initializeApp(firebaseConfig);
export default app;
