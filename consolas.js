/* =====================================================================
   CONSOLAS EN VENTA
   Para agregar una consola copiá un bloque { ... } y cambiá los datos.
   Fotos: poné una lista en "fotos" (la primera es la portada), o usá
   "carpeta" + "cantidad" y se buscan fotos/consolas/<carpeta>/1.jpeg, 2.jpeg...
   Los dos de abajo son EJEMPLOS: reemplazalos por tus consolas reales.
   ===================================================================== */
var CONSOLAS = [
  {
    nombre: 'PlayStation 4 Slim 500GB',
    precio: '$250.000',
    estado: 'Usada · Excelente',
    fotos: [
      'fotos/consolas/ps4-slim/1.jpeg',
      'fotos/consolas/ps4-slim/2.jpeg',
      'fotos/consolas/ps4-slim/3.jpeg'
    ],
    descripcion: 'PS4 Slim revisada por dentro, con limpieza completa y pasta térmica nueva. Funciona perfecto y lista para jugar.',
    caracteristicas: ['Liberada con GoldHEN', 'Limpieza interna y pasta térmica nueva', 'Lectora funcionando perfecto'],
    especificaciones: [['Modelo', 'CUH-2215A'], ['Almacenamiento', '500 GB'], ['Salida de video', 'HDMI 1080p'], ['Firmware', '9.00']],
    detalles: ['Incluye 1 joystick, cable HDMI y cable de poder', 'Pequeñas marcas de uso en la carcasa'],
    vendida: false
  },
  {
    nombre: 'PlayStation 3 Super Slim 250GB',
    precio: '$180.000',
    estado: 'Usada · Muy buena',
    carpeta: 'ps3-superslim',
    cantidad: 4,
    descripcion: 'PS3 Super Slim con CFW y juegos cargados a pedido.',
    caracteristicas: ['CFW instalado', 'MultiMAN, webMAN MOD, IRISMAN y Apollo', 'Mantenimiento hecho'],
    especificaciones: [['Modelo', 'CECH-4001'], ['Almacenamiento', '250 GB']],
    detalles: ['Incluye joystick y cables'],
    vendida: false
  }
];

