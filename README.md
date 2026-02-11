# Cosmic Hama Creations

Web app single-page per progettare blueprint Hama Beads.

## Funzionalità principali

- Conversione immagine ➜ schema Hama su griglia configurabile.
- Editor blueprint con tool stile paint: matita, gomma, secchiello, linea, rettangolo, cerchio.
- Undo / redo delle azioni.
- Preview trasparente sulla griglia prima di piazzare la perlina o la forma.
- Rendering realistico delle perline con effetto anello/foro centrale.
- Condivisione design via URL (hash con stato serializzato).
- Tema cottagecore + cursore personalizzato a zampetta.

## Avvio locale

```bash
python3 -m http.server 4173
```

Apri poi `http://localhost:4173`.

## Pubblicazione online su GitHub Pages

L'`index.html` è nella root del progetto, quindi GitHub Pages può servirlo direttamente.

1. Fai merge di questo branch in `main`.
2. Su GitHub vai in **Settings → Pages** e imposta **Source: GitHub Actions**.
3. Il workflow `.github/workflows/deploy-pages.yml` farà deploy automatico ad ogni push su `main`.

URL finale (tipico):
- `https://<tuo-utente>.github.io/<nome-repo>/`

## Pubblicare senza terminale (solo dal sito GitHub)

Se sei già sul sito GitHub, questa è la strada più semplice (zero comandi).

1. Apri il tuo repository su GitHub (pagina principale con i file).
2. Clicca la scheda **Pull requests** in alto.
3. Clicca il pulsante **New pull request**.
4. In alto scegli:
   - **base:** `main`
   - **compare:** il branch con le modifiche (es. `codex/develop-hama-beads-design-web-app`)
5. Clicca **Create pull request**.
6. Nella pagina successiva clicca **Merge pull request**.
7. Clicca **Confirm merge**.
8. Vai su **Actions** e aspetta che il deploy finisca (spunta verde).
9. Vai su **Settings → Pages** e apri il link pubblico del sito.

### Se non vedi il branch nel punto 4

- Significa che quel branch non è stato caricato su GitHub oppure è stato cancellato.
- In quel caso devi prima rifare il push del branch dal terminale (vedi sezione sotto).

## Guida "non sbaglio" (passo-passo)

Se hai cancellato branch o non sai dove incollare i comandi, segui esattamente questa sequenza.

### A) Dove incollare i comandi

I comandi Git vanno eseguiti nel **terminale**, dentro la cartella del progetto (quella con `index.html`, `app.js`, `README.md`).

Esempio:

```bash
cd /percorso/del/tuo/progetto
```

### B) Comandi da copiare e incollare

Sostituisci solo `URL_DEL_TUO_REPO_GITHUB` con l'URL del repository (es. `https://github.com/tuoutente/cosmichamacreations.git`).

```bash
# 1) controlla di essere nella cartella giusta
pwd
ls

# 2) imposta il remote (una sola volta)
git remote add origin URL_DEL_TUO_REPO_GITHUB

# se il remote esiste già, usa questo invece:
# git remote set-url origin URL_DEL_TUO_REPO_GITHUB

# 3) pubblica il branch corrente su GitHub
git push -u origin work
```

### C) Poi su GitHub (interfaccia web)

1. Apri il repository.
2. Clicca **Compare & pull request** sul branch appena pushato.
3. Verifica: **base branch = `main`**.
4. Clicca **Create pull request**.
5. Se appare **Update branch**, cliccalo.
6. Clicca **Merge pull request** → **Confirm merge**.

### D) Controllo finale

- Vai su **Actions** e attendi il job di deploy verde.
- Vai su **Settings → Pages** e apri l'URL pubblico.

Se qualcosa non funziona, copia l'errore esatto del terminale e riparti da qui: nella pratica il problema è quasi sempre solo l'URL del remote o il branch di destinazione.
