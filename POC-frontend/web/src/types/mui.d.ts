import { GridProps as MuiGridProps } from "@mui/material";

declare module "@mui/material/Grid" {
  interface GridProps extends MuiGridProps {
    item?: boolean;
    container?: boolean;
    xs?: number | boolean;
    sm?: number | boolean;
    md?: number | boolean;
    lg?: number | boolean;
    xl?: number | boolean;
    spacing?: number;
    direction?: "row" | "row-reverse" | "column" | "column-reverse";
    wrap?: "nowrap" | "wrap" | "wrap-reverse";
    zeroMinWidth?: boolean;
  }
}
