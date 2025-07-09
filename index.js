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
                await pintarPatron(`${i}`);
            }
            break;

        default:
            const i = parseInt(document.querySelector('input[name="patron"]').value, 10);
            if (COMPROBADOS.has(i)) break;
            else COMPROBADOS.add(i);
            RECUENTO.fin++;
            await pintarPatron(`${i}`);
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
    if (!/^[1-9]{4,9}$/.test(patron)) {
        return false; // solo cifras 1-9, longitud 4-9
    }

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
            return false; // no se puede repetir
        }

        const clave = `${anterior},${actual}`;
        if (saltos[clave] && !visitados.has(String(saltos[clave]))) {
            return false; // no se puede saltar el número intermedio sin visitarlo
        }

        visitados.add(actual);
        anterior = actual;
    }

    return true;
}

function pintarPatron(patron) {
    return new Promise(resolve => {
        setTimeout(() => {
            const valido = esPatronValido(patron);
            document.getElementById('totalInicio').textContent = ++RECUENTO.inicio;
            document.getElementById('totalFin').textContent = RECUENTO.fin;
            document.getElementById('mostrarTodoSpan').textContent = RECUENTO.inicio;
            document.getElementById(valido ? 'totalV' : 'totalF').textContent = ++RECUENTO[valido ? 'valido' : 'invalido'];
            document.getElementById('mostrarValidosSpan').textContent = RECUENTO.valido;
            document.getElementById('mostrarInvalidosSpan').textContent = RECUENTO.invalido;

            const mostrar = document.querySelector('input[name="mostrar"]:checked').value;

            const p = document.createElement('p');
            p.textContent = `${patron} ${valido ? '✅' : '❌'}`;
            p.className = valido ? 'valido' : 'invalido';
            p.style.display = (!valido && mostrar=="1" || valido && mostrar=="2") ? 'none' : '';
            document.getElementById('patrones').prepend(p);

            resolve();
        }, document.getElementById('velocidad').value);
    });
}