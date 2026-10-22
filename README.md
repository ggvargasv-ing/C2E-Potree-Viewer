# CARBON2EARTH · Visor 3D Potree

Visor web independiente de nubes de puntos LiDAR para el proyecto **CARBON2EARTH (C2E)**, basado en **Potree** y personalizado visualmente para el entorno **Forest Digital Twin (FDM)**.

**Repositorio:** https://github.com/ggvargasv-ing/C2E-Potree-Viewer  
**Estado:** versión de referencia **v1.1.1**, cabeceras dinámicas, carga múltiple y relleno progresivo de deslizadores verificados manualmente en XAMPP; no equivale a certificación de todas las herramientas.  
**Repositorio relacionado, pero independiente:** https://github.com/ggvargasv-ing/C2E_FDM_Prototipo

> **Principio de mantenimiento:** conservar el funcionamiento del visor estable; analizar el código real antes de modificar Potree, jsTree, sus estilos o sus eventos.

## 1. Alcance

Este repositorio contiene el **visor Potree autónomo**, no el núcleo del prototipo FDM ni los servicios de procesamiento de observación de la Tierra. Permite representar una o varias nubes convertidas al formato que consume esta distribución de Potree, navegar por la escena y utilizar las herramientas proporcionadas por la biblioteca.

La interfaz C2E incorpora:

- Panel lateral de apariencia clara, con colores alineados con la identidad C2E.
- Iconos funcionales originales de Potree; botón de apertura del panel adaptado visualmente.
- Idioma español inicial y traducciones complementarias de algunas etiquetas de la interfaz.
- Carga de varias nubes mediante el parámetro de URL `clouds`.
- Árbol de Escena para activar o desactivar la visualización de nubes, con casillas de alto contraste adaptadas a jsTree (verde C2E para el estado marcado).
- Indicador en la esquina superior derecha que refleja las **nubes realmente visibles**, no únicamente las solicitadas por URL.
- Herramientas nativas de Potree de medición, navegación, propiedades y recorte, sujetas a validación funcional específica.

**Fuera del alcance actual:** procesamiento de archivos LAS/LAZ en el navegador, publicación de datos LiDAR en GitHub, servicios satelitales, API REST propia y superposición georreferenciada de límites de áreas piloto. La inclusión futura de Shapefiles es una mejora pendiente, no una funcionalidad implementada.

## 2. Organización del código

```text
C2E-Potree-Viewer/
├── index.html                       # Arranque del visor y carga de las nubes
├── css/
│   └── styles.css                   # Estilos C2E sobre las bibliotecas
├── js/
│   ├── c2e-ui.js                    # Traducciones y distintivo dinámico de visibilidad
│   └── get.js                       # Lectura sencilla de parámetros URL
├── libs/
│   ├── potree/
│   │   ├── potree.js                # Motor y componentes Potree distribuidos
│   │   ├── potree.css               # CSS base de Potree
│   │   ├── sidebar.html             # Estructura HTML de la barra lateral
│   │   └── resources/              # Iconos, idiomas, recursos, etc.
│   ├── jstree/
│   │   ├── jstree.js                # Árbol de la escena
│   │   └── themes/mixed/style.css   # CSS / sprites de jsTree
│   ├── shapefile/shapefile.js        # Biblioteca disponible; integración pendiente
│   └── ...                         # Otras dependencias distribuidas
├── .gitignore
└── README.md
```

En la instalación local se utiliza también `pointclouds/`, **ignorada por Git**:

```text
pointclouds/
└── NOMBRE_NUBE/
    ├── metadata.json
    └── ...                         # Otros archivos creados por el conversor
```

La estructura exacta bajo cada carpeta depende de la salida del conversor. El repositorio no incluye las nubes ni garantiza que una instalación clonada muestre datos hasta que se configuren los recursos LiDAR.

## 3. Requisitos y ejecución local

- Navegador moderno con soporte WebGL.
- Servidor HTTP estático: la configuración utilizada y comprobada durante el desarrollo fue **Apache mediante XAMPP en Windows**.
- Nubes de puntos **previamente convertidas** y accesibles por HTTP en `pointclouds/<nombre>/metadata.json`.

Ejemplo de instalación local:

```text
C:\xampp\htdocs\c2e\
```

Con Apache arrancado, abrir:

```text
http://localhost/c2e/index.html?clouds=PNOA_SERRADILLA_2025_MOSAICO
```

