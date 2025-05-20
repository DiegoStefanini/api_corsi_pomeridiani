// index.js
const express = require('express');
const path    = require('path');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const adminRequests     = require('./routes/adminRequests');
const userRoutes        = require('./routes/users');
const iscrizioniRoutes  = require('./routes/iscrizioni');
const corsiRoutes       = require('./routes/corsi');
const logRoutes         = require('./routes/log');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static HTML
app.get('/', (req, res) => {
    res.redirect('/documentazione');
});

app.get('/documentazione', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/documentazione.html'));
});

app.get('/registra-scuola', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/registrazione.html'));
});

// monta i router
app.use('/auth', authRoutes);
app.use('/admin', adminRequests);
app.use('/users', userRoutes);   // <— qui monti il nuovo router
app.use('/iscrizioni', iscrizioniRoutes);   // <— qui monti il nuovo router
app.use('/corsi', corsiRoutes);   // <— qui monti il nuovo router
app.use('/log', logRoutes);   // <— qui monti il nuovo router

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});
