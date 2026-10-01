/*
    Autore:      prof. Michele SALVEMINI
    File:        script.js - Convertitore Binario <-> Base 2^n (fino a 32 bit)
    Obiettivo:   Conversioni col metodo dei raggruppamenti dei bit
    Versione:    1.0
    Data:        29/09/2026

    Struttura:
    1. Costanti
    2. Variabili di stato
    3. Funzioni di supporto
    4. Rendering: binario -> base 2^n
    5. Rendering: base 2^n -> binario
    6. Gestione eventi
    7. Collegamento eventi e avvio
*/

// ---------------------------------------------------------------
// 1. Costanti
// ---------------------------------------------------------------

// Massimo numero di bit gestiti
const MAX_BIT = 32;

// Cifre disponibili fino alla base 32 (0..9, A..V, con V = 31)
const SIMBOLI = "0123456789ABCDEFGHIJKLMNOPQRSTUV";

// Base -> quanti bit servono per ogni cifra (log2 della base)
const BASI = {
    4:  { bitPerCifra: 2 },
    8:  { bitPerCifra: 3 },
    16: { bitPerCifra: 4 },
    32: { bitPerCifra: 5 }
};

// ---------------------------------------------------------------
// 2. Variabili di stato
// ---------------------------------------------------------------

// Stringa binaria corrente (solo 0/1), senza spazi
let binarioCorrente = "00101101";

// Base di destinazione selezionata nel widget 1
let baseCorrente = 16;

// ---------------------------------------------------------------
// 3. Funzioni di supporto
// ---------------------------------------------------------------

// Estrae solo i caratteri 0/1 da una stringa, tronca a MAX_BIT
function normalizzaBinario(testo) {
    const soloBit = testo.replace(/[^01]/g, "");
    return soloBit.slice(0, MAX_BIT);
}

// Raggruppa una stringa binaria in blocchi di n bit partendo da destra.
// Restituisce:
//  - gruppi:          array di stringhe binarie lunghe n
//  - padding:         zeri aggiunti SOLO per rendere la lunghezza multipla di n
//  - zeriIniziali:    zeri iniziali totali nel PRIMO gruppo a sinistra
//                     (padding + zeri già presenti nella stringa originale)
function raggruppaBit(stringaBinaria, n) {
    if (stringaBinaria.length === 0) {
        return { gruppi: [], padding: 0, zeriIniziali: 0 };
    }
    let bin = stringaBinaria;
    let padding = 0;
    while (bin.length % n !== 0) {
        bin = "0" + bin;
        padding++;
    }
    const gruppi = [];
    for (let i = 0; i < bin.length; i += n) {
        gruppi.push(bin.substring(i, i + n));
    }
    // Conta gli zeri iniziali del primo gruppo a sinistra
    let zeriIniziali = 0;
    const primoGruppo = gruppi[0];
    while (zeriIniziali < primoGruppo.length && primoGruppo[zeriIniziali] === "0") {
        zeriIniziali++;
    }
    return { gruppi: gruppi, padding: padding, zeriIniziali: zeriIniziali };
}

// Converte un gruppo binario nella cifra (simbolo) della base 2^n
function gruppoInCifra(gruppo) {
    return SIMBOLI[parseInt(gruppo, 2)];
}

// Converte un carattere nella sua cifra decimale, o -1 se non valido
function cifraInValore(carattere, base) {
    const indice = SIMBOLI.indexOf(carattere.toUpperCase());
    if (indice < 0 || indice >= base) return -1;
    return indice;
}

// Calcola quanti bit al massimo sono "occupati" da un binario
// ripulito dagli zeri iniziali (almeno 1 bit)
function lunghezzaSignificativa(stringaBinaria) {
    const senzaZeri = stringaBinaria.replace(/^0+/, "");
    return senzaZeri.length === 0 ? 1 : senzaZeri.length;
}

// ---------------------------------------------------------------
// 4. Rendering: binario -> base 2^n
// ---------------------------------------------------------------

