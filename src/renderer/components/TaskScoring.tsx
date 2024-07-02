import React from 'react';
import { Box, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import { scoreColors } from '../constants';

interface CircleProps {
  bgcolor: string;
  selected: boolean;
}
/* Rectangle 2487 */

const Circle = styled(IconButton)<CircleProps>(({ bgcolor, selected }) => ({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: bgcolor,
  // marginRight: theme.spacing(3),
  border: selected ? '4px solid white' : '4px solid transparent',
  boxShadow: selected ? `0 0 0 3px ${bgcolor}` : 'none',
  '&:hover': {
    backgroundColor: bgcolor,
  },
}));

interface ITaskScoringProps {
  onScoreSelection: React.Dispatch<React.SetStateAction<number | null>>;
  selected: number | null;
}

function TaskScoring({ selected, onScoreSelection }: ITaskScoringProps) {
  return (
    <Box display="flex" mt={1}>
      {scoreColors.map((color, index) => (
        <Box
          width={24}
          height={24}
          display="flex"
          justifyContent="center"
          alignItems="center"
          mr={1}
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