Para cargar varias nubes, separar los nombres de carpeta mediante comas:

```text
http://localhost/c2e/index.html?clouds=PNOA_SERRADILLA_2025_MOSAICO,PNOA_CASTROPOL_2024_MOSAICO,PNOA_BOSTAL_2025_MOSAICO
```

Estos nombres son ejemplos empleados en el desarrollo. Deben existir carpetas coincidentes en `pointclouds/`. Los nombres deben corresponder a los directorios reales y no deben incluir rutas arbitrarias.

**Importante:** la implementación actual requiere el parámetro `clouds`. En `index.html` se utiliza `getQueryVariable('clouds').split(',')`; si no se especifica, se puede producir un error. Este caso no está resuelto en v1.0.

## 4. Flujo de funcionamiento confirmado en código

1. `index.html` carga las hojas CSS y las dependencias de `libs/`, seguidas de `js/get.js` y `js/c2e-ui.js`.
2. Crea `window.viewer = new Potree.Viewer(...)` sobre `#potree_render_area`.
3. Configura inicialmente EDL, FOV `60`, presupuesto de `2_000_000` puntos y `viewer.useHQ = true`. `viewer.loadSettingsFromURL()` puede modificar la configuración efectiva a partir de otros parámetros.
4. Carga la interfaz gráfica con `viewer.loadGUI(...)`, establece español con `viewer.setLanguage('es')` y ejecuta `window.c2eUpgradePotreeUI()`.
5. Lee `clouds`, separa los nombres por coma y ejecuta para cada uno `Potree.loadPointCloud('./pointclouds/' + name + '/metadata.json', name, callback)`.
6. Tras recibir cada nube, configura tamaño de punto `1`, tipo `FIXED`, forma `CIRCLE`, atributo `rgba`; la añade a `viewer.scene` y llama a `viewer.fitToScreen()`.
7. `c2e-ui.js` observa cambios del texto de la barra lateral y mantiene el indicador mediante una consulta a `viewer.scene.pointclouds` aproximadamente cada `500 ms`.

### Distintivo de nubes visibles

- **Una visible:** muestra el nombre de la nube (`_` se sustituye por espacios); si hay varias cargadas, añade `1 de N visibles`.
- **Varias visibles:** muestra `N nubes visibles`.
- **Ninguna visible:** muestra `Ninguna nube visible`, o `Cargando nubes…` si la escena todavía no contiene nubes.

El indicador se basa en la propiedad `visible` de cada objeto de nube. **No constituye un diagnóstico de carga completa, cobertura espacial o renderizado efectivo**.

## 5. Diseño y responsabilidades

| Archivo | Responsabilidad | Política de modificación |
| --- | --- | --- |
| `index.html` | Inicialización del visor; carga de dependencias y nubes | Cambios pequeños, revisados y probados |
| `css/styles.css` | Identidad visual y ajustes del panel | Lugar preferente para cambios cosméticos |
| `js/c2e-ui.js` | Traducción puntual y distintivo | No introducir lógica científica o de renderizado |
| `js/get.js` | Lectura de parámetros URL | Mantener contrato `?clouds=` o versionarlo explícitamente |
| `libs/potree/*` | Biblioteca Potree y su interfaz original | Evitar ediciones directas sin justificación técnica |
| `libs/jstree/*` | Árbol de escena y sus sprites | Analizar clases, estados y sprites antes de alterar CSS |

El CSS utiliza, entre otros, los colores `#2f7d4f` (verde principal), `#256540` (verde oscuro), `#ffffff` (paneles) y `#17241f` (texto principal). Los recursos de medición usan la iconografía distribuida por Potree.

### Precaución técnica: checkboxes de Escena

**Los checkboxes del árbol de Escena no deben tratarse como simples `input[type="checkbox"]`.** La distribución incluida de jsTree utiliza reglas `.jstree-checkbox`, `.jstree-checked` y `.jstree-undetermined`, con iconografía procedente de sprites (`32px.png` y, en el tema adaptable, `40px.png`). El contraste de los estados marcados sobre el panel claro **se ha mejorado y validado manualmente en la interfaz**.

**Diagnóstico confirmado en Chrome:** el árbol real tiene ID `#jstree_scene`; cada casilla es un elemento `<i class="jstree-icon jstree-checkbox" role="presentation"></i>` dentro de un `<a class="jstree-anchor">`. Al marcar, jsTree añade `jstree-checked` al **ancla**, no a un `input` ni al elemento padre `<li>`. El tema original dibuja la casilla con `libs/jstree/themes/mixed/32px.png`.

