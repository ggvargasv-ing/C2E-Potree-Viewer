/* CARBON2EARTH - UI de presentación integrada. Sin redirección de iconos.
 * No llama a las herramientas ni al motor de Potree. */
(function () {
  'use strict';
  const labels = new Map([
    ['EYE-DOME-LIGHTING', 'Realce de profundidad (EDL)'],
    ['BACKGROUND', 'Fondo del visor'],
    ['OTHER', 'Otros ajustes'],
    ['SPLAT QUALITY', 'Calidad de representación'],
    ['MEASUREMENT', 'Medición y análisis'],
    ['CLIPPING', 'Recorte espacial'],
    ['Filters', 'Filtros'],
    ['SHOW/HIDE LABELS', 'Etiquetas de medición'],
    ['CLIP TASK', 'Operación de recorte'],
    ['CLIP METHOD', 'Método de recorte'],
    ['Opacity:', 'Opacidad:'], ['Radius:', 'Radio:'],
    ['Strength:', 'Intensidad:'],
    ['Skybox', 'Entorno'], ['Gradient', 'Degradado'],
    ['Black', 'Negro'], ['White', 'Blanco'], ['None', 'Ninguno'],
    ['Standard', 'Estándar'], ['High Quality', 'Alta calidad'],
    ['Show', 'Mostrar'], ['Hide', 'Ocultar'],
    ['Inside', 'Interior'], ['Outside', 'Exterior'],
    ['Highlight', 'Resaltar']
  ]);
  let observer = null;
  let scheduled = false;
  const sidebarId = 'potree_sidebar_container';
  function translate(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const changes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|INPUT|TEXTAREA|OPTION)$/i.test(parent.tagName) || parent.isContentEditable) continue;
      const before = node.nodeValue;
      const token = before.trim();
      if (labels.has(token)) changes.push([node, before.replace(token, labels.get(token))]);
    }
    for (const [node, after] of changes) node.nodeValue = after;
    const label = root.querySelector('#show_bounding_box + span');
    if (label) label.textContent = 'Cajas delimitadoras';
  }
  function update() {
    const root = document.getElementById(sidebarId);
    if (!root) return;
    if (observer) observer.disconnect();
    try { translate(root); }
    finally {
      if (observer) observer.observe(root, {subtree:true, childList:true, characterData:true});
    }
  }
  function onChange() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled=false; update(); });
  }
  // Etiqueta dinámica: refleja visibilidad real, no solo ?clouds=.
  let badgeTimer = null;
  function badge() {
    const stage = document.getElementById('potree_render_area');
    if (!stage) return;
    let el = document.getElementById('c2e-cloud-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'c2e-cloud-badge';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      const kicker = document.createElement('div');
      kicker.className = 'c2e-badge-kicker';
      const dot = document.createElement('span');
      dot.className = 'c2e-badge-dot';
      dot.setAttribute('aria-hidden', 'true');
      kicker.append(dot, document.createTextNode('CARBON2EARTH · VISOR 3D'));
      const name = document.createElement('div');
      name.className = 'c2e-badge-name';
      el.append(kicker, name);
      stage.appendChild(el);
    }
    const clouds = window.viewer?.scene?.pointclouds;
    const all = Array.isArray(clouds) ? clouds : [];
    const visible = all.filter(pc => pc && pc.visible !== false);
    let label;
    if (visible.length === 0) {
      label = all.length ? 'Ninguna nube visible' : 'Cargando nubes…';
    } else if (visible.length === 1) {
      label = String(visible[0].name || 'Nube sin nombre').replace(/_/g, ' ');
    } else {
      label = `${visible.length} nubes visibles`;
    }
    const detail = all.length > 1 ? ` · ${visible.length} de ${all.length} visibles` : '';
    const nameNode = el.querySelector('.c2e-badge-name');
    const display = label + (visible.length === 1 ? detail : '');
    if (nameNode && nameNode.textContent !== display) nameNode.textContent = display;
    el.title = all.length ? `${visible.length} de ${all.length} nubes visibles` : 'Cargando nubes';
  }

  // Estado real de las cabeceras: Potree cambia display del panel hermano,
  // sin añadir clases activas ni aria-expanded a sus h3.
  let headerObserver = null;
  let headerClickBound = false;
  function initSectionHeaders() {
    const root = document.getElementById('potree_menu');
    if (!root) return;
    const ids = ['menu_appearance', 'menu_tools', 'menu_scene', 'menu_filters'];
    const headings = ids.map(id => document.getElementById(id)).filter(Boolean);
    const sync = () => headings.forEach(h => {
      const panel = h.nextElementSibling;
      if (!panel) return;
      const open = window.getComputedStyle(panel).display !== 'none';
      h.classList.toggle('c2e-section-open', open);
      h.setAttribute('aria-expanded', String(open));
    });
    if (!headerObserver && typeof MutationObserver !== 'undefined') {
      headerObserver = new MutationObserver(sync);
      headings.forEach(h => {
        if (h.nextElementSibling) headerObserver.observe(h.nextElementSibling, {
          attributes: true, attributeFilter: ['style', 'class', 'hidden']
        });
      });
    }
    if (!headerClickBound) {
      root.addEventListener('click', event => {
        if (event.target.closest('h3')) window.requestAnimationFrame(sync);
      });
      headerClickBound = true;
    }
    sync();
  }
  window.c2eUpgradePotreeUI = function () {
    initSectionHeaders();
    update();
    const root=document.getElementById(sidebarId);
    if (root && !observer && typeof MutationObserver !== 'undefined') {
      observer=new MutationObserver(onChange);
      observer.observe(root,{subtree:true,childList:true,characterData:true});
    }
    badge();
    if (badgeTimer === null) badgeTimer = window.setInterval(badge, 500);
  };
})();
