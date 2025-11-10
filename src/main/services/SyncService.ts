import axios, { AxiosError } from 'axios';
import log from 'electron-log';

import apiClient from '../apiClient';
import {
  PendingOperation,
  PendingOperationRepository,
} from '../repositories/PendingOperationRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { SpaceRepository } from '../repositories/SpaceRepository';
import { RepetitiveTaskTemplateRepository } from '../repositories/RepetitiveTaskTemplateRepository';
import { TaskService } from './TaskService';
import { apiEndpoints } from '../config/apiEndpoints';
import { prisma } from '../prisma';

let isSyncing = false;

class SyncService {
  private pendingOpRepo: PendingOperationRepository;

  private settingsRepo: SettingsRepository;

  private taskRepo: TaskRepository;

  private spaceRepo: SpaceRepository;

  private rttRepo: RepetitiveTaskTemplateRepository;

  private taskService: TaskService;

  private onSyncStatusChange: ((isSyncing: boolean) => void) | null = null;

  constructor() {
    this.pendingOpRepo = new PendingOperationRepository();
    this.settingsRepo = new SettingsRepository();
    this.taskRepo = new TaskRepository();
    this.spaceRepo = new SpaceRepository();
    this.rttRepo = new RepetitiveTaskTemplateRepository();
    this.taskService = new TaskService();
  }

  public initialize(callbacks: {
    onSyncStatusChange: (isSyncing: boolean) => void;
  }) {
    this.onSyncStatusChange = callbacks.onSyncStatusChange;
  }

  public async runSync(): Promise<void> {
    if (isSyncing) {
      log.info('[SyncService] Sync process already running. Exiting.');
      return;
    }

    log.info('[SyncService] Starting sync process...');
    isSyncing = true;
    this.onSyncStatusChange?.(true);

    try {
      log.info('[SyncService] Starting PUSH phase...');
      while (true) {
        const operation = await this.pendingOpRepo.getOldestPendingOperation();
        if (!operation) {
          log.info('[SyncService] Local queue is empty. PUSH phase complete.');
          break;
        }
        await this.processOperation(operation);
      }

      log.info('[SyncService] Starting PULL phase...');
      await this.pullRemoteChanges();
    } catch (error) {
      log.error(
        '[SyncService] An unexpected error occurred in runSync:',
        error,
      );
    } finally {
      isSyncing = false;
      this.onSyncStatusChange?.(false);
      log.info('[SyncService] Sync process finished.');
    }
  }

