/* Ayuda local: usa el catálogo público y no envía ni guarda preguntas. */
(() => {
  'use strict';
  const panel = document.getElementById('shop-assistant-panel');
  const toggle = document.getElementById('shop-assistant-toggle');
  const close = document.getElementById('shop-assistant-close');
  const form = document.getElementById('shop-assistant-form');
  const input = document.getElementById('shop-assistant-input');
  const log = document.getElementById('shop-assistant-log');
  if (!panel || !toggle || !close || !form || !input || !log) return;
  const catalog = Array.isArray(window.INVENTARIO_USA) ? window.INVENTARIO_USA : [];
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const money = value => new Intl.NumberFormat('es-CO', {style:'currency',currency:'COP',maximumFractionDigits:0}).format(value);
  function add(value, who) {
    const p = document.createElement('p');
    p.className = 'shop-assistant-message ' + (who || 'bot');
    if (typeof value === 'string') p.textContent = value; else value(p);
    log.appendChild(p); log.scrollTop = log.scrollHeight;
  }
  function link(parent, label, href) {
    const a = document.createElement('a'); a.textContent = label; a.href = href; parent.appendChild(a);
  }
  function handoff(question) {
    add(p => {
      p.append('No tengo una respuesta confirmada para eso. ');
      const phone = String(window.WHATSAPP_COMPRAS || '').replace(/\D/g, '');
      if (phone) link(p, 'Pregúntanos por WhatsApp', 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Hola, tengo una consulta sobre la tienda: ' + question));
    });
  }
  function answer(question) {
    const q = norm(question.trim()); if (!q) return;
    const sku = q.match(/(?:#|sku\s*|referencia\s*|ref\s*|numero\s*)(\d{1,3})\b/);
    if (sku) {
      const item = catalog.find(p => String(p.sku || p.id) === sku[1]);
      if (!item) return handoff(question);
      const id = item.sku || item.id;
      if (Number(item.stock) <= 0 || item.status === 'vendido') return add('La referencia #' + id + ' (' + item.title + ') figura como vendida. Puedes pedir algo parecido por WhatsApp.');
      return add(p => {p.append('Referencia #' + id + ': ' + item.title + ', color ' + item.color + ', talla ' + item.size + ', ' + money(item.price) + '. Figura disponible; confirma antes de pagar. '); link(p,'Ver la prenda','#producto-sku-' + encodeURIComponent(id));});
    }
    if (/\b(envio|domicilio|entrega|bogota)\b/.test(q)) return add('En Bogotá, el domicilio llega entre 1 y 2 días. Fuera de Bogotá, el plazo y el costo se cotizan por WhatsApp. El envío se cobra aparte.');
    if (/\b(pago|pagar|nequi|daviplata|transferencia|efectivo)\b/.test(q)) return add('Puedes pagar en efectivo, por Nequi, Daviplata o transferencia. El pago se coordina por WhatsApp; esta página no cobra en línea.');
    if (/\b(factura)\b/.test(q)) return add('Puedes pedir factura por WhatsApp si la necesitas.');
    if (/\b(talla|medida|tamano)\b/.test(q) && !/nike|adidas|levi|reebok|tommy|puma|calvin|guess|camiseta|chaqueta|zapato|jean/.test(q)) return add(p => {p.append('La talla aparece en cada ficha. Consulta la ');link(p,'guía de tallas','#tallas');p.append(' y pide las medidas exactas por WhatsApp.');});
    if (/\b(devolucion|cambio|garantia|retracto|datos|privacidad|politica)\b/.test(q)) return handoff(question);
    const words = q.split(/[^a-z0-9]+/).filter(w => w.length > 2 && !['quiero','busco','tienes','tienen','para','con','del','que','ver','ropa','talla','color','marca','precio','disponible'].includes(w));
    const matches = catalog.filter(p => Number(p.stock) > 0 && p.status !== 'vendido').map(p => ({p,score:words.reduce((n,w) => n + (norm([p.title,p.brand,p.item,p.color,p.size,p.category].join(' ')).includes(w) ? 1 : 0),0)})).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0,4);
    if (matches.length) return add(p => {p.append('Estas prendas figuran disponibles; confirma existencias antes de pagar:'); const ul=document.createElement('ul'); for(const match of matches){const li=document.createElement('li'); const item=match.p; link(li,item.title+' · '+item.size+' · '+money(item.price),'#producto-sku-'+encodeURIComponent(item.sku||item.id));ul.appendChild(li);}p.appendChild(ul);});
    handoff(question);
  }
  function open(value){panel.hidden=!value;toggle.setAttribute('aria-expanded',String(value));if(value)input.focus();else toggle.focus();}
  toggle.addEventListener('click',()=>open(panel.hidden));close.addEventListener('click',()=>open(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)open(false);});
  form.addEventListener('submit',e=>{e.preventDefault();const value=input.value.trim();if(!value)return;add(value,'user');input.value='';answer(value);});
  add('¡Hola! Puedo buscar prendas por marca, tipo o referencia y contarte sobre pagos y entregas.');
})();
