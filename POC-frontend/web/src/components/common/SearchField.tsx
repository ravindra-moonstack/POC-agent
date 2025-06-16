import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { TextFieldProps } from '@mui/material';

interface SearchFieldProps extends Omit<TextFieldProps, 'variant'> {
  onSearch?: (value: string) => void;
}

const SearchField: React.FC<SearchFieldProps> = ({ onSearch, ...props }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (onSearch) {
      onSearch(value);
    }
    if (props.onChange) {
      props.onChange(event);
    }
  };

  return (
    <TextField
      placeholder="Search..."
      variant="outlined"
      size="small"
      onChange={handleChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
        ...props.InputProps,
      }}
      sx={{
        width: 300,
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default SearchField; 