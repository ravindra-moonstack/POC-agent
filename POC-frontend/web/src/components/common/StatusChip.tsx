import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';

type Status = 'completed' | 'in_progress' | 'pending' | 'cancelled' | string;

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: Status;
}

const getStatusColor = (status: Status): ChipProps['color'] => {
  const statusMap: Record<Status, ChipProps['color']> = {
    completed: 'success',
    in_progress: 'warning',
    pending: 'info',
    cancelled: 'error',
  };

  return statusMap[status.toLowerCase()] || 'default';
};

const getStatusLabel = (status: Status): string => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const StatusChip: React.FC<StatusChipProps> = ({ status, ...props }) => {
  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status)}
      size="small"
      {...props}
    />
  );
};

export default StatusChip; 