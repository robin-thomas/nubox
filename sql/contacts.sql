CREATE TABLE `contacts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `address` VARCHAR(42) NOT NULL,
  `contact_address` VARCHAR(42) NOT NULL,
  `contact_nickname` VARCHAR(50) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);
