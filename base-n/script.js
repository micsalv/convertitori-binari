/*
    Autore:      prof. Michele SALVEMINI
    File:        script.js - comportamento di "Convertitore Base N <-> Base 10"
    Obiettivo:   Supporto allo studio delle conversioni di base da un sistema ad un altro
    Versione:    2.0
    Data:        26/09/2026

    Struttura:
    1. Costanti
    2. Variabili di stato
    3. Funzioni di conversione e rendering
    4. Funzioni di gestione degli eventi
    5. Collegamento degli eventi e avvio

    Il convertitore e' bidirezionale e usa un unico stato condiviso:
    modificare un widget aggiorna automaticamente l'altro, come nella
    pagina gemella del convertitore binario-decimale.
*/

// ---------------------------------------------------------------
// 1. Costanti
// ---------------------------------------------------------------

// Simboli delle cifre: in base 16 i resti dal 10 al 15
// diventano le lettere A-F, perche' una cifra deve essere
// sempre un singolo carattere
const CIFRE = "0123456789ABCDEF";

// Intervallo ammissibile per la base di conversione
const BASE_MINIMA = 2;
const BASE_MASSIMA = 16;

// Valore massimo del numero da convertire (8 bit): mantiene
// la coerenza con il convertitore binario-decimale della stessa serie
const VALORE_MASSIMO = 255;

// ---------------------------------------------------------------
// 2. Variabili di stato
// ---------------------------------------------------------------

// Stato condiviso dai due widget: un unico punto di verita'
// evita stati incoerenti tra i due versi di conversione
let numeroDecimale = 45;
let baseDestinazione = 2;
let stringaBaseN = "101101";   // e' il numero 45 scritto in base 2

// ---------------------------------------------------------------
// 3. Funzioni di conversione e rendering
// ---------------------------------------------------------------

// Converte un numero decimale in base N con il metodo delle
// divisioni successive; restituisce la stringa delle cifre
function convertiInBaseN(numero, base) {
    if (numero === 0) {
        return "0";
    }

    // I resti vengono raccolti in ordine di calcolo (cifra meno
    // significativa prima); il risultato finale li legge al contrario
    let resti = [];
    let daDividere = numero;

    while (daDividere > 0) {
        const resto = daDividere % base;
        resti.push(CIFRE[resto]);
        daDividere = Math.floor(daDividere / base);
    }

    return resti.reverse().join("");
}

// Converte una stringa in base N in decimale con il calcolo
// posizionale; restituisce un oggetto con il valore e lo
// sviluppo dei singoli contributi, oppure null se la stringa
// contiene cifre non ammissibili per la base
function calcolaDecimaleDaBaseN(stringa, base) {
    // Normalizzazione: spazi rimossi e lettere maiuscole,
    // cosi' "ff", "FF" e "f f" sono tutti accettati in base 16
    const pulita = stringa.trim().toUpperCase().replace(/\s+/g, "");

    if (pulita.length === 0) {
        return null;
    }

    let valore = 0;
    let contributi = [];

    for (let i = 0; i < pulita.length; i++) {
        const cifra = pulita[i];
        const posizioneDaDestra = pulita.length - 1 - i;
        const peso = Math.pow(base, posizioneDaDestra);
        const valoreCifra = CIFRE.indexOf(cifra);

        // La cifra non appartiene all'alfabeto della base:
        // la conversione non e' possibile, segnaliamo l'errore
        if (valoreCifra === -1 || valoreCifra >= base) {
            return null;
        }

        const contributo = valoreCifra * peso;
        valore += contributo;

        // Ogni riga dello sviluppo mostra posizione, cifra, peso
        // e contributo: e' il metodo posizionale reso esplicito
        contributi.push({
            posizione: posizioneDaDestra,
            cifra: cifra,
            valoreCifra: valoreCifra,
            peso: peso,
            contributo: contributo
        });
    }

    return { valore: valore, contributi: contributi, pulita: pulita };
}

