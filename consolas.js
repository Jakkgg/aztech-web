/* Tienda AZ TECH: lee consolas/lista.txt y, de cada carpeta, info.txt + fotos 1.jpeg, 2.jpeg... */
(function(){
  var grid = document.getElementById('tienda-grid');
  if(!grid) return;

  var BASE = 'consolas/', EXTS = ['jpeg','jpg','png','webp'], MAX_FOTOS = 15;
  var WA = 'https://wa.me/5492964574506?text=';
  var KEYS = ['nombre','precio','estado','vendida','descripcion','caracteristicas','especificaciones','detalles','fotos','modelo','incluye'];
  var CONSOLAS = [];

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function norm(s){ return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function dir(c){ return BASE + encodeURIComponent(c) + '/'; }

  /* ---------- info.txt -> objeto ---------- */
  function parsear(txt){
    var out = {}, key = null;
    txt.replace(/\r/g, '').split('\n').forEach(function(l){
      var m = l.match(/^\s*([A-Za-zÁÉÍÓÚÜáéíóúüñÑ]+)\s*:\s*(.*)$/);
      if(m && KEYS.indexOf(norm(m[1])) > -1){
        key = norm(m[1]); out[key] = [];
        if(m[2].trim()) out[key].push(m[2].trim());
      } else if(key){
        out[key].push(l.trim());
      }
    });
    var g = function(k){ return (out[k] || []).join('\n').trim(); };
    var lst = function(k){
      return (out[k] || []).map(function(s){ return s.replace(/^[-•*]\s*/, '').trim(); }).filter(Boolean);
    };
    var pares = function(k){
      return lst(k).map(function(s){
        var i = s.indexOf(':');
        return i < 0 ? [s, ''] : [s.slice(0, i).trim(), s.slice(i + 1).trim()];
      });
    };
    return {
      nombre: g('nombre'), precio: g('precio'), estado: g('estado'),
      vendida: /^(si|true|1|vendida)/.test(norm(g('vendida'))),
      descripcion: g('descripcion'),
      caracteristicas: lst('caracteristicas'),
      modelo: g('modelo'),
      especificaciones: pares('especificaciones'),
      incluye: pares('incluye'),
      detalles: lst('detalles'),
      fotos: lst('fotos')
    };
  }

  /* ---------- fotos 1, 2, 3... (jpeg, jpg, png o webp) ---------- */
  function probar(src){
    return new Promise(function(res){
      var im = new Image();
      im.onload = function(){ res(src); };
      im.onerror = function(){ res(null); };
      im.src = src;
    });
  }
  async function fotosDe(c){
    var a = [];
    for(var i = 1; i <= MAX_FOTOS; i++){
      var f = null;
      for(var e = 0; e < EXTS.length && !f; e++) f = await probar(dir(c) + i + '.' + EXTS[e]);
      if(!f) break;
      a.push(f);
    }
    return a;
  }

  async function cargar(){
    var r = await fetch(BASE + 'lista.txt', {cache:'no-cache'});
    if(!r.ok) return;
    var carpetas = (await r.text()).split('\n').map(function(l){ return l.trim(); })
      .filter(function(l){ return l && l.charAt(0) !== '#'; });
    var items = await Promise.all(carpetas.map(async function(c){
      try{
        var t = await fetch(dir(c) + 'info.txt', {cache:'no-cache'});
        if(!t.ok) return null;
        var d = parsear(await t.text());
        d.fotos = d.fotos.length
          ? d.fotos.map(function(nombre){ return dir(c) + encodeURIComponent(nombre); })
          : await fotosDe(c);
        if(!d.nombre) d.nombre = c;
        return d;
      }catch(e){ return null; }
    }));
    CONSOLAS = items.filter(Boolean);
  }

  /* ---------- helpers de render ---------- */
  function lista(titulo, items){
    if(!items.length) return '';
    return '<div class="tm-sec"><h4>' + titulo + '</h4><ul>' +
      items.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
  }
  function specs(titulo, items){
    if(!items.length) return '';
    return '<div class="tm-sec"><h4>' + titulo + '</h4>' +
      items.map(function(p){ return '<div class="tm-spec">' + (p[1] ? '<b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span>' : '<span style="text-align:left">' + esc(p[0]) + '</span>') + '</div>'; }).join('') + '</div>';
  }

  /* ---------- modal tipo publicación ---------- */
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
    var c = CONSOLAS[i], f = c.fotos;
    n = f.length;
    car.style.display = n ? '' : 'none';
    track.innerHTML = f.map(function(s){ return '<img src="' + esc(s) + '" alt="' + esc(c.nombre) + '">'; }).join('');
    dots.innerHTML = n > 1 ? f.map(function(_, k){ return '<button type="button" class="tm-dot" data-k="' + k + '" aria-label="Foto ' + (k + 1) + '"></button>'; }).join('') : '';
    count.style.display = dots.style.display = n > 1 ? '' : 'none';
    body.innerHTML =
      '<div class="tm-price"><span>' + esc(c.precio) + '</span>' + (c.estado ? '<em>' + esc(c.estado) + '</em>' : '') + '</div>' +
      '<h3>' + esc(c.nombre) + '</h3>' +
      (c.modelo ? '<p style="margin-top:6px;font-family:\'Space Mono\',monospace;font-size:12.5px;color:var(--ink-soft)">Modelo: ' + esc(c.modelo) + '</p>' : '') +
      (c.descripcion ? '<div class="tm-sec"><h4>📝 Descripción</h4><p>' + esc(c.descripcion) + '</p></div>' : '') +
      lista('⭐ Características', c.caracteristicas) +
      specs('⚙️ Especificaciones', c.especificaciones) +
      specs('🎁 Incluye', c.incluye) +
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
  var x0 = null;
  car.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive:true});
  car.addEventListener('touchend', function(e){
    if(x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if(Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  /* ---------- arranque ---------- */
  cargar().then(function(){
    if(!CONSOLAS.length){
      grid.innerHTML = '<p class="tienda-empty">Por ahora no hay consolas en venta. Escribime por WhatsApp y te aviso cuando entre alguna.</p>';
      return;
    }
    grid.innerHTML = CONSOLAS.map(function(c, i){
      var f = c.fotos;
      return '<button type="button" class="tc" data-i="' + i + '">' +
        '<span class="tc-img">' + (f.length ? '<img src="' + esc(f[0]) + '" alt="' + esc(c.nombre) + '">' : '') +
        (f.length > 1 ? '<span class="tc-multi">▣ ' + f.length + '</span>' : '') +
        (c.vendida ? '<span class="tc-sold">Vendida</span>' : '') + '</span>' +
        '<span class="tc-info"><span class="tc-name">' + esc(c.nombre) + '</span><span class="tc-price">' + esc(c.precio) + '</span></span>' +
        '</button>';
    }).join('');
  }).catch(function(){
    grid.innerHTML = '<p class="tienda-empty">No pude cargar las consolas. Probá recargar la página.</p>';
  });
})();
