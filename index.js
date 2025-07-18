const COMPROBADOS = new Set();
const RECUENTO = {};

const PRUEBASUNITARIAS = [
    // [OK] Válidos
    { patron: '1234', esValido: true },      // simple, sin saltos
    { patron: '1245789', esValido: true },   // largo válido, sin saltos prohibidos
    { patron: '241578963', esValido: true },  // largo válido, visita intermedios

    // [ERR] Demasiado corto
    { patron: '', esValido: false },
    { patron: '1', esValido: false },
    { patron: '12', esValido: false },
    { patron: '123', esValido: false },

    // [ERR] Demasiado largo
    { patron: '1234567891', esValido: false },
    { patron: '12345678912', esValido: false },

    // [ERR] Caracteres no permitidos
    { patron: '12a4', esValido: false },
    { patron: '1*34', esValido: false },
    { patron: '1024', esValido: false },
    { patron: '-124', esValido: false },

    // [ERR] Repetido
    { patron: '1123', esValido: false },
    { patron: '12321', esValido: false },

    // [ERR] Salto prohibido (porque el intermedio no fue visitado)
    { patron: '1369', esValido: false },       // salta el 2
    { patron: '3147', esValido: false },       // salta el 2
    { patron: '7123', esValido: false },       // salta el 4
    { patron: '1789', esValido: false },       // salta el 4
    { patron: '1987', esValido: false },       // salta el 5
    { patron: '9147', esValido: false },       // salta el 5
    { patron: '4698', esValido: false },       // salta el 5
    { patron: '6412', esValido: false },       // salta el 5
    { patron: '3741', esValido: false },       // salta el 5
    { patron: '7321', esValido: false },       // salta el 5
    { patron: '7963', esValido: false },       // salta el 8
    { patron: '9753', esValido: false },       // salta el 8

    // [OK] Otros válidos con intermedios visitados antes
    { patron: '1253', esValido: true },      // visita 2 antes de 3
    { patron: '1546', esValido: true },      // visita 5 antes de 9
    { patron: '5376', esValido: true },      // visita 5 antes de saltar
];

const SALTOS = {
    '1,3': 2, '3,1': 2,
    '1,7': 4, '7,1': 4,
    '3,9': 6, '9,3': 6,
    '7,9': 8, '9,7': 8,
    '1,9': 5, '9,1': 5,
    '3,7': 5, '7,3': 5,
    '2,8': 5, '8,2': 5,
    '4,6': 5, '6,4': 5
};

