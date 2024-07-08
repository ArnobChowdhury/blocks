import { PageHeader } from '../components';
import { AllTasks } from '../widgets';
import { ChannelsEnum } from '../types';

function Inbox() {
  const refreshAllTasks = () => {
    window.electron.ipcRenderer.sendMessage(
      ChannelsEnum.REQUEST_ALL_UNSCHEDULED_ACTIVE_TASKS,
    );
    window.electron.ipcRenderer.sendMessage(
      ChannelsEnum.REQUEST_ALL_ONE_OFF_ACTIVE_TASKS,
    );
    window.electron.ipcRenderer.sendMessage(
      ChannelsEnum.REQUEST_ALL_DAILY_ACTIVE_TASKS,
    );
    window.electron.ipcRenderer.sendMessage(
      ChannelsEnum.REQUEST_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
    );
  };

  return (
    <>
      <PageHeader>Inbox</PageHeader>
      <AllTasks refreshAllTasks={refreshAllTasks} />
    </>
  );
}

export default Inbox;
