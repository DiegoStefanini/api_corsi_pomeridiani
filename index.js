const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const jwt = require('jsonwebtoken');

// Middleware per leggere JSON nel body delle richieste
app.use(express.json());

const corsiFilePath = path.join(__dirname, 'corsi.json');
const iscrizioniFilePath = path.join(__dirname, 'iscrizioni.json');
const auleFilePath = path.join(__dirname, 'aule.json');
const utentiPath = path.join(__dirname, 'utenti.json');
const SECRET_KEY = 'chiave_super_segreta123'; // puoi metterla anche in variabile d'ambiente


// Funzione per leggere i corsi dal file JSON
function leggiCorsi() {
  const dati = fs.readFileSync(corsiFilePath);
  return JSON.parse(dati);
}

// Per la lettura degli studenti iscritti ai corsi
function leggiIscrizioni() {
  const dati = fs.readFileSync(iscrizioniFilePath);
  return JSON.parse(dati);
}

//legge le aule
function leggiAule() {
  const dati = fs.readFileSync(auleFilePath);
  return JSON.parse(dati);
}

//leggi utenti per permessi
function leggiUtenti() {
  const data = fs.readFileSync(utentiPath);
  return JSON.parse(data);
}


// Funzione per salvare i corsi nel file JSON
function salvaCorsi(corsi) {
  fs.writeFileSync(corsiFilePath, JSON.stringify(corsi, null, 2));
}

// per salvare gli studenti nel JSON
function salvaIscrizioni(iscrizioni) {
  fs.writeFileSync(iscrizioniFilePath, JSON.stringify(iscrizioni, null, 2));
}

// GET di base
app.get('/', (req, res) => {
  res.send('API attiva!');
});

// GET autori
app.get('/authors', (req, res) => {
  res.json({ authors: ['Balinzo', 'Romboli', 'Stefanini'] });
});

//------------------------------------------CORSI

// GET corsi
app.get('/corsi', (req, res) => {
  const corsi = leggiCorsi();
  let response = "<h1>Corsi Pomeridiani:</h1><ul>";

  corsi.forEach(corso => {
    response += `<li><strong>${corso.nome}</strong><br>${corso.descrizione}<br><em>${corso.professore}</em> - ${corso.aula}, ${corso.giorno} - ${corso.orario}</li><hr>`;
  });

  response += "</ul>";
  res.send(response);
});

// GET corso per id
app.get('/corsi/:id', (req, res) => {
  const corsi = leggiCorsi();
  const corso = corsi.find(c => c.id === parseInt(req.params.id));

  if (!corso) {
    return res.status(404).json({ message: 'Corso non trovato' });
  }

  res.json(corso);
});



// POST per aggiungere un nuovo corso
app.post('/corsi', autenticazione, checkRuolo('professore'), (req, res) => {
  const corsi = leggiCorsi();
  const aule = leggiAule();

  // Calcola il nuovo ID come il massimo ID esistente + 1
  const nuovoId = corsi.length > 0 ? Math.max(...corsi.map(c => c.id)) + 1 : 1;

  const nuovoCorso = {
    id: nuovoId,
    ...req.body
  };

  // Controllo: verifica se l'aula esiste in aule.json
  const aulaEsistente = aule.some(aula => aula.nome === nuovoCorso.aula);
  if (!aulaEsistente) {
    return res.status(400).json({
      message: 'Errore: aula non esistente. Impossibile creare il corso.'
    });
  }

  // Funzione per convertire orario in minuti (es. "14:30-15:30" → { inizio: 870, fine: 930 })
  function orarioInMinuti(orario) {
    const [inizio, fine] = orario.split('-');
    const [h1, m1] = inizio.split(':').map(Number);
    const [h2, m2] = fine.split(':').map(Number);
    return { inizio: h1 * 60 + m1, fine: h2 * 60 + m2 };
  }

  // Controllo: sovrapposizione orari nello stesso giorno e aula
  const nuovoOrario = orarioInMinuti(nuovoCorso.orario);

  const sovrapposto = corsi.some(corso => {
    return corso.aula === nuovoCorso.aula &&
           corso.giorno === nuovoCorso.giorno && (() => {
              const orarioEsistente = orarioInMinuti(corso.orario);
              return (
                nuovoOrario.inizio < orarioEsistente.fine &&
                nuovoOrario.fine > orarioEsistente.inizio
              );
           })();
  });

  if (sovrapposto) {
    return res.status(400).json({
      message: 'Errore: c\'è un conflitto di orario con un altro corso nella stessa aula!'
    });
  }

  // Salva il nuovo corso
  corsi.push(nuovoCorso);
  salvaCorsi(corsi);
  res.status(201).json({
    message: 'Corso aggiunto con successo!',
    corso: nuovoCorso
  });
});


