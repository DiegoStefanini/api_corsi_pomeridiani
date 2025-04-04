const express = require('express');
const app = express();
const PORT = 3000;
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'supersegreto123'; // in prod mettilo in .env

// Middleware per leggere JSON nel body delle richieste
app.use(express.json());

// Rotte di esempio
app.get('/', (req, res) => {
  res.send('API attiva!');
});

app.get('/authors', (req, res) => {
  res.json({ authors: ['Balinzo', 'Romboli', 'Stefanini'] });
});

app.get('/corsi', (req, res) => {
  let response = "<h1>Corsi Pomeridiani:</h1><ul>";
  corsiPomeridiani.forEach(corso => {
    response += `<li><strong>${corso.nome}</strong><br>${corso.descrizione}<br><em>${corso.professore}</em> - ${corso.aula}, ${corso.orario}</li><hr>`;
  });
  response += "</ul>";
  res.send(response);
});

/*
app.post('/corsi', (req, res) => {
  const nuovoCorso = req.body;

  // Verifica che tutti i campi necessari siano presenti
  if (!nuovoCorso.nome || !nuovoCorso.descrizione || !nuovoCorso.professore || !nuovoCorso.aula || !nuovoCorso.orario) {
    return res.status(400).json({ errore: 'Tutti i campi sono obbligatori: nome, descrizione, professore, aula, orario' });
  }

  // Aggiungi il nuovo corso all'array
  corsiPomeridiani.push(nuovoCorso);
  res.status(201).json({ messaggio: 'Corso aggiunto con successo', corso: nuovoCorso });
});
*/

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});

const corsiPomeridiani = [
  {
    nome: 'Macchina di Turing',
    descrizione: 'Un viaggio nella teoria della computazione attraverso la Macchina di Turing, il modello matematico fondamentale per comprendere i principi dell’informatica. Il corso coprirà il concetto di calcolabilità, esempi pratici di macchine di Turing e la loro rilevanza nell’informatica moderna.lorizzarti scoprendo lo stile, i colori e le forme che ti valorizzano.',
    professore: 'Mirco Ciriello',
    aula: 'Lab. Info 2',
    orario: 'Mercoledì, 16:15 - 18:15'
  },
  {
    nome: 'Sicurezza Informatica',
    descrizione: 'Corso di Scopri i fondamenti della sicurezza informatica, dagli attacchi più comuni alle strategie di difesa. Il corso include nozioni di crittografia, penetration testing e buone pratiche per proteggere reti e sistemi informatici. con diverse tecniche di modellazione e colorazione per ragazzi.',
    professore: 'Francesco Odierna',
    aula: 'Lab. Info 1',
    orario: 'Giovedì, 16:15 - 17:15'
  }
];