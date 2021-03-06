CREATE TABLE `shares` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sharer` VARCHAR(42) NOT NULL,
  `shared_with` VARCHAR(42) NOT NULL,
  `file_id` INT NOT NULL,
  `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  FOREIGN KEY(file_id) REFERENCES fs(id)
);
