// index.js
const express = require('express');
const path    = require('path');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const adminRequests     = require('./routes/adminRequests');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static HTML
app.get('/documentazione', (req, res) => {
    res.sendFile(path.join(__dirname, 'documentazione.html'));
});

app.get('/register-school', (req, res) => {
    res.sendFile(path.join(__dirname, 'registrazione.html'));
});

// monta i router
app.use('/auth', authRoutes);
app.use('/admin', adminRequests);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});
