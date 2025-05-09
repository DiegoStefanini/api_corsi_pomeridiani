
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


CREATE TABLE `corsi` (
  `id` int(11) NOT NULL,
  `titolo` varchar(255) NOT NULL,
  `descrizione` text DEFAULT NULL,
  `orario` varchar(100) DEFAULT NULL,
  `scuola_id` int(11) NOT NULL,
  `docente_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `iscrizioni` (
  `id` int(11) NOT NULL,
  `studente_id` int(11) NOT NULL,
  `corso_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `lezioni` (
  `id` int(11) NOT NULL,
  `corso_id` int(11) NOT NULL,
  `data` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `presenze` (
  `id` int(11) NOT NULL,
  `lezione_id` int(11) NOT NULL,
  `studente_id` int(11) NOT NULL,
  `presente` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;





CREATE TABLE `registration_requests` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `indirizzo` text DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `admin_username` varchar(100) NOT NULL,
  `admin_password` varchar(100) NOT NULL,
  `status` enum('block','pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `scuole` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `indirizzo` text DEFAULT NULL,
  `email_amministratore` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




CREATE TABLE `utenti` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `ruolo` enum('amministratore','docente','studente') NOT NULL,
  `scuola_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




ALTER TABLE `corsi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `scuola_id` (`scuola_id`),
  ADD KEY `docente_id` (`docente_id`);


ALTER TABLE `iscrizioni`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `studente_id` (`studente_id`,`corso_id`),
  ADD KEY `corso_id` (`corso_id`);


ALTER TABLE `lezioni`
  ADD PRIMARY KEY (`id`),
  ADD KEY `corso_id` (`corso_id`);


ALTER TABLE `presenze`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lezione_id` (`lezione_id`,`studente_id`),
  ADD KEY `studente_id` (`studente_id`);



ALTER TABLE `registration_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);


ALTER TABLE `scuole`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `utenti`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `scuola_id` (`scuola_id`);




ALTER TABLE `corsi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `iscrizioni`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `lezioni`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `presenze`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;




ALTER TABLE `registration_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT;

ALTER TABLE `utenti`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT;


ALTER TABLE `corsi`
  ADD CONSTRAINT `corsi_ibfk_1` FOREIGN KEY (`scuola_id`) REFERENCES `scuole` (`id`),
  ADD CONSTRAINT `corsi_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `utenti` (`id`);


ALTER TABLE `iscrizioni`
  ADD CONSTRAINT `iscrizioni_ibfk_1` FOREIGN KEY (`studente_id`) REFERENCES `utenti` (`id`),
  ADD CONSTRAINT `iscrizioni_ibfk_2` FOREIGN KEY (`corso_id`) REFERENCES `corsi` (`id`);


ALTER TABLE `lezioni`
  ADD CONSTRAINT `lezioni_ibfk_1` FOREIGN KEY (`corso_id`) REFERENCES `corsi` (`id`);


ALTER TABLE `presenze`
  ADD CONSTRAINT `presenze_ibfk_1` FOREIGN KEY (`lezione_id`) REFERENCES `lezioni` (`id`),
  ADD CONSTRAINT `presenze_ibfk_2` FOREIGN KEY (`studente_id`) REFERENCES `utenti` (`id`);



ALTER TABLE `scuole`
  ADD CONSTRAINT `fk_request` FOREIGN KEY (`id`) REFERENCES `registration_requests` (`id`) ON DELETE CASCADE;


ALTER TABLE `utenti`
  ADD CONSTRAINT `utenti_ibfk_1` FOREIGN KEY (`scuola_id`) REFERENCES `scuole` (`id`);
COMMIT;

