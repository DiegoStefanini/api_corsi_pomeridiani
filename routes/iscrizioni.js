// routes/iscrizioni.js
const express = require('express');
const pool    = require('../db'); // Assicurati che il percorso sia corretto
const {
    authenticateToken,
    authorize
} = require('../middleware/checkAuth'); // Assicurati che il percorso sia corretto

const router = express.Router();

/**
 * POST /iscrizioni
 * Iscrive lo studente autenticato (ruolo 'studente') a un corso specifico.
 * Lo studente può iscriversi solo ai corsi della propria scuola.
 * Protetto: authenticateToken + authorize('studente')
 *
 * body: {
 * corso_id: number // L'ID del corso a cui iscriversi
 * }
 */
router.post('/', authenticateToken, authorize('studente'), async (req, res) => {
    console.log(req);
    const { corso_id } = req.body; // Ora prendiamo solo corso_id dal corpo
    const scuola_id_utente = req.user.scuola_id; // ID scuola dell'utente autenticato (dal token JWT)
    const studente_id_autenticato = req.user.id; // ID dell'utente studente autenticato (dal token JWT)

    console.log('Richiesta iscrizione ricevuta:', { corso_id, studente_id_autenticato, scuola_id_utente });

    // --- Validazione Input Base ---
    if (!corso_id || isNaN(parseInt(corso_id))) {
        return res.status(400).json({ message: 'ID del corso mancante o non valido.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Connessione al DB acquisita per POST /iscrizioni ');
        await conn.beginTransaction();

        // --- Verifica Esistenza e Appartenenza Corso ---
        const [corsoRows] = await conn.query(
            'SELECT id, scuola_id FROM corsi WHERE id = ?',
            [parseInt(corso_id)]
        );
        console.log('Risultato query verifica corso:', corsoRows);

        if (corsoRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Corso non trovato.' });
        }
        if (corsoRows[0].scuola_id !== scuola_id_utente) {
            await conn.rollback();
            return res.status(403).json({ message: 'Non puoi iscriverti a corsi di altre scuole.' });
        }

        // --- Verifica Esistenza e Ruolo Studente (OPZIONALE ma buona pratica) ---
        // Sebbene authorize('studente') dovrebbe aver già garantito il ruolo,
        // una verifica aggiuntiva sull'esistenza dell'utente con quell'ID e ruolo
        // nella scuola corretta può essere una sicurezza in più.
        const [studenteRows] = await conn.query(
            'SELECT id, ruolo FROM utenti WHERE id = ? AND scuola_id = ? AND ruolo = \'studente\'',
            [studente_id_autenticato, scuola_id_utente]
        );
        console.log('Risultato query verifica utente (studente):', studenteRows);

        if (studenteRows.length === 0) {
            // Questo errore indica un'incoerenza: l'utente autenticato con ruolo studente
            // non è stato trovato nel DB come studente di quella scuola.
            // Potrebbe indicare un problema con i dati o un token obsoleto.
            await conn.rollback();
            return res.status(404).json({ message: 'Utente studente non trovato o non valido per questa operazione.' });
        }

        // --- Tentativo di Inserimento Iscrizione ---
        // Usiamo studente_id_autenticato per studente_id.
        const [result] = await conn.query(
            'INSERT INTO iscrizioni (studente_id, corso_id) VALUES (?, ?)',
            [studente_id_autenticato, parseInt(corso_id)]
        );
        console.log('Risultato inserimento iscrizione:', result);

        await conn.commit();
        res.status(201).json({
            message: 'Iscrizione al corso avvenuta con successo.',
            iscrizione: {
                id: result.insertId,
                studente_id: studente_id_autenticato,
                corso_id: parseInt(corso_id)
            }
        });

    } catch (err) {
        if (conn) await conn.rollback();

        console.error('Errore dettagliato in POST /iscrizioni:', {
            message: err.message,
            code: err.code,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage,
        });

        if (err.code === 'ER_DUP_ENTRY' || (err.sqlState && err.sqlState.startsWith('23'))) {
            return res.status(409).json({ message: 'Risulti già iscritto a questo corso.' });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            // Questo errore potrebbe ancora capitare se, per qualche motivo, il corso_id
            // passasse le prime validazioni ma non esistesse al momento dell'insert (raro con le transazioni).
            return res.status(400).json({ message: 'ID corso non valido (riferimento mancante).' });
        }

        res.status(500).json({
            message: 'Errore interno del server durante l\'iscrizione.',
        });
    } finally {
        if (conn) {
            console.log('Rilascio connessione DB per POST /iscrizioni');
            await conn.release();
        }
    }
});
/**
 * GET /iscrizioni
 * Recupera l'elenco di tutti i corsi con il numero degli iscritti per ciascun corso.
 * Richiede autenticazione (ma non specifica il ruolo, quindi accessibile a tutti gli utenti autenticati).
 * Se vuoi limitare l'accesso, aggiungi il middleware `authorize`.
 */
router.get('/', authenticateToken, authorize('studente', 'amministratore'), async (req, res) => {
    console.log("Eseguendo GET /iscrizioni");
    try {
        const [rows] = await pool.query(`
            SELECT
                c.id AS corso_id,
                c.titolo AS nome_corso,
                c.descrizione AS descrizione_corso,
                COUNT(i.studente_id) AS numero_iscritti
            FROM corsi c
            LEFT JOIN iscrizioni i ON c.id = i.corso_id
            GROUP BY c.id, c.titolo, c.descrizione
        `);
        console.log("Risultato della query:", rows);
        res.json(rows);
    } catch (err) {
        console.error('Errore in GET /iscrizioni:', err);
        console.error(err); // Stampa l'errore completo
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

/**
 * GET /iscrizioni/:id_corso
 * Recupera l'elenco degli studenti iscritti a un corso specifico.
 * Richiede autenticazione (ma non specifica il ruolo, quindi accessibile a tutti gli utenti autenticati).
 * Se vuoi limitare l'accesso, aggiungi il middleware `authorize`.
 */
router.get('/:corso_id', authenticateToken,authorize('studente', 'amministratore'), async (req, res) => {
    const corsoId = req.params.corso_id;

    // Validazione del parametro
    if (!corsoId || isNaN(corsoId)) {
        return res.status(400).json({ error: 'ID del corso non valido' });
    }

    try {
        const [rows] = await pool.query(`
            SELECT
                u.id AS studente_id,
                u.username AS nome_studente
            FROM iscrizioni i
            JOIN utenti u ON i.studente_id = u.id
            WHERE i.corso_id = ?
        `, [corsoId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Corso non trovato o nessun iscritto.' });
        }

        res.json(rows);

    } catch (err) {
        console.error('Errore in GET /iscrizioni/:corso_id:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

/**
 * GET /iscrizioni 
 * Recupera l'elenco dei corsi a cui lo studente autenticato è iscritto.
 * Protetto: authenticateToken + authorize('studente')
 */
router.get('/mie-iscrizioni', authenticateToken, authorize('studente'), async (req, res) => {
    const studenteId = req.user.id;

    try {
        const [rows] = await pool.query(`
            SELECT
                c.id AS corso_id,
                c.titolo AS nome_corso,
                c.descrizione AS descrizione_corso
            FROM iscrizioni i
            JOIN corsi c ON i.corso_id = c.id
            WHERE i.studente_id = ?
        `, [studenteId]);

        res.json(rows);

    } catch (err) {
        console.error('Errore in GET /iscrizioni/mie-iscrizioni:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

/**
 * DELETE /iscrizioni
 * Permette allo studente autenticato (ruolo 'studente') di cancellare la propria iscrizione a un corso specifico.
 * Protetto: authenticateToken + authorize('studente')
 *
 * body: {
 * corso_id: number // L'ID del corso da cui disiscriversi
 * }
 */
router.delete('/', authenticateToken, authorize('studente'), async (req, res) => {
    const { corso_id } = req.body;
    const studente_id = req.user.id;

    if (!corso_id || typeof corso_id !== 'number') {
        return res.status(400).json({ error: 'ID del corso mancante o non valido' });
    }

    try {
        const [result] = await pool.query(`
            DELETE FROM iscrizioni
            WHERE studente_id = ? AND corso_id = ?
        `, [studente_id, corso_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Iscrizione non trovata' });
        }

        res.json({ message: 'Disiscrizione avvenuta con successo' });

    } catch (err) {
        console.error('Errore in DELETE /iscrizioni:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});


module.exports = router;