import React from 'react';
import { Box, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import { scoreColors } from '../../constants';

interface CircleProps {
  bgcolor: string;
  selected: boolean;
}
/* Rectangle 2487 */

const Circle = styled(IconButton)<CircleProps>(({ bgcolor, selected }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: bgcolor,
  padding: 6,
  // marginRight: theme.spacing(3),
  border: selected ? '3px solid white' : '3px solid transparent',
  boxShadow: selected ? `0 0 0 2px ${bgcolor}` : 'none',
  '&:hover': {
    backgroundColor: bgcolor,
  },
}));

interface ITaskScoringProps {
  onScoreSelection: (index: number) => void;
  selected: number | null;
}

function TaskScoring({ selected, onScoreSelection }: ITaskScoringProps) {
  return (
    <Box display="flex" gap={1} mr={0.5}>
      {scoreColors.map((color, index) => (
        <Box
          width={20}
          height={20}
          display="flex"
          justifyContent="center"
          alignItems="center"
          key={color}
        >
          <Circle
            bgcolor={color}
            selected={selected === index}
            onClick={() => onScoreSelection(index)}
          />
        </Box>
      ))}
    </Box>
  );
}

export default TaskScoring;