function aggiornaBinarioVersoBase() {
    const n = BASI[baseCorrente].bitPerCifra;
    const contenitore = document.getElementById("gruppi-bit");
    contenitore.innerHTML = "";

    // Info di stato sopra la griglia
    const info = document.getElementById("info-binario");
    const lunghezza = binarioCorrente.length;
    if (lunghezza === 0) {
        info.textContent = "Nessun bit inserito.";
    } else {
        info.textContent =
            "Bit inseriti: " + lunghezza + " / " + MAX_BIT +
            "  ·  bit per cifra in base " + baseCorrente + ": " + n;
    }

    if (lunghezza === 0) {
        document.getElementById("risultato-b2x").innerHTML =
            "<em>Inserisci almeno un bit per vedere il raggruppamento.</em>";
        document.getElementById("input-cifre").value = "";
        aggiornaBaseVersoBinario("");
        return;
    }

    // Raggruppa e mostra visivamente i blocchi
    const risultato = raggruppaBit(binarioCorrente, n);
    const gruppi = risultato.gruppi;
    contenitore.style.setProperty("--n-gruppi", gruppi.length);

    const cifreRisultato = [];
    gruppi.forEach(function (gruppo) {
        const cifra = gruppoInCifra(gruppo);
        cifreRisultato.push(cifra);

        const blocco = document.createElement("div");
        blocco.className = "gruppo-bit";

        // Singoli bit del gruppo, con stato acceso/spento
        for (let k = 0; k < gruppo.length; k++) {
            const b = document.createElement("span");
            b.className = "gruppo-bit-singolo" + (gruppo[k] === "1" ? " on" : "");
            b.textContent = gruppo[k];
            blocco.appendChild(b);
        }

        // Etichetta con la cifra corrispondente nella base di destinazione
        const etichetta = document.createElement("span");
        etichetta.className = "gruppo-cifra";
        etichetta.innerHTML = "("+ cifra+")" + "<sub>" + baseCorrente + "</sub>";
        blocco.appendChild(etichetta);

        contenitore.appendChild(blocco);
    });

    // Nota sugli zeri iniziali del primo gruppo a sinistra.
    // Se il primo gruppo è tutto zeri (raro ma possibile), lo diciamo esplicitamente.
    let notaPadding = "";
    if (risultato.zeriIniziali > 0) {
        const primoGruppo = risultato.gruppi[0];
        const tuttoZeri = primoGruppo.split("").every(function (c) { return c === "0"; });

        if (tuttoZeri) {
            notaPadding = " (il gruppo più a sinistra è tutto a zero: " +
                primoGruppo + " → cifra 0)";
        } else {
            notaPadding = " (" + risultato.zeriIniziali +
                " zer" + (risultato.zeriIniziali === 1 ? "o" : "i") +
                " inizial" + (risultato.zeriIniziali === 1 ? "e" : "i") +
                " nel gruppo più a sinistra: " + primoGruppo + ")";
        }
    }

    const stringaRisultato = cifreRisultato.join("");

    document.getElementById("risultato-b2x").innerHTML =
        "<strong>" + binarioCorrente + "<sub>2</sub></strong> = " +
        gruppi.join("&nbsp;|&nbsp;") +
        " = <strong>" + stringaRisultato + "<sub>" + baseCorrente + "</sub></strong>" +
        notaPadding;

    // Sincronizza il widget 2 (mostra lo stesso valore nella base scelta)
    document.getElementById("input-cifre").value = stringaRisultato;
    document.getElementById("base-corrente-label").textContent = baseCorrente;
    aggiornaBaseVersoBinario(stringaRisultato);
}

// ---------------------------------------------------------------
// 5. Rendering: base 2^n -> binario
// ---------------------------------------------------------------

