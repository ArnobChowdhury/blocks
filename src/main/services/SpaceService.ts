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
import { prisma } from '../prisma';
import { PendingOperationRepository } from '../repositories/PendingOperationRepository';
import { SpaceRepository } from '../repositories/SpaceRepository';
import { syncService } from './SyncService';

export class SpaceService {
  private spaceRepository: SpaceRepository;

  private pendingOpRepository: PendingOperationRepository;

  constructor() {
    this.spaceRepository = new SpaceRepository();
    this.pendingOpRepository = new PendingOperationRepository();
  }

  getAllSpaces = async (userId: string | null): Promise<Space[]> => {
    return this.spaceRepository.getAllSpaces(userId);
  };

  createSpace = async (name: string, userId: string | null): Promise<Space> => {
    const isPremium = !!userId;

    const newSpace = await prisma.$transaction(async (tx) => {
      const createdSpace = await this.spaceRepository.createSpace(
        name,
        userId,
        tx,
      );

      if (isPremium) {
        await this.pendingOpRepository.enqueueOperation(
          {
            userId: userId!,
            operationType: 'create',
            entityType: 'space',
            entityId: createdSpace.id,
            payload: JSON.stringify(createdSpace),
          },
          tx,
        );
      }
      return createdSpace;
    });

    if (isPremium) {
      syncService.runSync();
    }

    return newSpace;
  };
}
