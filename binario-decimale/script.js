/*
    Autore:      prof. Michele SALVEMINI
    File:        script.js - comportamento di "Convertitore ed Eserciziario Binario-Decimale"
    Obiettivo:   Supporto allo studio delle conversioni di base da un sistema ad un altro
    Versione:    3.1 (variante grafica)
    Data:        08/10/2026

    Struttura:
    1. Costanti
    2. Variabili di stato
    3. Funzioni di costruzione e rendering (binario -> decimale, decimale -> binario)
    4. Funzioni di animazione
    5. Funzioni di gestione degli eventi
    6. Collegamento degli eventi e avvio

    Novita' rispetto alla versione 2.0:
    - La griglia dei bit viene costruita UNA volta sola e poi aggiornata. Prima veniva
      ricreata a ogni click: il pulsante premuto spariva e chi usa la tastiera perdeva
      il focus. Ora il focus resta sul tasto.
    - I tasti usano aria-pressed (acceso/spento) invece di cambiare l'etichetta.
    - Interruttore delle animazioni, pulsanti "Azzera i bit" e "Numero a caso".
    - Le costanti seguono lo standard della Knowledge Base (camelCase con prefisso c).
*/

// ---------------------------------------------------------------
// 1. Costanti
// ---------------------------------------------------------------

// Numero di bit del byte
const cNumeroBit = 8;

// Peso posizionale di ciascuno dei 8 bit, da MSB (sinistra) a LSB (destra)
const cPesi = [128, 64, 32, 16, 8, 4, 2, 1];

// Esponente di 2 associato a ciascuna posizione, mostrato sotto il peso
const cEsponenti = [7, 6, 5, 4, 3, 2, 1, 0];

// Valore massimo rappresentabile con 8 bit (1 byte)
const cValoreMassimo = 255;

// Durata (in millisecondi) dell'effetto "pop" su tasti e risultati
const cDurataPop = 250;

// ---------------------------------------------------------------
// 2. Variabili di stato
// ---------------------------------------------------------------

// Stato corrente degli 8 bit; il valore iniziale 45 e' l'esempio della scheda
let bit = [0, 0, 1, 0, 1, 1, 0, 1];

// Riferimenti agli elementi della griglia, salvati alla creazione
let tastiBit = [];
let contributiBit = [];

// true se le animazioni sono attive (interruttore + preferenza del sistema)
let animazioniAttive = true;

// true solo quando il numero cambia dal campo o dal dado: in quel caso le righe
// della tabella compaiono in sequenza (con lo slider sarebbe un effetto continuo e fastidioso)
let animaRighe = false;

// ---------------------------------------------------------------
// 3. Funzioni di costruzione e rendering
// ---------------------------------------------------------------

// Crea gli 8 tasti una sola volta; il loro aspetto viene poi aggiornato
// da aggiornaBinarioVersoDecimale() senza ricostruire la griglia
function costruisciGrigliaBit() {
    const griglia = document.getElementById("griglia-bit");

    for (let i = 0; i < cNumeroBit; i++) {
        // Ogni bit e' un vero pulsante: e' raggiungibile da tastiera
        // e utilizzabile anche da chi naviga con tecnologie assistive
        const colonna = document.createElement("div");
        colonna.className = "bit-column";
        // Variabile CSS usata per ritardare l'ingresso di ogni tasto
        colonna.style.setProperty("--i", i);

        const peso = document.createElement("span");
        peso.className = "bit-weight";
        peso.textContent = cPesi[i];

        const potenza = document.createElement("span");
        potenza.className = "bit-power";
        potenza.innerHTML = "2<sup>" + cEsponenti[i] + "</sup>";

        const bottone = document.createElement("button");
        bottone.type = "button";
        bottone.className = "bit-box";
        bottone.setAttribute("aria-label", "Bit con peso " + cPesi[i]);
        bottone.addEventListener("click", function () {
            invertiBit(i);
        });

        const contributo = document.createElement("span");
        contributo.className = "bit-subval";

        colonna.append(peso, potenza, bottone, contributo);
        griglia.appendChild(colonna);

        tastiBit.push(bottone);
        contributiBit.push(contributo);
    }
}

