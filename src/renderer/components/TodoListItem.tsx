import React, { useState } from 'react';
import {
  ListItem,
  FormControlLabel,
  Typography,
  Box,
  IconButton,
  Fade,
  Tooltip,
} from '@mui/material';
import SmallCheckbox from './SmallCheckbox';
import Clock from '../icons/Clock';
import Close from '../icons/Close';

interface ITodoListItemProps {
  isCompleted: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  taskTitle: string;
  showClock: boolean;
}

function TodoListItem({
  isCompleted,
  onChange,
  taskTitle,
  showClock = true,
}: ITodoListItemProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <ListItem
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <Box display="flex" justifyContent="space-between" width="100%">
        <FormControlLabel
          control={<SmallCheckbox checked={isCompleted} onChange={onChange} />}
          label={
            <Typography
              sx={{
                textDecoration: isCompleted ? 'line-through' : 'none',
              }}
              variant="body2"
            >
              {taskTitle}
            </Typography>
          }
        />
        <Fade in={showOptions} timeout={500}>
          <Box>
            {showClock && (
              <Tooltip
                title="Reschedule"
                placement="top"
                arrow
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, -6],
                        },
                      },
                    ],
                  },
                }}
              >
                <IconButton size="small">
                  <Clock />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip
              title="Failed"
              placement="top"
              arrow
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, -6],
                      },
                    },
                  ],
                },
              }}
            >
              <IconButton size="small">
                <Close />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      </Box>
    </ListItem>
  );
}

export default TodoListItem;
