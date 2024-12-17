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
import { Tag, Space } from '../../generated/client';

type SelectorProps =
  | {
      label: string;
      options: Tag[] | Space[];
      multiple: true;
      value: Tag[] | Space[];
      onChange: (value: Tag[] | Space[]) => void;
      onOpen: () => Promise<void>;
      onOptionCreation: (optionName: string) => void;
    }
  | {
      label: string;
      options: Tag[] | Space[];
      multiple: false;
      value?: Tag | Space;
      onChange: (value: Tag | Space) => void;
      onOpen: () => Promise<void>;
      onOptionCreation: (optionName: string) => void;
    };

const filter = createFilterOptions<Tag | Space>();

function Selector({
  label,
  options,
  value,
  onOpen,
  onOptionCreation,
  onChange,
  multiple,
}: SelectorProps) {
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
      multiple={multiple}
      limitTags={2}
      disableCloseOnSelect
      size="small"
      id="asynchronous-demo"
      sx={{ width: 300 }}
      open={open}
      value={value}
      onChange={(_, changedValue) => {
        if (!changedValue) return;
        if (multiple) {
          if (Array.isArray(changedValue)) {
            onChange(changedValue as Tag[] | Space[]); // Safe
          }
        } else if (!Array.isArray(changedValue)) {
          onChange(changedValue); // Safe
        }
      }}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      // needs to be worked on
      isOptionEqualToValue={(option, val) =>
        (option as Tag | Space).id === (val as Tag | Space).id
      }
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
        return (option as Tag | Space).name;
      }}
      options={options}
      loading={loading}
      clearOnBlur
      selectOnFocus
      filterOptions={(filterOptions, params) => {
        const filtered = filter(filterOptions as Tag[] | Space[], params);

        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = filterOptions.some(
          (option) => inputValue === (option as Tag | Space).name,
        );
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
                ? () => onOptionCreation(option.inputValue as string)
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
            {(option as Tag | Space).name}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...params}
          label={label}
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

export default Selector;
