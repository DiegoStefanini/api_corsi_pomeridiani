const express = require('express');
const app = express();
const PORT = 3000;
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'supersegreto123'; // in prod mettilo in .env

// Middleware per leggere JSON nel body delle richieste
app.use(express.json());

// Rotte di esempio
app.get('/', (req, res) => {
  res.send('API attiva!');
});


// Avvia il server
app.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});
