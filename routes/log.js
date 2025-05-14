const express = require('express');
const router      = express.Router();
const fs = require('fs');
const path = require('path');
const {
    authenticateToken,
    authorize
} = require('../middleware/checkAuth');

router.get('/', authenticateToken, authorize('amministratore'), async (req, res) => {
    const scuola_id = req.user.scuola_id; 
    const logFileName = `scuola-${scuola_id}.log`;
    const logFilePath = path.join(__dirname, '..', 'logs', logFileName); 

    fs.access(logFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).json({ error: 'Log file non trovato' });
        }

        res.sendFile(logFilePath);
    });
});
            
module.exports = router;