window.onload = () => {
    document.getElementById('velocidad').addEventListener('input', function() {
        document.getElementById('velocidadSpan').textContent = this.value==0 ? 'lo más rápido posible' : `esperar ${this.value}ms entre cada comprobación`;
    });
    document.querySelectorAll('input[name="tipo"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.tipogrp').forEach(div => {
                div.style.display = 'none';
                div.style.opacity = '';
                div.style.position = '';
                div.style.pointerEvents = '';
                div.querySelectorAll('input:not([type="range"])').forEach(input => {
                    input.value = '';
                    input.required = '';
                });
            })
            const selected = document.getElementById(radio.value);
            selected.style.display = '';
            selected.querySelectorAll('input').forEach(input => {
                input.required = '1';
            });
            const comprobarBtn = document.getElementById('comprobar');
            comprobarBtn.textContent = '✔️ Comprobar';
            if (radio.value == 'patron_dibujo') {
                comprobarBtn.textContent = '➕ Agregar';
                const canvas = selected.querySelector('canvas');
                dibujarGrid(canvas, 'salmon');
                const patronDiv = document.getElementById('patron');
                patronDiv.style.display = '';
                patronDiv.style.opacity = '0';
                patronDiv.style.position = 'absolute';
                patronDiv.style.pointerEvents = 'none';
                const input = patronDiv.querySelector('input[name="patron"]');
                input.required = 1;

                let patron = [];             // Secuencia actual
                let dibujando = false;       // Flag para saber si estamos arrastrando
                const { r, positions } = calcularCanvas(canvas);

                // redibuja la grid inicial
                dibujarGrid(canvas);

                canvas.addEventListener("mousedown", (e) => {
                    patron = [];
                    dibujando = true;
                    procesarPosicion(e);
                });

                canvas.addEventListener("mousemove", (e) => {
                    if (!dibujando) return;
                    procesarPosicion(e);
                });

                canvas.addEventListener("mouseup", () => {
                    dibujando = false;
                    input.value = patron.join("");
                });

                canvas.addEventListener("mouseleave", () => {
                    if (dibujando) {
                        dibujando = false;
                        input.value = patron.join("");
                    }
                });

                // Eventos táctiles
                canvas.addEventListener("touchstart", (e) => {
                    e.preventDefault(); // evita el scroll
                    patron = [];
                    dibujando = true;
                    procesarPosicion(e.touches[0]);
                });

                canvas.addEventListener("touchmove", (e) => {
                    e.preventDefault(); // evita el scroll
                    if (!dibujando) return;
                    procesarPosicion(e.touches[0]);
                });

                canvas.addEventListener("touchend", () => {
                    dibujando = false;
                    input.value = patron.join("");
                });

                canvas.addEventListener("touchcancel", () => {
                    if (dibujando) {
                        dibujando = false;
                        input.value = patron.join("");
                    }
                });

                function procesarPosicion(e) {
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * canvas.width / rect.width;
                    const y = (e.clientY - rect.top) * canvas.height / rect.height;

                    for (let i = 1; i <= 9; i++) {
                        const { x: cx, y: cy } = positions[i];
                        const distancia = Math.hypot(x - cx, y - cy);
                        if (distancia <= r) {
                            if (!patron.includes(i)) {
                                // Si hay salto y el intermedio no está aún, lo agregamos primero
                                const intermedio = SALTOS[`${patron[patron.length - 1]},${i}`];
                                if (intermedio && !patron.includes(intermedio)) patron.push(intermedio);

                                patron.push(i);
                                dibujarGrid(canvas);
                                dibujarPatron(patron.join(''), canvas, true);
                            }
                            break;
                        }
                    }
                }
            }
            if (radio.value == 'patron_aleatorio') {
                comprobarBtn.textContent = '🔀 Generar';
                const longitud = selected.querySelector('input[name="patron_longitud"]');
                const span = selected.querySelector('span');
                longitud.addEventListener('input', function() {
                    span.textContent = this.value;
                });
            }
        });
    });
    document.querySelectorAll('input[name="mostrar"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('#patrones > p').forEach(p => p.style.display = radio.value=="0" ? '' : 'none');
            if (radio.value=="0") return;
            document.querySelectorAll(`#patrones .${radio.value=="1" ? '' : 'in'}valido`).forEach(p => p.style.display = '');
        });
    });
}

function alternarMotivos() {
    document.querySelectorAll('#patrones > p span.motivo').forEach(span => {
        span.style.display = document.getElementById('motivos').checked ? '' : 'none';
    });
    document.querySelectorAll('#patrones > p span.conflicto').forEach(span => {
        span.style.textDecorationLine = document.getElementById('motivos').checked ? 'spelling-error' : 'none';
    });
}

function cambiarVista(vista) {
    const motivos = document.getElementById('motivos');
    motivos.disabled = 1;
    motivos.checked = false;
    alternarMotivos();

    const patronesDiv = document.getElementById('patrones');
    document.querySelectorAll('#patrones > p').forEach(p => {
        p.style.minWidth = '';
        p.style.flexDirection = '';
    });
    document.querySelectorAll('#patrones > p a.validez').forEach(a => a.style.display = '');
    document.querySelectorAll('#patrones > p canvas').forEach(c => c.style.display = 'none');
    patronesDiv.style.flexDirection = '';
    patronesDiv.style.flexWrap = '';
    switch (vista.split("_")[0]) {
        case 'fila':
            document.querySelectorAll('#patrones > p').forEach(p => p.style.minWidth = 'max-content');
            break;

        case 'cuadricula':
            patronesDiv.style.flexWrap = 'wrap';
            const tipo = vista.split("_")[1];
            if (tipo == 'columna') patronesDiv.style.flexDirection = 'column';
            const patron = vista.split("_")[2];
            if (typeof patron !== 'undefined') {
                document.querySelectorAll('#patrones > p').forEach(p => p.style.flexDirection = 'column');
                document.querySelectorAll('#patrones > p a.validez').forEach(a => a.style.display = 'none');
                document.querySelectorAll('#patrones > p canvas').forEach(c => c.style.display = '');
            }
            break;
    
        default:
            motivos.disabled = '';
            patronesDiv.style.flexDirection = 'column';
            break;
    }
}