  private async processOperation(operation: PendingOperation): Promise<void> {
    const { id, entityType, operationType, entityId, payload } = operation;

    const endpointConfig = apiEndpoints[entityType]?.[operationType];

    if (!endpointConfig) {
      log.error(
        `[SyncService] No API endpoint configured for ${entityType} -> ${operationType}. Marking as failed.`,
      );
      await this.pendingOpRepo.updateOperationStatus(id, 'failed');
      return;
    }

    const url = endpointConfig.path.replace(':id', entityId);
    const data =
      endpointConfig.method === 'POST' || endpointConfig.method === 'PUT'
        ? JSON.parse(payload)
        : undefined;

    log.info(`[SyncService] Making API call: ${endpointConfig.method} ${url}`);

    try {
      await this.pendingOpRepo.updateOperationStatus(id, 'processing');
      await apiClient({
        method: endpointConfig.method,
        url,
        data,
      });

      log.info(
        `[SyncService] Operation ${id} synced successfully. Deleting from queue.`,
      );
      await this.pendingOpRepo.deleteOperation(operation.id);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        await this.handleAxiosError(error, operation);
      } else {
        log.warn(
          `[SyncService] An unexpected network error occurred for operation ${id}. Recording failed attempt.`,
          error,
        );
        await this.pendingOpRepo.recordFailedAttempt(id);
      }
    }
  }

  private async pullRemoteChanges(): Promise<void> {
    while (true) {
      let syncData;
      let lastChangeId;
      try {
        lastChangeId = await this.settingsRepo.getLastChangeId();
        log.info(
          `[SyncService] Fetching changes since change ID: ${lastChangeId}`,
        );

        const endpoint = apiEndpoints.sync!.fetch!;
        const response = await apiClient.get(endpoint.path, {
          params: { last_change_id: lastChangeId },
        });
        syncData = response.data.result.data;
      } catch (error) {
        log.error(
          '[SyncService] Failed to fetch remote changes from API:',
          error,
        );
        break;
      }

      const hasNewChanges =
        syncData.tasks?.length > 0 ||
        syncData.spaces?.length > 0 ||
        syncData.repetitiveTaskTemplates?.length > 0;

      if (!hasNewChanges) {
        await this.settingsRepo.setLastChangeId(syncData.latestChangeId);
        break;
      }

      try {
        log.info('[SyncService] Beginning database transaction for sync pull.');
        await prisma.$transaction(async (tx) => {
          if (syncData.spaces?.length > 0) {
            await this.spaceRepo.upsertMany(syncData.spaces, tx);
          }
          if (syncData.repetitiveTaskTemplates?.length > 0) {
            await this.rttRepo.upsertMany(syncData.repetitiveTaskTemplates, tx);
          }
          if (syncData.tasks?.length > 0) {
            await this.taskRepo.upsertMany(syncData.tasks, tx);
          }
          await this.settingsRepo.setLastChangeId(syncData.latestChangeId);
        });

        log.info(
          `[SyncService] PULL phase complete. Transaction committed. Synced up to change ID: ${syncData.latestChangeId}`,
        );
      } catch (error) {
        log.error(
          '[SyncService] Error during sync pull transaction. Rolling back.',
          error,
        );
        break;
      }
    }
  }

  private async handleAxiosError(
    error: AxiosError<{ result: { code: string; data: any; message: string } }>,
    operation: PendingOperation,
  ) {
    const { id, entityType, entityId, operationType } = operation;

    if (error.response) {
      const { status, data } = error.response;
      const errorCode = data?.result?.code;

      if (status === 409) {
        if (errorCode === 'DUPLICATE_ENTITY') {
          const canonicalId = data?.result?.data?.canonical_id;
          if (canonicalId) {
            log.warn(
              `[SyncService] Duplicate entity conflict for operation ${id} (entityId: ${entityId}). Canonical ID: ${canonicalId}. Remapping and deleting local entity.`,
            );
            await this.pendingOpRepo.remapEntityId(entityId, canonicalId);

            switch (entityType) {
              case 'task':
                await this.taskService.deleteTaskById(entityId);
                break;
            }
            await this.pendingOpRepo.deleteOperation(id);
          } else {
            log.error(
              `[SyncService] DUPLICATE_ENTITY conflict for operation ${id} but no canonical_id provided. Marking as failed.`,
              error.response.data,
            );
            await this.pendingOpRepo.updateOperationStatus(id, 'failed');
          }
        } else if (errorCode === 'STALE_DATA') {
          log.warn(
            `[SyncService] Stale data conflict for operation ${id}. Deleting operation.`,
          );
          await this.pendingOpRepo.deleteOperation(id);
        } else {
          log.error(
            `[SyncService] Unknown 409 conflict for operation ${id}. Marking as failed.`,
            error.response.data,
          );
          await this.pendingOpRepo.updateOperationStatus(id, 'failed');
        }
      } else if (status === 404) {
        log.warn(
          `[SyncService] Entity not found (404) for operation ${id}. Deleting operation.`,
        );
        await this.pendingOpRepo.deleteOperation(id);
      } else if (status === 401) {
        log.warn(
          `[SyncService] Unauthorized (401) for operation ${id}. Recording failed attempt.`,
        );
        await this.pendingOpRepo.recordFailedAttempt(id);
      } else if (status >= 500) {
        log.warn(
          `[SyncService] Server error (${status}) for operation ${id}. Recording failed attempt.`,
        );
        await this.pendingOpRepo.recordFailedAttempt(id);
      } else if (status >= 400) {
        // Other 4xx errors (400, 422, etc.)
        log.error(
          `[SyncService] Client error (${status}) for operation ${id}. Marking as failed.`,
          error.response.data,
        );
        await this.pendingOpRepo.updateOperationStatus(id, 'failed');
      }
    } else if (error.request) {
      // Network error (no response received)
      log.warn(
        `[SyncService] No response received (network error) for operation ${id}. Recording failed attempt.`,
      );
      await this.pendingOpRepo.recordFailedAttempt(id);
    }
  }
}

export const syncService = new SyncService();
