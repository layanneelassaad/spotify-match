import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "KEY",
  authDomain: "domain",
  projectId: "ID",
  storageBucket: "ID",
  messagingSenderId: "ID",
  appId: "ID",
};

const app = initializeApp(firebaseConfig);
export default app;
