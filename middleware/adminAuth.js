// middleware/adminAuth.js
require('dotenv').config();

const ADMIN_USER = process.env.API_ADMIN_USER;
const ADMIN_PASS = process.env.API_ADMIN_PASS;


function adminAuth(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Autenticazione richiesta');
    }
    const [user, pass] = Buffer
        .from(auth.split(' ')[1], 'base64')
        .toString()
        .split(':');

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Credenziali non valide');
}

module.exports = adminAuth;