// Ricostruisce la tabella del calcolo posizionale (widget 1)
function aggiornaCalcoloPosizionale() {
    const corpoTabella = document.getElementById("corpo-tabella-posizionale");
    const risultato = document.getElementById("risultato-n2d");
    corpoTabella.innerHTML = "";

    const conversione = calcolaDecimaleDaBaseN(stringaBaseN, baseDestinazione);

    // Errore: cifra non valida per la base corrente.
    // Mostriamo un messaggio esplicito, non un risultato sbagliato:
    // l'errore va analizzato, non nascosto.
    if (conversione === null) {
        corpoTabella.innerHTML =
            "<tr><td colspan=\"4\">-</td></tr>";
        risultato.classList.add("errore");
        risultato.innerHTML =
            "La cifra inserita non e' valida in base " + baseDestinazione +
            ". Ricorda: in base " + baseDestinazione + " le cifre ammissibili" +
            " vanno da 0 a " + (baseDestinazione - 1) +
            (baseDestinazione > 10 ? " (A = 10, B = 11, ...)." : ".");
        return;
    }

    risultato.classList.remove("errore");

    for (let i = 0; i < conversione.contributi.length; i++) {
        const riga = conversione.contributi[i];
        const tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + riga.posizione + "</td>" +
            "<td>" + riga.cifra + "</td>" +
            '<td class="monospace peso">' + baseDestinazione + "<sup>" +
            riga.posizione + "</sup> = " + riga.peso + "</td>" +
            '<td class="monospace">' + riga.valoreCifra + " &times; " +
            riga.peso + " = " + riga.contributo + "</td>";
        corpoTabella.appendChild(tr);
    }

    // Mostra lo sviluppo completo: cifre, contributi e risultato
    const addendi = conversione.contributi.map(function (riga) {
        return riga.contributo;
    });
    document.getElementById("risultato-n2d").innerHTML =
        "<strong>" + conversione.pulita + "<sub>" + baseDestinazione +
        "</sub></strong> = " + addendi.join(" + ") + " = <strong>" +
        conversione.valore + "<sub>10</sub></strong>";
}

// Ricostruisce la tabella delle divisioni successive (widget 2)
// e aggiorna il risultato della conversione decimale -> base N
function aggiornaDivisioniSuccessive() {
    const corpoTabella = document.getElementById("corpo-tabella-divisioni");
    corpoTabella.innerHTML = "";

    // L'intestazione della tabella ricorda sempre la base in uso:
    // evita confusione quando lo studente muove lo slider
    document.getElementById("intestazione-divisione").innerHTML =
        "Divisione (&divide; " + baseDestinazione + ")";

    // Caso limite: lo zero non richiede divisioni, ma va gestito esplicitamente
    if (numeroDecimale === 0) {
        corpoTabella.innerHTML =
            "<tr><td>1</td><td>0 &divide; " + baseDestinazione + "</td><td>0</td>" +
            "<td><span class=\"remainder-badge\">0</span></td></tr>";
        document.getElementById("risultato-d2n").innerHTML =
            "<strong>0<sub>10</sub></strong> = <strong>0<sub>" +
            baseDestinazione + "</sub></strong>";
        return;
    }

    let daDividere = numeroDecimale;
    let passo = 1;
    let resti = [];

    while (daDividere > 0) {
        const quoziente = Math.floor(daDividere / baseDestinazione);
        const resto = daDividere % baseDestinazione;

        resti.push(CIFRE[resto]);

        const riga = document.createElement("tr");
        riga.innerHTML =
            "<td>" + passo + "</td>" +
            "<td>" + daDividere + " &divide; " + baseDestinazione + "</td>" +
            "<td>" + quoziente + "</td>" +
            '<td><span class="remainder-badge">' + CIFRE[resto] + "</span></td>";
        corpoTabella.appendChild(riga);

        daDividere = quoziente;
        passo++;
    }

    // Il risultato si legge dal resto piu' significativo (ultimo
    // calcolato) a quello meno significativo (primo calcolato)
    const risultato = resti.reverse().join("");
    document.getElementById("risultato-d2n").innerHTML =
        "<strong>" + numeroDecimale + "<sub>10</sub></strong> = <strong>" +
        risultato + "<sub>" + baseDestinazione + "</sub></strong>";
}

