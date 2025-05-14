// middleware/log.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK;


function log() {
    return async (req, res, next) => {
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.originalUrl;
        const user = req.user
            ? `${req.user.id} (scuola_id: ${req.user.scuola_id})`
            : 'Utente non autenticato';
        const body = req.body && Object.keys(req.body).length > 0
            ? JSON.stringify(req.body)
            : 'nessun body';

        const logEntry = `[${timestamp}] ${method} ${url} - ${user} - body: ${body}\n`;

        // Log su file
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        fs.appendFile(path.join(logDir, 'access.log'), logEntry, err => {
            if (err) console.error('Errore nella scrittura dei log:', err);
        });

        // Log su Discord
        if (DISCORD_WEBHOOK_URL != 0) {
            try {
                await axios.post(DISCORD_WEBHOOK_URL, {
                    embeds: [
                        {
                            title: "📄 Log Server",
                            description: `**Metodo:** \`${method}\`\n**Endpoint:** \`${url}\`\n**Utente:** \`${user}\`\n**Orario:** \`${timestamp}\`\n\n📦 **Body:**\n\`\`\`json\n${body}\n\`\`\``,
                            color: 0x0000ff, // blu
                            footer: {
                                text: "LOG"
                            }
                        }
                    ]
                });
            } catch (err) {
                console.error('Errore invio webhook Discord:', err.message);
            }
        }
        next();
    };
}

module.exports = log;
