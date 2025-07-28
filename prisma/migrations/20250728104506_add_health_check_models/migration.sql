/*
  Warnings:

  - You are about to drop the column `autoStart` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `command` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `envVars` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `workingDir` on the `services` table. All the data in the column will be lost.
  - The values [WEBSERVICE,BACKEND] on the enum `services_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `services` DROP COLUMN `autoStart`,
    DROP COLUMN `command`,
    DROP COLUMN `envVars`,
    DROP COLUMN `workingDir`,
    MODIFY `type` ENUM('HTTP', 'GRPC', 'SYSTEMD', 'SUPERVISORD', 'DOCKER', 'DATABASE', 'CACHE', 'CUSTOM') NOT NULL;

-- CreateTable
CREATE TABLE `health_check_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NOT NULL,
    `type` ENUM('HTTP', 'TCP', 'COMMAND', 'SCRIPT') NOT NULL,
    `url` VARCHAR(191) NULL,
    `port` INTEGER NULL,
    `command` VARCHAR(191) NULL,
    `script` VARCHAR(191) NULL,
    `timeout` INTEGER NOT NULL DEFAULT 10000,
    `interval` INTEGER NOT NULL DEFAULT 30000,
    `retries` INTEGER NOT NULL DEFAULT 3,
    `expectedStatus` INTEGER NULL,
    `expectedResponse` VARCHAR(191) NULL,
    `headers` JSON NULL,
    `method` ENUM('GET', 'POST', 'PUT', 'DELETE') NOT NULL DEFAULT 'GET',
    `body` VARCHAR(191) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_check_results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceId` INTEGER NOT NULL,
    `status` ENUM('HEALTHY', 'UNHEALTHY', 'UNKNOWN') NOT NULL,
    `responseTime` INTEGER NOT NULL,
    `lastChecked` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `error` VARCHAR(191) NULL,
    `details` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `health_check_configs` ADD CONSTRAINT `health_check_configs_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_check_results` ADD CONSTRAINT `health_check_results_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
