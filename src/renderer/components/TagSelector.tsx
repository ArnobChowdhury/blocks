import { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';

// eslint-disable-next-line import/no-relative-packages
import { Tag } from '../../generated/client';

interface TagSelectorProps {
  tags: Tag[];
  onChange: (value: Tag[]) => void;
  onOpen: () => Promise<void>;
  onTagCreation: (tagName: string) => void;
}

const filter = createFilterOptions<Tag>();

function TagSelector({ tags, onOpen, onTagCreation }: TagSelectorProps) {
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
      size="small"
      id="asynchronous-demo"
      sx={{ width: 300 }}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      isOptionEqualToValue={(option, value) => option.name === value.name}
      // getOptionLabel={(option) => option.name}
      getOptionLabel={(option) => {
        // Value selected with enter, right from the input
        if (typeof option === 'string') {
          return option;
        }
        // Add "xxx" option created dynamically
        if (option.inputValue) {
          return option.inputValue;
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
          console.log('inputValue', inputValue);
          filtered.push({
            inputValue,
            name: `Create "${inputValue}"`,
          });
        }

        console.log('filtered', filtered);

        return filtered;
      }}
      renderOption={(props, option) => {
        const { key, onClick, ...optionProps } = props;
        const isCreatable = Boolean('inputValue' in option);

        return (
          <li
            key={key}
            onClick={
              isCreatable ? () => onTagCreation(option.inputValue) : onClick
            }
            {...optionProps}
            style={{
              fontSize: theme.typography.body2.fontSize,
            }}
          >
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
