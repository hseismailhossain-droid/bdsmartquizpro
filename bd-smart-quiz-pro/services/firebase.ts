
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager, terminate, clearIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCl3bpXS6rfxbbacSa8tkPGLpWrZhl03U8",
  authDomain: "smart-quiz-pro-8e2e7.firebaseapp.com",
  projectId: "smart-quiz-pro-8e2e7",
  storageBucket: "smart-quiz-pro-8e2e7.firebasestorage.app",
  messagingSenderId: "942324280346",
  appId: "1:942324280346:web:3b9b8869b85bc85e68b5a3",
  measurementId: "G-8NNSWK1YZG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager()
    })
  });
} catch (e) {
  console.warn("Firestore persistence failed, falling back to basic setup", e);
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

export const refreshFirestore = async () => {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
    window.location.reload();
  } catch (e) {
    window.location.reload();
  }
};

export default app;
