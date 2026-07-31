// resenas.js
// Login/registro + guardado y visualización de reseñas usando Firebase.

import { db, auth } from './firebase-config.js';
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const grid = document.getElementById('resenas-grid');
const form = document.getElementById('resena-form');
const starsWrap = document.getElementById('rf-stars');
const fotoInput = document.getElementById('resena-foto');
const preview = document.getElementById('rf-preview');

let puntaje = 0;
let fotoBase64 = '';

/* ==================== AUTH: nav, modal, login/registro ==================== */

const authArea = document.getElementById('auth-area');
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authUsername = document.getElementById('auth-username');
const authEmail = document.getElementById('auth-email');
const authPass = document.getElementById('auth-pass');
const authError = document.getElementById('auth-error');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authModalMsg = document.getElementById('auth-modal-msg');
const authModalTitle = document.getElementById('auth-modal-title');
const authTabs = document.querySelectorAll('.modal-tab');
const authModalClose = document.getElementById('auth-modal-close');

let authMode = 'login';

function actualizarModoModal() {
  authTabs.forEach(function (t) { t.classList.toggle('active', t.dataset.mode === authMode); });
  const esLogin = authMode === 'login';
  authModalTitle.textContent = esLogin ? 'Iniciar sesión' : 'Crear cuenta';
  authSubmitBtn.textContent = esLogin ? 'Iniciar sesión' : 'Crear cuenta';
  authPass.setAttribute('autocomplete', esLogin ? 'current-password' : 'new-password');
}

function abrirAuthModal(mode, mensaje) {
  authMode = mode || 'login';
  actualizarModoModal();
  if (mensaje) {
    authModalMsg.textContent = mensaje;
    authModalMsg.style.display = 'block';
  } else {
    authModalMsg.style.display = 'none';
  }
  authError.style.display = 'none';
  authModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cerrarAuthModal() {
  authModal.classList.remove('open');
  document.body.style.overflow = '';
}

if (authTabs.length) {
  authTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      authMode = tab.dataset.mode;
      actualizarModoModal();
    });
  });
}

if (authModalClose) authModalClose.addEventListener('click', cerrarAuthModal);
if (authModal) {
  authModal.addEventListener('click', function (e) {
    if (e.target === authModal) cerrarAuthModal();
  });
}
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && authModal && authModal.classList.contains('open')) cerrarAuthModal();
});

function traducirErrorAuth(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'Ese email ya está registrado. Probá iniciar sesión.';
    case 'auth/invalid-email': return 'El email no es válido.';
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/wrong-password': return 'Contraseña incorrecta.';
    case 'auth/user-not-found': return 'No existe una cuenta con ese email.';
    case 'auth/invalid-credential': return 'Email o contraseña incorrectos.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Probá de nuevo en un rato.';
    default: return 'Ocurrió un error. Probá de nuevo.';
  }
}

if (authForm) {
  authForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    authError.style.display = 'none';
    authSubmitBtn.disabled = true;

    const email = authEmail.value.trim();
    const pass = authPass.value;

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);

        // Le ponemos el nombre de usuario elegido en el form de registro.
        // Sin esto, Firebase deja displayName en null.
        const nombreElegido = authUsername ? authUsername.value.trim() : '';
        if (nombreElegido) {
          await updateProfile(cred.user, { displayName: nombreElegido });
        }

        // onAuthStateChanged ya se disparó antes de que termine el updateProfile,
        // así que forzamos un repintado con el nombre ya actualizado.
        pintarAuthArea(auth.currentUser);
      }
      cerrarAuthModal();
      authForm.reset();
    } catch (err) {
      authError.textContent = traducirErrorAuth(err.code);
      authError.style.display = 'block';
    } finally {
      authSubmitBtn.disabled = false;
    }
  });
}

function pintarAuthArea(user) {
  if (!authArea) return;

  if (user) {
    console.log(auth.currentUser);
    const nombreCorto = user.displayName || user.email.split('@')[0];
    authArea.innerHTML =
      '<span class="auth-hello">Hola, ' + nombreCorto + '</span>' +
      '<button type="button" class="nav-cta auth-logout" id="btn-logout-nav">Cerrar sesión</button>';
    document.getElementById('btn-logout-nav').addEventListener('click', function () {
      signOut(auth);
    });
  } else {
    authArea.innerHTML =
      '<button type="button" class="nav-cta" id="btn-login-nav">Iniciar sesión</button>' +
      '<button type="button" class="nav-cta auth-register" id="btn-register-nav">Registrarse</button>';
    document.getElementById('btn-login-nav').addEventListener('click', function () { abrirAuthModal('login'); });
    document.getElementById('btn-register-nav').addEventListener('click', function () { abrirAuthModal('registro'); });
  }
}

