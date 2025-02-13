class PcproPineEditor {
    constructor(selector) {
        this.container = document.querySelector(selector);
        this.lastColors = {
            foreColor: '#000000',
            backColor: '#FFFFFF',
            tableCell: '#FFFFFF'
        };
        this.selectedColumn = null;
        this.selectedCells = new Set();
        this.lastSelectedCell = null; // Añadir para rastrear la última celda seleccionada
        this.columnWidths = new Map(); // Añadir para almacenar los anchos definidos por el usuario
        this.selectedImage = null; // Añadir para rastrear la imagen seleccionada
        this.selectedTable = null; // Añadir para rastrear la tabla seleccionada
        this.selectedContainer = null; // Añadir para rastrear el contenedor flexible seleccionado
        this.isToolbarPinned = false;
        this.lastScrollPosition = 0;
        this.dependencies = {
            mammoth: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.0/mammoth.browser.min.js',
            xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
            pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js'
        };
        this.init();
        this.setupUndoRedo(); // Añadir esta línea
        this.setupToolbarBehavior();
    }

    async loadDependency(name) {
        if (window[name]) return window[name];

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.dependencies[name];
            script.onload = () => resolve(window[name]);
            script.onerror = () => reject(new Error(`Error cargando ${name}`));
            document.head.appendChild(script);
        });
    }

    init() {
        this.createEditorStructure();
        this.setupToolbar();
        this.attachEvents();
    }

    createEditorStructure() {
        this.container.classList.add('pcpro-pine-editor');
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'pcpro-pine-toolbar';
        this.content = document.createElement('div');
        this.content.className = 'pcpro-pine-content';
        this.content.contentEditable = true;

        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.content);

        // Añadir botón de pin
        const pinButton = document.createElement('button');
        pinButton.className = 'toolbar-pin';
        pinButton.innerHTML = '<i class="fas fa-thumbtack"></i>';
        pinButton.title = 'Fijar barra de herramientas';
        this.toolbar.appendChild(pinButton);

        // Añadir botón de toggle
        const toggleButton = document.createElement('button');
        toggleButton.className = 'toolbar-toggle';
        toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
        toggleButton.title = 'Mostrar/ocultar barra de herramientas';
        this.container.appendChild(toggleButton);

        // Añadir los créditos
        const credits = document.createElement('div');
        credits.className = 'pcpro-pine-credits';
        credits.innerHTML = `
            Diseñado con <i class="fas fa-heart"></i> por franHR 
            <i class="far fa-copyright"></i> 2025 
            <a href="https://www.pcprogramacion.es" target="_blank">www.pcprogramacion.es</a>
        `;
        this.container.appendChild(credits);
    }

    setupToolbar() {
        const tools = [
            { icon: '<i class="fas fa-undo"></i>', command: 'undo', tooltip: 'Deshacer' },
            { icon: '<i class="fas fa-redo"></i>', command: 'redo', tooltip: 'Rehacer' },
            { type: 'separator' },
            { icon: '<i class="fas fa-bold"></i>', command: 'bold', tooltip: 'Negrita' },
            { icon: '<i class="fas fa-italic"></i>', command: 'italic', tooltip: 'Cursiva' },
            { icon: '<i class="fas fa-underline"></i>', command: 'underline', tooltip: 'Subrayado' },
            { type: 'separator' },
            { type: 'fontSizeCustom' }, // Cambiado de 'fontSize' a 'fontSizeCustom'
            { type: 'fontName' },
            { type: 'separator' },
            { type: 'colorPicker', command: 'foreColor', tooltip: 'Color de texto', icon: '<i class="fas fa-font"></i>' },
            { type: 'colorPicker', command: 'backColor', tooltip: 'Color de fondo', icon: '<i class="fas fa-fill-drip"></i>' },
            { type: 'separator' },
            { icon: '<i class="fas fa-align-left"></i>', command: 'justifyLeft', tooltip: 'Alinear izquierda' },
            { icon: '<i class="fas fa-align-center"></i>', command: 'justifyCenter', tooltip: 'Centrar' },
            { icon: '<i class="fas fa-align-right"></i>', command: 'justifyRight', tooltip: 'Alinear derecha' },
            { icon: '<i class="fas fa-table"></i>', command: 'insertTable', tooltip: 'Insertar tabla' },
            { type: 'tableControls' },
            { icon: '<i class="fas fa-image"></i>', command: 'insertImage', tooltip: 'Insertar imagen' },
            { type: 'imageControls' },
            { type: 'separator' },
            { icon: '<i class="fas fa-columns"></i>', command: 'insertTwoColumns', tooltip: 'Insertar 2 columnas' },
            { icon: '<i class="fas fa-object-group"></i>', command: 'insertImageText', tooltip: 'Imagen con texto' }, // Actualizado
            { icon: '<i class="fas fa-square-full"></i>', command: 'insertInfoBox', tooltip: 'Cuadro de información' },
            { type: 'columnControls' },
            { type: 'separator' },
            { icon: '<i class="fas fa-save"></i>', command: 'saveTemplate', tooltip: 'Guardar plantilla' },
            { icon: '<i class="fas fa-folder-open"></i>', command: 'loadTemplate', tooltip: 'Cargar plantilla' },
            { icon: '<i class="fas fa-code"></i>', command: 'showHTML', tooltip: 'Ver HTML' },
            { type: 'separator' },
            { icon: '<i class="fas fa-eye"></i>', command: 'preview', tooltip: 'Previsualizar' },
            { icon: '<i class="fas fa-print"></i>', command: 'print', tooltip: 'Imprimir/PDF' },
            { type: 'separator' },
            { icon: '<i class="fas fa-file-word"></i>', command: 'importWord', tooltip: 'Importar Word' },
            { icon: '<i class="fas fa-file-excel"></i>', command: 'importExcel', tooltip: 'Importar Excel' },
            { icon: '<i class="fas fa-file-pdf"></i>', command: 'importPDF', tooltip: 'Importar PDF' },
            { type: 'separator' },
            { icon: '<i class="fas fa-list-ol"></i>', command: 'insertOrderedList', tooltip: 'Lista numerada' },
            { icon: '<i class="fas fa-list-ul"></i>', command: 'insertUnorderedList', tooltip: 'Lista con viñetas' },
            { icon: '<i class="fas fa-tasks"></i>', command: 'insertChecklist', tooltip: 'Lista de verificación' },
            { type: 'separator' }
        ];

        tools.forEach(tool => this.createToolbarItem(tool));
    }

    createToolbarItem(tool) {
        if (tool.type === 'separator') {
            const span = document.createElement('span');
            span.style.borderLeft = '1px solid #dee2e6';
            span.style.margin = '0 5px';
            this.toolbar.appendChild(span);
            return;
        }

        if (tool.type === 'fontSizeCustom') {
            const sizes = [8, 10, 12, 14, 16, 18, 24, 32, 48, 64, 72, 96];
            this.createSelect('fontSize', sizes, 'Tamaño PX');
            return;
        }

        if (tool.type === 'fontName') {
            const fonts = [
                'Arial',
                'Times New Roman',
                'Courier New', 
                'Georgia',
                'Verdana',
                'Helvetica',
                'Tahoma',
                'Trebuchet MS',
                'Impact',
                'Comic Sans MS',
                'Palatino',
                'Garamond',
                'Bookman',
                'Candara',
                'Arial Black',
                'Calibri',
                'Century Gothic',
                'Franklin Gothic Medium',
                'Lucida Sans',
                'Segoe UI'
            ];
            this.createSelect('fontName', fonts, 'Fuente');
            return;
        }

        if (tool.type === 'fontSize') {
            const sizes = ['8', '10', '12', '14', '16', '18', '24', '36'];
            this.createSelect('fontSize', sizes, 'Tamaño');
            return;
        }

        if (tool.type === 'colorPicker') {
            const button = document.createElement('button');
            button.className = 'pcpro-pine-color-btn';
            button.innerHTML = `${tool.icon} ${tool.command === 'foreColor' ? 'Texto' : tool.command === 'backColor' ? 'Fondo' : 'Celda'}`;
            button.title = tool.tooltip;
            button.style.setProperty('--button-color', this.lastColors[tool.command]);
            
            button.addEventListener('click', () => {
                if (tool.command === 'tableCell') {
                    const selectedCell = this.content.querySelector('td.selected');
                    if (selectedCell) {
                        selectedCell.style.backgroundColor = this.lastColors[tool.command];
                    }
                } else {
                    document.execCommand(tool.command, false, this.lastColors[tool.command]);
                }
            });

            const dropdownButton = document.createElement('button');
            dropdownButton.className = 'pcpro-pine-color-dropdown';
            dropdownButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
            dropdownButton.title = `Seleccionar ${tool.command === 'foreColor' ? 'color de texto' : tool.command === 'backColor' ? 'color de fondo' : 'color de celda'}`;
            dropdownButton.addEventListener('click', (event) => this.showColorPicker(event, tool.command));

            const container = document.createElement('div');
            container.className = 'pcpro-pine-color-container';
            container.appendChild(button);
            container.appendChild(dropdownButton);

            this.toolbar.appendChild(container);
            return;
        }

        if (tool.command === 'insertImage') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', (event) => this.showImageDialog(event));
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.type === 'imageControls') {
            const container = document.createElement('div');
            container.className = 'pcpro-pine-image-controls';
            container.style.display = 'none'; // Oculto por defecto

            container.innerHTML = `
                <div class="image-controls-group">
                    <input type="number" min="10" max="1000" class="image-width-input" placeholder="Ancho px">
                    <div class="align-controls">
                        <button class="align-left" title="Alinear izquierda">
                            <i class="fas fa-align-left"></i>
                        </button>
                        <button class="align-center" title="Centrar">
                            <i class="fas fa-align-center"></i>
                        </button>
                        <button class="align-right" title="Alinear derecha">
                            <i class="fas fa-align-right"></i>
                        </button>
                    </div>
                    <div class="text-position-controls">
                        <button class="text-top" title="Texto arriba">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="text-right" title="Texto derecha">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                        <button class="text-bottom" title="Texto abajo">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="text-left" title="Texto izquierda">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                    </div>
                    <button class="delete-image" title="Eliminar imagen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            this.imageControls = container;
            this.setupImageControls();
            this.toolbar.appendChild(container);
            return;
        }

        if (tool.type === 'tableControls') {
            const container = document.createElement('div');
            container.className = 'pcpro-pine-table-controls';
            container.style.display = 'none';

            container.innerHTML = `
                <div class="table-controls-group">
                    <div class="control-group">
                        <span class="control-label">Tabla %</span>
                        <input type="number" min="1" max="100" class="table-width-input" placeholder="Tabla %">
                    </div>
                    <div class="column-controls">
                        <div class="control-group">
                            <span class="control-label">Selección</span>
                            <button class="select-column" title="Seleccionar columna">
                                <i class="fas fa-columns"></i>
                            </button>
                        </div>
                        <div class="control-group">
                            <span class="control-label">Columna %</span>
                            <div class="column-width-controls">
                                <input type="number" min="1" max="100" class="column-width-input" placeholder="Col %">
                                <button class="apply-column-width" title="Aplicar ancho de columna">
                                    <i class="fas fa-arrows-alt-h"></i>
                                </button>
                            </div>
                        </div>
                        <div class="control-group">
                            <span class="control-label">Columna</span>
                            <div class="button-group">
                                <button class="add-column" title="Añadir columna">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="delete-column" title="Eliminar columna">
                                    <i class="fas fa-minus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="control-group">
                            <span class="control-label">Color</span>
                            <div class="color-controls">
                                <button class="paint-cell" title="Pintar celda">
                                    <i class="fas fa-paint-roller"></i>
                                </button>
                                <button class="cell-color-btn" title="Color de celda">
                                    <i class="fas fa-fill-drip"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="row-controls">
                        <div class="control-group">
                            <span class="control-label">Fila</span>
                            <div class="button-group">
                                <button class="add-row" title="Añadir fila">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="delete-row" title="Eliminar fila">
                                    <i class="fas fa-minus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="control-group">
                        <span class="control-label">Tabla</span>
                        <button class="delete-table" title="Eliminar tabla">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            this.tableControls = container;
            this.setupTableControls();
            this.toolbar.appendChild(container);
            return;
        }

        if (tool.command === 'insertTwoColumns') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => this.insertTwoColumns());
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'insertImageText') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => this.showImageTextDialog());
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'insertInfoBox') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => this.insertInfoBox());
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.type === 'columnControls') {
            const container = document.createElement('div');
            container.className = 'pcpro-pine-column-controls';
            container.style.display = 'none';

            container.innerHTML = `
                <div class="column-controls-group">
                    <div class="control-group">
                        <span class="control-label">Columnas</span>
                        <div class="button-group">
                            <button class="add-flex-column" title="Añadir columna">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="remove-flex-column" title="Eliminar columna">
                                <i class="fas fa-minus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="control-group">
                        <span class="control-label">Ancho columna</span>
                        <div class="width-controls">
                            <input type="number" min="1" max="100" class="column-width-input" placeholder="Col %">
                            <button class="apply-width" title="Aplicar ancho">
                                <i class="fas fa-arrows-alt-h"></i>
                            </button>
                        </div>
                    </div>
                    <div class="control-group">
                        <span class="control-label">Alineación</span>
                        <div class="align-controls">
                            <button class="align-left" title="Alinear izquierda">
                                <i class="fas fa-align-left"></i>
                            </button>
                            <button class="align-center" title="Centrar">
                                <i class="fas fa-align-center"></i>
                            </button>
                            <button class="align-right" title="Alinear derecha">
                                <i class="fas fa-align-right"></i>
                            </button>
                            <button class="align-justify" title="Distribuir">
                                <i class="fas fa-align-justify"></i>
                            </button>
                        </div>
                    </div>
                    <div class="control-group">
                        <span class="control-label">Fondo</span>
                        <button class="column-color-btn" title="Color de fondo">
                            <i class="fas fa-fill-drip"></i>
                        </button>
                    </div>
                    <div class="control-group insert-buttons">
                        <div class="button-group">
                            <span class="control-label">Insertar módulos</span>
                            <div class="button-row">
                                <button class="insert-image-text" title="Imagen con texto">
                                    <i class="fas fa-object-group"></i>
                                </button>
                                <button class="insert-info-box" title="Cuadro de información">
                                    <i class="fas fa-square-full"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="control-group">
                        <span class="control-label">Contenedor</span>
                        <button class="delete-container" title="Eliminar contenedor">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            this.columnControls = container;
            this.setupColumnControls();
            this.toolbar.appendChild(container);
            return;
        }

        if (tool.command === 'undo') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => {
                document.execCommand('undo', false);
            });
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'redo') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => {
                document.execCommand('redo', false);
            });
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'preview') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => this.showPreview());
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'print') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => this.printDocument());
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'importWord') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => this.importWord());
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'importExcel') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => this.importExcel());
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'importPDF') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => this.importPDF());
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'insertChecklist') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => this.createChecklist());
            this.toolbar.appendChild(button);
            return;
        }

        if (tool.command === 'justifyLeft' || tool.command === 'justifyCenter' || tool.command === 'justifyRight') {
            const button = document.createElement('button');
            button.innerHTML = tool.icon;
            button.title = tool.tooltip;
            button.addEventListener('click', () => {
                const selection = window.getSelection();
                let element = selection.anchorNode;
                
                // Buscar el elemento lista más cercano
                while (element && !['UL', 'OL', 'DIV'].includes(element.nodeName)) {
                    element = element.parentNode;
                }

                if (element) {
                    if (element.nodeName === 'UL' || element.nodeName === 'OL') {
                        // Si no está envuelto en un contenedor, envolverlo
                        if (!element.parentElement.classList.contains('list-container')) {
                            const container = document.createElement('div');
                            container.className = 'list-container';
                            element.parentNode.insertBefore(container, element);
                            container.appendChild(element);
                            container.style.textAlign = tool.command.replace('justify', '').toLowerCase();
                        } else {
                            element.parentElement.style.textAlign = tool.command.replace('justify', '').toLowerCase();
                        }
                    } else {
                        // Aplicar alineación normal para otros elementos
                        document.execCommand(tool.command, false, null);
                    }
                }
            });
            this.toolbar.appendChild(button);
            return;
        }

        const button = document.createElement('button');
        button.innerHTML = tool.icon;
        button.title = tool.tooltip;
        button.addEventListener('click', async (event) => {
            if (tool.command === 'insertTable') {
                this.showTableDialog(event);
            } else if (tool.command === 'saveTemplate') {
                await this.saveTemplate();
            } else if (tool.command === 'loadTemplate') {
                await this.loadTemplate();
            } else if (tool.command === 'showHTML') {
                this.showHTML();
            } else {
                document.execCommand(tool.command, false, null);
            }
        });
        this.toolbar.appendChild(button);
    }

    createSelect(command, options, placeholder) {
        const select = document.createElement('select');
        const defaultOption = document.createElement('option');
        defaultOption.text = placeholder;
        select.appendChild(defaultOption);

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.text = option;
            select.appendChild(opt);
        });

        select.addEventListener('change', (e) => {
            if (e.target.value !== placeholder) {
                this.applyCommand(command, e.target.value);
                e.target.selectedIndex = 0;
            }
        });

        this.toolbar.appendChild(select);
    }

    showTableDialog(event) {
        const button = event.target;
        const rect = button.getBoundingClientRect();
        
        const popup = document.createElement('div');
        popup.className = 'pcpro-pine-table-popup';
        popup.style.position = 'absolute';
        popup.style.top = `${rect.bottom + window.scrollY}px`;
        popup.style.left = `${rect.left + window.scrollX}px`;
        popup.innerHTML = `
            <div class="title">Dimensiones de la tabla:</div>
            <div class="pcpro-pine-table-dimensions">
                <label>
                    Filas:
                    <input type="number" min="1" max="20" value="3" id="tableRows">
                </label>
                <label>
                    Columnas:
                    <input type="number" min="1" max="20" value="3" id="tableCols">
                </label>
            </div>
            <button id="applyTable">Aplicar cambios</button>
        `;

        const applyButton = popup.querySelector('#applyTable');
        applyButton.addEventListener('click', () => {
            const rows = parseInt(popup.querySelector('#tableRows').value);
            const cols = parseInt(popup.querySelector('#tableCols').value);
            this.insertTable(rows, cols);
            popup.remove();
        });

        document.body.appendChild(popup);
    }

    highlightCells(grid, rows, cols) {
        const cells = grid.children;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const cellRow = Math.floor(i / 8) + 1;
            const cellCol = (i % 8) + 1;
            
            if (cellRow <= rows && cellCol <= cols) {
                cell.style.background = '#e9ecef';
            } else {
                cell.style.background = '#fff';
            }
        }
    }

    insertTable(rows, cols) {
        let table = '<table style="border-collapse: collapse; width: 100%; position: relative;">';
        for (let i = 0; i < rows; i++) {
            table += '<tr>';
            for (let j = 0; j < cols; j++) {
                table += `
                    <td style="border: 1px solid #dee2e6; padding: 8px; position: relative;">
                        <div class="cell-content" contenteditable="true">&nbsp;</div>
                        ${j < cols - 1 ? '<div class="column-resizer"></div>' : ''}
                        ${i < rows - 1 ? '<div class="row-resizer"></div>' : ''}
                        ${j < cols - 1 && i < rows - 1 ? '<div class="corner-resizer"></div>' : ''}
                    </td>
                `;
            }
            table += '</tr>';
        }
        table += '</table>';
        this.content.focus();
        document.execCommand('insertHTML', false, table);
        
        // Añadir los manejadores de redimensionamiento
        const insertedTable = this.content.querySelector('table:last-of-type');
        this.setupTableResizers(insertedTable);
    }

    setupTableResizers(table) {
        let isResizing = false;
        let currentResizer = null;
        let startX, startY, startWidth, startHeight;

        // Añadir estilos para los redimensionadores
        const style = document.createElement('style');
        style.textContent = `
            .column-resizer {
                position: absolute;
                right: -5px;
                top: 0;
                width: 10px;
                height: 100%;
                cursor: col-resize;
                z-index: 1;
            }
            .row-resizer {
                position: absolute;
                bottom: -5px;
                left: 0;
                width: 100%;
                height: 10px;
                cursor: row-resize;
                z-index: 1;
            }
            .corner-resizer {
                position: absolute;
                right: -5px;
                bottom: -5px;
                width: 10px;
                height: 10px;
                cursor: se-resize;
                z-index: 2;
            }
            .resizing {
                user-select: none;
            }
        `;
        document.head.appendChild(style);

        // Eventos de redimensionamiento
        table.addEventListener('mousedown', e => {
            if (e.target.matches('.column-resizer, .row-resizer, .corner-resizer')) {
                isResizing = true;
                currentResizer = e.target;
                const td = currentResizer.parentElement;
                
                startX = e.pageX;
                startY = e.pageY;
                startWidth = td.offsetWidth;
                startHeight = td.offsetHeight;
                
                document.body.classList.add('resizing');
            }
        });

        document.addEventListener('mousemove', e => {
            if (!isResizing) return;

            const td = currentResizer.parentElement;
            
            if (currentResizer.classList.contains('column-resizer') || 
                currentResizer.classList.contains('corner-resizer')) {
                const width = startWidth + (e.pageX - startX);
                td.style.width = width + 'px';
            }
            
            if (currentResizer.classList.contains('row-resizer') || 
                currentResizer.classList.contains('corner-resizer')) {
                const height = startHeight + (e.pageY - startY);
                td.style.height = height + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                currentResizer = null;
                document.body.classList.remove('resizing');
            }
        });
    }

    showColorPicker(event, command, callback = null) {
        event.stopPropagation(); // Evitar que el evento se propague
        // Remover cualquier popup existente
        document.querySelectorAll('.pcpro-pine-color-popup').forEach(p => p.remove());
        
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        const popup = document.createElement('div');
        popup.className = 'pcpro-pine-color-popup';
        popup.style.top = `${rect.bottom + window.scrollY}px`;
        
        // Calcular la posición horizontal para evitar que se salga de la ventana
        const popupWidth = 200; // Ancho del popup
        let leftPos = rect.left + window.scrollX;
        
        // Si el popup se sale por la derecha, ajustar su posición
        if (leftPos + popupWidth > viewportWidth) {
            leftPos = viewportWidth - popupWidth - 10; // 10px de margen
        }
        
        popup.style.left = `${Math.max(10, leftPos)}px`;

        // Añadir preview del color
        popup.innerHTML = `
            <div class="color-grid">
                ${this.generateColorGrid()}
            </div>
            <div class="color-preview" style="background-color: ${this.lastColors[command]}"></div>
            <input type="range" min="0" max="100" value="50" class="color-range">
            <div class="color-buttons">
                <button class="apply-color">Aplicar</button>
                <button class="reset-color">Restablecer color</button>
            </div>
        `;

        let selectedColor = null;
        const preview = popup.querySelector('.color-preview');
        const rangeInput = popup.querySelector('.color-range');

        // Manejar clicks en celdas de color
        const colorCells = popup.querySelectorAll('.color-cell');
        colorCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar cierre del popup al seleccionar color
                popup.querySelectorAll('.color-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                selectedColor = cell.style.backgroundColor;
                preview.style.backgroundColor = this.adjustColor(selectedColor, rangeInput.value);
            });
        });

        // Prevenir cierre al interactuar con los controles
        popup.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        rangeInput.addEventListener('input', (e) => {
            e.stopPropagation();
            if (selectedColor) {
                preview.style.backgroundColor = this.adjustColor(selectedColor, e.target.value);
            }
        });

        const applyButton = popup.querySelector('.apply-color');
        applyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (selectedColor) {
                const finalColor = this.adjustColor(selectedColor, rangeInput.value);
                this.lastColors[command] = finalColor;
                
                if (callback) {
                    callback(finalColor);
                } else if (command === 'tableCell') {
                    const selectedCell = this.content.querySelector('td.selected');
                    if (selectedCell) {
                        selectedCell.style.backgroundColor = finalColor;
                    }
                } else {
                    document.execCommand(command, false, finalColor);
                }
                
                // Actualizar solo el indicador de color del botón principal
                const mainButton = button.previousElementSibling;
                if (mainButton) {
                    mainButton.style.setProperty('--button-color', finalColor);
                }
                popup.remove();
            }
        });

        // Añadir el evento para el botón reset
        const resetButton = popup.querySelector('.reset-color');
        resetButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const defaultColors = {
                'foreColor': '#000000',
                'backColor': '#FFFFFF',
                'tableCell': '#FFFFFF',
                'columnBack': '#FFFFFF'
            };
            
            const defaultColor = defaultColors[command];
            this.lastColors[command] = defaultColor;
            
            if (callback) {
                callback(defaultColor);
            } else if (command === 'tableCell') {
                const selectedCell = this.content.querySelector('td.selected');
                if (selectedCell) {
                    selectedCell.style.backgroundColor = defaultColor;
                }
            } else {
                document.execCommand(command, false, defaultColor);
            }
            
            const mainButton = button.previousElementSibling;
            if (mainButton) {
                mainButton.style.setProperty('--button-color', defaultColor);
            }
            popup.remove();
        });

        // Evento para cerrar el popup al hacer click fuera
        const closePopup = (e) => {
            if (!popup.contains(e.target) && e.target !== button) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        };

        // Agregar el evento después de un pequeño delay para evitar que se cierre inmediatamente
        setTimeout(() => {
            document.addEventListener('click', closePopup);
        }, 0);

        document.body.appendChild(popup);
    }

    generateColorGrid() {
        const colors = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#800000', '#808000', '#008080', '#800080', '#808080', '#C0C0C0', '#FFA500', '#A52A2A'];
        return colors.map(color => `<div class="color-cell" style="background-color: ${color};"></div>`).join('');
    }

    adjustColor(color, brightness) {
        // Convertir el color a RGB si está en formato hex
        let r, g, b;
        if (color.startsWith('#')) {
            r = parseInt(color.slice(1, 3), 16);
            g = parseInt(color.slice(3, 5), 16);
            b = parseInt(color.slice(5, 7), 16);
        } else {
            const matches = color.match(/\d+/g);
            [r, g, b] = matches.map(Number);
        }

        // Ajustar el brillo (0-100)
        // 50 es el punto medio (color original)
        // < 50 oscurece, > 50 aclara
        const factor = brightness / 50;
        
        if (factor <= 1) {
            // Oscurecer el color
            r = Math.round(r * factor);
            g = Math.round(g * factor);
            b = Math.round(b * factor);
        } else {
            // Aclarar el color
            // factor va de 1 a 2, necesitamos convertirlo a un rango de 0 a 1 para aclarar
            const lightenFactor = factor - 1; // 0 a 1
            r = Math.round(r + (255 - r) * lightenFactor);
            g = Math.round(g + (255 - g) * lightenFactor);
            b = Math.round(b + (255 - b) * lightenFactor);
        }

        // Asegurar que los valores están en el rango 0-255
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        return `rgb(${r}, ${g}, ${b})`;
    }

    attachEvents() {
        this.content.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
            }
        });

        // Unificar la gestión de clicks en celdas
        this.content.addEventListener('click', (e) => {
            const cell = e.target.closest('td');
            if (cell) {
                const table = cell.closest('table');
                if (table !== this.selectedTable) {
                    this.selectedTable = table;
                    this.tableControls.style.display = 'block';
                    this.tableControls.querySelector('.table-width-input').value = 
                        parseInt(table.style.width) || 100;
                }
                if (e.altKey) {
                    this.selectColumn(cell);
                } else if (e.ctrlKey) {
                    // Selección múltiple con Ctrl
                    this.selectedColumn = null; // Limpiar selección de columna
                    this.content.querySelectorAll('td').forEach(td => td.classList.remove('selected-column'));
                    
                    if (this.selectedCells.has(cell)) {
                        this.selectedCells.delete(cell);
                        cell.classList.remove('selected');
                    } else {
                        this.selectedCells.add(cell);
                        cell.classList.add('selected');
                    }
                } else {
                    // Selección simple
                    this.selectedCells.forEach(c => c.classList.remove('selected'));
                    this.selectedCells.clear();
                    this.selectedColumn = null;
                    this.content.querySelectorAll('td').forEach(td => {
                        td.classList.remove('selected');
                        td.classList.remove('selected-column');
                    });
                    this.selectedCells.add(cell);
                    cell.classList.add('selected');
                    this.lastSelectedCell = cell; // Guardar referencia a la última celda seleccionada
                }
            } else {
                // Click fuera de la tabla
                this.selectedTable = null;
                this.tableControls.style.display = 'none';
            }
        });

        // Prevenir el menú contextual por defecto
        this.content.addEventListener('contextmenu', (e) => {
            if (e.target.closest('td')) {
                e.preventDefault();
            }
        });

        // Detectar tecla Supr para eliminar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && (this.selectedCells.size > 0 || this.selectedColumn)) {
                this.deleteSelectedElements();
            }
        });

        // Añadir manejo de clicks en contenedores flexibles
        this.content.addEventListener('click', (e) => {
            const column = e.target.closest('.flex-column');
            const container = e.target.closest('.flex-container');
            
            if (column && container) {
                // Deseleccionar columna anterior
                if (this.selectedColumn) {
                    this.selectedColumn.classList.remove('selected-column');
                }
                
                this.selectedColumn = column;
                this.selectedContainer = container;
                column.classList.add('selected-column');
                
                // Calcular el porcentaje real de la columna
                const containerWidth = container.offsetWidth;
                const columnWidth = column.offsetWidth;
                const percentage = Math.round((columnWidth / containerWidth) * 100);
                
                // Mostrar controles con el porcentaje real
                this.columnControls.style.display = 'block';
                this.columnControls.querySelector('.column-width-input').value = percentage;
                this.enableColumnDragDrop();
            } else if (!e.target.closest('.pcpro-pine-column-controls')) {
                // Click fuera de columnas y controles
                if (this.selectedColumn) {
                    this.selectedColumn.classList.remove('selected-column');
                }
                this.selectedColumn = null;
                this.selectedContainer = null;
                this.columnControls.style.display = 'none';
            }
        });

        // Agregar soporte para atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {  // metaKey para Mac
                switch(e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            document.execCommand('redo', false);
                        } else {
                            document.execCommand('undo', false);
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        document.execCommand('redo', false);
                        break;
                }
            }
        });
    }

    selectColumn(cell) {
        const table = cell.closest('table');
        if (table) {
            // Limpiar selecciones previas
            this.selectedCells.clear();
            this.content.querySelectorAll('td').forEach(td => {
                td.classList.remove('selected');
                td.classList.remove('selected-column');
            });
            
            const cellIndex = cell.cellIndex;
            const columnCells = table.querySelectorAll(`tr td:nth-child(${cellIndex + 1})`);
            columnCells.forEach(td => {
                td.classList.add('selected-column');
            });
            
            this.selectedColumn = {
                table: table,
                index: cellIndex
            };

            // Actualizar el input con el ancho actual
            const widthInput = this.toolbar.querySelector('.pcpro-pine-width-input');
            if (widthInput) {
                const currentWidth = cell.offsetWidth;
                widthInput.value = currentWidth;
            }
        }
    }

    deleteSelectedElements() {
        if (this.selectedCells.size > 0) {
            const cellsToDelete = Array.from(this.selectedCells);
            cellsToDelete.forEach(cell => {
                const row = cell.parentElement;
                if (row.cells.length === 1) {
                    row.remove();
                } else {
                    cell.remove();
                }
            });
            this.selectedCells.clear();
        } else if (this.selectedColumn) {
            const { table, index } = this.selectedColumn;
            const rows = table.rows;
            for (let i = rows.length - 1; i >= 0; i--) {
                if (rows[i].cells.length === 1) {
                    rows[i].remove();
                } else {
                    rows[i].deleteCell(index);
                }
            }
            if (table.rows.length === 0) {
                table.remove();
            }
            this.selectedColumn = null;
        }
    }

    applyColumnWidth(percentage) {
        if (this.selectedColumn && percentage >= 1 && percentage <= 100) {
            const { table, index } = this.selectedColumn;
            const totalWidth = 100;
            
            // Guardar el ancho definido por el usuario
            if (!this.columnWidths.has(table)) {
                this.columnWidths.set(table, new Map());
            }
            const tableWidths = this.columnWidths.get(table);
            tableWidths.set(index, percentage);

            // Aplicar el ancho a la columna seleccionada
            const cells = table.querySelectorAll(`tr td:nth-child(${index + 1})`);
            cells.forEach(td => {
                td.style.width = `${percentage}%`;
                td.style.minWidth = 'unset';
                td.style.maxWidth = 'unset';
            });

            // Calcular el espacio restante y las columnas sin ancho definido
            const numCols = table.rows[0].cells.length;
            let definedWidth = 0;
            let undefinedCols = [];

            for (let i = 0; i < numCols; i++) {
                if (tableWidths.has(i)) {
                    definedWidth += tableWidths.get(i);
                } else if (i !== index) {
                    undefinedCols.push(i);
                }
            }

            // Distribuir el espacio restante entre las columnas sin ancho definido
            const remainingWidth = totalWidth - definedWidth;
            if (undefinedCols.length > 0 && remainingWidth > 0) {
                const widthPerCol = remainingWidth / undefinedCols.length;
                
                undefinedCols.forEach(colIndex => {
                    const colCells = table.querySelectorAll(`tr td:nth-child(${colIndex + 1})`);
                    colCells.forEach(td => {
                        td.style.width = `${widthPerCol}%`;
                        td.style.minWidth = 'unset';
                        td.style.maxWidth = 'unset';
                    });
                });
            }

            // Asegurar que la tabla use el nuevo sistema de ancho
            table.style.width = '100%';
            table.style.tableLayout = 'fixed';

            // Mantener la selección visual
            cells.forEach(td => td.classList.add('selected-column'));
        }
    }

    showImageDialog(event) {
        const button = event.target.closest('button'); // Aseguramos que tenemos el botón
        const rect = button.getBoundingClientRect();
        
        const popup = document.createElement('div');
        popup.className = 'pcpro-pine-image-popup';
        popup.style.position = 'absolute';
        popup.style.top = `${rect.bottom + window.scrollY + 5}px`; // Añadido pequeño margen

        // Verificar si hay espacio suficiente a la derecha
        const viewportWidth = window.innerWidth;
        if (rect.left + 300 > viewportWidth) {
            popup.style.right = '10px';
        } else {
            popup.style.left = `${Math.max(10, rect.left)}px`;
        }

        popup.innerHTML = `
            <div class="title">Insertar imagen:</div>
            <div class="pcpro-pine-image-tabs">
                <button class="tab-btn active" data-tab="url">URL</button>
                <button class="tab-btn" data-tab="file">Archivo</button>
            </div>
            <div class="tab-content url-tab active">
                <input type="url" placeholder="https://ejemplo.com/imagen.jpg" class="image-url-input">
            </div>
            <div class="tab-content file-tab">
                <input type="file" accept="image/*" class="image-file-input">
            </div>
            <div class="image-preview"></div>
            <button class="insert-image-btn">Insertar imagen</button>
        `;

        // Manejar tabs
        const tabs = popup.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                popup.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                popup.querySelector(`.${tab.dataset.tab}-tab`).classList.add('active');
            });
        });

        // Previsualizar imagen
        const preview = popup.querySelector('.image-preview');
        const urlInput = popup.querySelector('.image-url-input');
        const fileInput = popup.querySelector('.image-file-input');

        urlInput.addEventListener('input', () => { // Cambiado de 'change' a 'input'
            if (urlInput.value) {
                const img = new Image();
                img.onload = () => {
                    preview.innerHTML = `<img src="${urlInput.value}" style="max-width: 100%; max-height: 200px;">`;
                };
                img.onerror = () => {
                    preview.innerHTML = '<p style="color: red;">Error al cargar la imagen</p>';
                };
                img.src = urlInput.value;
            }
        });

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px;">`;
                };
                reader.readAsDataURL(file);
            }
        });

        // Insertar imagen
        popup.querySelector('.insert-image-btn').addEventListener('click', () => {
            const activeTab = popup.querySelector('.tab-btn.active').dataset.tab;

            if (activeTab === 'url' && urlInput.value) {
                this.insertImage(urlInput.value);
                popup.remove();
            } else if (activeTab === 'file' && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.insertImage(e.target.result);
                    popup.remove();
                };
                reader.onerror = () => {
                    console.error('Error al leer el archivo');
                };
                reader.readAsDataURL(fileInput.files[0]);
            }
        });

        // Cerrar popup al hacer clic fuera
        const closePopup = (e) => {
            if (!popup.contains(e.target) && e.target !== button) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closePopup);
        }, 100);

        document.body.appendChild(popup);
    }

    insertImage(src) {
        const img = `<img src="${src}" style="max-width: 100%; height: auto; cursor: pointer;" class="pcpro-pine-image">`;
        this.content.focus();
        document.execCommand('insertHTML', false, img);
        
        const insertedImage = this.content.querySelector('img:last-of-type');
        if (insertedImage) {
            this.attachImageEvents(insertedImage);
        }
    }

    attachImageEvents(img) {
        img.addEventListener('click', (e) => {
            e.preventDefault();
            this.selectImage(img);
        });
    }

    selectImage(img) {
        // Deseleccionar imagen anterior
        if (this.selectedImage) {
            this.selectedImage.classList.remove('selected');
        }

        this.selectedImage = img;
        img.classList.add('selected');
        
        // Mostrar controles y actualizar valor del input
        this.imageControls.style.display = 'block';
        this.imageControls.querySelector('.image-width-input').value = img.width;

        // Click fuera de la imagen deselecciona
        const handleClickOutside = (e) => {
            if (!img.contains(e.target) && !this.imageControls.contains(e.target)) {
                img.classList.remove('selected');
                this.selectedImage = null;
                this.imageControls.style.display = 'none';
                document.removeEventListener('click', handleClickOutside);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        // Añadir soporte para imágenes PDF
        if (img.closest('.pdf-page')) {
            // Remover posicionamiento absoluto para mejor manejo
            img.style.position = 'relative';
            img.style.top = 'auto';
            img.style.left = 'auto';
            
            // Asegurar que la imagen tenga los estilos necesarios
            if (!img.classList.contains('pcpro-pine-image')) {
                img.classList.add('pcpro-pine-image');
            }
        }
    }

    setupImageControls() {
        const controls = this.imageControls;
        
        controls.querySelector('.image-width-input').addEventListener('change', (e) => {
            if (this.selectedImage && e.target.value) {
                const newWidth = parseInt(e.target.value);
                if (newWidth >= 10 && newWidth <= 1000) {
                    this.selectedImage.style.width = `${newWidth}px`;
                    this.selectedImage.style.height = 'auto';
                    
                    // Mantener proporciones para imágenes PDF
                    if (this.selectedImage.closest('.pdf-page')) {
                        const originalWidth = this.selectedImage.getAttribute('data-original-width');
                        const originalHeight = this.selectedImage.getAttribute('data-original-height');
                        if (originalWidth && originalHeight) {
                            const ratio = originalHeight / originalWidth;
                            this.selectedImage.style.height = `${newWidth * ratio}px`;
                        }
                    }
                }
            }
        });

        controls.querySelector('.align-left').addEventListener('click', () => {
            if (this.selectedImage) {
                this.selectedImage.style.display = 'block';
                this.selectedImage.style.marginLeft = '0';
                this.selectedImage.style.marginRight = 'auto';
            }
        });

        controls.querySelector('.align-center').addEventListener('click', () => {
            if (this.selectedImage) {
                this.selectedImage.style.display = 'block';
                this.selectedImage.style.marginLeft = 'auto';
                this.selectedImage.style.marginRight = 'auto';
            }
        });

        controls.querySelector('.align-right').addEventListener('click', () => {
            if (this.selectedImage) {
                this.selectedImage.style.display = 'block';
                this.selectedImage.style.marginLeft = 'auto';
                this.selectedImage.style.marginRight = '0';
            }
        });

        controls.querySelector('.delete-image').addEventListener('click', () => {
            if (this.selectedImage) {
                this.selectedImage.remove();
                this.selectedImage = null;
                controls.style.display = 'none';
            }
        });

        // Añadir controles de posición del texto
        controls.querySelector('.text-top').addEventListener('click', () => {
            if (this.selectedImage) {
                // Si es una imagen PDF, primero la sacamos del contenedor PDF
                if (this.selectedImage.closest('.pdf-page')) {
                    const pdfPage = this.selectedImage.closest('.pdf-page');
                    const img = this.selectedImage;
                    img.remove();
                    pdfPage.parentNode.insertBefore(img, pdfPage);
                }
                this.wrapImageWithText(this.selectedImage, 'top');
            }
        });

        controls.querySelector('.text-right').addEventListener('click', () => {
            if (this.selectedImage) {
                // Si es una imagen PDF, primero la sacamos del contenedor PDF
                if (this.selectedImage.closest('.pdf-page')) {
                    const pdfPage = this.selectedImage.closest('.pdf-page');
                    const img = this.selectedImage;
                    img.remove();
                    pdfPage.parentNode.insertBefore(img, pdfPage);
                }
                this.wrapImageWithText(this.selectedImage, 'right');
            }
        });

        controls.querySelector('.text-bottom').addEventListener('click', () => {
            if (this.selectedImage) {
                // Si es una imagen PDF, primero la sacamos del contenedor PDF
                if (this.selectedImage.closest('.pdf-page')) {
                    const pdfPage = this.selectedImage.closest('.pdf-page');
                    const img = this.selectedImage;
                    img.remove();
                    pdfPage.parentNode.insertBefore(img, pdfPage);
                }
                this.wrapImageWithText(this.selectedImage, 'bottom');
            }
        });

        controls.querySelector('.text-left').addEventListener('click', () => {
            if (this.selectedImage) {
                // Si es una imagen PDF, primero la sacamos del contenedor PDF
                if (this.selectedImage.closest('.pdf-page')) {
                    const pdfPage = this.selectedImage.closest('.pdf-page');
                    const img = this.selectedImage;
                    img.remove();
                    pdfPage.parentNode.insertBefore(img, pdfPage);
                }
                this.wrapImageWithText(this.selectedImage, 'left');
            }
        });
    }

    wrapImageWithText(img, position) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '20px';
        container.style.margin = '10px 0';
        container.style.minHeight = '200px';
        
        const textDiv = document.createElement('div');
        textDiv.innerHTML = '<p contenteditable="true">Añade tu texto aquí</p>';
        textDiv.style.flex = '1';
        textDiv.style.minWidth = '0';
        textDiv.style.overflow = 'auto';
        textDiv.style.alignSelf = 'stretch'; // Asegura que el texto ocupe toda la altura
        
        const imgDiv = document.createElement('div');
        imgDiv.style.position = 'relative';
        imgDiv.style.minWidth = '300px'; // Ancho mínimo fijo
        imgDiv.style.maxWidth = '300px'; // Ancho máximo fijo
        imgDiv.style.alignSelf = 'flex-start'; // Mantiene la imagen arriba
        
        // Asegurarnos que la imagen mantenga sus dimensiones
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        
        // Mover la imagen al nuevo contenedor
        img.parentNode.insertBefore(container, img);
        imgDiv.appendChild(img);

        // Configurar el layout según la posición
        switch(position) {
            case 'top':
                container.style.flexDirection = 'column';
                imgDiv.style.alignSelf = 'center';
                container.appendChild(textDiv);
                container.appendChild(imgDiv);
                break;
            case 'right':
                container.style.flexDirection = 'row';
                container.style.alignItems = 'start';
                container.appendChild(textDiv);
                container.appendChild(imgDiv);
                break;
            case 'bottom':
                container.style.flexDirection = 'column';
                imgDiv.style.alignSelf = 'center';
                container.appendChild(imgDiv);
                container.appendChild(textDiv);
                break;
            case 'left':
                container.style.flexDirection = 'row';
                container.style.alignItems = 'start';
                container.appendChild(imgDiv);
                container.appendChild(textDiv);
                break;
        }

        // Añadir clase para identificar el contenedor
        container.className = 'image-text-container';
        container.style.border = '1px dashed #dee2e6';
        container.style.padding = '10px';
    }

    setupTableControls() {
        const controls = this.tableControls;
        
        // Ancho de tabla
        controls.querySelector('.table-width-input').addEventListener('change', (e) => {
            if (this.selectedTable && e.target.value) {
                const width = parseInt(e.target.value);
                if (width >= 1 && width <= 100) {
                    this.selectedTable.style.width = `${width}%`;
                }
            }
        });

        // Seleccionar columna
        controls.querySelector('.select-column').addEventListener('click', () => {
            if (this.lastSelectedCell) {
                this.selectColumn(this.lastSelectedCell);
            }
        });

        // Ancho de columna
        const columnWidthInput = controls.querySelector('.column-width-input');
        controls.querySelector('.apply-column-width').addEventListener('click', () => {
            if (this.lastSelectedCell && columnWidthInput.value) {
                const width = parseInt(columnWidthInput.value);
                if (width >= 1 && width <= 100) {
                    const cellIndex = this.lastSelectedCell.cellIndex;
                    const cells = this.selectedTable.querySelectorAll(`td:nth-child(${cellIndex + 1})`);
                    cells.forEach(cell => {
                        cell.style.width = `${width}%`;
                    });
                }
            }
        });

        // Color de celda
        controls.querySelector('.cell-color-btn').addEventListener('click', (e) => {
            if (this.lastSelectedCell) {
                // Usar el mismo código del colorPicker pero para celdas
                this.showColorPicker(e, 'tableCell');
            }
        });

        // Pintar celda con último color
        controls.querySelector('.paint-cell').addEventListener('click', () => {
            if (this.lastSelectedCell) {
                this.lastSelectedCell.style.backgroundColor = this.lastColors.tableCell;
            }
        });

        // Añadir columna
        controls.querySelector('.add-column').addEventListener('click', () => {
            if (this.selectedTable) {
                const rows = this.selectedTable.rows;
                for (let i = 0; i < rows.length; i++) {
                    const newCell = rows[i].insertCell();
                    newCell.innerHTML = '&nbsp;';
                    newCell.style.border = '1px solid #dee2e6';
                    newCell.style.padding = '8px';
                }
            }
        });

        // Eliminar columna
        controls.querySelector('.delete-column').addEventListener('click', () => {
            if (this.selectedColumn) {
                this.deleteSelectedElements();
            }
        });

        // Añadir fila
        controls.querySelector('.add-row').addEventListener('click', () => {
            if (this.selectedTable) {
                const row = this.selectedTable.insertRow();
                const cols = this.selectedTable.rows[0].cells.length;
                for (let i = 0; i < cols; i++) {
                    const cell = row.insertCell();
                    cell.innerHTML = '&nbsp;';
                    cell.style.border = '1px solid #dee2e6';
                    cell.style.padding = '8px';
                }
            }
        });

        // Eliminar fila
        controls.querySelector('.delete-row').addEventListener('click', () => {
            if (this.lastSelectedCell) {
                const row = this.lastSelectedCell.parentElement;
                row.remove();
            }
        });

        // Eliminar tabla
        controls.querySelector('.delete-table').addEventListener('click', () => {
            if (this.selectedTable) {
                this.selectedTable.remove();
                this.selectedTable = null;
                controls.style.display = 'none';
            }
        });
    }

    setupColumnControls() {
        const controls = this.columnControls;

        // Añadir columna
        controls.querySelector('.add-flex-column').addEventListener('click', () => {
            if (this.selectedContainer) {
                const newColumn = this.createDraggableColumn();
                this.selectedContainer.appendChild(newColumn);
            }
        });

        // Añadir botones de inserción en el módulo
        controls.querySelector('.insert-buttons').innerHTML = `
            <div class="button-group">
                <span class="control-label">Insertar módulos</span>
                <div class="button-row">
                    <button class="insert-image-text" title="Imagen con texto">
                        <i class="fas fa-object-group"></i>
                    </button>
                    <button class="insert-info-box" title="Cuadro de información">
                        <i class="fas fa-square-full"></i>
                    </button>
                </div>
            </div>
        `;

        controls.querySelector('.insert-image-text').addEventListener('click', () => {
            if (this.selectedColumn) {
                this.showImageTextDialog(this.selectedColumn);
            }
        });

        controls.querySelector('.insert-info-box').addEventListener('click', () => {
            if (this.selectedColumn) {
                const box = `
                    <div class="info-box" contenteditable="true" style="border: 1px solid #dee2e6; padding: 15px; margin: 10px 0; border-radius: 4px; background: #f8f9fa;">
                        <h4 style="margin-top: 0;">Título del cuadro</h4>
                        <p style="margin-bottom: 0;">Información del cuadro</p>
                    </div>
                `;
                this.selectedColumn.insertAdjacentHTML('beforeend', box);
            }
        });

        // Eliminar columna
        controls.querySelector('.remove-flex-column').addEventListener('click', () => {
            if (this.selectedColumn && this.selectedContainer.children.length > 1) {
                this.selectedColumn.remove();
                this.selectedColumn = null;
            }
        });

        // Alineación de columnas
        controls.querySelector('.align-left').addEventListener('click', () => {
            if (this.selectedContainer) {
                this.selectedContainer.style.justifyContent = 'flex-start';
            }
        });

        controls.querySelector('.align-center').addEventListener('click', () => {
            if (this.selectedContainer) {
                this.selectedContainer.style.justifyContent = 'center';
            }
        });

        controls.querySelector('.align-right').addEventListener('click', () => {
            if (this.selectedContainer) {
                this.selectedContainer.style.justifyContent = 'flex-end';
            }
        });

        controls.querySelector('.align-justify').addEventListener('click', () => {
            if (this.selectedContainer) {
                this.selectedContainer.style.justifyContent = 'space-between';
            }
        });

        // Ancho de columna
        const widthInput = controls.querySelector('.column-width-input');
        controls.querySelector('.apply-width').addEventListener('click', () => {
            if (this.selectedColumn && widthInput.value) {
                const width = parseInt(widthInput.value);
                if (width >= 1 && width <= 100) {
                    this.updateColumnWidths(this.selectedColumn, width);
                }
            }
        });

        // Color de fondo - Corregido
        controls.querySelector('.column-color-btn').addEventListener('click', (e) => {
            if (this.selectedColumn) {
                const colorPicker = (finalColor) => {
                    this.selectedColumn.style.backgroundColor = finalColor;
                };
                this.showColorPicker(e, 'columnBack', colorPicker);
            }
        });

        // Eliminar contenedor
        controls.querySelector('.delete-container').addEventListener('click', () => {
            if (this.selectedContainer) {
                this.selectedContainer.remove();
                this.selectedContainer = null;
                this.selectedColumn = null;
                controls.style.display = 'none';
            }
        });
    }

    createDraggableColumn() {
        const column = document.createElement('div');
        column.className = 'flex-column';
        
        const siblings = this.selectedContainer ? this.selectedContainer.children.length : 0;
        const equalWidth = Math.floor(100 / (siblings + 1));
        
        column.style.flex = `1 1 ${equalWidth}%`;
        column.style.flexBasis = `${equalWidth}%`;
        column.style.minWidth = '0';
        column.innerHTML = '<p contenteditable="true">Nueva columna</p>';
        column.draggable = true;
        
        column.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', '');
            column.classList.add('dragging');
        });

        column.addEventListener('dragend', () => {
            column.classList.remove('dragging');
            this.redistributeColumnWidths(column.parentElement);
        });

        // Redistribuir anchos después de añadir la nueva columna
        setTimeout(() => {
            const container = column.parentElement;
            if (container) {
                const allColumns = Array.from(container.children);
                const width = Math.floor(100 / allColumns.length);
                allColumns.forEach((col, index) => {
                    if (index === allColumns.length - 1) {
                        // La última columna absorbe la diferencia
                        const usedWidth = width * (allColumns.length - 1);
                        col.style.flex = `1 1 ${100 - usedWidth}%`;
                        col.style.flexBasis = `${100 - usedWidth}%`;
                    } else {
                        col.style.flex = `1 1 ${width}%`;
                        col.style.flexBasis = `${width}%`;
                    }
                });
            }
        }, 0);

        return column;
    }

    redistributeColumnWidths(container) {
        if (!container) return;
        
        const columns = Array.from(container.children);
        const equalWidth = Math.floor(100 / columns.length);
        const remainder = 100 - (equalWidth * columns.length);
        
        columns.forEach((col, index) => {
            if (index === columns.length - 1) {
                // La última columna toma el resto
                const finalWidth = equalWidth + remainder;
                col.style.flex = `1 1 ${finalWidth}%`;
                col.style.flexBasis = `${finalWidth}%`;
            } else {
                col.style.flex = `1 1 ${equalWidth}%`;
                col.style.flexBasis = `${equalWidth}%`;
            }
        });
    }

    enableColumnDragDrop() {
        if (this.selectedContainer) {
            this.selectedContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggable = this.selectedContainer.querySelector('.dragging');
                if (!draggable) return;

                const afterElement = this.getDragAfterElement(this.selectedContainer, e.clientX);
                if (afterElement) {
                    this.selectedContainer.insertBefore(draggable, afterElement);
                } else {
                    this.selectedContainer.appendChild(draggable);
                }
            });
        }
    }

    getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.flex-column:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    getContent() {
        return this.content.innerHTML;
    }

    setContent(html) {
        this.content.innerHTML = html;
    }

    insertTwoColumns() {
        const columns = `
            <div class="flex-container">
                <div class="flex-column" style="flex-basis: 50%;">
                    <p contenteditable="true">Contenido izquierda</p>
                </div>
                <div class="flex-column" style="flex-basis: 50%;">
                    <p contenteditable="true">Contenido derecha</p>
                </div>
            </div>
            <p><br></p>
        `;
        
        document.execCommand('insertHTML', false, columns);
    }

    showImageTextDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'pcpro-pine-image-text-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="title">Insertar imagen con texto:</div>
                <div class="pcpro-pine-image-tabs">
                    <button class="tab-btn active" data-tab="url">URL</button>
                    <button class="tab-btn" data-tab="file">Archivo</button>
                </div>
                <div class="tab-content url-tab active">
                    <input type="url" placeholder="https://ejemplo.com/imagen.jpg" class="image-url-input">
                </div>
                <div class="tab-content file-tab">
                    <input type="file" accept="image/*" class="image-file-input">
                    <div class="image-preview"></div>
                </div>
                <div class="position-section">
                    <div class="title-small">Posición de la imagen:</div>
                    <div class="position-buttons">
                        <button data-position="left">Imagen a la izquierda</button>
                        <button data-position="right">Imagen a la derecha</button>
                    </div>
                </div>
            </div>
        `;

        // Manejar tabs
        const tabs = dialog.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                dialog.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                dialog.querySelector(`.${tab.dataset.tab}-tab`).classList.add('active');
            });
        });

        // Previsualizar imagen
        const preview = dialog.querySelector('.image-preview');
        const urlInput = dialog.querySelector('.image-url-input');
        const fileInput = dialog.querySelector('.image-file-input');

        urlInput.addEventListener('input', () => {
            if (urlInput.value) {
                const img = new Image();
                img.onload = () => {
                    preview.innerHTML = `<img src="${urlInput.value}" style="max-width: 100%; max-height: 200px;">`;
                };
                img.onerror = () => {
                    preview.innerHTML = '<p style="color: red;">Error al cargar la imagen</p>';
                };
                img.src = urlInput.value;
            }
        });

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px;">`;
                };
                reader.readAsDataURL(file);
            }
        });

        // Manejar posición
        const positionButtons = dialog.querySelectorAll('.position-buttons button');
        positionButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const position = button.dataset.position;
                const activeTab = dialog.querySelector('.tab-btn.active').dataset.tab;
                let imageSrc = '';

                if (activeTab === 'url' && urlInput.value) {
                    imageSrc = urlInput.value;
                } else if (activeTab === 'file' && fileInput.files[0]) {
                    imageSrc = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(fileInput.files[0]);
                    });
                }

                if (imageSrc) {
                    this.insertImageWithText(position, imageSrc);
                    dialog.remove();
                } else {
                    alert('Por favor, selecciona una imagen primero');
                }
            });
        });

        document.body.appendChild(dialog);
    }

    insertImageWithText(position, imageSrc) {
        const container = `
            <div class="image-text-container" contenteditable="true" style="display: flex; gap: 20px; margin: 10px 0; align-items: start; padding: 10px; border: 1px dashed #dee2e6;">
                ${position === 'left' ? `
                    <div style="flex: 0 0 300px;">
                        <img src="${imageSrc}" style="width: 100%; height: auto;">
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <p>Texto junto a la imagen</p>
                    </div>
                ` : `
                    <div style="flex: 1; min-width: 0;">
                        <p>Texto junto a la imagen</p>
                    </div>
                    <div style="flex: 0 0 300px;">
                        <img src="${imageSrc}" style="width: 100%; height: auto;">
                    </div>
                `}
            </div>
        `;
        document.execCommand('insertHTML', false, container);
    }

    insertInfoBox() {
        const box = `
            <div class="info-box" contenteditable="true" style="border: 1px solid #dee2e6; padding: 15px; margin: 10px 0; border-radius: 4px; background: #f8f9fa;">
                <h4 style="margin-top: 0;">Título del cuadro</h4>
                <p style="margin-bottom: 0;">Información del cuadro</p>
            </div>
        `;
        document.execCommand('insertHTML', false, box);
    }

    async saveTemplate() {
        // Remover cualquier popup existente
        document.querySelectorAll('.pcpro-pine-template-popup').forEach(p => p.remove());

        const popup = document.createElement('div');
        popup.className = 'pcpro-pine-template-popup';
        
        // Cargar lista de plantillas
        const response = await fetch('handle_templates.php?action=list');
        const result = await response.json();
        
        popup.innerHTML = `
            <div class="template-input-group">
                <select class="template-list-dropdown">
                    <option value="">Nueva plantilla...</option>
                    ${
                        result.templates.map(t => `<option value="${t.name}">${t.name}</option>`).join('')
                    }
                </select>
                <input type="text" placeholder="Nombre de la plantilla" class="template-name-input">
                <button class="save-template-btn">
                    <i class="fas fa-check"></i>
                </button>
                <button class="delete-template-btn" title="Eliminar plantilla">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;

        const toolbarRight = document.querySelector('.pcpro-pine-toolbar');
        toolbarRight.appendChild(popup);

        const dropdown = popup.querySelector('.template-list-dropdown');
        const input = popup.querySelector('.template-name-input');
        const deleteBtn = popup.querySelector('.delete-template-btn');

        dropdown.addEventListener('change', () => {
            input.value = dropdown.value; // Rellenar el campo con la plantilla seleccionada
        });

        deleteBtn.addEventListener('click', async () => {
            if (!input.value) return;
            if (!confirm('¿Eliminar plantilla?')) return;
            const delResponse = await fetch('handle_templates.php', {
                method: 'POST',
                body: new URLSearchParams({
                    action: 'delete',
                    name: input.value
                })
            });
            const delResult = await delResponse.json();
            if (delResult.success) {
                alert(delResult.message);
                popup.remove();
            } else {
                alert('Error eliminando la plantilla');
            }
        });

        input.focus();

        popup.querySelector('.save-template-btn').addEventListener('click', async () => {
            const nombre = input.value.trim();
            if (nombre) {
                const content = this.getContent();
                const formData = new FormData();
                formData.append('action', 'save');
                formData.append('name', nombre);
                formData.append('content', content);
                
                try {
                    const response = await fetch('handle_templates.php', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    if (data.success) {
                        popup.innerHTML = `
                            <div class="template-success">
                                <i class="fas fa-check-circle"></i>
                                Plantilla guardada
                            </div>
                        `;
                        setTimeout(() => popup.remove(), 2000);
                    }
                } catch (error) {
                    alert('Error al guardar la plantilla');
                    popup.remove();
                }
            }
        });

        // Cerrar al presionar Escape o hacer clic fuera
        const closePopup = (e) => {
            if (e.key === 'Escape' || (!popup.contains(e.target) && !e.target.closest('.pcpro-pine-template-popup'))) {
                popup.remove();
                document.removeEventListener('keydown', closePopup);
                document.removeEventListener('click', closePopup);
            }
        };

        setTimeout(() => {
            document.addEventListener('keydown', closePopup);
            document.addEventListener('click', closePopup);
        }, 100);
    }

    async loadTemplate() {
        // Remover cualquier popup existente
        document.querySelectorAll('.pcpro-pine-template-popup').forEach(p => p.remove());

        const popup = document.createElement('div');
        popup.className = 'pcpro-pine-template-popup';
        try {
            const response = await fetch('handle_templates.php?action=list');
            const result = await response.json();
            popup.innerHTML = `
                <div class="template-input-group">
                    <select class="template-list-dropdown">
                        <option value="">Seleccione una plantilla</option>
                        ${
                            result.templates.map(t => `<option value="${t.name}">${t.name}</option>`).join('')
                        }
                    </select>
                    <button class="load-template-btn" title="Cargar plantilla">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="delete-template-btn" title="Eliminar plantilla">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            const toolbar = document.querySelector('.pcpro-pine-toolbar');
            toolbar.appendChild(popup);
            
            const dropdown = popup.querySelector('.template-list-dropdown');
            const loadBtn = popup.querySelector('.load-template-btn');
            const deleteBtn = popup.querySelector('.delete-template-btn');

            loadBtn.addEventListener('click', async () => {
                const selected = dropdown.value;
                if (!selected) return;
                try {
                    const res = await fetch(`handle_templates.php?action=load&name=${selected}`);
                    const data = await res.json();
                    if (data.success && data.content) {
                        this.setContent(data.content);
                        popup.remove();
                    } else {
                        alert('Error cargando la plantilla');
                    }
                } catch (error) {
                    alert('Error cargando la plantilla');
                }
            });

            deleteBtn.addEventListener('click', async () => {
                const selected = dropdown.value;
                if (!selected) return;
                if (!confirm('¿Eliminar plantilla seleccionada?')) return;
                const delResponse = await fetch('handle_templates.php', {
                    method: 'POST',
                    body: new URLSearchParams({
                        action: 'delete',
                        name: selected
                    })
                });
                const delResult = await delResponse.json();
                if (delResult.success) {
                    alert(delResult.message);
                    popup.remove();
                } else {
                    alert('Error eliminando la plantilla');
                }
            });
        } catch (error) {
            alert('Error al listar plantillas');
        }
    }

    showHTML() {
        const content = this.getContent();
        alert(content);
    }

    setupUndoRedo() {
        // Crear un MutationObserver para detectar cambios en el contenido
        const observer = new MutationObserver((mutations) => {
            // Solo guardamos el estado si los cambios no son por undo/redo
            if (!this.isUndoingRedoing) {
                this.content.dispatchEvent(new Event('contentChanged'));
            }
        });

        observer.observe(this.content, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true
        });

        // Habilitar la funcionalidad nativa de undo/redo
        document.execCommand('enableObjectResizing', false, 'true');
        document.execCommand('enableInlineTableEditing', false, 'true');
    }

    showPreview() {
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        const checkedBoxes = this.content.querySelectorAll('input[type="checkbox"]:checked');
        const checkedIndexes = new Set();
        
        // Guardar los índices de los checkbox marcados
        checkedBoxes.forEach(checkbox => {
            const list = checkbox.closest('.pcpro-pine-checklist');
            const checkboxes = list.querySelectorAll('input[type="checkbox"]');
            const index = Array.from(checkboxes).indexOf(checkbox);
            checkedIndexes.add(index);
        });
        
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Previsualización</title>
                <style>
                    body { 
                        max-width: 800px;
                        margin: 20px auto;
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    img { max-width: 100%; height: auto; }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 10px 0;
                    }
                    td {
                        border: 1px solid #dee2e6;
                        padding: 8px;
                    }
                    .flex-container {
                        display: flex;
                        gap: 20px;
                        margin: 10px 0;
                        padding: 10px;
                    }
                    .flex-column {
                        flex: 1;
                        padding: 10px;
                    }
                    .preview-header {
                        padding: 10px;
                        background: #f8f9fa;
                        border-bottom: 1px solid #dee2e6;
                        margin-bottom: 20px;
                        text-align: right;
                    }
                    .preview-header button {
                        padding: 8px 16px;
                        background: #0d6efd;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .preview-header button:hover {
                        background: #0b5ed7;
                    }
                    /* Preservar colores de fondo */
                    * { 
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Estilos para listas */
                    .list-container {
                        text-align: inherit;
                    }
                    
                    .list-container ul,
                    .list-container ol,
                    .list-container .pcpro-pine-checklist {
                        display: inline-block;
                        text-align: left;
                    }
                    
                    .checklist-item {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        width: 100%;
                    }
                    
                    .checklist-item input[type="checkbox"] {
                        margin: 0;
                        vertical-align: middle;
                    }
                    
                    /* Preservar estado de checkbox */
                    input[type="checkbox"] {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                </style>
            </head>
            <body>
                <div class="preview-header">
                    <button onclick="window.close()">Cerrar previsualización</button>
                </div>
                ${this.getContent()}
                <script>
                    // Restaurar el estado de los checkboxes
                    const checkedIndexes = ${JSON.stringify(Array.from(checkedIndexes))};
                    document.querySelectorAll('.pcpro-pine-checklist').forEach(list => {
                        const checkboxes = list.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach((checkbox, index) => {
                            checkbox.checked = checkedIndexes.includes(index);
                        });
                    });
                </script>
            </body>
            </html>
        `);
        previewWindow.document.close();
    }

    printDocument() {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        const checkedBoxes = this.content.querySelectorAll('input[type="checkbox"]:checked');
        const checkedIndexes = new Set();
        
        checkedBoxes.forEach(checkbox => {
            const list = checkbox.closest('.pcpro-pine-checklist');
            const checkboxes = list.querySelectorAll('input[type="checkbox"]');
            const index = Array.from(checkboxes).indexOf(checkbox);
            checkedIndexes.add(index);
        });
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Imprimir documento</title>
                <style>
                    @page {
                        margin: 2cm;
                        size: auto;
                    }
                    body { 
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #000;
                    }
                    @media screen {
                        body {
                            max-width: 800px;
                            margin: 20px auto;
                            padding: 20px;
                        }
                    }
                    @media print {
                        body { 
                            width: 100%;
                            margin: 0;
                            padding: 0;
                        }
                        .no-print { 
                            display: none !important; 
                        }
                    }
                    /* Estilos comunes para pantalla e impresión */
                    img { 
                        max-width: 100%; 
                        height: auto;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 10px 0;
                        page-break-inside: avoid;
                    }
                    td {
                        border: 1px solid #dee2e6;
                        padding: 8px;
                    }
                    .flex-container {
                        display: flex;
                        gap: 20px;
                        margin: 10px 0;
                        padding: 10px;
                        page-break-inside: avoid;
                    }
                    .flex-column {
                        flex: 1;
                        padding: 10px;
                    }
                    .print-header {
                        padding: 10px;
                        background: #f8f9fa;
                        border-bottom: 1px solid #dee2e6;
                        margin-bottom: 20px;
                        text-align: right;
                    }
                    .print-header button {
                        padding: 8px 16px;
                        margin-left: 10px;
                        background: #0d6efd;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .print-header button:hover {
                        background: #0b5ed7;
                    }
                    /* Preservar colores de fondo */
                    * { 
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Estilos para listas */
                    .list-container {
                        text-align: inherit;
                    }
                    
                    .list-container ul,
                    .list-container ol,
                    .list-container .pcpro-pine-checklist {
                        display: inline-block;
                        text-align: left;
                    }
                    
                    .checklist-item {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        width: 100%;
                    }
                    
                    .checklist-item input[type="checkbox"] {
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        appearance: none;
                        width: 12px;
                        height: 12px;
                        border: 1px solid #000;
                        position: relative;
                        margin-right: 8px;
                        vertical-align: middle;
                    }

                    .checklist-item input[type="checkbox"]:checked::after {
                        content: '✓';
                        position: absolute;
                        left: 1px;
                        top: -3px;
                        font-size: 12px;
                        color: #000;
                    }
                </style>
            </head>
            <body>
                <div class="print-header no-print">
                    <button onclick="window.print()">Imprimir/Guardar PDF</button>
                    <button onclick="window.close()">Cerrar</button>
                </div>
                ${this.getContent()}
                <script>
                    // Restaurar el estado de los checkboxes
                    const checkedIndexes = ${JSON.stringify(Array.from(checkedIndexes))};
                    document.querySelectorAll('.pcpro-pine-checklist').forEach(list => {
                        const checkboxes = list.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach((checkbox, index) => {
                            checkbox.checked = checkedIndexes.includes(index);
                        });
                    });
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    async importWord() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.docx,.doc';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const mammoth = await this.loadDependency('mammoth');
                    const arrayBuffer = await file.arrayBuffer();
                    
                    if (file.name.endsWith('.doc')) {
                        alert('Los archivos .doc pueden perder algún formato en la importación');
                    }

                    const result = await mammoth.convertToHtml({ 
                        arrayBuffer,
                        styleMap: [
                            "p[style-name='Heading 1'] => h1:fresh",
                            "p[style-name='Heading 2'] => h2:fresh",
                            "p[style-name='Heading 3'] => h3:fresh"
                        ],
                        preserveImages: true
                    });

                    // Limpiar y preparar el contenido
                    const cleanedContent = this.cleanWordContent(result.value);
                    
                    this.showImportDialog('Word', cleanedContent, [{
                        name: 'Documento completo', 
                        content: cleanedContent
                    }]);
                } catch (error) {
                    console.error('Error al importar Word:', error);
                    alert('Error al importar el documento Word');
                }
            }
        };
        
        input.click();
    }

    // Añadir este nuevo método para limpiar el contenido de Word
    cleanWordContent(html) {
        // Crear un elemento temporal
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Eliminar todos los estilos inline que puedan interferir
        const elements = temp.getElementsByTagName('*');
        for (let el of elements) {
            // Mantener solo algunos estilos específicos
            const style = el.style;
            const fontSize = style.fontSize;
            const fontWeight = style.fontWeight;
            const fontStyle = style.fontStyle;
            
            // Limpiar todos los estilos
            el.removeAttribute('style');
            
            // Restaurar solo los estilos que queremos mantener
            if (fontSize) el.style.fontSize = fontSize;
            if (fontWeight) el.style.fontWeight = fontWeight;
            if (fontStyle) el.style.fontStyle = fontStyle;
            
            // Convertir elementos span sin estilo en texto normal
            if (el.tagName === 'SPAN' && !el.getAttribute('style')) {
                const parent = el.parentNode;
                while (el.firstChild) {
                    parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
            }
        }

        // Normalizar espacios en blanco y eliminar líneas vacías
        temp.innerHTML = temp.innerHTML
            .replace(/\s+/g, ' ')
            .replace(/<p>\s*<\/p>/g, '');

        return temp.innerHTML;
    }

    async importExcel() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const XLSX = await this.loadDependency('XLSX');
                    const arrayBuffer = await file.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer);
                    
                    // Convertir todas las hojas a HTML
                    const sheets = workbook.SheetNames.map(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        let html = this.convertExcelToHTML(worksheet);
                        return {
                            name: sheetName,
                            content: html
                        };
                    });

                    // Mostrar diálogo de selección
                    this.showImportDialog('Excel', sheets[0].content, sheets);
                } catch (error) {
                    console.error('Error al importar Excel:', error);
                    alert('Error al importar el documento Excel');
                }
            }
        };
        
        input.click();
    }

    convertExcelToHTML(worksheet) {
        let html = '<table style="border-collapse: collapse; width: 100%;">';
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Añadir estilos para las celdas
        for (let row = range.s.r; row <= range.e.r; row++) {
            html += '<tr>';
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cell = worksheet[XLSX.utils.encode_cell({r: row, c: col})];
                const value = cell ? cell.v : '';
                const style = this.getExcelCellStyle(cell);
                html += `<td style="${style}">${value}</td>`;
            }
            html += '</tr>';
        }
        html += '</table>';
        return html;
    }

    getExcelCellStyle(cell) {
        let style = 'border: 1px solid #dee2e6; padding: 8px;';
        
        if (cell && cell.s) { // si la celda tiene estilos
            if (cell.s.font && cell.s.font.bold) {
                style += 'font-weight: bold;';
            }
            if (cell.s.fill && cell.s.fill.bgColor) {
                style += `background-color: ${cell.s.fill.bgColor.rgb};`;
            }
            if (cell.s.alignment) {
                style += `text-align: ${cell.s.alignment.horizontal};`;
            }
        }
        
        return style;
    }

    async importPDF() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const pdfjsLib = await this.loadDependency('pdfjsLib');
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    const pages = [];
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 1.5 });
                        
                        // Extraer texto con formato
                        const textContent = await page.getTextContent();
                        const textItems = await this.processTextContent(textContent, viewport);
                        
                        // Extraer imágenes
                        const operatorList = await page.getOperatorList();
                        const images = await this.extractImages(page, operatorList, viewport);
                        
                        // Combinar texto e imágenes
                        const pageContent = this.combineTextAndImages(textItems, images);
                        
                        pages.push({
                            name: `Página ${i}`,
                            content: pageContent
                        });
                    }
                    
                    this.showImportDialog('PDF', pages[0].content, pages);
                } catch (error) {
                    console.error('Error al importar PDF:', error);
                    alert('Error al importar el documento PDF');
                }
            }
        };
        
        input.click();
    }

    async processTextContent(textContent, viewport) {
        const styles = new Map();
        const textItems = [];
        let currentStyle = null;
        
        for (const item of textContent.items) {
            // Extraer estilos del texto
            const style = {
                fontSize: Math.round(Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1])),
                fontFamily: item.fontName,
                color: item.color || '#000000',
                bold: item.fontName.toLowerCase().includes('bold'),
                italic: item.fontName.toLowerCase().includes('italic'),
            };

            const key = JSON.stringify(style);
            if (!styles.has(key)) {
                styles.set(key, style);
            }
            
            // Verificar si es un nuevo párrafo
            const isNewParagraph = currentStyle && 
                (Math.abs(item.transform[5] - currentStyle.y) > style.fontSize * 1.5);
            
            if (isNewParagraph) {
                textItems.push({ type: 'break' });
            }
            
            textItems.push({
                text: item.str,
                style: style,
                x: item.transform[4],
                y: viewport.height - item.transform[5],
                width: item.width,
                height: item.height
            });
            
            currentStyle = {
                y: item.transform[5]
            };
        }
        
        return this.formatTextItems(textItems);
    }

    async extractImages(page, operatorList, viewport) {
        const images = [];
        const scale = 1.5;
        
        for (let i = 0; i < operatorList.fnArray.length; i++) {
            if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
                const imgData = operatorList.argsArray[i][0];
                const img = await this.getImageFromPDF(page, imgData);
                if (img) {
                    const transform = operatorList.argsArray[i][1];
                    images.push({
                        data: img,
                        x: transform[4] * scale,
                        y: viewport.height - (transform[5] * scale),
                        width: transform[0] * scale,
                        height: transform[3] * scale
                    });
                }
            }
        }
        
        return images;
    }

    async getImageFromPDF(page, imgData) {
        try {
            const img = await page.objs.get(imgData);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            const imgData2 = ctx.createImageData(img.width, img.height);
            imgData2.data.set(img.data);
            ctx.putImageData(imgData2, 0, 0);
            return canvas.toDataURL();
        } catch (error) {
            console.error('Error al extraer imagen:', error);
            return null;
        }
    }

    formatTextItems(textItems) {
        let html = '<div class="pdf-content">';
        let currentParagraph = '';
        let currentStyle = null;
        
        textItems.forEach((item, index) => {
            if (item.type === 'break' || index === textItems.length - 1) {
                if (currentParagraph) {
                    html += `<p style="margin-bottom: 1em;">${currentParagraph}</p>`;
                    currentParagraph = '';
                }
            } else {
                const style = item.style;
                const styleStr = `font-size: ${style.fontSize}px; 
                                font-family: ${style.fontFamily}; 
                                color: ${style.color};
                                font-weight: ${style.bold ? 'bold' : 'normal'};
                                font-style: ${style.italic ? 'italic' : 'normal'};`;
                
                currentParagraph += `<span style="${styleStr}">${item.text}</span>`;
            }
        });
        
        if (currentParagraph) {
            html += `<p style="margin-bottom: 1em;">${currentParagraph}</p>`;
        }
        
        html += '</div>';
        return html;
    }

    combineTextAndImages(textContent, images) {
        let html = '<div class="pdf-page" style="position: relative;">';
        
        // Añadir texto
        html += textContent;
        
        // Añadir imágenes con las mismas clases y eventos que las imágenes normales
        images.forEach(img => {
            html += `
                <img src="${img.data}" 
                     class="pcpro-pine-image"
                     style="position: relative; 
                            cursor: pointer;
                            width: ${img.width}px; 
                            height: auto;
                            margin: 10px auto;
                            display: block;"
                     data-original-width="${img.width}"
                     data-original-height="${img.height}">
            `;
        });
        
        html += '</div>';
        return html;
    }

    showImportDialog(type, previewContent, sections) {
        const dialog = document.createElement('div');
        dialog.className = 'pcpro-pine-import-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>Importar ${type}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="sections-list">
                        <h4>Seleccionar secciones:</h4>
                        ${sections.map((section, index) => `
                            <div class="section-item">
                                <label>
                                    <input type="checkbox" value="${index}" ${index === 0 ? 'checked' : ''}>
                                    ${section.name}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    <div class="preview-area">
                        <h4>Vista previa:</h4>
                        <div class="preview-content">${previewContent}</div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="import-btn">Importar selección</button>
                    <button class="cancel-btn">Cancelar</button>
                </div>
            </div>
        `;

        // Añadir estilos inline para el diálogo
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        // Eventos
        dialog.querySelector('.close-btn').onclick = () => dialog.remove();
        dialog.querySelector('.cancel-btn').onclick = () => dialog.remove();
        
        dialog.querySelector('.import-btn').onclick = () => {
            const selectedIndexes = [...dialog.querySelectorAll('input[type="checkbox"]:checked')]
                .map(cb => parseInt(cb.value));
            
            let finalContent = selectedIndexes
                .map(index => sections[index].content)
                .join('<hr>');
            
            this.content.focus();
            // Insertar contenido limpio y preparar para edición
            this.content.innerHTML += finalContent;
            
            // Asegurar que todo el contenido sea editable
            const editableElements = this.content.querySelectorAll('p, h1, h2, h3, td');
            editableElements.forEach(el => {
                el.contentEditable = 'true';
            });
            
            dialog.remove();
        };

        // Previsualización al seleccionar secciones
        dialog.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const selectedIndex = parseInt(cb.value);
                const previewArea = dialog.querySelector('.preview-content');
                previewArea.innerHTML = sections[selectedIndex].content;
            });
        });

        document.body.appendChild(dialog);
    }

    setupToolbarBehavior() {
        let hideTimeout;
        const toolbar = this.toolbar;
        const toggleBtn = this.container.querySelector('.toolbar-toggle');
        const pinBtn = toolbar.querySelector('.toolbar-pin');

        // Manejar scroll
        window.addEventListener('scroll', () => {
            if (this.isToolbarPinned) return;

            const currentScroll = window.pageYOffset;
            const toolbarRect = this.container.getBoundingClientRect();
            
            // Mostrar/ocultar botón de toggle
            toggleBtn.classList.toggle('visible', currentScroll > toolbarRect.top);

            // Manejar visibilidad de la barra
            if (currentScroll > this.lastScrollPosition) {
                // Scrolling hacia abajo
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(() => {
                    toolbar.classList.add('hidden');
                }, 1000);
            } else {
                // Scrolling hacia arriba
                toolbar.classList.remove('hidden');
            }

            this.lastScrollPosition = currentScroll;
        });

        // Manejar hover en la barra
        toolbar.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            toolbar.classList.remove('hidden');
        });

        // Evento del botón toggle
        toggleBtn.addEventListener('click', () => {
            toolbar.classList.toggle('hidden');
        });

        // Evento del botón pin
        pinBtn.addEventListener('click', () => {
            this.isToolbarPinned = !this.isToolbarPinned;
            pinBtn.classList.toggle('pinned', this.isToolbarPinned);
            toolbar.classList.toggle('fixed', this.isToolbarPinned);
            this.container.classList.toggle('has-fixed-toolbar', this.isToolbarPinned);
            
            if (this.isToolbarPinned) {
                toolbar.classList.remove('hidden');
                toggleBtn.classList.remove('visible');
            } else {
                this.lastScrollPosition = window.pageYOffset;
            }
        });
    }

    createChecklist() {
        const list = document.createElement('ul');
        list.className = 'pcpro-pine-checklist';
        const container = document.createElement('div');
        container.className = 'list-container';
        container.appendChild(list);
        list.innerHTML = `
            <li>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span contenteditable="true">Nuevo elemento</span>
                </label>
            </li>
        `;
        
        this.content.focus();
        document.execCommand('insertHTML', false, container.outerHTML);
        
        // Añadir manejador para nuevos elementos al presionar Enter
        const checklistItems = this.content.querySelectorAll('.pcpro-pine-checklist li');
        checklistItems.forEach(item => this.setupChecklistItem(item));
    }

    setupChecklistItem(item) {
        const span = item.querySelector('span');
        span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const newItem = document.createElement('li');
                newItem.innerHTML = `
                    <label class="checklist-item">
                        <input type="checkbox">
                        <span contenteditable="true"></span>
                    </label>
                `;
                item.parentNode.insertBefore(newItem, item.nextSibling);
                this.setupChecklistItem(newItem);
                newItem.querySelector('span').focus();
            }
        });
    }

    applyCommand(command, value) {
        if (command === 'fontSize') {
            this.content.focus();
            document.execCommand('fontSize', false, 7);
            const fontElems = this.content.querySelectorAll('font[size="7"]');
            fontElems.forEach(el => {
                const span = document.createElement('span');
                span.style.fontSize = value + 'px';
                while (el.firstChild) {
                    span.appendChild(el.firstChild);
                }
                el.replaceWith(span);
            });
            return;
        }
        document.execCommand(command, false, value);
    }

    updateColumnWidths(selectedColumn, newWidth) {
        if (!this.selectedContainer) return;
        
        const columns = Array.from(this.selectedContainer.children);
        
        // Validar y limitar el nuevo ancho
        newWidth = Math.max(1, Math.min(100, parseInt(newWidth)));
        
        // Calcular espacio restante y distribuirlo
        const remainingWidth = 100 - newWidth;
        const otherColumns = columns.filter(col => col !== selectedColumn);
        const widthPerOther = Math.floor(remainingWidth / otherColumns.length);
        
        // Aplicar los nuevos anchos
        selectedColumn.style.flex = `1 1 ${newWidth}%`;
        selectedColumn.style.flexBasis = `${newWidth}%`;
        
        otherColumns.forEach((col, index) => {
            if (index === otherColumns.length - 1) {
                // La última columna ajusta cualquier diferencia
                const actualWidth = 100 - newWidth - (widthPerOther * (otherColumns.length - 1));
                col.style.flex = `1 1 ${actualWidth}%`;
                col.style.flexBasis = `${actualWidth}%`;
            } else {
                col.style.flex = `1 1 ${widthPerOther}%`;
                col.style.flexBasis = `${widthPerOther}%`;
            }
        });
    }

    createDraggableColumn() {
        const column = document.createElement('div');
        column.className = 'flex-column';
        
        const siblings = this.selectedContainer ? this.selectedContainer.children.length : 0;
        const equalWidth = Math.floor(100 / (siblings + 1));
        
        column.style.flex = `1 1 ${equalWidth}%`;
        column.style.flexBasis = `${equalWidth}%`;
        column.style.minWidth = '0';
        column.innerHTML = '<p contenteditable="true">Nueva columna</p>';
        column.draggable = true;
        
        column.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', '');
            column.classList.add('dragging');
        });

        column.addEventListener('dragend', () => {
            column.classList.remove('dragging');
            this.redistributeColumnWidths(column.parentElement);
        });

        // Redistribuir anchos después de añadir la nueva columna
        setTimeout(() => {
            const container = column.parentElement;
            if (container) {
                const allColumns = Array.from(container.children);
                const width = Math.floor(100 / allColumns.length);
                allColumns.forEach((col, index) => {
                    if (index === allColumns.length - 1) {
                        // La última columna absorbe la diferencia
                        const usedWidth = width * (allColumns.length - 1);
                        col.style.flex = `1 1 ${100 - usedWidth}%`;
                        col.style.flexBasis = `${100 - usedWidth}%`;
                    } else {
                        col.style.flex = `1 1 ${width}%`;
                        col.style.flexBasis = `${width}%`;
                    }
                });
            }
        }, 0);

        return column;
    }

    redistributeColumnWidths(container) {
        if (!container) return;
        
        const columns = Array.from(container.children);
        const equalWidth = Math.floor(100 / columns.length);
        const remainder = 100 - (equalWidth * columns.length);
        
        columns.forEach((col, index) => {
            if (index === columns.length - 1) {
                // La última columna toma el resto
                const finalWidth = equalWidth + remainder;
                col.style.flex = `1 1 ${finalWidth}%`;
                col.style.flexBasis = `${finalWidth}%`;
            } else {
                col.style.flex = `1 1 ${equalWidth}%`;
                col.style.flexBasis = `${equalWidth}%`;
            }
        });
    }
}