// Aggiorna i tasti e il risultato della conversione binario -> decimale;
// infine aggiorna anche il widget delle divisioni successive,
// cosi' i due strumenti restano coerenti
function aggiornaBinarioVersoDecimale() {
    let valoreDecimale = 0;
    let addendi = [];

    for (let i = 0; i < cNumeroBit; i++) {
        const bitAttivo = bit[i] === 1;

        // Somma dei soli pesi dei bit accesi: e' il cuore del metodo posizionale
        if (bitAttivo) {
            valoreDecimale += cPesi[i];
            addendi.push(cPesi[i]);
        }

        // Aggiorna l'aspetto del tasto senza ricrearlo
        tastiBit[i].textContent = bit[i];
        tastiBit[i].classList.toggle("active", bitAttivo);
        tastiBit[i].setAttribute("aria-pressed", bitAttivo ? "true" : "false");

        contributiBit[i].textContent = bitAttivo ? "+" + cPesi[i] : "0";
        contributiBit[i].classList.toggle("active", bitAttivo);
    }

    // Mostra lo sviluppo completo: i bit, i pesi sommati e il risultato
    const stringaBinaria = bit.join("");
    const stringaAddendi = addendi.length > 0 ? addendi.join(" + ") : "0";
    document.getElementById("risultato-b2d").innerHTML =
        "<strong>" + stringaBinaria + "<sub>2</sub></strong> = " +
        stringaAddendi + " = <strong>" + valoreDecimale + "<sub>10</sub></strong>";

    aggiornaTabellone(valoreDecimale);

    // Sincronizza slider, campo numerico e widget delle divisioni
    document.getElementById("slider-decimale").value = valoreDecimale;
    document.getElementById("display-decimale").textContent = valoreDecimale;
    document.getElementById("input-decimale").value = valoreDecimale;

    aggiornaDivisioniSuccessive(valoreDecimale);
}

// Aggiorna il tabellone: valore decimale e bit evidenziati.
// I bit a 1 hanno una classe dedicata (colore) ma restano sempre scritti come cifre
function aggiornaTabellone(valoreDecimale) {
    document.getElementById("tabellone-decimale").textContent = valoreDecimale;

    const tabelloneBinario = document.getElementById("tabellone-binario");
    tabelloneBinario.innerHTML = "";
    for (let i = 0; i < cNumeroBit; i++) {
        const cifra = document.createElement("span");
        cifra.className = bit[i] === 1 ? "uno" : "zero";
        cifra.textContent = bit[i];
        tabelloneBinario.appendChild(cifra);
    }
}

