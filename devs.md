## 🛠️ Stato dei lavori
Funzionalità | Stato
Registrazione e approvazione scuole | ✅ Completato
Login e JWT | ✅ Completato
Creazione utenti | ✅ Completato
Creazione corsi e assegnazione docenti | 🟡 Da completare
Gestione lezioni | 🟡 Da completare
Iscrizione studenti | 🟡 Da completare
Gestione presenze | 🔲 In sviluppo
Log azioni locali per scuola | 🔲 Da implementare
Webhook Discord logging globale | 🔲 Da implementare

## 🚨 Problemi o cose da risolvere
Area | Problema | Soluzione prevista
Sicurezza API | Accesso admin frontend migliorabile | Protezione con login a token anche lato admin
Log eventi | Log utente locali e webhook non ancora implementati | Creare servizio logging centralizzato
Rate Limit | Nessun rate-limit su login | Aggiungere express-rate-limit
Validazione dati | Base ma migliorabile | Introdurre express-validator
CORS | Attualmente molto permissivo | Limitare ai domini autorizzati

## 🤝 Workflow di collaborazione (Git & GitHub)

Per lavorare insieme senza conflitti o perdita di codice, seguiamo questo flusso di lavoro:

---

### 🔄 1. Prima di iniziare: aggiorna `main`

Assicurati di avere l’ultima versione del progetto prima di iniziare a lavorare:

```bash
git checkout main
git pull origin main
```

---

### 🌿 2. Crea un nuovo branch per la tua modifica

Lavora sempre su un branch separato da `main`:

```bash
git checkout -b nome-feature
```

Esempi di nomi di branch:
- `diego-login-api`
- `marco-db-setup`
- `stefano-fix-bug-clipboard`

---

### 💾 3. Salva le modifiche e fai push

Dopo aver modificato il codice, salva i cambiamenti e inviali su GitHub:

```bash
git add .
git commit -m "Descrizione chiara delle modifiche"
git push origin nome-feature
```

---

### 🧪 4. Apri una Pull Request (PR)

Vai su GitHub → Repository → **Pull Requests** → **New Pull Request**

- Base branch: `main`
- Compare: il tuo branch
- Aggiungi una descrizione chiara
- Assegna (opzionale) un revisore

---

### ⚠️ 5. Risolvi conflitti se servono

Se ci sono conflitti tra il tuo branch e `main`, Git te li segnala.

Per risolverli:

1. Modifica i file con conflitti
2. Segui le istruzioni nei file (<<<<, ====, >>>>)
3. Poi:

```bash
git add .
git commit -m "Risolti conflitti"
git push
```

---

### ✅ 6. Unisci la PR quando è pronta

Quando la PR è approvata dal team, puoi fare il **merge** su `main`.

---

## 🧠 Regole del team

- ❌ **Non lavorare direttamente su `main`**
- ✅ **Usa nomi chiari per i branch**
- 📣 **Comunica sempre con il team se modifichi cose importanti**
- 🧹 **Tieni il codice pulito e ben commentato**

---

## 📦 Extra: `.gitignore` consigliato

Per evitare di caricare file inutili (come `node_modules`), assicurati di avere questo nel file `.gitignore`:

```gitignore
node_modules
.env
.DS_Store
dist
*.log
```