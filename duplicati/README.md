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
