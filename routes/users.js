// routes/users.js
const express = require('express');
const bcrypt  = require('bcrypt');
const pool    = require('../db');
const {
    authenticateToken,
    authorize
} = require('../middleware/checkAuth');  // JWT + RBAC

const SALT_ROUNDS = 10;
const router      = express.Router();

/**
 * POST /users/register
 * Crea un nuovo utente (docente o studente o amministratore) per la scuola dell’admin loggato.
 * Protetto: authenticateToken + authorize('amministratore')
 *
 * body: {
 *   username: string,
 *   password: string,
 *   ruolo: 'docente' | 'studente'
 * }
 */
router.post('/', authenticateToken, authorize('amministratore'),
    async (req, res) => {
        const { username, password, ruolo } = req.body;
        const allowedRoles = ['docente', 'studente', 'amministratore'];

        // validazione di base
        if (!username || !password || !ruolo) {
            return res.status(400).send('Campi mancanti: username, password, ruolo.');
        }
        if (!allowedRoles.includes(ruolo)) {
            return res.status(400).send('Ruolo non valido, scegli "docente" o "studente" o "amministratore.');
        }

        const scuola_id = req.user.scuola_id; // dal JWT
        let conn;
        try {
            conn = await pool.getConnection();
            await conn.beginTransaction();

            // hash della password
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

            // inserimento utente
            await conn.query(
                `INSERT INTO utenti
                 (username, password_hash, ruolo, scuola_id)
                 VALUES (?, ?, ?, ?)`,
                [username, passwordHash, ruolo, scuola_id]
            );

            await conn.commit();
            res.status(201).json({ message: 'Utente creato con successo.' });

        } catch (err) {
            if (conn) await conn.rollback();
            console.error('Errore in POST /users:', err);
            res.status(500).send('Errore interno del server.');
        } finally {
            if (conn) conn.release();
        }
    }
);

module.exports = router;
