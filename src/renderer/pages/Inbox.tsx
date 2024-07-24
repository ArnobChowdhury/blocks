import { useEffect } from 'react';
import { PageHeader } from '../components';
import { AllTasks } from '../widgets';
import { refreshAllTasks } from '../utils';

function Inbox() {
  useEffect(() => {
    refreshAllTasks();
  }, []);

  return (
    <>
      <PageHeader>Inbox</PageHeader>
      <AllTasks />
    </>
  );
}

export default Inbox;
