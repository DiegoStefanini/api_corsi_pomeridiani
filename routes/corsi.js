const express = require('express');
const pool    = require('../db');
const {
    authenticateToken,
    authorize
} = require('../middleware/checkAuth');
const log = require('../middleware/logs');
const router = express.Router();

// GET /corsi
// Restituisce tutti i corsi della scuola dell'utente autenticato, con i nomi di scuola e docente.
router.get('/', authenticateToken, authorize('studente', 'docente', 'amministratore'), async (req, res) => {
    const scuolaId = req.user.scuola_id;

    try {
        const [corsi] = await pool.query(
            `SELECT c.id, c.titolo, c.descrizione, s.nome AS nome_scuola, u.username AS nome_docente
             FROM corsi c
             JOIN scuole s ON c.scuola_id = s.id
             JOIN utenti u ON c.docente_id = u.id
             WHERE c.scuola_id = ?`,
            [scuolaId]
        );

        res.json(corsi);
    } catch (error) {
        console.error('Errore durante la ricerca dei corsi:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
});

// GET /corsi/:id
// Restituisce un corso specifico per ID, con i nomi di scuola e docente.
router.get('/:id', authenticateToken, authorize('studente', 'docente', 'amministratore'), async (req, res) => {
    const corsoId = parseInt(req.params.id);
    const scuolaId = req.user.scuola_id;

    if (isNaN(corsoId)) {
        return res.status(400).json({ error: 'ID del corso non valido.' });
    }

    try {
        const [corsi] = await pool.query(
            `SELECT c.id, c.titolo, c.descrizione, s.nome AS nome_scuola, u.username AS nome_docente
             FROM corsi c
             JOIN scuole s ON c.scuola_id = s.id
             JOIN utenti u ON c.docente_id = u.id
             WHERE c.id = ? AND c.scuola_id = ?`,
            [corsoId, scuolaId]
        );

        if (corsi.length === 0) {
            return res.status(404).json({ message: 'Corso non trovato.' });
        }

        res.json(corsi[0]);
    } catch (error) {
        console.error('Errore durante la ricerca del corso:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
});

// POST /corsi
// Crea un nuovo corso. Solo i docenti e gli amministratori possono creare corsi.
// Prende 'titolo' e 'descrizione' dal body e ricava 'docente_id' e 'scuola_id' dal JWT.
router.post('/', authenticateToken,log(), authorize('docente'), async (req, res) => {
    const { titolo, descrizione } = req.body;
    const docenteId = req.user.id;
    const scuolaId = req.user.scuola_id;

    if (!titolo || !descrizione) {
        return res.status(400).json({ error: 'Titolo e descrizione sono obbligatori.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO corsi (titolo, descrizione, scuola_id, docente_id) VALUES (?, ?, ?, ?)',
            [titolo, descrizione, scuolaId, docenteId]
        );

        res.status(201).json({
            message: 'Corso creato con successo.',
            corso_id: result.insertId
        });
    } catch (error) {
        console.error('Errore durante la creazione del corso:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
});

// PUT /corsi/:id
// Permette a un docente di modificare il titolo e la descrizione dei propri corsi.
router.put('/:id', authenticateToken,log(), authorize('docente'), async (req, res) => {
    const corsoId = parseInt(req.params.id);
    const { titolo, descrizione } = req.body;
    const docenteId = req.user.id; // ID del docente dal token

    if (isNaN(corsoId)) {
        return res.status(400).json({ error: 'ID del corso non valido.' });
    }

    if (!titolo && !descrizione) {
        return res.status(400).json({ error: 'Devi fornire almeno il titolo o la descrizione da modificare.' });
    }

    try {
        // Verifica se il corso esiste e se appartiene al docente che sta facendo la richiesta
        const [corso] = await pool.query(
            'SELECT id FROM corsi WHERE id = ? AND docente_id = ?',
            [corsoId, docenteId]
        );

        if (corso.length === 0) {
            return res.status(404).json({ message: 'Corso non trovato o non sei autorizzato a modificarlo.' });
        }

        let updates = [];
        let params = [];

        if (titolo) {
            updates.push('titolo = ?');
            params.push(titolo);
        }
        if (descrizione) {
            updates.push('descrizione = ?');
            params.push(descrizione);
        }

        params.push(corsoId);

        const sql = `UPDATE corsi SET ${updates.join(', ')} WHERE id = ?`;

        const [result] = await pool.query(sql, params);

        if (result.affectedRows > 0) {
            res.json({ message: 'Corso aggiornato con successo.' });
        } else {
            // Questo caso potrebbe verificarsi se non ci sono modifiche da apportare
            res.json({ message: 'Nessuna modifica apportata al corso.' });
        }

    } catch (error) {
        console.error('Errore durante l\'aggiornamento del corso:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
});

// DELETE /corsi/:id
// Elimina un corso specifico. Solo i docenti e gli amministratori possono eliminare corsi.
router.delete('/:id', authenticateToken,log(), authorize('amministratore', 'docente'), async (req, res) => {
    const corsoId = parseInt(req.params.id);

    if (isNaN(corsoId)) {
        return res.status(400).json({ error: 'ID del corso non valido.' });
    }

    try {
        const [result] = await pool.query(
            'DELETE FROM corsi WHERE id = ?',
            [corsoId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Corso non trovato.' });
        }

        res.json({ message: 'Corso eliminato con successo.' });
    } catch (error) {
        console.error('Errore durante l\'eliminazione del corso:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
});

module.exports = router;