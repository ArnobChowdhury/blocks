/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { PrismaClient } from '@prisma/client';
import dayjs, { Dayjs } from 'dayjs';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {
  ITaskIPC,
  TaskScheduleTypeEnum,
  TaskCompletionStatusEnum,
  DaysInAWeek,
  ChannelsEnum,
  IPCEventsResponseEnum,
} from '../renderer/types';
import { getTodayStart, getTodayEnd } from './helpers';

const prisma = new PrismaClient();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1500,
    height: 928,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

/**
 * todo for ipc events
 * 1. Error handling
 * 2. DB calls should be moved to a separate service
 */

/**
 * DBs
 */
const makeCompletedOneOffTasksInactive = async () => {
  const todayStart = getTodayStart();

  await prisma.task.updateMany({
    where: {
      isActive: true,
      schedule: TaskScheduleTypeEnum.Once,
      dueDate: {
        lt: todayStart,
      },
      completionStatus: TaskCompletionStatusEnum.COMPLETE,
    },
    data: {
      isActive: false,
    },
  });
};
const generateDueRepetitiveTasks = async () => {
  const todayStart = dayjs().startOf('day');
  const todayStartAsString = todayStart.toISOString();

  const dueRepetitiveTasks = await prisma.repetitiveTaskTemplate.findMany({
    where: {
      isActive: true,
      OR: [
        { lastDateOfTaskGeneration: { lt: todayStartAsString } },
        { lastDateOfTaskGeneration: null },
      ],
    },
  });

  await Promise.all(
    dueRepetitiveTasks.map(async (repetitiveTask) => {
      const { id: templateId, title, schedule } = repetitiveTask;

      let lastDateOfTaskGeneration: Dayjs | Date | null;
      // eslint-disable-next-line prettier/prettier
      lastDateOfTaskGeneration = repetitiveTask.lastDateOfTaskGeneration;

      let daysSinceLastTaskGeneration: number;

      if (!lastDateOfTaskGeneration) {
        daysSinceLastTaskGeneration = 1;
        lastDateOfTaskGeneration = todayStart.subtract(1, 'day');
      } else
        daysSinceLastTaskGeneration = dayjs().diff(
          dayjs(lastDateOfTaskGeneration),
          'day',
        );

      const dayArray = Array.from(
        { length: daysSinceLastTaskGeneration },
        (_, i) => i + 1,
      );

      await Promise.all(
        dayArray.map(async (day) => {
          let dueDate: Dayjs | string = dayjs(lastDateOfTaskGeneration).add(
            day,
            'day',
          );
          const dayOfWeekLowercase = dueDate.format('dddd').toLowerCase();

          if (repetitiveTask[dayOfWeekLowercase as DaysInAWeek]) {
            dueDate = dueDate.toISOString();

            await prisma.task.upsert({
              where: {
                repetitiveTaskTemplateId_dueDate: {
                  repetitiveTaskTemplateId: templateId,
                  dueDate,
                },
              },
              create: {
                repetitiveTaskTemplateId: templateId,
                dueDate,
                title,
                schedule,
              },
              update: {},
            });

            await prisma.repetitiveTaskTemplate.update({
              where: {
                id: templateId,
              },
              data: {
                lastDateOfTaskGeneration: dueDate,
              },
            });
          }
        }),
      );
    }),
  );
};

