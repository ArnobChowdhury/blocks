import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskScoring from './TaskScoring';
import { scoreColors } from '../../constants';

describe('TaskScoring Component', () => {
  test('renders correct number of score circles', () => {
    render(<TaskScoring selected={null} onScoreSelection={jest.fn()} />);
    const circles = screen.getAllByRole('button');
    expect(circles).toHaveLength(scoreColors.length);
  });
  test('calls onScoreSelection when a circle is clicked', () => {
    const onScoreSelectionMock = jest.fn();
    render(
      <TaskScoring selected={null} onScoreSelection={onScoreSelectionMock} />,
    );
    const circles = screen.getAllByRole('button');
    fireEvent.click(circles[2]);
    expect(onScoreSelectionMock).toHaveBeenCalledWith(2);
  });
});