**Solución implementada:** el bloque final `CARBON2EARTH · CHECKBOXES JSTREE` de `css/styles.css` emplea selectores anclados a `#jstree_scene`, retira el sprite **solo de las casillas**, y dibuja sus estados mediante pseudoelementos CSS `::before` y `::after`:

- Desmarcada: fondo blanco y borde gris `#899b90`.
- Marcada: verde C2E `#2f7d4f`, borde `#256540` y marca blanca.
- Indeterminada: tratamiento visual propuesto con fondo verde pálido y trazo; **pendiente de una comprobación manual específica**.
- Deshabilitada: opacidad reducida; **pendiente de una comprobación manual específica**.

La prueba temporal en la consola de Chrome y la posterior prueba del CSS permanente confirmaron el contraste de estados marcado/desmarcado y la activación/desactivación de nubes, con el indicador dinámico sincronizado. No se modificaron `libs/jstree/*`, `libs/potree/*`, el DOM ni los controladores de visibilidad.

**Criterio de mantenimiento:** no aplicar reglas genéricas para `input[type="checkbox"]` ni sustituir el sprite global de jsTree. Si se modifica esta mejora, comprobar en el DOM las clases y los estilos calculados; probar marcado, desmarcado, selección parcial y deshabilitado, además del comportamiento de las nubes. El selector `#scene_objects` por sí solo no resultó eficaz para esta personalización; el ID verificado es `#jstree_scene`.

### Particularidad de la barra lateral

En `libs/potree/sidebar.html`, `#show_bounding_box` controla las cajas delimitadoras y `#msaa` es un control distinto que comparte erróneamente una etiqueta. La personalización C2E conserva el primero y oculta el segundo desde CSS. La sección `#menu_about` también está oculta por diseño. Antes de cambiarlos, revisar las reglas existentes en la parte final de `css/styles.css`.

## 6. Validación y limitaciones

**Comprobado durante el desarrollo mediante navegador local y capturas aportadas:**

- Arranque de Potree bajo XAMPP.
- Representación de nube de puntos PNOA convertida.
- Carga simultánea de tres nubes.
- Activación/desactivación de nubes desde Escena.
- Actualización del indicador al dejar visible una de tres nubes.
- Integración de la interfaz visual C2E.
- Mejora permanente del contraste de casillas jsTree (estados marcado y desmarcado) y conservación de la visibilidad funcional de las nubes; confirmada mediante capturas y pruebas locales en Chrome.

**Pendiente de una batería formal de pruebas:** todas las herramientas de medición y recorte, exportaciones, rendimiento con grandes volúmenes, compatibilidad entre navegadores, responsive, manejo de errores de carga y accesibilidad completa.

**Limitaciones conocidas del código actual:**

- Se espera `?clouds=`; no hay tratamiento explícito del parámetro ausente.
- No hay mensajes de error propios para carpetas o `metadata.json` inexistentes.
- Se invoca `fitToScreen()` cada vez que termina de cargar una nube, por lo que el encuadre puede reajustarse durante la carga múltiple.
- El indicador realiza una comprobación periódica cada `500 ms`, en vez de utilizar un sistema de eventos específico de visibilidad.
- Los nombres del distintivo se derivan de nombres técnicos de carpetas; no existe todavía un catálogo de nombres amigables de pilotos.
- La compatibilidad espacial entre distintas nubes depende de sus datos de origen y conversión; el código no resuelve desajustes CRS o verticales.

## 7. Hoja de ruta no implementada

- **Contornos de pilotos:** visualizar las geometrías de las áreas piloto (por ejemplo, desde Shapefile) en un sistema de referencia coherente con las nubes; comprobar XY, Z y, si procede, ajuste al relieve. Existe `libs/shapefile/shapefile.js`, pero **no hay integración de límites implementada**.
- **Accesibilidad del árbol:** mejora de contraste de casillas jsTree **implementada y comprobada para marcado/desmarcado**. Pendiente de validar de forma específica los estados indeterminado/deshabilitado, la navegación con teclado y otros criterios de accesibilidad.
- **Robustez:** validar parámetros de URL, informar de errores HTTP y evitar reajustes de cámara imprevistos.
- **Integración FDM:** definir una interfaz desacoplada para abrir el visor desde el frontend principal de CARBON2EARTH, sin fusionar los repositorios.

