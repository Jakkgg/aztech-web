// resenas.js
// Guarda reseñas nuevas en Firestore y muestra las que ya fueron aprobadas.
// Requiere que firebase-config.js se haya cargado antes (ver index.html).

import { db } from './firebase-config.js';
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const grid = document.getElementById('resenas-grid');
const form = document.getElementById('resena-form');
const starsWrap = document.getElementById('rf-stars');
const fotoInput = document.getElementById('resena-foto');
const preview = document.getElementById('rf-preview');

let puntaje = 0;
let fotoBase64 = '';

// ---------- Estrellas ----------
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

// ---------- Preview + achicado de la foto ----------
// Firestore no guarda archivos, así que la foto se guarda como texto (base64)
// dentro del mismo documento. Por eso la achicamos antes: si no, un documento
// puede superar el límite de 1MB que permite Firestore por documento.
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

// ---------- Envío del formulario ----------
if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

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
        aprobada: false, // se publica recién cuando vos la apruebes desde Firebase
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

// ---------- Carga de reseñas aprobadas ----------
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