ipcMain.on(ChannelsEnum.REQUEST_CREATE_TASK, async (event, task: ITaskIPC) => {
  const { title, schedule, dueDate, days, shouldBeScored } = task;
  try {
    if (
      schedule === TaskScheduleTypeEnum.Once ||
      schedule === TaskScheduleTypeEnum.Unscheduled
    ) {
      // create a new task
      await prisma.task.create({
        data: {
          title,
          schedule,
          shouldBeScored,
          createdAt: new Date(),
          dueDate,
        },
      });
    } else {
      let monday;
      let tuesday;
      let wednesday;
      let thursday;
      let friday;
      let saturday;
      let sunday;

      if (schedule === TaskScheduleTypeEnum.Daily) {
        monday = true;
        tuesday = true;
        wednesday = true;
        thursday = true;
        friday = true;
        saturday = true;
        sunday = true;
      }

      if (schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek) {
        days?.forEach((day) => {
          switch (day) {
            case 'monday':
              monday = true;
              break;
            case 'tuesday':
              tuesday = true;
              break;
            case 'wednesday':
              wednesday = true;
              break;
            case 'thursday':
              thursday = true;
              break;
            case 'friday':
              friday = true;
              break;
            case 'saturday':
              saturday = true;
              break;
            case 'sunday':
              sunday = true;
              break;
            default:
              break;
          }
        });
      }

      await prisma.repetitiveTaskTemplate.create({
        data: {
          title,
          schedule,
          shouldBeScored,
          monday,
          tuesday,
          wednesday,
          thursday,
          friday,
          saturday,
          sunday,
        },
      });

      event.reply(ChannelsEnum.RESPONSE_CREATE_TASK, {
        message: IPCEventsResponseEnum.SUCCESSFUL,
      });
    }
  } catch (err) {
    console.error(err);
    event.reply(ChannelsEnum.ERROR_CREATE_TASK, {
      message: IPCEventsResponseEnum.ERROR,
    });
  }
});

ipcMain.on(ChannelsEnum.REQUEST_TASKS_TODAY, async (event) => {
  await generateDueRepetitiveTasks();

  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();

  const tasksForToday = await prisma.task.findMany({
    where: {
      dueDate: {
        gte: todayStart,
        lte: todayEnd,
      },
      completionStatus: {
        not: TaskCompletionStatusEnum.FAILED,
      },
    },
    select: {
      id: true,
      dueDate: true,
      completionStatus: true,
      score: true,
      title: true,
      shouldBeScored: true,
    },
  });

  event.reply(ChannelsEnum.RESPONSE_TASKS_TODAY, tasksForToday);
});

/**
 * todo: add error handling
 */
ipcMain.on(ChannelsEnum.REQUEST_TASKS_OVERDUE, async (event) => {
  const todayStart = getTodayStart();

  const tasksOverdue = await prisma.task.findMany({
    where: {
      dueDate: {
        lt: todayStart,
      },
      completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
    },
    select: {
      id: true,
      dueDate: true,
      completionStatus: true,
      score: true,
      title: true,
      shouldBeScored: true,
      schedule: true,
    },
  });

  event.reply(ChannelsEnum.RESPONSE_TASKS_OVERDUE, tasksOverdue);
});

/**
 * todo: add error handling
 */
ipcMain.on(
  ChannelsEnum.REQUEST_TOGGLE_TASK_COMPLETION_STATUS,
  async (event, { id, checked, score }) => {
    // todo: need to make the one-off task in active
    await prisma.task.update({
      where: {
        id,
      },
      data: {
        completionStatus: checked
          ? TaskCompletionStatusEnum.COMPLETE
          : TaskCompletionStatusEnum.INCOMPLETE,
        score,
      },
    });
  },
);

/**
 * todo: add error handling
 */
ipcMain.on(ChannelsEnum.REQUEST_TASK_FAILURE, async (event, { id }) => {
  await prisma.task.update({
    where: {
      id,
    },
    data: {
      completionStatus: TaskCompletionStatusEnum.FAILED,
    },
  });
});

ipcMain.on(ChannelsEnum.REQUEST_ALL_ONE_OFF_ACTIVE_TASKS, async (event) => {
  try {
    await makeCompletedOneOffTasksInactive();
    const tasks = await prisma.task.findMany({
      where: {
        isActive: true,
        schedule: TaskScheduleTypeEnum.Once,
      },
    });

    event.reply(ChannelsEnum.RESPONSE_ALL_ONE_OFF_ACTIVE_TASKS, tasks);
  } catch {
    event.reply(ChannelsEnum.ERROR_ALL_ONE_OFF_ACTIVE_TASKS, {
      message: IPCEventsResponseEnum.ERROR,
    });
  }
});

