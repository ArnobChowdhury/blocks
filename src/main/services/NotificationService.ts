import { Notification } from 'electron';
import cron from 'node-cron';
import log from 'electron-log';
import { ChannelsEnum, TimeOfDay } from '../../renderer/types';
import { deviceSettingsService } from './DeviceSettingsService';
import { TaskRepository } from '../repositories/TaskRepository';
import { RepetitiveTaskTemplateRepository } from '../repositories/RepetitiveTaskTemplateRepository';
import { getSession } from '../sessionManager';
import { getMainWindow, sendToMainWindow } from '../windowManager';

class NotificationService {
  private taskRepo: TaskRepository;
  private rttRepo: RepetitiveTaskTemplateRepository;
  private titleMapping: Record<TimeOfDay, string>;

  constructor() {
    this.taskRepo = new TaskRepository();
    this.rttRepo = new RepetitiveTaskTemplateRepository();
    log.info('[NotificationService] Initialized.');

    this.titleMapping = {
      [TimeOfDay.Morning]: 'Your Morning Tasks',
      [TimeOfDay.Afternoon]: 'Your Afternoon Tasks',
      [TimeOfDay.Evening]: 'Your Evening Tasks',
      [TimeOfDay.Night]: 'Your Nightly Tasks',
    };
  }

  public start(): void {
    log.info('[NotificationService] Starting notification scheduler.');

    cron.schedule('0 8 * * *', () => {
      this.triggerNotificationChecks(TimeOfDay.Morning);
    });

    cron.schedule('0 12 * * *', () => {
      this.triggerNotificationChecks(TimeOfDay.Afternoon);
    });

    cron.schedule('0 17 * * *', () => {
      this.triggerNotificationChecks(TimeOfDay.Evening);
    });

    cron.schedule('0 20 * * *', () => {
      this.triggerNotificationChecks(TimeOfDay.Night);
    });
  }

  private async triggerNotificationChecks(timeOfDay: TimeOfDay): Promise<void> {
    const settings = deviceSettingsService.getSettings();
    if (!settings.notificationsEnabled) {
      log.info(
        `[NotificationService] Notifications are disabled. Skipping check for ${timeOfDay}.`,
      );
      return;
    }

    log.info(
      `[NotificationService] Cron job fired for ${timeOfDay}. Checking for tasks.`,
    );

    const session = getSession();
    const userId = session.user ? session.user.id : null;

    await this.sendNotificationForTimeOfDay(timeOfDay, userId);
  }

  private async sendNotificationForTimeOfDay(
    timeOfDay: TimeOfDay,
    userId: string | null,
  ): Promise<void> {
    try {
      const tasksIncompleteCount =
        await this.taskRepo.getIncompleteTasksForTimeOfDay(userId, timeOfDay);
      const rttIncompleteCount =
        await this.rttRepo.getCountOfIncompleteRepetitiveTasksForTimeOfDay(
          userId,
          timeOfDay,
        );

      const totalInCompleteForTimeOfDay =
        tasksIncompleteCount + rttIncompleteCount;

      if (totalInCompleteForTimeOfDay === 0) {
        log.info(
          `[NotificationService] No incomplete tasks for ${timeOfDay}. No notification will be sent.`,
        );
        return;
      }

      const notification = new Notification({
        title: this.titleMapping[timeOfDay],
        body: `You have ${totalInCompleteForTimeOfDay} task${
          totalInCompleteForTimeOfDay > 1 ? 's' : ''
        } to complete.`,
        silent: false,
      });

      notification.on('click', () => {
        log.info('[NotificationService] Notification clicked by user.');
        const mainWindow = getMainWindow();
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          sendToMainWindow(ChannelsEnum.RESPONSE_CREATE_OR_UPDATE_TASK);
        }
      });

      notification.show();
    } catch (error) {
      log.error(
        `[NotificationService] Failed to check tasks or send notification for ${timeOfDay}:`,
        error,
      );
    }
  }
}

export const notificationService = new NotificationService();