// Aggiorna tutti gli elementi condivisi: lettura della base nelle
// etichette, legenda delle cifre letterali, e sincronizza il campo
// del numero in base N con la sua forma canonica
function aggiornaElementiCondivisi() {
    document.getElementById("display-base").textContent = baseDestinazione;
    document.getElementById("input-base-n").value = stringaBaseN;

    const etichetteBase = document.querySelectorAll(".base-riferimento");
    for (let i = 0; i < etichetteBase.length; i++) {
        etichetteBase[i].textContent = baseDestinazione;
    }

    // Mostra la legenda delle cifre letterali solo quando serve:
    // quando la base supera 10 compaiono le cifre A-F
    const legenda = document.getElementById("legenda-cifre");
    if (baseDestinazione > 10) {
        document.getElementById("legenda-base").textContent = baseDestinazione;
        document.getElementById("legenda-cifra-massima").textContent =
            baseDestinazione - 1;
        legenda.hidden = false;
    } else {
        legenda.hidden = true;
    }
}

// Un unico punto di aggiornamento: ogni evento ricalcola tutto,
// garantendo che i due widget mostrino sempre lo stesso numero
function aggiornaTutto() {
    aggiornaElementiCondivisi();
    aggiornaCalcoloPosizionale();
    aggiornaDivisioniSuccessive();
}

// ---------------------------------------------------------------
// 4. Funzioni di gestione degli eventi
// ---------------------------------------------------------------

// Campo in base N: se la stringa e' valida aggiorna lo stato
// condiviso; se non lo e' aggiorna comunque la vista, cosi'
// il messaggio di errore appare subito mentre si digita
function gestisciInputBaseN(valore) {
    stringaBaseN = valore;
    const conversione = calcolaDecimaleDaBaseN(valore, baseDestinazione);

    if (conversione !== null) {
        numeroDecimale = conversione.valore;
        document.getElementById("input-decimale").value = numeroDecimale;
        stringaBaseN = conversione.pulita;   // forma canonica
    }
    aggiornaTutto();
}

// Campo decimale: il valore viene limitato all'intervallo 0-255,
// coerente con 8 bit
function gestisciInputDecimale(valore) {
    let numero = parseInt(valore, 10);
    if (isNaN(numero) || numero < 0) {
        numero = 0;
    }
    if (numero > VALORE_MASSIMO) {
        numero = VALORE_MASSIMO;
    }
    numeroDecimale = numero;
    stringaBaseN = convertiInBaseN(numeroDecimale, baseDestinazione);
    aggiornaTutto();
}

// Lo slider vincola la base all'intervallo [2, 16] per costruzione,
// quindi non servono controlli aggiuntivi ne' messaggi di errore:
// un valore non valido non puo' nemmeno essere selezionato.
// Cambiando base, il numero inserito viene riscritto nella nuova base
function gestisciSlider(valore) {
    let base = parseInt(valore, 10);
    if (isNaN(base)) {
        base = BASE_MINIMA;
    }
    baseDestinazione = base;
    stringaBaseN = convertiInBaseN(numeroDecimale, baseDestinazione);
    aggiornaTutto();
}

// ---------------------------------------------------------------
// 5. Collegamento degli eventi e avvio
// ---------------------------------------------------------------

document.getElementById("input-base-n").addEventListener("input", function () {
    gestisciInputBaseN(this.value);
});

document.getElementById("input-decimale").addEventListener("input", function () {
    gestisciInputDecimale(this.value);
});

document.getElementById("slider-base").addEventListener("input", function () {
    gestisciSlider(this.value);
});

document.getElementById("pulsante-stampa").addEventListener("click", function () {
    window.print();
});

// Primo rendering: mostra subito la conversione del valore iniziale
aggiornaTutto();
