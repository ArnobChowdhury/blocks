import { render, screen } from '@testing-library/react';
import Selector from './Selector';

describe('Selector component', () => {
  it('renders correctly', () => {
    const label = 'Test label';
    render(
      <Selector
        label={label}
        options={[
          {
            id: 1,
            name: 'Option 1',
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
          {
            id: 2,
            name: 'Option 2',
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
        ]}
        multiple={false}
        onChange={() => {}}
        onOpen={async () => {}}
        onOptionCreation={() => {}}
      />,
    );
    expect(screen.getAllByText(label).length).toBe(2);
  });
});
