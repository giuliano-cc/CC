# Duplicati

App locale per trovare i file duplicati sul Mac e spostarli nel Cestino. Solo Python 3, nessuna dipendenza.

    python3 duplicati/duplicati.py                 # scansiona Download, Documenti, Scrivania, Immagini
    python3 duplicati/duplicati.py ~/Music ~/Movies  # oppure cartelle a scelta

Si apre il browser su http://127.0.0.1:8765. I duplicati sono identificati dal contenuto (SHA-256), non dal nome.
Sicurezza: i file vanno nel Cestino (si possono ripristinare), in ogni gruppo resta sempre almeno una copia,
il server ascolta solo su localhost e le azioni richiedono un token casuale.

## App con doppio clic

`Duplicati.zip` contiene `Duplicati.app`. Scompattalo, trascinalo in Applicazioni e aprilo con doppio clic.
Al primo avvio macOS potrebbe bloccarla perché non è firmata: fai clic destro sull'app, scegli **Apri**, poi **Apri** di nuovo
(oppure Impostazioni di Sistema → Privacy e sicurezza → "Apri comunque").
Per uscire: clic destro sull'icona nel Dock → **Esci**.
Nell'app puoi scegliere le cartelle da scansionare (Home, Musica, Film, dischi esterni o un percorso a piacere) e la dimensione minima dei file.
Dopo aver modificato `duplicati.py`, rigenera l'app con `./build_app.sh`.

L'icona è generata da `make_icon.py` (richiede Pillow) e salvata in `icon.icns`; `build_app.sh` la inserisce nell'app.
Per cambiarla modifica `make_icon.py`, esegui `python3 make_icon.py` e poi `./build_app.sh`.

## Novità della versione 2.0

- **iCloud:** i file presenti solo su iCloud (non scaricati) non vengono mai letti né scaricati. Si confrontano per **nome e dimensione**
  (ignorando maiuscole e suffissi come " 2", " (1)", " copy") e compaiono con ☁. Il contenuto di questi file non è verificato.
  Percorso: `~/Library/Mobile Documents/com~apple~CloudDocs`.
- **Confronto "Solo nome e dimensione":** veloce, non legge i file; utile per iCloud o per grandi archivi.
- Filtro per tipo di file, cartelle da escludere, annulla scansione, barra di avanzamento.
- Scegli quale copia tenere (più vecchia, più recente, percorso più corto, cartella preferita) e ordina i gruppi.
- Miniature per le immagini, elenco a pagine di 100 gruppi, cestino a blocchi (molto più veloce).
- Hard link e cartelle scansionate due volte non contano più come duplicati.
