// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ChannelsEnum } from '../renderer/types';

/**
 * Todo for channels
 * 1. Move the types to types/index.ts or somewhere appropriate as enums
 */
// export type Channels =
//   | 'ipc-example'
//   | 'create-task'
//   | 'request-tasks-today'
//   | 'response-tasks-today'
//   | 'request-toggle-task-completion-status'
//   | 'request-monthly-report'
//   | 'response-monthly-report'
//   | 'request-tasks-overdue'
//   | 'response-tasks-overdue'
//   | 'request-task-failure';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: ChannelsEnum, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: ChannelsEnum, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: ChannelsEnum, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    // removeAllListeners(channel: Channels) {
    //   ipcRenderer.removeAllListeners(channel);
    // },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;