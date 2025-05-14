-- Dump della struttura del database api_tepsit
CREATE DATABASE IF NOT EXISTS `api_tepsit` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `api_tepsit`;

-- Dump della struttura di tabella api_tepsit.aule
CREATE TABLE IF NOT EXISTS `aule` (
  `id` int NOT NULL,
  `id_scuola` int DEFAULT NULL,
  `capienza` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella api_tepsit.corsi
CREATE TABLE IF NOT EXISTS `corsi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titolo` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `descrizione` text COLLATE utf8mb4_general_ci,
  `orario` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `scuola_id` int NOT NULL,
  `docente_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `scuola_id` (`scuola_id`),
  KEY `docente_id` (`docente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella api_tepsit.iscrizioni
CREATE TABLE IF NOT EXISTS `iscrizioni` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studente_id` int NOT NULL,
  `corso_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `studente_id` (`studente_id`,`corso_id`),
  KEY `corso_id` (`corso_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella api_tepsit.lezioni
CREATE TABLE IF NOT EXISTS `lezioni` (
  `id` int NOT NULL AUTO_INCREMENT,
  `corso_id` int NOT NULL,
  `data` date NOT NULL,
  `id_aula` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `corso_id` (`corso_id`),
  KEY `FK_lezioni_aule` (`id_aula`),
  CONSTRAINT `FK_lezioni_aule` FOREIGN KEY (`id_aula`) REFERENCES `aule` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella api_tepsit.presenze
CREATE TABLE IF NOT EXISTS `presenze` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lezione_id` int NOT NULL,
  `studente_id` int NOT NULL,
  `presente` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `lezione_id` (`lezione_id`,`studente_id`),
  KEY `studente_id` (`studente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella api_tepsit.registration_requests
CREATE TABLE IF NOT EXISTS `registration_requests` (
  `id` int NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `indirizzo` text COLLATE utf8mb4_general_ci,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `admin_username` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `admin_password` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('block','pending','approved','rejected') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella api_tepsit.scuole
CREATE TABLE IF NOT EXISTS `scuole` (
  `id` int NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `indirizzo` text COLLATE utf8mb4_general_ci,
  `email_amministratore` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella api_tepsit.utenti
CREATE TABLE IF NOT EXISTS `utenti` (
  `id` int NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `ruolo` enum('amministratore','docente','studente') COLLATE utf8mb4_general_ci NOT NULL,
  `scuola_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `scuola_id` (`scuola_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
