const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const SQL_FILE = path.join(__dirname, 'database.sql');

/**
 * Inizializza il database: crea DB e tabelle uno statement alla volta
 */
async function initDatabase() {
  let schema;
  try {
    schema = fs.readFileSync(SQL_FILE, 'utf8');
  } catch (err) {
    console.error(`Errore lettura ${SQL_FILE}:`, err);
    throw err;
  }

  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: false
  });

  try {
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length);

    for (const sql of statements) {
      console.log('Eseguo:', sql.slice(0, 50) + (sql.length > 50 ? '...' : ''));
      await conn.query(sql);
    }

    console.log('✔️ Schema DB applicato con successo.');
  } catch (err) {
    console.error('Errore initDatabase:', err);
    throw err;
  } finally {
    await conn.end();
  }
}

(async () => {
  // 1) Inizializza DB + tabelle
  await initDatabase();

  // 2) Crea pool verso il DB ora garantito
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'api_tepsit',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // 3) Setup Express
  const app = express();
  app.use(express.json());

  app.get('/documentazione', (req, res) => {
    res.sendFile(path.join(__dirname, 'documentazione.html'));
  });

  // Rotta di esempio: restituisce tutte le scuole
  app.get('/scuole', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM scuole');
      res.json(rows);
    } catch (err) {
      console.error('Errore /scuole:', err);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  // 4) Avvio server
  const server = app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
  });

  // 5) Chiusura Graceful
  let shuttingDown = false;
  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\nChiusura server in corso...');
    server.close(async () => {
      try {
        await pool.end();
        console.log('Connessioni DB chiuse.');
      } catch (err) {
        console.warn('Errore chiusura DB ignorato:', err.message);
      }
      console.log('Server chiuso. Arrivederci!');
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
})();