async function validarForm() {
    document.getElementById('resetAll').disabled = document.getElementById('comprobar').disabled = 1;
    document.body.style.cursor = 'progress';
    if (!RECUENTO.fin) resetAll();
    RECUENTO.inicio = RECUENTO.fin;
    switch (document.querySelector('input[name="tipo"]:checked').value) {
        case 'patron_rango':
            const inicio = parseInt(document.getElementById('patron_rango_inicio').value, 10);
            const fin = parseInt(document.getElementById('patron_rango_fin').value, 10);

            RECUENTO.fin += fin-inicio;
            if (RECUENTO.fin++ < 0) break;

            for (let i = inicio; i <= fin; i++) {
                if (COMPROBADOS.has(i)) {
                    RECUENTO.fin--;
                    continue;
                }
                else COMPROBADOS.add(i);
                await agregarPatron(`${i}`);
            }
            break;
        
        case 'patron_aleatorio':
            const input = document.querySelector('#patron input[name="patron"]');
            const longitud = document.querySelector('#patron_aleatorio input[name="patron_longitud"]').value;
            const min = Math.pow(10, longitud - 1); // 10^(l-1), por ejemplo (l=5) => 10000
            const max = Math.pow(10, longitud) - 1; // 10^l - 1, por ejemplo (l=5) => 99999

            let patron;
            do {
                patron = Math.floor(Math.random() * (max - min + 1)) + min;
            } while (!esPatronValido(`${patron}`).valido);
            input.value = patron;

        default:
            const i = parseInt(document.querySelector('input[name="patron"]').value, 10);
            if (COMPROBADOS.has(i)) break;
            else COMPROBADOS.add(i);
            RECUENTO.fin++;
            await agregarPatron(`${i}`);
            break;
    }
    document.getElementById('resetAll').disabled = document.getElementById('comprobar').disabled = '';
    document.body.style.cursor = '';
    document.querySelectorAll('.tipogrp').forEach(div => {
        div.querySelectorAll('input:not([type="range"])').forEach(input => input.value = '');
        div.querySelectorAll('canvas').forEach(canvas => dibujarGrid(canvas));
    });
}

function resetAll() {
    document.getElementById('resetAll').disabled = 1;
    COMPROBADOS.clear();
    RECUENTO.fin = 0;
    RECUENTO.valido = 0;
    RECUENTO.invalido = 0;
    document.getElementById('totalInicio').textContent = 0;
    document.getElementById('totalFin').textContent = 0;
    document.getElementById('totalV').textContent = 0;
    document.getElementById('totalF').textContent = 0;
    document.getElementById('mostrarTodoSpan').textContent = 0;
    document.getElementById('mostrarValidosSpan').textContent = 0;
    document.getElementById('mostrarInvalidosSpan').textContent = 0;
    document.getElementById('patrones').innerHTML = '';
}

function esPatronValido(patron) {
    if (typeof patron !== "string") return { valido: false, motivo: 'Formato patrón no válido', conflicto: patron};
    if (patron.length < 4) return { valido: false, motivo: 'Patrón demasiado corto. Longitud mínima: 4', conflicto: patron};
    if (patron.length > 9) return { valido: false, motivo: 'Patrón demasiado largo. Longitud máxima: 9', conflicto: patron};
    const caracteresIlegales = [...patron].find(c => !/[1-9]/.test(c));
    if (caracteresIlegales) return { valido: false, motivo: "Solo se pueden usar cifras del 1 al 9", conflicto: caracteresIlegales };

    const visitados = new Set();

    let anterior = patron[0];
    visitados.add(anterior);

    for (let i = 1; i < patron.length; i++) {
        const actual = patron[i];
        if (visitados.has(actual)) {
            return { valido: false, motivo: `No se puede repetir un número que ya se ha visitado`, conflicto: actual };
        }

        const clave = `${anterior},${actual}`;
        if (SALTOS[clave] && !visitados.has(String(SALTOS[clave]))) {
            return { valido: false, motivo: `No se puede saltar un número intermedio (${anterior}<span class="salto">${SALTOS[clave]}</span>${actual}) sin visitarlo`, conflicto: `${anterior}${actual}`};
        }

        visitados.add(actual);
        anterior = actual;
    }

    return { valido: true, motivo: 'OK' };
}

