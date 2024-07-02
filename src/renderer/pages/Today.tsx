import { useState, useEffect, Fragment } from 'react';
import {
  Typography,
  Button,
  List,
  ListItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  styled,
} from '@mui/material';
import Plus from '../icons/Plus';
import { AddTask } from '../widgets';
import { ITask } from '../types';
import { TaskScoring, PageHeader } from '../components';

const SmallCheckbox = styled(Checkbox)(({ theme }) => ({
  padding: theme.spacing(0.5), // Adjust the padding as needed
  transform: 'scale(0.8)', // Adjust the size as needed
}));

// const { ipcRenderer } = require('electron'); // Import ipcRenderer

function Today() {
  const [showAddTask, setShowAddTask] = useState(false);
  // this line needs to be changed
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [taskIndexForScoring, setTaskIndexForScoring] = useState<number>();
  const [score, setScore] = useState<number | null>(null);

  console.log('REACT', tasks);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('request-tasks-today');

    window.electron.ipcRenderer.on('response-tasks-today', (response) => {
      console.log(response);
      setTasks(response as ITask[]);
    });
  }, []);

  const onTaskCompletionChange = (
    id: number,
    checked: boolean,
    taskScore?: number | null,
  ) => {
    window.electron.ipcRenderer.sendMessage(
      'request-toggle-task-completion-status',
      {
        id,
        checked,
        score: taskScore,
      },
    );
    window.electron.ipcRenderer.sendMessage('request-tasks-today');
  };

  const handleScoreDialogClose = () => {
    setTaskIndexForScoring(undefined);
    setScore(null);
  };

  return (
    <>
      <PageHeader>Today</PageHeader>
      <List>
        {tasks.map((task, index) => (
          <Fragment key={task.id}>
            <ListItem>
              <FormControlLabel
                control={
                  <SmallCheckbox
                    checked={task.completionStatus === 'COMPLETE'}
                    onChange={(e) => {
                      if (task.shouldBeScored && e.target.checked)
                        setTaskIndexForScoring(index);
                      else
                        onTaskCompletionChange(
                          task.id,
                          e.target.checked,
                          task.shouldBeScored ? null : undefined,
                        );
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      textDecoration:
                        task.completionStatus === 'COMPLETE'
                          ? 'line-through'
                          : 'none',
                    }}
                    variant="body2"
                  >
                    {task.title}
                  </Typography>
                }
              />
            </ListItem>
            {index !== tasks.length - 1 && <Divider />}
          </Fragment>
        ))}
      </List>
      {showAddTask && <AddTask widgetCloseFunc={setShowAddTask} />}
      {!showAddTask && (
        <Button
          startIcon={<Plus />}
          variant="text"
          onClick={() => setShowAddTask(true)}
        >
          Add Task
        </Button>
      )}
      <Dialog
        open={Boolean(taskIndexForScoring)}
        onClose={handleScoreDialogClose}
        title="Score dialog"
        sx={{ padding: 2 }}
      >
        <DialogTitle fontSize="16px">Score your task</DialogTitle>
        {taskIndexForScoring && (
          <DialogContent>
            <Typography variant="body1">
              {tasks[taskIndexForScoring].title}
            </Typography>
          </DialogContent>
        )}
        <Box px={3} minWidth={450}>
          <Typography variant="h6">Score:</Typography>
          <TaskScoring selected={score} onScoreSelection={setScore} />
        </Box>
        <DialogActions>
          <Button
            variant="text"
            disabled={score === null}
            onClick={() => {
              if (score === null) return;
              onTaskCompletionChange(
                tasks[taskIndexForScoring as number].id,
                true,
                score,
              );
              handleScoreDialogClose();
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Today;
