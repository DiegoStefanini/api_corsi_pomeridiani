
-- Database
CREATE DATABASE IF NOT EXISTS `api_tepsit` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `api_tepsit`;

CREATE TABLE IF NOT EXISTS `registration_requests` (
  `id` int(11) AUTO_INCREMENT,
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



-- Scuole
CREATE TABLE IF NOT EXISTS `scuole` (
  `id` int(11) AUTO_INCREMENT,
  `nome` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `indirizzo` text COLLATE utf8mb4_general_ci,
  `email_amministratore` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
    CONSTRAINT `FK_scuole_richieste` FOREIGN KEY (`id`) REFERENCES `registration_requests` (`id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Aule
CREATE TABLE IF NOT EXISTS `aule` (
  `id` int(11) AUTO_INCREMENT,
  `id_scuola` int DEFAULT NULL,
  `capienza` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_scuola` (`id_scuola`),
  CONSTRAINT `FK_aule_scuole` FOREIGN KEY (`id_scuola`) REFERENCES `scuole` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Utenti
CREATE TABLE IF NOT EXISTS `utenti` (
  `id` int(11) AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `ruolo` enum('amministratore','docente','studente') COLLATE utf8mb4_general_ci NOT NULL,
  `scuola_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `scuola_id` (`scuola_id`),
  CONSTRAINT `FK_utenti_scuole` FOREIGN KEY (`scuola_id`) REFERENCES `scuole` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Corsi
CREATE TABLE IF NOT EXISTS `corsi` (
  `id` int(11) AUTO_INCREMENT,
  `titolo` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `descrizione` text COLLATE utf8mb4_general_ci,
  `orario` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `scuola_id` int NOT NULL,
  `docente_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `scuola_id` (`scuola_id`),
  KEY `docente_id` (`docente_id`),
  CONSTRAINT `FK_corsi_scuole` FOREIGN KEY (`scuola_id`) REFERENCES `scuole` (`id`),
  CONSTRAINT `FK_corsi_docenti` FOREIGN KEY (`docente_id`) REFERENCES `utenti` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Lezioni
CREATE TABLE IF NOT EXISTS `lezioni` (
  `id` int(11) AUTO_INCREMENT,
  `corso_id` int NOT NULL,
  `data` date NOT NULL,
  `id_aula` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `corso_id` (`corso_id`),
  KEY `id_aula` (`id_aula`),
  CONSTRAINT `FK_lezioni_corsi` FOREIGN KEY (`corso_id`) REFERENCES `corsi` (`id`),
  CONSTRAINT `FK_lezioni_aule` FOREIGN KEY (`id_aula`) REFERENCES `aule` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Iscrizioni
CREATE TABLE IF NOT EXISTS `iscrizioni` (
  `id` int(11) AUTO_INCREMENT,
  `studente_id` int NOT NULL,
  `corso_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `studente_id` (`studente_id`, `corso_id`),
  KEY `corso_id` (`corso_id`),
  CONSTRAINT `FK_iscrizioni_studenti` FOREIGN KEY (`studente_id`) REFERENCES `utenti` (`id`),
  CONSTRAINT `FK_iscrizioni_corsi` FOREIGN KEY (`corso_id`) REFERENCES `corsi` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Presenze
CREATE TABLE IF NOT EXISTS `presenze` (
  `id` int(11) AUTO_INCREMENT,
  `lezione_id` int NOT NULL,
  `studente_id` int NOT NULL,
  `presente` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `lezione_id` (`lezione_id`, `studente_id`),
  KEY `studente_id` (`studente_id`),
  CONSTRAINT `FK_presenze_lezioni` FOREIGN KEY (`lezione_id`) REFERENCES `lezioni` (`id`),
  CONSTRAINT `FK_presenze_studenti` FOREIGN KEY (`studente_id`) REFERENCES `utenti` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
