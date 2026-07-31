// firebase-config.js
// Acá va la configuración de TU proyecto de Firebase.
//
// Cómo conseguirla:
// 1. Entrá a https://console.firebase.google.com
// 2. Creá un proyecto nuevo (gratis).
// 3. Adentro del proyecto: ⚙️ (arriba a la izquierda) → "Configuración del proyecto".
// 4. Bajá hasta "Tus apps" → hacé clic en el ícono </> (Web) para agregar una app web.
// 5. Le ponés un nombre (ej: "aztech-web") y Firebase te muestra un objeto
//    firebaseConfig como el de abajo. Copiá esos valores acá.
// 6. Andá a "Firestore Database" en el menú de la izquierda → "Crear base de datos"
//    → elegí modo "producción" y la región más cercana (southamerica-east1).
// 7. En la pestaña "Reglas" de Firestore, pegá las reglas que te paso en las
//    instrucciones (permiten que cualquiera escriba una reseña, pero solo
//    se lean las que vos aprobaste).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQy1d71UIak8qXnp2zusgCPuEFfLyG-Xk",
  authDomain: "az-tech-c437f.firebaseapp.com",
  projectId: "az-tech-c437f",
  storageBucket: "az-tech-c437f.firebasestorage.app",
  messagingSenderId: "T163782263549",
  appId: "1:163782263549:web:9c877f3fbdffe9fb77b494"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