(function(){
  var grid = document.getElementById('tienda-grid');
  if(!grid) return;

  var WA = 'https://wa.me/5492964574506?text=';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function fotosDe(c){
    if(c.fotos && c.fotos.length) return c.fotos;
    var a = [];
    for(var i = 1; i <= (c.cantidad || 1); i++) a.push('fotos/consolas/' + c.carpeta + '/' + i + '.jpeg');
    return a;
  }
  function lista(titulo, items){
    if(!items || !items.length) return '';
    return '<div class="tm-sec"><h4>' + titulo + '</h4><ul>' +
      items.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
  }
  function specs(items){
    if(!items || !items.length) return '';
    return '<div class="tm-sec"><h4>⚙️ Especificaciones</h4>' +
      items.map(function(p){ return '<div class="tm-spec"><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></div>'; }).join('') + '</div>';
  }

  /* ---------- Grilla ---------- */
  if(!CONSOLAS.length){
    grid.innerHTML = '<p class="tienda-empty">Por ahora no hay consolas en venta. Escribime por WhatsApp y te aviso cuando entre alguna.</p>';
    return;
  }
  grid.innerHTML = CONSOLAS.map(function(c, i){
    var f = fotosDe(c);
    return '<button type="button" class="tc" data-i="' + i + '">' +
      '<span class="tc-img"><img src="' + esc(f[0]) + '" alt="' + esc(c.nombre) + '" loading="lazy" onerror="this.style.opacity=0">' +
      (f.length > 1 ? '<span class="tc-multi">▣ ' + f.length + '</span>' : '') +
      (c.vendida ? '<span class="tc-sold">Vendida</span>' : '') + '</span>' +
      '<span class="tc-info"><span class="tc-name">' + esc(c.nombre) + '</span><span class="tc-price">' + esc(c.precio) + '</span></span>' +
      '</button>';
  }).join('');

  /* ---------- Modal ---------- */
  var m = document.createElement('div');
  m.className = 'tm';
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-modal', 'true');
  m.setAttribute('aria-label', 'Detalle de la consola');
  m.innerHTML =
    '<div class="tm-box">' +
      '<div class="tm-head"><img src="favicon.png" alt=""><div><b>AZ TECH</b><span>Río Grande · Barrio Chacra 13</span></div>' +
      '<button type="button" class="tm-x" aria-label="Cerrar">✕</button></div>' +
      '<div class="tm-car"><div class="tm-track"></div>' +
        '<button type="button" class="tm-nav prev" aria-label="Foto anterior">‹</button>' +
        '<button type="button" class="tm-nav next" aria-label="Foto siguiente">›</button>' +
        '<span class="tm-count"></span></div>' +
      '<div class="tm-dots"></div><div class="tm-body"></div>' +
    '</div>';
  document.body.appendChild(m);

  var track = m.querySelector('.tm-track'), dots = m.querySelector('.tm-dots'),
      count = m.querySelector('.tm-count'), body = m.querySelector('.tm-body'),
      prev = m.querySelector('.prev'), next = m.querySelector('.next'),
      car = m.querySelector('.tm-car'), idx = 0, n = 0;

  function go(i){
    idx = Math.max(0, Math.min(n - 1, i));
    track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    count.textContent = (idx + 1) + '/' + n;
    [].forEach.call(dots.children, function(d, k){ d.classList.toggle('on', k === idx); });
    prev.style.display = idx > 0 ? '' : 'none';
    next.style.display = idx < n - 1 ? '' : 'none';
  }

  function abrir(i){
    var c = CONSOLAS[i], f = fotosDe(c);
    n = f.length;
    track.innerHTML = f.map(function(s){ return '<img src="' + esc(s) + '" alt="' + esc(c.nombre) + '">'; }).join('');
    dots.innerHTML = n > 1 ? f.map(function(_, k){ return '<button type="button" class="tm-dot" data-k="' + k + '" aria-label="Foto ' + (k + 1) + '"></button>'; }).join('') : '';
    count.style.display = dots.style.display = n > 1 ? '' : 'none';
    body.innerHTML =
      '<div class="tm-price"><span>' + esc(c.precio) + '</span>' + (c.estado ? '<em>' + esc(c.estado) + '</em>' : '') + '</div>' +
      '<h3>' + esc(c.nombre) + '</h3>' +
      (c.descripcion ? '<div class="tm-sec"><h4>📝 Descripción</h4><p>' + esc(c.descripcion) + '</p></div>' : '') +
      lista('⭐ Características', c.caracteristicas) +
      specs(c.especificaciones) +
      lista('📦 Detalles', c.detalles) +
      (c.vendida
        ? '<p class="tm-sold">Esta consola ya se vendió.</p>'
        : '<a class="btn-primary tm-wa" target="_blank" rel="noopener" href="' + WA + encodeURIComponent('Hola AZ TECH! Me interesa la consola en venta: ' + c.nombre) + '">Consultar por WhatsApp →</a>');
    go(0);
    m.classList.add('open');
    m.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    m.querySelector('.tm-x').focus();
  }
  function cerrar(){
    m.classList.remove('open');
    document.body.style.overflow = '';
  }

  grid.addEventListener('click', function(e){
    var b = e.target.closest('.tc');
    if(b) abrir(+b.getAttribute('data-i'));
  });
  m.addEventListener('click', function(e){
    if(e.target === m || e.target.closest('.tm-x')) cerrar();
    else if(e.target.closest('.prev')) go(idx - 1);
    else if(e.target.closest('.next')) go(idx + 1);
    else if(e.target.classList.contains('tm-dot')) go(+e.target.getAttribute('data-k'));
  });
  document.addEventListener('keydown', function(e){
    if(!m.classList.contains('open')) return;
    if(e.key === 'Escape') cerrar();
    if(e.key === 'ArrowLeft') go(idx - 1);
    if(e.key === 'ArrowRight') go(idx + 1);
  });

  // deslizar con el dedo en el celu
  var x0 = null;
  car.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive:true});
  car.addEventListener('touchend', function(e){
    if(x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if(Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
