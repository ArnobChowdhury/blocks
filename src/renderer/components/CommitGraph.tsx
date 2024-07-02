import { Paper, Stack } from '@mui/material';
import { styled } from '@mui/system';

const data = [
  { date: '2023-06-01', commits: 1 },
  { date: '2023-06-02', commits: 7 },
  { date: '2023-06-03', commits: 4 },
  // Add more data points
];

const getColor = (commits: number) => {
  if (commits >= 5) return '#216e39';
  if (commits >= 3) return '#30a14e';
  if (commits >= 1) return '#40c463';
  return '#ebedf0';
};

interface CommitSquareProps {
  commits: number;
}

const CommitSquare = styled(Paper)<CommitSquareProps>(({ commits }) => ({
  backgroundColor: getColor(commits),
  width: 10,
  height: 10,
  margin: 1,
  borderRadius: 2,
}));

function CommitGraph() {
  return (
    <Stack>
      {data.map((day) => (
        <CommitSquare
          key={`index-${day.date}-${day.commits}`}
          commits={day.commits}
        />
      ))}
    </Stack>
  );
}

export default CommitGraph;
