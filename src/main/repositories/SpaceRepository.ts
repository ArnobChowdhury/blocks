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
import { PrismaClient, Space } from '../../generated/client';
import { prisma } from '../prisma';

type PrismaTransactionalClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class SpaceRepository {
  getAllSpaces = async (userId: string | null): Promise<Space[]> => {
    return prisma.space.findMany({
      where: {
        userId,
      },
    });
  };

  createSpace = async (
    name: string,
    userId: string | null,
    tx?: PrismaTransactionalClient,
  ): Promise<Space> => {
    const db = tx || prisma;

    return db.space.create({
      data: {
        name,
        userId,
      },
    });
  };

  upsertMany = async (
    spaces: Space[],
    tx: PrismaTransactionalClient,
  ): Promise<void> => {
    if (spaces.length === 0) {
      return;
    }

    const upsertPromises = spaces.map(async (incomingSpace) => {
      const { id, ...incomingSpaceData } = incomingSpace;

      const existingSpace = await tx.space.findUnique({
        where: { id },
      });

      if (existingSpace) {
        if (
          new Date(incomingSpace.modifiedAt) >=
          new Date(existingSpace.modifiedAt)
        ) {
          return tx.space.update({
            where: { id },
            data: incomingSpaceData,
          });
        }
        return Promise.resolve();
      }
      return tx.space.create({
        data: incomingSpace,
      });
    });

    await Promise.all(upsertPromises);
  };
}
