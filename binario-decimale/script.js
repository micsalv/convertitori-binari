/*
    Autore:      prof. Michele SALVEMINI
    File:        script.js - comportamento di "Convertitore ed Eserciziario Binario-Decimale"
    Obiettivo:   Supporto allo studio delle conversioni di base da un sistema ad un altro
    Versione:    2.0
    Data:        26/09/2026

    Struttura:
    1. Costanti
    2. Variabili di stato
    3. Funzioni di rendering (binario -> decimale, decimale -> binario)
    4. Funzioni di gestione degli eventi
    5. Collegamento degli eventi e avvio
*/

// ---------------------------------------------------------------
// 1. Costanti
// ---------------------------------------------------------------

// Peso posizionale di ciascuno dei 8 bit, da MSB (sinistra) a LSB (destra)
const PESI = [128, 64, 32, 16, 8, 4, 2, 1];

// Esponente di 2 associato a ciascuna posizione, mostrato sotto il peso
const ESPONENTI = [7, 6, 5, 4, 3, 2, 1, 0];

// Valore massimo rappresentabile con 8 bit (1 byte)
const VALORE_MASSIMO = 255;

// ---------------------------------------------------------------
// 2. Variabili di stato
// ---------------------------------------------------------------

// Stato corrente degli 8 bit; il valore iniziale 45 e' l'esempio della scheda
let bit = [0, 0, 1, 0, 1, 1, 0, 1];

// ---------------------------------------------------------------
// 3. Funzioni di rendering
// ---------------------------------------------------------------

// Ricostruisce la griglia dei bit e aggiorna il risultato della
// conversione binario -> decimale; infine aggiorna anche il widget
// delle divisioni successive, cosi' i due strumenti restano coerenti
function aggiornaBinarioVersoDecimale() {
    const griglia = document.getElementById("griglia-bit");
    griglia.innerHTML = "";

    let valoreDecimale = 0;
    let addendi = [];

    for (let i = 0; i < 8; i++) {
        const bitAttivo = bit[i] === 1;

        // Somma dei soli pesi dei bit accesi: e' il cuore del metodo posizionale
        if (bitAttivo) {
            valoreDecimale += PESI[i];
            addendi.push(PESI[i]);
        }

        // Ogni bit e' un vero pulsante: e' raggiungibile da tastiera
        // e utilizzabile anche da chi naviga con tecnologie assistive
        const colonna = document.createElement("div");
        colonna.className = "bit-column";

        const bottone = document.createElement("button");
        bottone.type = "button";
        bottone.className = "bit-box" + (bitAttivo ? " active" : "");
        bottone.textContent = bit[i];
        bottone.setAttribute("aria-label",
            "Bit con peso " + PESI[i] + (bitAttivo ? ", attivo" : ", disattivo"));
        bottone.addEventListener("click", function () {
            invertiBit(i);
        });

        const peso = document.createElement("span");
        peso.className = "bit-weight";
        peso.textContent = PESI[i];

        const potenza = document.createElement("span");
        potenza.className = "bit-power";
        potenza.innerHTML = "2<sup>" + ESPONENTI[i] + "</sup>";

        const contributo = document.createElement("span");
        contributo.className = "bit-subval" + (bitAttivo ? " active" : "");
        contributo.textContent = bitAttivo ? "+" + PESI[i] : "0";

        colonna.append(peso, potenza, bottone, contributo);
        griglia.appendChild(colonna);
    }

    // Mostra lo sviluppo completo: i bit, i pesi sommati e il risultato
    const stringaBinaria = bit.join("");
    const stringaAddendi = addendi.length > 0 ? addendi.join(" + ") : "0";
    document.getElementById("risultato-b2d").innerHTML =
        "<strong>" + stringaBinaria + "<sub>2</sub></strong> = " +
        stringaAddendi + " = <strong>" + valoreDecimale + "<sub>10</sub></strong>";

    // Sincronizza slider, campo numerico e widget delle divisioni
    document.getElementById("slider-decimale").value = valoreDecimale;
    document.getElementById("display-decimale").textContent = valoreDecimale;
    document.getElementById("input-decimale").value = valoreDecimale;

    aggiornaDivisioniSuccessive(valoreDecimale);
}

