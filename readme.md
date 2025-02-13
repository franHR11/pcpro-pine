# PCPro Pine Editor - Editor de Texto Enriquecido

Un editor WYSIWYG (What You See Is What You Get) moderno y potente desarrollado en JavaScript puro sin dependencias externas.

## Autor
**Desarrollador**: franHR  
**Web**: [https://pcprogramacion.es/](https://pcprogramacion.es/)

## Descripción
PCPro Pine Editor es un editor de texto enriquecido que proporciona una experiencia de edición ágil y fluida, perfecto para cualquier proyecto web que requiera funciones avanzadas de edición de texto.

## Características Principales

### Editor Base
- Editor WYSIWYG completo
- Interfaz moderna y responsive
- Barra de herramientas personalizable y fijable
- Sistema de atajos de teclado
- Funciones de deshacer y rehacer

### Formatos de Texto
- Control de tamaño de fuente (8px a 96px)
- Más de 20 fuentes predefinidas
- Negrita, cursiva y subrayado
- Selector de color avanzado para texto y fondo
- Alineación de texto (izquierda, centro, derecha)

### Gestión de Tablas
- Creación de tablas a medida
- Control de ancho de columnas
- Añadir/eliminar filas y columnas
- Color de celda personalizable
- Selección múltiple (Ctrl+Click)
- Selección de columnas (Alt+Click)

### Gestión de Imágenes
- Inserción de imágenes mediante URL o archivos locales
- Redimensionamiento con preservación de aspecto
- Alineación automática
- Posicionamiento de texto (arriba, abajo, izquierda, derecha)
- Función de arrastrar y soltar

### Sistema de Columnas
- Contenedores flexibles (columnas)
- Control preciso de anchos
- Arrastrar y soltar para reordenar
- Colores y fondos personalizables
- Módulos e info-box insertables

### Importación de Documentos
- Soporte para Word (.docx, .doc)
- Soporte para Excel (.xlsx, .xls)
- Funcionalidad para PDF (extracción de texto e imágenes)
- Preservación general de formatos

### Listas
- Listas numeradas
- Listas con viñetas
- Listas de verificación interactivas
- Alineación de listas personalizable

## Instalación y Configuración

1. Incluir los archivos necesarios en tu HTML:
```html
<!-- Estilos -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="css/pcpro-pine-editor.css">

<!-- Script principal (incluye dependencias de importación) -->
<script src="js/pcpro-pine-editor.js"></script>
```

2. Crea un contenedor en el HTML e inicializa el editor:
```html
<div id="pine-editor"></div>
<script>
  const editor = new PcproPineEditor('#pine-editor');
</script>
```

> Nota: No hace falta añadir scripts externos, ya que se cargan dinámicamente cuando se necesitan.

## Uso Básico

### Obtener Contenido
```javascript
const html = editor.getContent();
```

### Establecer Contenido
```javascript
editor.setContent('<p>Nuevo contenido</p>');
```

### Previsualizar
```javascript
editor.showPreview();
```

### Imprimir/Documento PDF
```javascript
editor.printDocument();
```

## Funciones Avanzadas

### Eventos
```javascript
editor.content.addEventListener('contentChanged', () => {
    // Acciones cuando cambia el contenido
});
```

```javascript
editor.content.addEventListener('imageSelected', (e) => {
    console.log('Imagen seleccionada:', e.detail.image);
});
```

### Plantillas (Opcional)
```javascript
await editor.saveTemplate();
await editor.loadTemplate();
```

### Importar Documentos
```javascript
editor.importWord();
editor.importExcel();
editor.importPDF();
```

## Requisitos del Servidor

- PHP 7.0 o superior
- Permisos de escritura en /templates
- Módulos PHP:
  - file_get_contents
  - file_put_contents
  - json_encode / json_decode

## Personalización

### CSS
```css
.pcpro-pine-editor {
    /* Ajusta el contenedor del editor a tu gusto */
}
```

### Personalizar Barra de Herramientas
```javascript
// Ejemplo: modificar el arreglo de herramientas
const tools = [
  { icon: '<i class="fas fa-bold"></i>', command: 'bold', tooltip: 'Negrita' },
  // ...otros comandos
];
```

## Navegadores Compatibles
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Limitaciones Conocidas
- El importador de PDF funciona mejor con documentos simples
- Estilos avanzados de Word pueden perderse
- Arrastrar y soltar requiere navegadores modernos

## Contribuir
Si encuentras errores o tienes sugerencias, por favor abre un issue en el repositorio oficial.

## Licencia
Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

---
© 2025 [PCProgramación](https://www.pcprogramacion.es)

