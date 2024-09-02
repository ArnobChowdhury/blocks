import { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Checkbox,
  useTheme,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';

// eslint-disable-next-line import/no-relative-packages
import { Tag } from '../../generated/client';

interface TagSelectorProps {
  tags: Tag[];
  // eslint-disable-next-line react/require-default-props
  selectedTags: Tag[];
  onChange: (value: Tag[]) => void;
  onOpen: () => Promise<void>;
  onTagCreation: (tagName: string) => void;
}

const filter = createFilterOptions<Tag>();

function TagSelector({
  tags,
  selectedTags,
  onOpen,
  onTagCreation,
  onChange,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (open) {
      setLoading(true);
      onOpen()
        .then(() => setLoading(false))
        .catch(() => setLoading(false));
    }
  }, [open, onOpen]);

  return (
    <Autocomplete
      multiple
      limitTags={2}
      disableCloseOnSelect
      size="small"
      id="asynchronous-demo"
      sx={{ width: 300 }}
      open={open}
      value={selectedTags}
      onChange={(_, value) => {
        onChange(value);
      }}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      // needs to be worked on
      isOptionEqualToValue={(option, value) => option.id === value.id}
      // getOptionLabel={(option) => option.name}
      getOptionLabel={(option) => {
        // Value selected with enter, right from the input
        if (typeof option === 'string') {
          return option;
        }

        // Add "xxx" option created dynamically
        if ('inputValue' in option) {
          return option.inputValue as string;
        }

        // Regular option
        return option.name;
      }}
      options={tags}
      loading={loading}
      clearOnBlur
      selectOnFocus
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = options.some((option) => inputValue === option.name);
        if (inputValue !== '' && !isExisting) {
          filtered.push({
            inputValue,
            name: `Create "${inputValue}"`,
          } as unknown as Tag);
        }

        return filtered;
      }}
      renderOption={(props, option, { selected }) => {
        // @ts-ignore
        // eslint-disable-next-line react/prop-types
        const { key, onClick, ...optionProps } = props;
        const isCreatable = Boolean('inputValue' in option);

        return (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
          <li
            key={key}
            onClick={
              'inputValue' in option
                ? () => onTagCreation(option.inputValue as string)
                : onClick
            }
            {...optionProps}
            style={{
              fontSize: theme.typography.body2.fontSize,
            }}
          >
            {!isCreatable && (
              <Checkbox
                size="small"
                style={{ marginRight: 8 }}
                checked={selected}
              />
            )}
            {isCreatable && (
              <AddIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
            )}
            {option.name}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...params}
          label="Tags"
          size="small"
          InputLabelProps={{
            ...params.InputLabelProps,
            size: 'small',
            style: {
              fontSize: '14px',
            },
          }}
          InputProps={{
            ...params.InputProps,
            style: {
              fontSize: theme.typography.body2.fontSize,
            },
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={14} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

export default TagSelector;