// Costruisce la tabella delle divisioni successive per 2 e mostra
// il risultato binario con i resti letti dal basso verso l'alto
function aggiornaDivisioniSuccessive(numero) {
    const corpoTabella = document.getElementById("corpo-tabella-divisioni");
    corpoTabella.innerHTML = "";

    // Le righe si animano solo se richiesto E se le animazioni sono attive
    const animaOra = animaRighe && animazioniAttive;
    animaRighe = false;

    // Caso limite: lo zero non richiede divisioni, ma va gestito esplicitamente
    if (numero === 0) {
        const rigaZero = document.createElement("tr");
        rigaZero.innerHTML =
            "<td>1</td><td>0 &divide; 2</td><td>0</td>" +
            "<td><span class=\"remainder-badge\">0</span></td>";
        if (animaOra) {
            rigaZero.className = "riga-nuova";
            rigaZero.style.setProperty("--i", 0);
        }
        corpoTabella.appendChild(rigaZero);
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

        // Ritardo crescente: le righe compaiono nell'ordine dei calcoli
        if (animaOra) {
            riga.className = "riga-nuova";
            riga.style.setProperty("--i", passo - 1);
        }
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

    // La freccia "Lettura resti" scorre verso l'alto: indica il verso di lettura
    if (animaOra) {
        animaFrecciaLettura();
    }
}

// ---------------------------------------------------------------
// 4. Funzioni di animazione
// ---------------------------------------------------------------

// Piccolo "pop" (ingrandimento e ritorno) su un elemento.
// Non fa nulla se l'utente ha disattivato le animazioni.
function animaPop(elemento) {
    if (!animazioniAttive) {
        return;
    }
    elemento.animate(
        [
            { transform: "scale(1)" },
            { transform: "scale(1.06)" },
            { transform: "scale(1)" }
        ],
        { duration: cDurataPop, easing: "ease-out" }
    );
}

// La freccia parte dal basso e sale: ricorda che i resti si leggono dal basso verso l'alto
function animaFrecciaLettura() {
    document.getElementById("icona-freccia").animate(
        [
            { transform: "translateY(14px)", opacity: 0 },
            { transform: "translateY(0)", opacity: 1 }
        ],
        { duration: 450, easing: "ease-out" }
    );
}

// Attiva o disattiva le animazioni: l'attributo su <html> viene letto dal CSS
function impostaAnimazioni(attive) {
    animazioniAttive = attive;
    document.documentElement.setAttribute("data-animazioni", attive ? "on" : "off");
    document.getElementById("pulsante-animazioni").setAttribute("aria-checked", attive ? "true" : "false");
    document.getElementById("stato-animazioni").textContent = attive ? "sì" : "no";
}

// ---------------------------------------------------------------
// 5. Funzioni di gestione degli eventi
// ---------------------------------------------------------------

// Inverte un bit e ricalcola tutto: un unico punto di aggiornamento
// evita stati incoerenti tra i widget
function invertiBit(indice) {
    bit[indice] = bit[indice] === 1 ? 0 : 1;
    aggiornaBinarioVersoDecimale();
    animaPop(tastiBit[indice]);
    animaPop(document.getElementById("risultato-b2d"));
    animaPop(document.getElementById("tabellone-decimale"));
}

// Imposta i bit in base a un valore decimale, scomponendolo
// confrontando ogni peso con le potenze di 2 (operatore bit a bit)
function impostaBitDaDecimale(numero) {
    for (let i = 0; i < cNumeroBit; i++) {
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
    if (numero > cValoreMassimo) {
        numero = cValoreMassimo;
    }
    animaRighe = true;
    impostaBitDaDecimale(numero);
}

// Estrae un intero casuale tra 0 e 255: Math.random() restituisce un reale
// in [0, 1), moltiplicato per 256 e troncato da' un intero da 0 a 255
function estraiNumeroCasuale() {
    const numero = Math.floor(Math.random() * (cValoreMassimo + 1));
    animaRighe = true;
    impostaBitDaDecimale(numero);
    animaPop(document.getElementById("risultato-d2b"));
    animaPop(document.getElementById("tabellone-decimale"));
    animaPop(document.getElementById("tabellone-binario"));
}

// Riporta tutti i bit a zero
function azzeraBit() {
    impostaBitDaDecimale(0);
}

// ---------------------------------------------------------------
// 6. Collegamento degli eventi e avvio
// ---------------------------------------------------------------

document.getElementById("slider-decimale").addEventListener("input", function () {
    gestisciSlider(this.value);
});

document.getElementById("input-decimale").addEventListener("input", function () {
    gestisciInput(this.value);
});

document.getElementById("pulsante-casuale").addEventListener("click", estraiNumeroCasuale);

document.getElementById("pulsante-azzera").addEventListener("click", azzeraBit);

document.getElementById("pulsante-stampa").addEventListener("click", function () {
    window.print();
});

document.getElementById("pulsante-animazioni").addEventListener("click", function () {
    impostaAnimazioni(!animazioniAttive);
});

// Avvio: se il sistema dell'utente chiede meno movimento, le animazioni partono spente
// (l'utente puo' comunque riattivarle con l'interruttore)
const preferisceMenoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
impostaAnimazioni(!preferisceMenoMovimento);

// Primo rendering: costruisce la griglia e mostra subito l'esempio 45 in entrambi i widget
costruisciGrigliaBit();
aggiornaBinarioVersoDecimale();
