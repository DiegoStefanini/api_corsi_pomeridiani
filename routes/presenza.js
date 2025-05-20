const express = require('express');
const pool    = require('../db'); // Assicurati che il percorso sia corretto
const {
    authenticateToken,
    authorize // Lo useremo se vogliamo restringere ulteriormente alcuni endpoint
} = require('../middleware/checkAuth'); // Assicurati che il percorso sia corretto
const log = require('../middleware/logs');
const router = express.Router();

// 1. Inserimento presenze
router.post('/', authenticateToken,log(), authorize('docente'), async (req, res) => {
  const { lezione_id, studente_id, presente } = req.body;
  const docente_id = req.user.id; // Ottenere l'id dal token

  try {
    // 1. Verifica che il docente sia assegnato al corso della lezione
    const [lezione] = await pool.query(
      `SELECT c.docente_id 
       FROM lezioni l
       JOIN corsi c ON l.corso_id = c.id
       WHERE l.id = ?`,
      [lezione_id]
    );

    if (lezione.length === 0) {
      return res.status(404).send('Lezione non trovata');
    }

    if (lezione[0].docente_id !== docente_id && req.user.ruolo !== 'amministratore') { 
      return res.status(403).send('Non sei autorizzato a segnare presenze per questa lezione');
    }

    // 2. Verifica esistenza presenza e inserimento (come prima)
    const [existing] = await pool.query(
      'SELECT * FROM presenze WHERE lezione_id = ? AND studente_id = ?',
      [lezione_id, studente_id]
    );
    if (existing.length > 0) {
      return res.status(409).send('Presenza già registrata');
    }

    await pool.query(
      'INSERT INTO presenze (lezione_id, studente_id, presente) VALUES (?, ?, ?)',
      [lezione_id, studente_id, presente]
    );
    res.status(201).send('Presenza registrata');

  } catch (err) {
    console.error(err);
    res.status(500).send('Errore del server');
  }
});

// 2. Visualizza presenze per una lezione
router.get('/lezione/:lezione_id', authenticateToken, authorize('docente', 'amministratore','studente'), async (req, res) => {
  const { lezione_id } = req.params;

  try {
    const [presenze] = await pool.query(
      `SELECT u.id, u.username, 
       CASE 
         WHEN p.presente = 1 THEN 'si'
         WHEN p.presente = 0 THEN 'no'
         ELSE 'sconosciuto'  -- Gestione di valori imprevisti
       END AS presente,
       p.lezione_id
       FROM presenze p
       JOIN utenti u ON p.studente_id = u.id
       WHERE p.lezione_id = ?`,
      [lezione_id]
    );

    if (presenze.length === 0) {
      return res.status(404).send('Nessuna presenza trovata per questa lezione');
    }

    res.json(presenze);
  } catch (err) {
    console.error(err);
    res.status(500).send('Errore del server');
  }
});

router.post('/assenza', authenticateToken,log(), authorize('studente'), async (req, res) => {
    const studente_id = req.user.id;
    const { lezione_id } = req.body;
  
    if (!lezione_id) {
      return res.status(400).send('lezione_id mancante');
    }
  
    try {
      // 1. Verifica che la lezione esista e sia futura
      const [lezioni] = await pool.query(
        `SELECT l.*, c.id AS corso_id
         FROM lezioni l
         JOIN corsi c ON l.corso_id = c.id
         WHERE l.id = ?`, [lezione_id]
      );
      if (lezioni.length === 0) return res.status(404).send("Lezione non trovata");
  
      const lezione = lezioni[0];
      const oggi = new Date().toISOString().slice(0, 10);
      if (lezione.data <= oggi) return res.status(400).send("Non puoi notificare assenze per lezioni passate");
  
      // 2. Verifica che lo studente sia iscritto al corso
      const [iscrizione] = await pool.query(
        `SELECT * FROM iscrizioni WHERE studente_id = ? AND corso_id = ?`,
        [studente_id, lezione.corso_id]
      );
      if (iscrizione.length === 0) return res.status(403).send("Non sei iscritto a questo corso");
  
      // 3. Verifica che non ci sia già una registrazione
      const [presenza] = await pool.query(
        `SELECT * FROM presenze WHERE lezione_id = ? AND studente_id = ?`,
        [lezione_id, studente_id]
      );
      if (presenza.length > 0) return res.status(409).send("Hai già segnalato la tua presenza/assenza");
  
      // 4. Inserisce la notifica di assenza
      await pool.query(
        `INSERT INTO presenze (lezione_id, studente_id, presente) VALUES (?, ?, 0)`,
        [lezione_id, studente_id]
      );
  
      res.status(201).send("Assenza notificata correttamente");
  
    } catch (err) {
      console.error(err);
      res.status(500).send("Errore interno");
    }
  });

  // 3. Elimina una presenza specifica
router.delete('/:id', authenticateToken,log(), authorize('docente', 'amministratore'), async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM presenze WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send('Presenza non trovata');
    }

    res.send({ message: 'Presenza eliminata con successo' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Errore del server');
  }
});

// 4. Visualizza tutte le presenze
router.get('/', authenticateToken, authorize('docente', 'amministratore'), async (req, res) => {
  try {
    const [presenze] = await pool.query(
      `SELECT p.*, u.username as nome_studente, l.id as lezione_id, c.titolo as nome_corso
       FROM presenze p
       JOIN utenti u ON p.studente_id = u.id
       JOIN lezioni l ON p.lezione_id = l.id
       JOIN corsi c ON l.corso_id = c.id`
    );

    res.json(presenze);
  } catch (err) {
    console.error(err);
    res.status(500).send('Errore del server');
  }
});
  module.exports = router;