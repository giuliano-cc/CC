# Duplicati

App locale per trovare i file duplicati sul Mac e spostarli nel Cestino. Solo Python 3, nessuna dipendenza.

    python3 duplicati/duplicati.py                 # scansiona Download, Documenti, Scrivania, Immagini
    python3 duplicati/duplicati.py ~/Music ~/Movies  # oppure cartelle a scelta

Si apre il browser su http://127.0.0.1:8765. I duplicati sono identificati dal contenuto (SHA-256), non dal nome.
Sicurezza: i file vanno nel Cestino (si possono ripristinare), in ogni gruppo resta sempre almeno una copia,
il server ascolta solo su localhost e le azioni richiedono un token casuale.
