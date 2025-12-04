/*
 * Blocks Tracker - Todoing and habit tracking in one place.
 * Copyright (C) 2025 Chowdhury Md Sami Al Muntahi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { PrismaClient } from '../../generated/client';
import { prisma } from '../prisma';

const LAST_CHANGE_ID_KEY = 'last_change_id';
const LAST_SYNC_TIMESTAMP_KEY = 'last_sync_timestamp';

type PrismaTransactionalClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class SettingsRepository {
  async getLastChangeId(): Promise<number> {
    const setting = await prisma.settings.findUnique({
      where: { key: LAST_CHANGE_ID_KEY },
    });
    // The value is stored as a string, so we parse it. Default to 0 if not found.
    return setting ? parseInt(setting.value, 10) : 0;
  }

  async setLastChangeId(
    changeId: number,
    tx?: PrismaTransactionalClient,
  ): Promise<void> {
    const db = tx || prisma;
    await db.settings.upsert({
      where: { key: LAST_CHANGE_ID_KEY },
      update: { value: changeId.toString() },
      create: { key: LAST_CHANGE_ID_KEY, value: changeId.toString() },
    });
  }

  /**
   * Retrieves the timestamp of the last successful sync.
   * @returns The timestamp in milliseconds since epoch, or 0 if not found.
   */
  async getLastSync(): Promise<number> {
    const setting = await prisma.settings.findUnique({
      where: { key: LAST_SYNC_TIMESTAMP_KEY },
    });
    if (setting?.value) {
      const parsedValue = parseInt(setting.value, 10);
      return isNaN(parsedValue) ? 0 : parsedValue;
    }
    return 0;
  }

  /**
   * Stores the timestamp of the last successful sync.
   * @param timestamp The timestamp in milliseconds since epoch.
   * @param tx Optional transaction object.
   */
  async setLastSync(
    timestamp: number,
    tx?: PrismaTransactionalClient,
  ): Promise<void> {
    const db = tx || prisma;
    await db.settings.upsert({
      where: { key: LAST_SYNC_TIMESTAMP_KEY },
      update: { value: timestamp.toString() },
      create: { key: LAST_SYNC_TIMESTAMP_KEY, value: timestamp.toString() },
    });
    console.log(`[DB Repo] Updated last_sync_timestamp to ${timestamp}`);
  }
}
