const express = require('express');
const app = express();
const PORT = 3000;
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const path = require('path');

// Connessione al database MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'api_tepsit'
});

// Connessione al DB
connection.connect(err => {
  if (err) {
    console.error('Errore di connessione al DB:', err.stack);
    process.exit(1);
  }
  console.log('Connesso al DB con ID', connection.threadId);
});

// Middleware per leggere JSON nel body
app.use(express.json());

// Rotta per la documentazione
app.get('/documentazione', (req, res) => {
  res.sendFile(path.join(__dirname, 'documentazione.html'));
});



// Avvio del server
const server = app.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});

// Gestione chiusura pulita del server e del DB
function shutdown() {
  console.log('\nChiusura server in corso...');
  connection.end(err => {
    if (err) {
      console.error('Errore durante la chiusura della connessione al DB:', err.stack);
    } else {
      console.log('Connessione al DB chiusa correttamente.');
    }
    server.close(() => {
      console.log('Server chiuso. Arrivederci!');
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);   // CTRL+C
