CREATE TABLE `contacts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `address` VARCHAR(42) NOT NULL,
  `contact_nickname` VARCHAR(50) NOT NULL,
  `contact_address` VARCHAR(42) NOT NULL,
  `contact_encrypting_key` VARCHAR(100) NOT NULL,
  `contact_verifying_key` VARCHAR(100) NOT NULL,
  `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);
