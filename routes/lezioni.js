const express = require('express');
const pool    = require('../db'); // Assicurati che il percorso sia corretto
const {
    authenticateToken,
    authorize // Lo useremo se vogliamo restringere ulteriormente alcuni endpoint
} = require('../middleware/checkAuth'); // Assicurati che il percorso sia corretto

const router = express.Router();

// GET /lezioni/:corsoId
// Restituisce le lezioni di un corso specifico, filtrate per la scuola dell'utente.
router.get('/:corsoId', authenticateToken, authorize('studente', 'docente', 'amministratore'), async (req, res) => {
    const corsoId = parseInt(req.params.corsoId);
    const scuolaId = req.user.scuola_id; // Ottieni la scuola_id dal JWT

    if (isNaN(corsoId)) {
        return res.status(400).json({ error: 'ID del corso non valido.' });
    }

    try {
        const [lezioni] = await pool.query(
            `SELECT l.id, l.corso_id, l.data, l.orario_inizio, l.orario_fine, l.id_aula
             FROM lezioni l
             JOIN corsi c ON l.corso_id = c.id
             WHERE l.corso_id = ? AND c.scuola_id = ?`,
            [corsoId, scuolaId]
        );

        if (lezioni.length === 0) {
            return res.status(404).json({ message: 'Nessuna lezione trovata per questo corso in questa scuola.' });
        }

        res.json(lezioni);

    } catch (error) {
        console.error('Errore durante la ricerca delle lezioni:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
});

// POST /lezioni
// Crea una nuova lezione per un corso.
// Richiede autenticazione e autorizzazione per 'docente' o 'amministratore'.
router.post('/', authenticateToken, authorize('docente', 'amministratore'), async (req, res) => {
    const { corso_id, data, orario_inizio, orario_fine, id_aula } = req.body;

    // Validazione di base
    if (!corso_id || !data || !orario_inizio || !orario_fine || !id_aula) {
        return res.status(400).json({ error: 'Corso ID, data, orario di inizio, orario di fine e ID aula sono obbligatori.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO lezioni (corso_id, data, orario_inizio, orario_fine, id_aula) VALUES (?, ?, ?, ?, ?)',
            [corso_id, data, orario_inizio, orario_fine, id_aula]
        );

        res.status(201).json({
            message: 'Lezione creata con successo.',
            lezione_id: result.insertId
        });

    } catch (error) {
        console.error('Errore durante la creazione della lezione:', error);
        res.status(500).json({ error: 'Errore interno del server durante la creazione.' });
    }
});

// DELETE /lezioni/:id
// Elimina una lezione specifica.
// Richiede autenticazione e autorizzazione per 'docente' o 'amministratore'.
router.delete('/:id', authenticateToken, authorize('docente', 'amministratore'), async (req, res) => {
    const lezioneId = parseInt(req.params.id);

    if (isNaN(lezioneId)) {
        return res.status(400).json({ error: 'ID della lezione non valido.' });
    }

    try {
        const [result] = await pool.query(
            'DELETE FROM lezioni WHERE id = ?',
            [lezioneId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Lezione non trovata.' });
        }

        res.json({ message: 'Lezione eliminata con successo.' });

    } catch (error) {
        console.error('Errore durante l\'eliminazione della lezione:', error);
        res.status(500).json({ error: 'Errore interno del server durante l\'eliminazione.' });
    }
});

module.exports = router;