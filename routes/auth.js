// routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const pool    = require('../db');         // vedi nota su db.js
const jwt     = require('jsonwebtoken');


const SALT_ROUNDS = 10;
const ACCESS_TOKEN_SECRET  = process.env.ACCESS_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES = '24h'; 
const router = express.Router();

// chiami facendo /auth/register-shool
router.post('/register-school', async (req, res) => {
    const {
        nome,
        indirizzo,
        email,
        admin_username,
        admin_password
    } = req.body;

    if (!nome || !email || !admin_username || !admin_password) {
        return res.status(400).send('Campi obbligatori mancanti');
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [existingReqs] = await conn.query(
            'SELECT id, status FROM registration_requests WHERE nome = ?',
            [nome]
        );
        if (existingReqs.length > 0) {
            const status = existingReqs[0].status;

            await conn.rollback();
            return res.status(409).send(
                `Esiste già una richiesta con status "${status}" per una scuola con questo nome.`
            );
        }
        // Hash password e inserimento in registration request
        const passwordHash = await bcrypt.hash(admin_password, SALT_ROUNDS);

        await conn.query(
            `INSERT INTO registration_requests
             (nome, indirizzo, email, admin_username, admin_password)
             VALUES (?, ?, ?, ?, ?)`,
            [ nome, indirizzo || null, email, admin_username, passwordHash ]
        );

        await conn.commit();
        // risposta richiesta completata
        res.send(`
                <!DOCTYPE html>
                <html lang="it">
                <head><meta charset="UTF-8"><title>Registrazione Completata</title></head>
                <body>
                  <h1>Registrazione Completata</h1>
                  <p>Stiamo elaborando la tua richiesta...</p>
                  <p>Attendi una nostra email.</p>
                </body>
                </html>
              `);
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).send('Errore interno');
    } finally {
        conn.release();
    }
});

router.post('/token', async (req, res) => {
    const { username, password } = req.body;

    // Validazione minima
    if (!username || !password ) {
        return res
            .status(400)
            .send('Campi obbligatori mancanti: username, password.');
    }

    let conn;
    try {
        // Recupera utente da DB
        conn = await pool.getConnection();
        const [rows] = await conn.query(
            'SELECT id, username, password_hash, ruolo, scuola_id FROM utenti WHERE username = ?',
            [username]
        );
        if (rows.length === 0) {
            return res.status(401).send('Credenziali non valide. 1 ');
        }
        const user = rows[0];

        // Verifica password
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).send('Credenziali non valide. 2 ');
        }

        //  Genera JWT
        const payload = {
            sub: user.id,
            ruolo: user.ruolo,
            scuola_id: user.scuola_id
        };
        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRES
        });

        //  Ritorna il token
        return res.json({ accessToken });

    } catch (err) {
        console.error('Errore in POST /auth/token:', err);
        return res.status(500).send('Errore interno del server.');
    } finally {
        if (conn) conn.release();
    }
});





module.exports = router;
