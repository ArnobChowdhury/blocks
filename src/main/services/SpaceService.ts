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
// eslint-disable-next-line import/no-relative-packages
import { Space } from '../../generated/client';
import { SpaceRepository } from '../repositories/SpaceRepository';

export class SpaceService {
  private spaceRepository: SpaceRepository;

  constructor() {
    this.spaceRepository = new SpaceRepository();
  }

  getAllSpaces = async (userId: string | null): Promise<Space[]> => {
    return this.spaceRepository.getAllSpaces(userId);
  };

  createSpace = async (name: string, userId: string | null): Promise<Space> => {
    // Future business logic can be added here (e.g., validating name length).
    return this.spaceRepository.createSpace(name, userId);
  };
}