// DELETE per eliminare un corso in base all'id
app.delete('/corsi/:id', autenticazione, checkRuolo('professore'), (req, res) => {
  const corsi = leggiCorsi();
  const corsiAggiornati = corsi.filter(c => c.id !== parseInt(req.params.id));

  if (corsi.length === corsiAggiornati.length) {
    return res.status(404).json({ message: 'Corso non trovato' });
  }

  salvaCorsi(corsiAggiornati);
  res.json({ message: 'Corso eliminato con successo' });
}); 

app.put('/corsi/:id', autenticazione, checkRuolo('professore'), (req, res) => {
  const corsi = leggiCorsi();
  const indice = corsi.findIndex(c => c.id === parseInt(req.params.id));

  if (indice === -1) {
    return res.status(404).json({ message: 'Corso non trovato' });
  }

  corsi[indice] = {
    ...corsi[indice],
    ...req.body,
    id: corsi[indice].id // Mantieni lo stesso ID
  };

  salvaCorsi(corsi);
  res.json({ message: 'Corso aggiornato con successo', corso: corsi[indice] });
});

//------------------------------------------STUDENTI

app.post('/iscrizioni/:corsoId', autenticazione, checkRuolo('alunno'), (req, res) => {
  const corsoId = parseInt(req.params.corsoId);
  const { nomeStudente, classe } = req.body;

  if (!nomeStudente || !classe) {
    return res.status(400).json({ message: "Nome e classe dello studente sono obbligatori" });
  }

  const corsi = leggiCorsi();
  const corso = corsi.find(c => c.id === corsoId);
  if (!corso) {
    return res.status(404).json({ message: "Corso non trovato" });
  }

  let iscrizioni = leggiIscrizioni();
  let voceIscrizione = iscrizioni.find(i => i.corsoId === corsoId);

  if (!voceIscrizione) {
    voceIscrizione = { corsoId, studenti: [] };
    iscrizioni.push(voceIscrizione);
  }

  // Controlla se lo studente è già iscritto (nome + classe)
  const studenteEsistente = voceIscrizione.studenti.find(s =>
    s.nomeStudente.toLowerCase() === nomeStudente.toLowerCase() &&
    s.classe.toLowerCase() === classe.toLowerCase()
  );

  if (studenteEsistente) {
    return res.status(400).json({ message: "Studente già iscritto a questo corso" });
  }

  // Aggiungi lo studente
  voceIscrizione.studenti.push({ nomeStudente, classe });
  salvaIscrizioni(iscrizioni);

  res.json({ message: `Studente ${nomeStudente} (${classe}) iscritto con successo a "${corso.nome}"` });
});

app.get('/iscrizioni', (req, res) => {
  const iscrizioni = leggiIscrizioni();
  const corsi = leggiCorsi();

  let html = '<h1>Iscrizioni ai Corsi:</h1>';

  if (iscrizioni.length === 0) {
    html += '<p>Nessuna iscrizione trovata.</p>';
  } else {
    iscrizioni.forEach(iscrizione => {
      const corso = corsi.find(c => c.id === iscrizione.corsoId);
      html += `<h2>${corso ? corso.nome : 'Corso sconosciuto'} (ID: ${iscrizione.corsoId})</h2>`;
      if (iscrizione.studenti.length === 0) {
        html += '<p>Nessuno studente iscritto.</p>';
      } else {
        html += '<ul>';
        iscrizione.studenti.forEach(studente => {
          html += `<li>${studente.nomeStudente} - Classe: ${studente.classe}</li>`;
        });
        html += '</ul>';
      }
      html += '<hr>';
    });
  }

  res.send(html);
});


