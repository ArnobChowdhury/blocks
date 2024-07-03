import React from 'react';
import { ListItem, FormControlLabel, Typography } from '@mui/material';
import SmallCheckbox from './SmallCheckbox';

interface ITodoListItemProps {
  isCompleted: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  taskTitle: string;
}

function TodoListItem({
  isCompleted,
  onChange,
  taskTitle,
}: ITodoListItemProps) {
  return (
    <ListItem>
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
    </ListItem>
  );
}

export default TodoListItem;
