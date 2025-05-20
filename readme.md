## Come installare il progetto ? 

```bash
git clone https://github.com/DiegoStefanini/api_corsi_pomeridiani.git
cd api_corsi_pomeridiani
npm install 
```

## Configura il database

Importa database.sql su mysql 
Configura il file .env con le tue preferenze

## Avvia index.js

```bash
node index.js 
```


## Se dovesse dare errori di compilazione:

```bash
npm install bcrypt
npm install dotenv
npm install jsonwebtoken
npm install mysql2
npm install axios 
```

## Documentazione API e Test con Postman

Questa API include una documentazione interattiva disponibile all'indirizzo:
[https://www.google.com/search?q=http://localhost:3000/documentazione]
(https://www.google.com/search?q=http://localhost:3000/documentazione). Qui puoi esplorare tutti gli endpoint disponibili e la loro struttura.

Per testare facilmente le chiamate API, in particolare quelle `POST`, `GET`, `PUT`, `DELETE`, puoi utilizzare Postman. Fai riferimento alla documentazione per i dettagli sui parametri da inviare nel corpo delle richieste.