app.get('/iscrizioni/:corsoId', (req, res) => {
  const corsoId = parseInt(req.params.corsoId);

  const corsi = leggiCorsi();
  const corso = corsi.find(c => c.id === corsoId);
  if (!corso) {
    return res.status(404).json({ message: "Corso non trovato" });
  }

  const iscrizioni = leggiIscrizioni();
  const voceIscrizione = iscrizioni.find(i => i.corsoId === corsoId);

  if (!voceIscrizione || voceIscrizione.studenti.length === 0) {
    return res.status(200).json({
      corso: corso.nome,
      studenti: [],
      message: "Nessuno studente iscritto a questo corso"
    });
  }

  res.json({
    corso: corso.nome,
    studenti: voceIscrizione.studenti
  });
});

app.delete('/iscrizioni/:corsoId', autenticazione, checkRuolo('alunno'), (req, res) => {
  const corsoId = parseInt(req.params.corsoId);
  const { nomeStudente, classe } = req.body;

  if (!nomeStudente || !classe) {
    return res.status(400).json({ message: "Nome studente e classe sono obbligatori" });
  }

  const corsi = leggiCorsi();
  const corso = corsi.find(c => c.id === corsoId);
  if (!corso) {
    return res.status(404).json({ message: "Corso non trovato" });
  }

  const iscrizioni = leggiIscrizioni();
  const voceIscrizione = iscrizioni.find(i => i.corsoId === corsoId);

  if (!voceIscrizione) {
    return res.status(404).json({ message: "Nessuna iscrizione trovata per questo corso" });
  }

  const studentiAggiornati = voceIscrizione.studenti.filter(
    studente => !(studente.nomeStudente === nomeStudente && studente.classe === classe)
  );

  if (studentiAggiornati.length === voceIscrizione.studenti.length) {
    return res.status(404).json({ message: "Studente non trovato tra gli iscritti" });
  }

  // Aggiorna la lista
  voceIscrizione.studenti = studentiAggiornati;
  salvaIscrizioni(iscrizioni);

  res.json({
    message: `Studente ${nomeStudente} della ${classe} rimosso con successo da "${corso.nome}"`
  });
});

//------------------------------------------TABELLA AULE

app.get('/aule', (req, res) => {
  const corsi = leggiCorsi();
  const aule = leggiAule(); // ← array di oggetti con "nome"

  const nomiAule = aule.map(a => a.nome);
  const giorniSettimana = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

  // Mappa: giorno → aula → lista eventi
  const griglia = {};
  corsi.forEach(corso => {
    if (!griglia[corso.giorno]) griglia[corso.giorno] = {};
    if (!griglia[corso.giorno][corso.aula]) griglia[corso.giorno][corso.aula] = [];

    griglia[corso.giorno][corso.aula].push(`${corso.orario} - ${corso.nome} (${corso.professore})`);
  });

  // Costruzione HTML
  let html = `
    <style>
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 8px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background-color: #f5f5f5;
      }
      td {
        min-width: 150px;
      }
    </style>
    <h1>Orari dei Corsi Pomeridiani</h1>
    <table>
      <thead>
        <tr>
          <th>Giorno</th>`;

  nomiAule.forEach(nomeAula => {
    html += `<th>${nomeAula}</th>`;
  });

  html += `</tr></thead><tbody>`;

  // Righe fisse per tutti i giorni della settimana
  giorniSettimana.forEach(giorno => {
    html += `<tr><td><strong>${giorno}</strong></td>`;

    nomiAule.forEach(nomeAula => {
      const contenuto = griglia[giorno]?.[nomeAula]?.join('<br>') || '-';
      html += `<td>${contenuto}</td>`;
    });

    html += `</tr>`;
  });

  html += `</tbody></table>`;

  res.send(html);
});

//------------------------------------------LOGIN

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const utenti = leggiUtenti();

  const utente = utenti.find(u => u.username === username && u.password === password);

  if (!utente) {
    return res.status(401).json({ message: 'Credenziali non valide' });
  }

  // Genera token con username e ruolo
  const token = jwt.sign(
    { username: utente.username, ruolo: utente.ruolo },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.json({ message: 'Login effettuato con successo', token });
});


function autenticazione(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Token mancante' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token mancante' });

  try {
    const user = jwt.verify(token, SECRET_KEY);
    req.user = user; // aggiungiamo l'utente alla richiesta
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token non valido' });
  }
}


function checkRuolo(ruoloRichiesto) {
  return (req, res, next) => {
    if (req.user.ruolo !== ruoloRichiesto) {
      return res.status(403).json({ message: 'Permesso negato' });
    }
    next();
  };
}




//------------------------------------------AVVIO DEL SERVER SULLA PORTA 3000

// Avvio server
app.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});
