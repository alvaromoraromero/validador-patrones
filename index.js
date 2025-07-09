const MOSTRAR = 0; // 0: Todo.   1: Sólo válidos.   2: Sólo inválidos
const RECUENTO = { // No tocar
    total: 0,
    valido: 0,
    invalido: 0,
}
window.onload = () => {
    document.querySelectorAll('input[name="tipo"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.tipogrp').forEach(div => {
                div.style.display = 'none';
                div.querySelectorAll('input').forEach(input => {
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
}

function validarForm() {
    switch (document.querySelector('input[name="tipo"]:checked').value) {
        case 'patron_rango':
            const inicio = document.getElementById('patron_rango_inicio').value;
            const fin = document.getElementById('patron_rango_fin').value;
            for (let i = inicio; i <= fin; i++) {
                pintarPatron(`${i}`);
            }
            break;
    
        default:
            pintarPatron(document.querySelector('input[name="patron"]').value);
            break;
    } 

    return false;
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
    const valido = esPatronValido(patron);
    document.getElementById('total').textContent = ++RECUENTO.total;
    document.getElementById(valido ? 'totalV' : 'totalF').textContent = ++RECUENTO[valido ? 'valido' : 'invalido'];

    if (!valido && MOSTRAR==1 || valido && MOSTRAR==2) return;

    const p = document.createElement('p');
    p.textContent = `${patron} ${valido ? '✅' : '❌'}`;
    document.getElementById('patrones').append(p);
}