function agregarPatron(patron) {
    const velocidad = parseInt(document.getElementById('velocidad').value, 10);
    return new Promise(resolve => {
        setTimeout(() => {
            const resultado = esPatronValido(patron);
            document.getElementById('totalInicio').textContent = ++RECUENTO.inicio;
            document.getElementById('totalFin').textContent = RECUENTO.fin;
            document.getElementById('mostrarTodoSpan').textContent = RECUENTO.inicio;
            document.getElementById(resultado.valido ? 'totalV' : 'totalF').textContent = ++RECUENTO[resultado.valido ? 'valido' : 'invalido'];
            document.getElementById('mostrarValidosSpan').textContent = RECUENTO.valido;
            document.getElementById('mostrarInvalidosSpan').textContent = RECUENTO.invalido;


            const p = document.createElement('p');
            rellenarParrafoPatron(p, patron, resultado);
            document.getElementById('patrones').prepend(p);

            if (velocidad > 0) resolve();
        }, velocidad);
        if (velocidad == 0) resolve();
    });
}

function rellenarParrafoPatron(p, patron, resultado, config={}) {
    const mostrar = config.mostrar ?? document.querySelector('input[name="mostrar"]:checked').value;
    const mostrarMotivos = config.motivos ?? document.getElementById('motivos').checked;
    const vista = (config.vista ?? document.querySelector('select#vista').value).split("_");
    const cuadricula_patron = (vista[0] == 'cuadricula' && typeof vista[2] !== 'undefined');

    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    canvas.style.zoom = '.4';
    canvas.style.display = cuadricula_patron ? '' : 'none';
    p.append(canvas);
    dibujarPatron(patron, canvas);

    const ojoVisualizar = document.createElement('a');
    ojoVisualizar.className = 'validez';
    ojoVisualizar.textContent = '👁️';
    ojoVisualizar.addEventListener('click', () => mostrarDialogPatron(patron));
    ojoVisualizar.style.cursor = 'pointer';
    ojoVisualizar.title = 'Visualizar patrón';
    ojoVisualizar.style.display = cuadricula_patron ? 'none' : '';

    const spanValidez = document.createElement('span');
    spanValidez.className = 'validez';
    spanValidez.textContent = resultado.valido ? '✅' : '❌';

    const spanMotivo = document.createElement('span');
    spanMotivo.className = 'motivo';
    spanMotivo.innerHTML = `${resultado.motivo}.`;
    spanMotivo.style.display = mostrarMotivos ? '' : 'none';

    const div = document.createElement('div');
    div.innerHTML = `${patron.replaceAll(resultado.conflicto, `<span class="conflicto" style="text-decoration-line: ${mostrarMotivos ? 'spelling-error' : 'none'};">${resultado.conflicto}</span>`)}`;
    div.append(spanValidez);
    p.append(ojoVisualizar);
    p.append(div);
    p.append(spanMotivo);
    p.className = resultado.valido ? 'valido' : 'invalido';
    p.style.display = (!resultado.valido && mostrar=="1" || resultado.valido && mostrar=="2") ? 'none' : '';
    p.style.flexDirection = cuadricula_patron ? 'column' : '';
}

function mostrarDialogPatron(patron) {
    const dialogPatron = document.getElementById('dialogPatron');
    dialogPatron.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    dialogPatron.append(canvas);
    dibujarPatron(patron, canvas);

    dialogPatron.showModal();
}

function mostrarDialogPruebasUnitarias() {
    const dialogPruebasUnitarias = document.getElementById('dialogPruebasUnitarias');
    dialogPruebasUnitarias.innerHTML = '';

    const divPatrones = document.createElement('div');
    divPatrones.id = 'patrones';
    divPatrones.style.flexDirection = 'column';
    const resultadosPruebas = cargarPruebasUnitarias(divPatrones);
    dialogPruebasUnitarias.append(divPatrones);

    const p = document.createElement('p');
    p.style.margin = '10px';
    p.innerHTML = `De un total de ${PRUEBASUNITARIAS.length} pruebas unitarias:<br><ul><li>${resultadosPruebas.validos} fueron realizadas correctamente.</li><li>${resultadosPruebas.invalidos} devolvieron error.</li><li>${resultadosPruebas.omitidos} fueron omitidas.</li></ul>`;
    dialogPruebasUnitarias.prepend(p);

    dialogPruebasUnitarias.showModal();
}

