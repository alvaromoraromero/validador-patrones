const COMPROBADOS = new Set();
const RECUENTO = {};
window.onload = () => {
    document.getElementById('velocidad').addEventListener('input', function() {
        document.getElementById('velocidadSpan').textContent = this.value==0 ? 'lo más rápido posible' : `esperar ${this.value}ms entre cada comprobación`;
    });
    document.querySelectorAll('input[name="tipo"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.tipogrp').forEach(div => {
                div.style.display = 'none';
                div.querySelectorAll('input').forEach(input => {
                    input.value = '';
                    input.required = '';
                });
            })
            const selected = document.getElementById(radio.value);
            selected.style.display = '';
            selected.querySelectorAll('input').forEach(input => {
                input.required = '1';
            });
            console.log(radio.value);
            if (radio.value == 'patron_dibujo') {
                dibujarGrid(selected.querySelector('canvas'), 'salmon');
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

        case 'patron_dibujo':
            alert('¡Funcionalidad no disponible por el momento!')
            break;

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
    document.querySelectorAll('.tipogrp').forEach(div => div.querySelectorAll('input').forEach(input => input.value = ''));
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
    const saltos = {
        '1,3': 2, '3,1': 2,
        '1,7': 4, '7,1': 4,
        '3,9': 6, '9,3': 6,
        '7,9': 8, '9,7': 8,
        '1,9': 5, '9,1': 5,
        '3,7': 5, '7,3': 5,
        '2,8': 5, '8,2': 5,
        '4,6': 5, '6,4': 5
    };

    let anterior = patron[0];
    visitados.add(anterior);

    for (let i = 1; i < patron.length; i++) {
        const actual = patron[i];
        if (visitados.has(actual)) {
            return { valido: false, motivo: `No se puede repetir un número que ya se ha visitado`, conflicto: actual };
        }

        const clave = `${anterior},${actual}`;
        if (saltos[clave] && !visitados.has(String(saltos[clave]))) {
            return { valido: false, motivo: `No se puede saltar un número intermedio (${anterior}<span class="salto">${saltos[clave]}</span>${actual}) sin visitarlo`, conflicto: `${anterior}${actual}`};
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

            const mostrar = document.querySelector('input[name="mostrar"]:checked').value;
            const vista = document.querySelector('select#vista').value.split("_");
            const cuadricula_patron = (vista[0] == 'cuadricula' && typeof vista[2] !== 'undefined');

            const p = document.createElement('p');
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
            spanMotivo.style.display = document.getElementById('motivos').checked ? '' : 'none';

            const div = document.createElement('div');
            div.innerHTML = `${patron.replaceAll(resultado.conflicto, `<span class="conflicto" style="text-decoration-line: ${document.getElementById('motivos').checked ? 'spelling-error' : 'none'};">${resultado.conflicto}</span>`)}`;
            div.append(spanValidez);
            p.append(ojoVisualizar);
            p.append(div);
            p.append(spanMotivo);
            p.className = resultado.valido ? 'valido' : 'invalido';
            p.style.display = (!resultado.valido && mostrar=="1" || resultado.valido && mostrar=="2") ? 'none' : '';
            p.style.flexDirection = cuadricula_patron ? 'column' : '';
            document.getElementById('patrones').prepend(p);

            if (velocidad > 0) resolve();
        }, velocidad);
        if (velocidad == 0) resolve();
    });
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
        ctx.strokeStyle = "#888";
        ctx.stroke();
    }
}

function dibujarPatron(patron, canvas) {
    const { r, positions } = calcularCanvas(canvas);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!esPatronValido(patron).valido) {
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