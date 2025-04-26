CREATE TABLE IF NOT EXISTS scuole (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    indirizzo TEXT,
    email_amministratore VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS registration_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255)           NOT NULL,
  indirizzo TEXT,
  email VARCHAR(255)          NOT NULL,
  admin_username VARCHAR(100) NOT NULL,
  admin_password VARCHAR(100) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL DEFAULT NULL
);


CREATE TABLE IF NOT EXISTS utenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    ruolo ENUM('amministratore', 'docente', 'studente') NOT NULL,
    scuola_id INT NOT NULL,
    FOREIGN KEY (scuola_id) REFERENCES scuole(id)
);

CREATE TABLE IF NOT EXISTS corsi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titolo VARCHAR(255) NOT NULL,
    descrizione TEXT,
    orario VARCHAR(100),
    scuola_id INT NOT NULL,
    docente_id INT,
    FOREIGN KEY (scuola_id) REFERENCES scuole(id),
    FOREIGN KEY (docente_id) REFERENCES utenti(id)
);

CREATE TABLE IF NOT EXISTS lezioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    corso_id INT NOT NULL,
    data DATE NOT NULL,
    FOREIGN KEY (corso_id) REFERENCES corsi(id)
);

CREATE TABLE IF NOT EXISTS iscrizioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studente_id INT NOT NULL,
    corso_id INT NOT NULL,
    FOREIGN KEY (studente_id) REFERENCES utenti(id),
    FOREIGN KEY (corso_id) REFERENCES corsi(id),
    UNIQUE (studente_id, corso_id)
);

CREATE TABLE IF NOT EXISTS presenze (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lezione_id INT NOT NULL,
    studente_id INT NOT NULL,
    presente BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (lezione_id) REFERENCES lezioni(id),
    FOREIGN KEY (studente_id) REFERENCES utenti(id),
    UNIQUE (lezione_id, studente_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utente_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (utente_id) REFERENCES utenti(id) ON DELETE CASCADE
);
