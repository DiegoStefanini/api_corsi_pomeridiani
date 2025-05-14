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
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const user = req.user
            ? `${req.user.id} (scuola_id: ${req.user.scuola_id})`
            : 'Utente non autenticato';

        const body = req.body && Object.keys(req.body).length > 0
            ? JSON.stringify(req.body, null, 2)
            : 'nessun body';

        const logEntry = `[${timestamp}] ${method} ${url} - ${user} - IP: ${ip} - User-Agent: ${userAgent} - body: ${body}\n`;

        // Log su file
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }

        const logFilename = req.user?.scuola_id
            ? `scuola-${req.user.scuola_id}.log`
            : 'generale.log';

        fs.appendFile(path.join(logDir, logFilename), logEntry, err => {
            if (err) console.error('Errore nella scrittura dei log:', err);
        });

        // Log su Discord
        if (DISCORD_WEBHOOK_URL != 0) {
            try {
                await axios.post(DISCORD_WEBHOOK_URL, {
                    embeds: [
                        {
                            title: "📄 Log Server",
                            description:
`**Metodo:** \`${method}\`
**Endpoint:** \`${url}\`
**Utente:** \`${user}\`
📍 **IP:** \`${ip}\`
🧭 **User-Agent:** \`${userAgent}\`
🕒 **Orario:** \`${timestamp}\`

📦 **Body:**
\`\`\`json
${body}
\`\`\``,
                            color: 0x0000ff,
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
