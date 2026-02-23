
CREATE DATABASE IF NOT EXISTS proyecto_web_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE proyecto_web_db;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  pin_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS consentimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NOT NULL UNIQUE,
  accepted TINYINT(1) NOT NULL DEFAULT 0,
  version VARCHAR(20) NOT NULL DEFAULT 'v1',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  CONSTRAINT fk_consent_participant FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS surveys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_id INT NOT NULL,
  text TEXT NOT NULL,
  qtype ENUM('single','text','number') NOT NULL DEFAULT 'single',
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_questions_survey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  label VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_uuid CHAR(36) NOT NULL UNIQUE,
  participant_id INT NOT NULL,
  survey_id INT NOT NULL,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  CONSTRAINT fk_sessions_participant FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_survey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS responses (
  uuid CHAR(36) NOT NULL PRIMARY KEY,
  session_id INT NOT NULL,
  survey_id INT NOT NULL,
  question_id INT NOT NULL,
  option_id INT NOT NULL DEFAULT 0,
  text_value TEXT NULL,
  number_value DOUBLE NULL,
  answered_at DATETIME NOT NULL,
  CONSTRAINT fk_responses_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_responses_survey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
  CONSTRAINT fk_responses_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_tokens (
  token CHAR(48) NOT NULL PRIMARY KEY,
  user_type ENUM('admin','participant') NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_tokens_type (user_type),
  INDEX idx_tokens_user (user_id)
) ENGINE=InnoDB;
