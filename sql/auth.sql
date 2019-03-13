CREATE TABLE `auth` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `address` VARCHAR(42) NOT NULL,
  `refresh_token` VARCHAR(30) NOT NULL,
  `expiry` TIMESTAMP NOT NULL,
  PRIMARY KEY(id)
);