onAuthStateChanged(auth, function (user) {
  pintarAuthArea(user);
});

/* ==================== RESEÑAS: estrellas, foto, envío, listado ==================== */

if (starsWrap) {
  starsWrap.addEventListener('click', function (e) {
    const btn = e.target.closest('.rf-star');
    if (!btn) return;
    puntaje = parseInt(btn.dataset.val, 10);
    Array.from(starsWrap.children).forEach(function (star) {
      star.classList.toggle('on', parseInt(star.dataset.val, 10) <= puntaje);
    });
  });
}

// Achico la foto antes de guardarla como base64 (Firestore tiene límite de 1MB por documento).
if (fotoInput) {
  fotoInput.addEventListener('change', function () {
    const file = fotoInput.files[0];
    preview.innerHTML = '';
    fotoBase64 = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (ev) {
      const img = new Image();
      img.onload = function () {
        const maxSize = 500;
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
        else if (h >= w && h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }

        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        fotoBase64 = canvas.toDataURL('image/jpeg', 0.7);

        const p = document.createElement('img');
        p.src = fotoBase64;
        preview.appendChild(p);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!auth.currentUser) {
      abrirAuthModal('login', 'Iniciá sesión o registrate para poder publicar tu reseña.');
      return;
    }

    const nombre = document.getElementById('resena-nombre').value.trim();
    const equipo = document.getElementById('resena-equipo').value.trim();
    const texto = document.getElementById('resena-texto').value.trim();

    if (!nombre || !texto || puntaje === 0) {
      alert('Completá tu nombre, la reseña y elegí un puntaje de estrellas.');
      return;
    }

    const submitBtn = form.querySelector('.rf-submit');
    const textoOriginal = submitBtn.textContent;
    submitBtn.textContent = 'Guardando...';
    submitBtn.disabled = true;

    try {
      await addDoc(collection(db, 'resenas'), {
        nombre: nombre,
        equipo: equipo || null,
        texto: texto,
        puntaje: puntaje,
        foto: fotoBase64 || null,

        autorUid: auth.currentUser.uid,
        autorEmail: auth.currentUser.email,

        aprobada: false, // Se publica cuando la apruebes
        creada: serverTimestamp()
      });

      form.reset();
      preview.innerHTML = '';
      fotoBase64 = '';
      puntaje = 0;
      Array.from(starsWrap.children).forEach(function (star) { star.classList.remove('on'); });

      alert('¡Gracias! Tu reseña quedó guardada y se va a publicar apenas la revise.');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar tu reseña. Probá de nuevo en un rato.');
    } finally {
      submitBtn.textContent = textoOriginal;
      submitBtn.disabled = false;
    }
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function cargarResenas() {
  if (!grid) return;

  try {
    const q = query(
      collection(db, 'resenas'),
      where('aprobada', '==', true),
      orderBy('creada', 'desc')
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = '<p class="resenas-empty">Todavía no hay reseñas publicadas. ¡Sé el primero en dejar la tuya!</p>';
      return;
    }

    grid.innerHTML = '';
    snap.forEach(function (docSnap) {
      const r = docSnap.data();
      const card = document.createElement('div');
      card.className = 'resena-card';

      const estrellas = Array.from({ length: 5 }, function (_, i) {
        return '<span class="' + (i < r.puntaje ? 'on' : '') + '">★</span>';
      }).join('');

      card.innerHTML =
        '<div class="rc-top">' +
          '<span class="rc-name">' + escapeHTML(r.nombre) + (r.equipo ? ' · ' + escapeHTML(r.equipo) : '') + '</span>' +
          '<span class="rc-stars">' + estrellas + '</span>' +
        '</div>' +
        '<p class="rc-text">' + escapeHTML(r.texto) + '</p>' +
        (r.foto ? '<img class="rc-photo" src="' + r.foto + '" alt="Foto de ' + escapeHTML(r.nombre) + '">' : '');

      const fotoEl = card.querySelector('.rc-photo');
      if (fotoEl) {
        fotoEl.addEventListener('click', function () {
          const lightbox = document.getElementById('lightbox');
          const lightboxImg = document.getElementById('lightbox-img');
          if (lightbox && lightboxImg) {
            lightboxImg.src = r.foto;
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
          }
        });
      }

      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="resenas-empty">No se pudieron cargar las reseñas ahora. Probá recargar la página.</p>';
  }
}

cargarResenas();
