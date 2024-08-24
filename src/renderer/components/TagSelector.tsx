import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
// eslint-disable-next-line import/no-relative-packages
import { Tag } from '../../generated/client';

interface TagSelectorProps {
  tags: Tag[];
  onChange: (value: Tag[]) => void;
  onOpen: () => Promise<void>;
}

function TagSelector({ tags, onOpen }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
      getOptionLabel={(option) => option.name}
      options={tags}
      loading={loading}
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
