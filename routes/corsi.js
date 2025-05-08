// routes/corsi.js
const express = require('express');
const pool    = require('../db'); // Assicurati che il percorso sia corretto
const {
    authenticateToken,
    authorize // Lo useremo se vogliamo restringere ulteriormente alcuni endpoint
} = require('../middleware/checkAuth'); // Assicurati che il percorso sia corretto

const router = express.Router();

/**
 * POST /corsi
 * Crea un nuovo corso. Solo gli amministratori possono creare corsi per la propria scuola.
 * Protetto: authenticateToken + authorize('amministratore')
 *
 * body: {
 * titolo: string,          // Obbligatorio
 * descrizione: string,     // Opzionale
 * orario: string,          // Opzionale (es. "Lunedì 15:00-17:00")
 * docente_id: number       // Opzionale, ID di un utente con ruolo 'docente'
 * }
 */
router.post('/', authenticateToken, authorize('amministratore'), async (req, res) => {
    const { titolo, descrizione, orario, docente_id } = req.body;
    const scuola_id = req.user.scuola_id; // ID della scuola dell'amministratore (dal token JWT)

    // --- Validazione Input Base ---
    if (!titolo || typeof titolo !== 'string' || titolo.trim() === '') {
        return res.status(400).json({ message: 'Il campo "titolo" è obbligatorio.' });
    }
    if (docente_id && (typeof docente_id !== 'number' || isNaN(parseInt(docente_id)))) {
        return res.status(400).json({ message: 'Il campo "docente_id" deve essere un numero intero valido.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // --- Validazione Docente (se fornito) ---
        let finalDocenteId = null; // Inizializza a null
        if (docente_id) {
            const [docenteRows] = await conn.query(
                'SELECT id FROM utenti WHERE id = ? AND ruolo = ? AND scuola_id = ?',
                [parseInt(docente_id), 'docente', scuola_id]
            );
            if (docenteRows.length === 0) {
                await conn.rollback();
                return res.status(400).json({ message: 'Docente non trovato, non valido o non appartenente alla tua scuola.' });
            }
            finalDocenteId = parseInt(docente_id);
        }

        // --- Inserimento Corso ---
        const [result] = await conn.query(
            'INSERT INTO corsi (titolo, descrizione, orario, scuola_id, docente_id) VALUES (?, ?, ?, ?, ?)',
            [titolo.trim(), descrizione || null, orario || null, scuola_id, finalDocenteId]
        );

        const nuovoCorsoId = result.insertId;

        await conn.commit();

        res.status(201).json({
            message: 'Corso creato con successo.',
            corso: {
                id: nuovoCorsoId,
                titolo: titolo.trim(),
                descrizione: descrizione || null,
                orario: orario || null,
                scuola_id: scuola_id,
                docente_id: finalDocenteId
            }
        });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Errore in POST /corsi:', err);
        // Controlla se l'errore è dovuto a un vincolo di chiave esterna per docente_id
        if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('docente_id')) {
            return res.status(400).json({ message: 'Il docente_id fornito non esiste o non è valido.' });
        }
        res.status(500).json({ message: 'Errore interno del server durante la creazione del corso.' });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * GET /corsi
 * Recupera tutti i corsi della scuola dell'utente autenticato.
 * Se l'utente è un amministratore, vede tutti i corsi della sua scuola.
 * Se l'utente è un docente, vede i corsi che insegna e quelli della sua scuola.
 * Se l'utente è uno studente, vede i corsi a cui è iscritto e quelli della sua scuola.
 * Protetto: authenticateToken
 */
router.get('/', authenticateToken, async (req, res) => {
    const scuola_id = req.user.scuola_id; // ID della scuola dell'utente (dal token JWT)
    // const utente_id = req.user.sub; // ID dell'utente (dal token JWT)
    // const ruolo_utente = req.user.ruolo; // Ruolo dell'utente (dal token JWT)

    let conn;
    try {
        conn = await pool.getConnection();
        // Query per recuperare i corsi.
        // Si potrebbe personalizzare la query in base al ruolo se necessario,
        // ma per ora mostriamo tutti i corsi della scuola.
        // Per JOIN con nome docente:
        const query = `
            SELECT
                c.id,
                c.titolo,
                c.descrizione,
                c.orario,
                c.scuola_id,
                c.docente_id,
                u.username AS nome_docente
            FROM corsi c
            LEFT JOIN utenti u ON c.docente_id = u.id AND u.ruolo = 'docente'
            WHERE c.scuola_id = ?
            ORDER BY c.titolo ASC;
        `;
        const [corsi] = await conn.query(query, [scuola_id]);

        res.status(200).json(corsi);

    } catch (err) {
        console.error('Errore in GET /corsi:', err);
        res.status(500).json({ message: 'Errore interno del server durante il recupero dei corsi.' });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * GET /corsi/:id
 * Recupera i dettagli di un corso specifico, verificando che appartenga alla scuola dell'utente.
 * Protetto: authenticateToken
 */
router.get('/:id', authenticateToken, async (req, res) => {
    const corso_id = parseInt(req.params.id);
    const scuola_id = req.user.scuola_id; // ID della scuola dell'utente (dal token JWT)

    if (isNaN(corso_id)) {
        return res.status(400).json({ message: 'ID del corso non valido.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        // Query per recuperare il corso e il nome del docente.
        const query = `
            SELECT
                c.id,
                c.titolo,
                c.descrizione,
                c.orario,
                c.scuola_id,
                c.docente_id,
                u.username AS nome_docente
            FROM corsi c
            LEFT JOIN utenti u ON c.docente_id = u.id AND u.ruolo = 'docente'
            WHERE c.id = ? AND c.scuola_id = ?;
        `;
        const [corsoRows] = await conn.query(query, [corso_id, scuola_id]);

        if (corsoRows.length === 0) {
            return res.status(404).json({ message: 'Corso non trovato o non appartenente alla tua scuola.' });
        }

        res.status(200).json(corsoRows[0]);

    } catch (err) {
        console.error(`Errore in GET /corsi/${corso_id}:`, err);
        res.status(500).json({ message: 'Errore interno del server durante il recupero del corso.' });
    } finally {
        if (conn) conn.release();
    }
});


// QUI PUOI AGGIUNGERE ALTRE ROUTE COME PUT E DELETE PER I CORSI
// Esempio PUT /corsi/:id (per modificare un corso, accessibile ad admin)
router.put('/:id', authenticateToken, authorize('amministratore'), async (req, res) => {
    const corso_id = parseInt(req.params.id);
    const { titolo, descrizione, orario, docente_id } = req.body;
    const scuola_id_admin = req.user.scuola_id;

    if (isNaN(corso_id)) {
        return res.status(400).json({ message: 'ID del corso non valido.' });
    }

    // Validazione: almeno un campo deve essere fornito per l'aggiornamento
    if (titolo === undefined && descrizione === undefined && orario === undefined && docente_id === undefined) {
        return res.status(400).json({ message: 'Nessun dato fornito per l_aggiornamento.' });
    }
    if (titolo !== undefined && (typeof titolo !== 'string' || titolo.trim() === '')) {
        return res.status(400).json({ message: 'Il campo "titolo" non può essere vuoto se fornito.' });
    }
     if (docente_id !== undefined && (typeof docente_id !== 'number' && docente_id !== null)) { // Permetti null per rimuovere il docente
        return res.status(400).json({ message: 'Il campo "docente_id" deve essere un numero o null.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Verifica che il corso esista e appartenga alla scuola dell'admin
        const [corsoEsistente] = await conn.query('SELECT * FROM corsi WHERE id = ? AND scuola_id = ?', [corso_id, scuola_id_admin]);
        if (corsoEsistente.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Corso non trovato o non appartenente alla tua scuola.' });
        }

        // 2. Validazione Docente (se fornito e non null)
        let finalDocenteId = corsoEsistente[0].docente_id; // Mantieni il vecchio se non specificato
        if (docente_id !== undefined) { // Solo se docente_id è esplicitamente nel body
            if (docente_id === null) {
                finalDocenteId = null; // Permetti di rimuovere il docente
            } else {
                 const [docenteRows] = await conn.query(
                    'SELECT id FROM utenti WHERE id = ? AND ruolo = ? AND scuola_id = ?',
                    [docente_id, 'docente', scuola_id_admin]
                );
                if (docenteRows.length === 0) {
                    await conn.rollback();
                    return res.status(400).json({ message: 'Docente non trovato, non valido o non appartenente alla tua scuola per l_aggiornamento.' });
                }
                finalDocenteId = docente_id;
            }
        }


        // 3. Costruisci la query di aggiornamento dinamicamente
        const campiDaAggiornare = {};
        if (titolo !== undefined) campiDaAggiornare.titolo = titolo.trim();
        if (descrizione !== undefined) campiDaAggiornare.descrizione = descrizione; // Può essere null o stringa
        if (orario !== undefined) campiDaAggiornare.orario = orario;       // Può essere null o stringa
        if (docente_id !== undefined) campiDaAggiornare.docente_id = finalDocenteId;


        if (Object.keys(campiDaAggiornare).length === 0) {
             await conn.rollback();
            return res.status(400).json({ message: 'Nessun campo valido fornito per l_aggiornamento.' });
        }

        const [result] = await conn.query('UPDATE corsi SET ? WHERE id = ? AND scuola_id = ?', [campiDaAggiornare, corso_id, scuola_id_admin]);

        if (result.affectedRows === 0) {
            // Questo non dovrebbe accadere se la verifica precedente ha avuto successo, ma è una sicurezza
            await conn.rollback();
            return res.status(404).json({ message: 'Aggiornamento fallito, corso non trovato.' });
        }

        await conn.commit();

        // Recupera il corso aggiornato per restituirlo
        const [updatedCorsoRows] = await conn.query(
             `SELECT c.id, c.titolo, c.descrizione, c.orario, c.scuola_id, c.docente_id, u.username AS nome_docente
              FROM corsi c
              LEFT JOIN utenti u ON c.docente_id = u.id AND u.ruolo = 'docente'
              WHERE c.id = ?`, [corso_id]
        );


        res.status(200).json({ message: 'Corso aggiornato con successo.', corso: updatedCorsoRows[0] });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error(`Errore in PUT /corsi/${corso_id}:`, err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('docente_id')) {
            return res.status(400).json({ message: 'Il docente_id fornito per l_aggiornamento non esiste o non è valido.' });
        }
        res.status(500).json({ message: 'Errore interno del server durante l_aggiornamento del corso.' });
    } finally {
        if (conn) conn.release();
    }
});


// DELETE /corsi/:id (per eliminare un corso, accessibile ad admin)
router.delete('/:id', authenticateToken, authorize('amministratore'), async (req, res) => {
    const corso_id = parseInt(req.params.id);
    const scuola_id_admin = req.user.scuola_id;

    if (isNaN(corso_id)) {
        return res.status(400).json({ message: 'ID del corso non valido.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 0. Opzionale: verifica se ci sono iscrizioni o lezioni collegate
        // Se esistono, potresti voler impedire la cancellazione o gestirla (es. DELETE CASCADE nel DB)
        // Per ora, procediamo con la cancellazione diretta. Assicurati che il DB gestisca le FK.
        // Esempio di verifica (da adattare se vuoi impedire la cancellazione):
        /*
        const [iscrizioni] = await conn.query('SELECT id FROM iscrizioni WHERE corso_id = ?', [corso_id]);
        if (iscrizioni.length > 0) {
            await conn.rollback();
            return res.status(409).json({ message: 'Impossibile eliminare il corso: esistono iscrizioni associate. Rimuovi prima le iscrizioni.' });
        }
        const [lezioni] = await conn.query('SELECT id FROM lezioni WHERE corso_id = ?', [corso_id]);
        if (lezioni.length > 0) {
            await conn.rollback();
            return res.status(409).json({ message: 'Impossibile eliminare il corso: esistono lezioni associate. Rimuovi prima le lezioni.' });
        }
        */

        // 1. Elimina il corso solo se appartiene alla scuola dell'admin
        const [result] = await conn.query('DELETE FROM corsi WHERE id = ? AND scuola_id = ?', [corso_id, scuola_id_admin]);

        if (result.affectedRows === 0) {
            await conn.rollback();
            // Potrebbe essere che il corso non esista o non appartenga alla scuola dell'admin
            return res.status(404).json({ message: 'Corso non trovato o non appartenente alla tua scuola, eliminazione fallita.' });
        }

        await conn.commit();
        res.status(200).json({ message: 'Corso eliminato con successo.' }); // O 204 No Content se preferisci non restituire un body

    } catch (err) {
        if (conn) await conn.rollback();
        console.error(`Errore in DELETE /corsi/${corso_id}:`, err);
         // Gestisci errori di violazione di foreign key se non hai ON DELETE CASCADE
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            // Questo errore generico indica che una riga in un'altra tabella fa riferimento a questo corso.
            // Potresti voler specificare meglio il messaggio in base alla tabella referenziante.
            let messaggioErrore = 'Impossibile eliminare il corso: è referenziato in altre tabelle (es. iscrizioni, lezioni).';
            if (err.sqlMessage.includes('iscrizioni_ibfk_2')) {
                 messaggioErrore = 'Impossibile eliminare il corso: esistono ancora iscrizioni associate a questo corso.';
            } else if (err.sqlMessage.includes('lezioni_ibfk_1')) {
                 messaggioErrore = 'Impossibile eliminare il corso: esistono ancora lezioni associate a questo corso.';
            }
            return res.status(409).json({ message: messaggioErrore });
        }
        res.status(500).json({ message: 'Errore interno del server durante l_eliminazione del corso.' });
    } finally {
        if (conn) conn.release();
    }
});


module.exports = router;