## 8. Git, cambios y control de versiones

El desarrollo local se mantuvo bajo `C:\xampp\htdocs\c2e` y se publicó como repositorio independiente. El primer commit de referencia fue `29b5bbb` (`Initial release: C2E Potree Viewer v1.0`). La mejora posterior de contraste de jsTree reside exclusivamente en `css/styles.css`.

Flujo sugerido para cualquier mejora:

```powershell
git status
git switch -c feature/nombre-descriptivo
# Editar y validar localmente en XAMPP.
git add index.html css/styles.css js/c2e-ui.js
git commit -m "Describe the change"
git push -u origin feature/nombre-descriptivo
```

Utilizar una **pull request** para revisar antes de fusionar en `main`. Evitar editar directamente `libs/` salvo que sea imprescindible y quede documentado. Conservar una copia funcional antes de cambios importantes.

### Datos y seguridad

El `.gitignore` excluye `pointclouds/`, `*.las`, `*.laz`, rásteres, algunos formatos pesados y `.env`. GitHub almacena el código y recursos necesarios para el visor, **no los datos LiDAR de las áreas piloto**. No publicar ubicaciones sensibles, archivos de clientes ni secretos sin autorización.

### Dependencias y licencias

Este repositorio incluye distribuciones de Potree, jsTree, Three.js y otras bibliotecas de terceros con sus propios archivos de licencia. Conservar los avisos originales y revisar las licencias aplicables antes de redistribuir comercialmente el conjunto. La presencia de una dependencia en `libs/` no implica que toda ella se utilice en tiempo de ejecución.

## 9. Referencias para incorporarse al proyecto

Para comprender o modificar este visor, consultar **en este orden**:

1. Este `README.md`.
2. `index.html` (arranque, configuración, contrato URL y carga de nubes).
3. `js/c2e-ui.js` (traducciones e indicador dinámico).
4. `css/styles.css` (cascada y estética C2E).
5. `libs/potree/sidebar.html`, `libs/potree/potree.css` y `libs/potree/potree.js`.
6. `libs/jstree/themes/mixed/style.css` y `libs/jstree/jstree.js`, cuando la tarea afecte al árbol.

Antes de proponer cambios, reproducir el problema, identificar el archivo y el selector/evento implicados, presentar una modificación mínima y comprobar que la carga de nubes, herramientas y controles siguen funcionando. **No asumir** que una corrección CSS genérica es aplicable a esta versión concreta de Potree.

### Cabeceras de sección (rama de validación)

Las cabeceras Apariencia, Herramientas, Escena y Filtros usan iconos SVG locales de [Tabler Icons](https://tabler.io/icons) (licencia MIT; conservar atribución y avisos de la biblioteca). El estilo está en el bloque final de `css/styles.css`; `js/c2e-ui.js` asigna la clase `c2e-section-open` y `aria-expanded` leyendo el `display` computado del panel hermano y observando sus cambios. El chevron cambia orientación y el texto/icono pasan a verde cuando la sección está abierta. `#menu_about` continúa oculto. **Validado en XAMPP:** cabeceras abiertas con texto e icono verdes, chevron hacia abajo, secciones cerradas neutras y sección «Acerca de» oculta. El arranque define los paneles cerrados antes de llamar a `c2eUpgradePotreeUI()`. La URL del script incluye `?v=c2e-headers-1-1` para evitar reutilizar una versión anterior en caché.

**Control de caché (v1.1):** en `index.html`, `./js/c2e-ui.js?v=c2e-headers-1-1` diferencia la versión utilizada. Tras cambios de JS/CSS, actualizar el identificador de versión correspondiente para evitar contenido obsoleto en el navegador.

### Deslizadores con relleno progresivo (v1.1.1)

`js/c2e-ui.js` incorpora exclusivamente una mejora visual para los deslizadores jQuery UI del panel lateral: observa la posición horizontal del `.ui-slider-handle` y colorea de verde C2E (`#2f7d4f`) la porción recorrida de la barra, dejando el resto en gris (`#dce3dc`). Detecta los deslizadores disponibles y los añadidos dinámicamente; **no modifica los valores, rangos ni eventos de Potree**. `index.html` utiliza `c2e-ui.js?v=c2e-sliders-1-1-1` para evitar caché obsoleta. Efecto comprobado en Chrome/XAMPP tras recargar el visor; pendientes pruebas automatizadas y exhaustivas en otros navegadores.
