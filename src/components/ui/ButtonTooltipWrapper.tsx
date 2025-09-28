import { Tooltip } from '@mui/material';
import React from 'react';
type ButtonTooltipWrapperProps = {
  children: React.ReactNode;
  tooltipText: string;
  active?: boolean;
};

const ButtonTooltipWrapper = ({ children, tooltipText, active }: ButtonTooltipWrapperProps) => {
  return active ? (
    <Tooltip title={tooltipText} arrow>
      <span>{children}</span>
    </Tooltip>
  ) : (
    <span>{children}</span>
  );
};
export default ButtonTooltipWrapper;
