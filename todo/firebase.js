import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgDid46DzO8THU3A83uIridgGpgRMu-sY",
  authDomain: "sj-to-do-backend.firebaseapp.com",
  projectId: "sj-to-do-backend",
  storageBucket: "sj-to-do-backend.firebasestorage.app",
  messagingSenderId: "879827976528",
  appId: "1:879827976528:web:7fa5c75dc039c5bdc32c55",
  databaseURL: "https://sj-to-do-backend-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db };
