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
import { PendingOperation, PrismaClient } from '../../generated/client';
import { prisma } from '../prisma';

export { PendingOperation };

type PrismaTransactionalClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface PendingOperationData {
  userId: string;
  operationType: 'create' | 'update' | 'delete';
  entityType: 'task' | 'space' | 'tag' | 'repetitive_task_template';
  entityId: string;
  payload: string;
}

export class PendingOperationRepository {
  /**
   * Adds a new operation to the pending operations queue.
   * @param opData The data for the operation to enqueue.
   * @returns The newly created PendingOperation record.
   */
  enqueueOperation = async (
    opData: PendingOperationData,
    tx?: PrismaTransactionalClient,
  ): Promise<PendingOperation> => {
    const db = tx || prisma;

    return db.pendingOperation.create({
      data: {
        userId: opData.userId,
        operationType: opData.operationType,
        entityType: opData.entityType,
        entityId: opData.entityId,
        payload: opData.payload,
      },
    });
  };

  /**
   * Retrieves the single oldest pending operation from the queue, ensuring that
   * no other operations for the same entity are currently being processed or have failed.
   * @returns The pending operation object or null if the queue is empty or blocked.
   */
  getOldestPendingOperation = async (): Promise<PendingOperation | null> => {
    const result = await prisma.$queryRaw<PendingOperation[]>`
      SELECT *
      FROM "PendingOperation" po1
      WHERE
        po1.status = 'pending' AND
        NOT EXISTS (
          SELECT 1
          FROM "PendingOperation" po2
          WHERE
            po2.entityId = po1.entityId AND
            po2.status IN ('processing', 'failed')
        )
      ORDER BY po1.id ASC
      LIMIT 1`;

    return result.length > 0 ? result[0] : null;
  };

  /**
   * Updates the status of a specific pending operation.
   * @param operationId The ID of the operation to update.
   * @param status The new status to set ('processing' or 'failed').
   * @returns The updated PendingOperation record.
   */
  updateOperationStatus = async (
    operationId: number,
    status: 'processing' | 'failed',
  ): Promise<PendingOperation> => {
    return prisma.pendingOperation.update({
      where: { id: operationId },
      data: { status },
    });
  };

  /**
   * Remaps the entityId for all pending operations that match the oldId.
   * This is crucial when a duplicate 'create' operation is resolved by the server
   * providing a canonical ID.
   * @param oldId The client-generated ID that was found to be a duplicate.
   * @param newId The canonical ID provided by the server.
   */
  remapEntityId = async (oldId: string, newId: string): Promise<void> => {
    await prisma.pendingOperation.updateMany({
      where: { entityId: oldId },
      data: { entityId: newId },
    });
  };

  /**
   * Deletes a pending operation from the queue, typically after a successful sync.
   * @param operationId The ID of the operation to delete.
   * @returns The deleted PendingOperation record.
   */
  deleteOperation = async (operationId: number): Promise<PendingOperation> => {
    return prisma.pendingOperation.delete({
      where: { id: operationId },
    });
  };

  /**
   * Handles a transient failure by incrementing the attempt count and
   * resetting the status to 'pending' for a future retry.
   * @param operationId The ID of the operation that failed.
   * @returns The updated PendingOperation record.
   */
  recordFailedAttempt = async (
    operationId: number,
  ): Promise<PendingOperation> => {
    return prisma.pendingOperation.update({
      where: { id: operationId },
      data: {
        attempts: {
          increment: 1,
        },
        status: 'pending',
      },
    });
  };
}
