// middleware/checkAuth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

/**
 * authenticateToken
 * Verifica che arrivi un JWT valido in Authorization: Bearer <token>
 * Popola req.user con { id, ruolo, scuola_id } estratti dal payload
*/
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send('Token mancante');
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).send('Token non valido');
        }
        req.user = {
            id: payload.sub,
            ruolo: payload.ruolo,
            scuola_id: payload.scuola_id
        };
        next();
    });
}

/**
 * authorize
 * Restituisce un middleware che consente l’accesso solo se
 * req.user.ruolo è incluso in allowedRoles
*/
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).send('Non autenticato');
        }
        if (!allowedRoles.includes(req.user.ruolo)) {
            return res.status(403).send('Accesso negato');
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authorize
};