function aggiornaBaseVersoBinario(stringaCifre) {
    const n = BASI[baseCorrente].bitPerCifra;
    const corpo = document.getElementById("corpo-tabella-espansione");
    corpo.innerHTML = "";

    // Info di stato
    const info = document.getElementById("info-cifre");
    info.textContent =
        "Base " + baseCorrente + "  ·  ogni cifra viene scritta su " + n + " bit";

    if (stringaCifre.length === 0) {
        document.getElementById("risultato-x2b").innerHTML =
            "<em>Nessuna cifra inserita.</em>";
        return;
    }

    let binarioCompleto = "";
    let cifreValide = true;
    let paddingTotale = 0;

    for (let i = 0; i < stringaCifre.length; i++) {
        const carattere = stringaCifre[i].toUpperCase();
        const valore = cifraInValore(carattere, baseCorrente);
        const riga = document.createElement("tr");

        if (valore < 0) {
            cifreValide = false;
            riga.innerHTML =
                "<td>" + (i + 1) + "</td>" +
                "<td><strong>" + carattere + "</strong></td>" +
                '<td colspan="2" class="cifra-invalida">Cifra non valida in base ' +
                baseCorrente + "</td>";
            corpo.appendChild(riga);
            continue;
        }

        const valoreBin = valore.toString(2);
        const zeriAggiunti = n - valoreBin.length;
        paddingTotale += zeriAggiunti;
        const gruppoBinario = valoreBin.padStart(n, "0");
        binarioCompleto += gruppoBinario;

        riga.innerHTML =
            "<td>" + (i + 1) + "</td>" +
            "<td><strong>" + carattere + "</strong></td>" +
            "<td>" + valore + "</td>" +
            '<td><span class="bit-group-badge">' + gruppoBinario + "</span>" +
            (zeriAggiunti > 0
                ? ' <span class="padding-nota">(+' + zeriAggiunti + " zeri a sinistra)</span>"
                : "") +
            "</td>";
        corpo.appendChild(riga);
    }

    if (!cifreValide) {
        document.getElementById("risultato-x2b").innerHTML =
            "<em>Correggi le cifre evidenziate per ottenere il binario.</em>";
        return;
    }

    document.getElementById("risultato-x2b").innerHTML =
        "<strong>" + stringaCifre.toUpperCase() + "<sub>" + baseCorrente + "</sub></strong> = " +
        binarioCompleto + "<sub>2</sub>" +
        (paddingTotale > 0
            ? " <span class=\"padding-nota\">(padding totale: +" + paddingTotale +
              " bit)</span>"
            : "");
}

// ---------------------------------------------------------------
// 6. Gestione eventi
// ---------------------------------------------------------------

function gestisciInputBinario(testo) {
    const pulito = normalizzaBinario(testo);
    binarioCorrente = pulito;
    // Aggiorna il campo con la versione ripulita (così l'utente vede subito l'effetto)
    if (document.getElementById("input-binario").value !== pulito) {
        document.getElementById("input-binario").value = pulito;
    }
    aggiornaBinarioVersoBase();
}

function gestisciCambioBase(nuovaBase) {
    baseCorrente = parseInt(nuovaBase, 10);
    // Il binario di partenza resta lo stesso: si ricalcola solo il raggruppamento
    aggiornaBinarioVersoBase();
}

function gestisciInputCifre(testo) {
    const pulito = testo.toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (document.getElementById("input-cifre").value !== pulito) {
        document.getElementById("input-cifre").value = pulito;
    }
    aggiornaBaseVersoBinario(pulito);
}

// ---------------------------------------------------------------
// 7. Collegamento eventi e avvio
// ---------------------------------------------------------------

document.getElementById("input-binario").addEventListener("input", function () {
    gestisciInputBinario(this.value);
});

document.getElementById("selettore-base").addEventListener("change", function () {
    gestisciCambioBase(this.value);
});

document.getElementById("input-cifre").addEventListener("input", function () {
    gestisciInputCifre(this.value);
});

document.getElementById("pulsante-stampa").addEventListener("click", function () {
    window.print();
});

// Primo rendering: 45 in base 16 -> "00101101" raggruppato in "0010 1101" = "2D"
aggiornaBinarioVersoBase();