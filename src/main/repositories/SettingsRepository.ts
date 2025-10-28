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
import { prisma } from '../prisma';

const LAST_CHANGE_ID_KEY = 'last_change_id';

export class SettingsRepository {
  async getLastChangeId(): Promise<number> {
    const setting = await prisma.settings.findUnique({
      where: { key: LAST_CHANGE_ID_KEY },
    });
    // The value is stored as a string, so we parse it. Default to 0 if not found.
    return setting ? parseInt(setting.value, 10) : 0;
  }

  async setLastChangeId(changeId: number): Promise<void> {
    await prisma.settings.upsert({
      where: { key: LAST_CHANGE_ID_KEY },
      update: { value: changeId.toString() },
      create: { key: LAST_CHANGE_ID_KEY, value: changeId.toString() },
    });
  }
}