ipcMain.on(ChannelsEnum.REQUEST_ALL_UNSCHEDULED_ACTIVE_TASKS, async (event) => {
  try {
    await makeCompletedOneOffTasksInactive();
    const tasks = await prisma.task.findMany({
      where: {
        isActive: true,
        schedule: TaskScheduleTypeEnum.Unscheduled,
      },
    });

    event.reply(ChannelsEnum.RESPONSE_ALL_UNSCHEDULED_ACTIVE_TASKS, tasks);
  } catch {
    event.reply(ChannelsEnum.ERROR_ALL_UNSCHEDULED_ACTIVE_TASKS, {
      message: IPCEventsResponseEnum.ERROR,
    });
  }
});

ipcMain.on(ChannelsEnum.REQUEST_ALL_DAILY_ACTIVE_TASKS, async (event) => {
  try {
    await makeCompletedOneOffTasksInactive();
    const tasks = await prisma.repetitiveTaskTemplate.findMany({
      where: {
        isActive: true,
        schedule: TaskScheduleTypeEnum.Daily,
      },
    });

    event.reply(ChannelsEnum.RESPONSE_ALL_DAILY_ACTIVE_TASKS, tasks);
  } catch {
    event.reply(ChannelsEnum.ERROR_ALL_DAILY_ACTIVE_TASKS, {
      message: IPCEventsResponseEnum.ERROR,
    });
  }
});

ipcMain.on(
  ChannelsEnum.REQUEST_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
  async (event) => {
    try {
      await makeCompletedOneOffTasksInactive();
      const tasks = await prisma.repetitiveTaskTemplate.findMany({
        where: {
          isActive: true,
          schedule: TaskScheduleTypeEnum.SpecificDaysInAWeek,
        },
      });

      event.reply(
        ChannelsEnum.RESPONSE_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
        tasks,
      );
    } catch {
      event.reply(ChannelsEnum.ERROR_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS, {
        message: IPCEventsResponseEnum.ERROR,
      });
    }
  },
);

/**
 * todos
 * 1. add error handling
 * 2. Change the name from re-schedule to something else. Then we can use the same function for unscheduled tasks as well
 */
ipcMain.on(
  ChannelsEnum.REQUEST_TASK_RESCHEDULE,
  async (event, { id, dueDate }) => {
    /**
     * Todos for rescheduling
     * 1. todo add a check that the task is not a Daily task. We don't allow rescheduling for Daily tasks
     * 2. in case of rescheduling a weekly task, we need to create a new task for the new dueDate
     * and mark the previous one as failed. That way our habit tracker will show the right representation.
     *   */

    const task = await prisma.task.findFirstOrThrow({
      where: {
        id,
      },
    });

    if (task.schedule === TaskScheduleTypeEnum.Daily) {
      return;
      // todo add error handling
    }

    if (task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek) {
      // need logic: a task can be delayed if the rescheduled day is prior to the next iteration
      return;
      // todo add error handling
    }

    await prisma.task.update({
      where: {
        id,
      },
      data: {
        dueDate,
      },
    });
  },
);

/**
 * todos:
 * 1. add error handling
 * 2. Whole function has to be addressed
 */

ipcMain.on(
  ChannelsEnum.REQUEST_MONTHLY_REPORT,
  async (event, { monthIndex }) => {
    const startOfMonth = dayjs().month(monthIndex).startOf('month').toDate();
    const endOfMonth = dayjs().month(monthIndex).endOf('month').toDate();

    try {
      const tasks = await prisma.repetitiveTaskTemplate.findMany({
        where: {
          schedule: {
            in: [
              TaskScheduleTypeEnum.Daily,
              TaskScheduleTypeEnum.SpecificDaysInAWeek,
            ],
          },
        },
        include: {
          Task: {
            orderBy: {
              dueDate: 'asc',
            },
            where: {
              dueDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          },
        },
      });

      event.reply(ChannelsEnum.RESPONSE_MONTHLY_REPORT, tasks);
    } catch (err) {
      event.reply(ChannelsEnum.ERROR_MONTHLY_REPORT, {
        message: IPCEventsResponseEnum.ERROR,
      });
    }
  },
);

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