// Costruisce la tabella delle divisioni successive per 2 e mostra
// il risultato binario con i resti letti dal basso verso l'alto
function aggiornaDivisioniSuccessive(numero) {
    const corpoTabella = document.getElementById("corpo-tabella-divisioni");
    corpoTabella.innerHTML = "";

    // Caso limite: lo zero non richiede divisioni, ma va gestito esplicitamente
    if (numero === 0) {
        corpoTabella.innerHTML =
            "<tr><td>1</td><td>0 &divide; 2</td><td>0</td>" +
            "<td><span class=\"remainder-badge\">0</span></td></tr>";
        document.getElementById("risultato-d2b").innerHTML =
            "<strong>0<sub>10</sub></strong> = <strong>00000000<sub>2</sub></strong>";
        return;
    }

    let daDividere = numero;
    let passo = 1;
    let resti = [];

    while (daDividere > 0) {
        const quoziente = Math.floor(daDividere / 2);
        const resto = daDividere % 2;

        // I resti vengono memorizzati in ordine di calcolo (LSB -> MSB)
        resti.push(resto);

        const riga = document.createElement("tr");
        riga.innerHTML =
            "<td>" + passo + "</td>" +
            "<td>" + daDividere + " &divide; 2</td>" +
            "<td>" + quoziente + "</td>" +
            '<td><span class="remainder-badge">' + resto + "</span></td>";
        corpoTabella.appendChild(riga);

        daDividere = quoziente;
        passo++;
    }

    // Il numero binario si ottiene leggendo i resti in ordine inverso;
    // padStart garantisce sempre 8 cifre, per raffronto con la griglia dei bit
    const binario8bit = resti.reverse().join("").padStart(8, "0");
    document.getElementById("risultato-d2b").innerHTML =
        "<strong>" + numero + "<sub>10</sub></strong> = <strong>" +
        binario8bit + "<sub>2</sub></strong>";
}

// ---------------------------------------------------------------
// 4. Funzioni di gestione degli eventi
// ---------------------------------------------------------------

// Inverte un bit e ricalcola tutto: un unico punto di aggiornamento
// evita stati incoerenti tra i widget
function invertiBit(indice) {
    bit[indice] = bit[indice] === 1 ? 0 : 1;
    aggiornaBinarioVersoDecimale();
}

// Imposta i bit in base a un valore decimale, scomponendolo
// confrontando ogni peso con le potenze di 2 (operatore bit a bit)
function impostaBitDaDecimale(numero) {
    for (let i = 0; i < 8; i++) {
        bit[i] = (numero & (1 << (7 - i))) ? 1 : 0;
    }
    aggiornaBinarioVersoDecimale();
}

// Legge il valore dello slider, con protezione da valori non numerici
function gestisciSlider(valore) {
    let numero = parseInt(valore, 10);
    if (isNaN(numero)) {
        numero = 0;
    }
    impostaBitDaDecimale(numero);
}

// Legge il campo numerico e lo limita all'intervallo 0-255,
// coerente con 8 bit; valori invalidi rientrano in automatico
function gestisciInput(valore) {
    let numero = parseInt(valore, 10);
    if (isNaN(numero) || numero < 0) {
        numero = 0;
    }
    if (numero > VALORE_MASSIMO) {
        numero = VALORE_MASSIMO;
    }
    impostaBitDaDecimale(numero);
}

// ---------------------------------------------------------------
// 5. Collegamento degli eventi e avvio
// ---------------------------------------------------------------

document.getElementById("slider-decimale").addEventListener("input", function () {
    gestisciSlider(this.value);
});

document.getElementById("input-decimale").addEventListener("input", function () {
    gestisciInput(this.value);
});

document.getElementById("pulsante-stampa").addEventListener("click", function () {
    window.print();
});

// Primo rendering: mostra subito l'esempio 45 in entrambi i widget
aggiornaBinarioVersoDecimale();
