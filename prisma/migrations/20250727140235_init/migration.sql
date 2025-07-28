/*
  Warnings:

  - You are about to drop the `websites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `websites`;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('WEBSERVICE', 'BACKEND', 'SYSTEMD', 'SUPERVISORD', 'DOCKER', 'CUSTOM') NOT NULL,
    `url` VARCHAR(191) NULL,
    `port` INTEGER NULL,
    `status` ENUM('RUNNING', 'STOPPED', 'ERROR', 'STARTING', 'STOPPING') NOT NULL DEFAULT 'STOPPED',
    `description` VARCHAR(191) NULL,
    `command` VARCHAR(191) NULL,
    `workingDir` VARCHAR(191) NULL,
    `envVars` JSON NULL,
    `autoStart` BOOLEAN NOT NULL DEFAULT false,
    `lastChecked` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `services_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
