// routes/adminRequests.js
const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const pool      = require('../db');



const router = express.Router();

router.use(adminAuth);

/** GET /admin/requests – mostra le richieste in HTML */
router.get('/requests', adminAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                id,
                nome,
                indirizzo,
                email,
                admin_username,
                status,
                created_at,
                processed_at
             FROM registration_requests
             ORDER BY created_at DESC`
        );

        let html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <title>Richieste di Registrazione</title>
                <style>
                    body { font-family: sans-serif; margin: 2em; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ccc; padding: 0.5em; }
                    th { background: #f4f4f4; }
                    form { display: inline; margin: 0; }
                    button { margin: 0 0.2em; }
                </style>
            </head>
            <body>
                <h1>Richieste di Registrazione</h1>
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Scuola</th>
                        <th>Email</th>
                        <th>Username Admin</th>
                        <th>Status</th>
                        <th>Inviata il</th>
                        <th>Processata il</th>
                        <th>Azioni</th>
                    </tr>`;

        rows.forEach(r => {
            html += `
                    <tr>
                        <td>${r.id}</td>
                        <td>${r.nome}</td>
                        <td>${r.email}</td>
                        <td>${r.admin_username}</td>
                        <td>${r.status}</td>
                        <td>${new Date(r.created_at).toLocaleString('it-IT')}</td>
                        <td>${r.processed_at
                            ? new Date(r.processed_at).toLocaleString('it-IT')
                            : '-'
                        }</td>
                        <td>
                        ${r.status === 'pending' ? `
                            <form action="/admin/requests/${r.id}/approve" method="post">
                                <button type="submit">Accetta</button>
                            </form>
                            <form action="/admin/requests/${r.id}/reject" method="post">
                                <button type="submit">Rifiuta</button>
                            </form>`: r.status === 'block' ? `
                            <form action="/admin/requests/${r.id}/sblock" method="post">
                                <button type="submit">Sblocca</button>
                            </form>
                             ` : `
                             <form action="/admin/requests/${r.id}/block" method="post">
                                <button type="submit">Blocca</button>
                            </form>
                             `
                        }
                        </td>
                    </tr>`;
        });

        html += `
                </table>
            </body>
            </html>`;

        res.send(html);

    } catch (err) {
        console.error('Errore in GET /admin/requests:', err);
        res.status(500).send('Errore interno del server.');
    }
});

/**
 * POST /admin/requests/:id/approve
 * Approva la richiesta, crea scuola + admin e torna alla lista.
 */
router.post('/requests/:id/approve', adminAuth, async (req, res) => {
    const { id } = req.params;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
    
        // 1) Recupera la richiesta pendente
        const [[reqRow]] = await conn.query(
            `SELECT * FROM registration_requests
             WHERE id = ? AND status = 'pending'`,
            [id]
        );
        if (!reqRow) {
            await conn.rollback();
            return res.status(404).send('Richiesta non trovata o già processata.');
        }
    
        // 2) Crea la scuola
        const [schoolResult] = await conn.query(
            `INSERT INTO scuole (id, nome, indirizzo, email_amministratore)
             VALUES (?, ?, ?, ?)`,
            [reqRow.id, reqRow.nome, reqRow.indirizzo, reqRow.email]
        );
    
        // // 3) Crea l’utente amministratore (password già hashata in registration_requests)
        await conn.query(
            `INSERT INTO utenti (username, password_hash, ruolo, scuola_id)
             VALUES (?, ?, 'amministratore', ?)`,
            [reqRow.admin_username, reqRow.admin_password, reqRow.id]
        );
    
        // // 4) Aggiorna lo stato della richiesta
        await conn.query(
            `UPDATE registration_requests
             SET status = 'approved', processed_at = NOW()
             WHERE id = ?`,
            [id]
        );
    
        await conn.commit();
        // Torna alla lista delle richieste
       
        res.redirect('/admin/requests');
    
    } catch (err) {
        await conn.rollback();
        console.error('Errore in POST /admin/requests/:id/approve:', err);
        res.status(500).send('Errore interno del server.');
    } finally {
        conn.release();
    }
});

/**
 * POST /admin/requests/:id/reject
 * Rifiuta la richiesta e torna alla lista.
 */
router.post('/requests/:id/reject', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            `UPDATE registration_requests
             SET status = 'rejected', processed_at = NOW()
             WHERE id = ?`,
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).send('Richiesta non trovata.');
        }
        // Torna alla lista delle richieste
        res.redirect('/admin/requests');
    } catch (err) {
        console.error('Errore in POST /admin/requests/:id/reject:', err);
        res.status(500).send('Errore interno del server.');
    }
});

router.post('/requests/:id/block', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            `UPDATE registration_requests
             SET status = 'block', processed_at = NOW()
             WHERE id = ?`,
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).send('Richiesta non trovata.');
        }
        res.redirect('/admin/requests');
    } catch (err) {
        console.error('Errore in POST /admin/requests/:id/block:', err);
        res.status(500).send('Errore interno del server.');
    }
});


router.post('/requests/:id/sblock', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            `UPDATE registration_requests
             SET status = 'approved', processed_at = NOW()
             WHERE id = ?`,
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).send('Richiesta non trovata.');
        }
        res.redirect('/admin/requests');
    } catch (err) {
        console.error('Errore in POST /admin/requests/:id/block:', err);
        res.status(500).send('Errore interno del server.');
    }
});


module.exports = router;