function cargarPruebasUnitarias(divPatrones) {
    const resultadosPruebas = {validos: 0, invalidos:0, omitidos: 0};
    PRUEBASUNITARIAS.forEach(pruebaUnitaria => {
        const patron = pruebaUnitaria.patron;
        const resultado = esPatronValido(patron)
        const p = document.createElement('p');
        rellenarParrafoPatron(p, patron, resultado, {mostrar: 0, motivos: true, vista: 'lista'});
        if (pruebaUnitaria.habilitado === false) {
            resultadosPruebas.omitidos++;
            p.style.backgroundColor = '#cccccc';
            p.append('Test omitido (deshabilitado).');
        }
        else if (pruebaUnitaria.esValido!=resultado.valido) {
            resultadosPruebas.invalidos++;
            p.style.backgroundColor = '#ffcccc';
            const motivoFalloTest = document.createElement('span');
            motivoFalloTest.textContent = `El test esperaba que el patron fuese ${pruebaUnitaria.esValido ? '' : 'in'}válido.`;
            p.append(motivoFalloTest);
        } else {
            resultadosPruebas.validos++;
            p.style.backgroundColor = '#ccffcc';
        }
        divPatrones.append(p);
    });
    return resultadosPruebas;
}

function calcularCanvas(canvas) {
    // radio del círculo
    const r = 20;
    // márgenes
    const marginX = canvas.width / 6;
    const marginY = canvas.height / 6;

    // calcula las coordenadas de cada posición del patrón
    const positions = {};
    for (let i = 1; i <= 9; i++) {
        const x = marginX + ((i - 1) % 3) * (marginX * 2);
        const y = marginY + Math.floor((i - 1) / 3) * (marginY * 2);
        positions[i] = { x, y };
    }
    return { r, positions};
}

function dibujarGrid(canvas, color = "#ccc") {
    const { r, positions } = calcularCanvas(canvas);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // dibuja los 9 círculos
    for (let i = 1; i <= 9; i++) {
        const { x, y } = positions[i];
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#888";
        ctx.stroke();
    }
}

function dibujarPatron(patron, canvas, permitirInvalido = false) {
    const { r, positions } = calcularCanvas(canvas);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!permitirInvalido && !esPatronValido(patron).valido) {
        dibujarGrid(canvas, 'salmon');
        return;
    }
    patron = patron.split('').map(Number);
    dibujarGrid(canvas);

    for (let i = 0; i < patron.length; i++) {
        const { x, y } = positions[patron[i]];
        ctx.beginPath();
        ctx.arc(x, y, r-7, 0, Math.PI * 2);
        ctx.fillStyle = "#3498db";
        ctx.fill();
        ctx.strokeStyle = "#2980b9";
        ctx.stroke();
    }

    ctx.strokeStyle = "#2980b9";
    ctx.lineWidth = 4;
    ctx.beginPath();

    for (let i = 0; i < patron.length; i++) {
        const { x, y } = positions[patron[i]];
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    for (let i = 0; i < patron.length; i++) {
        const { x, y } = positions[patron[i]];
        ctx.fillStyle = i===0 ? "#ff0" : "#0ff";
        // primer punto: dibuja triángulo orientado al siguiente
        if (i !== patron.length -1) {
            const next = positions[patron[i+1]];

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.atan2(next.y - y, next.x - x)+1.55);

            ctx.beginPath();
            ctx.moveTo(0, -6);  // punta
            ctx.lineTo(-6, 6);   // base izquierda
            ctx.lineTo(6, 6);    // base derecha
            ctx.closePath();

            ctx.fill();
            ctx.restore();
        }

        // último punto: dibuja un cuadrado
        else {
            const size = 10;
            ctx.fillRect(x - size/2, y - size/2, size, size);
        }
    }
}