// MUI Imports
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Component Imports
import CustomKpiCard from "@components/app/CustomKPICard";

// Type Imports
import type { EmployeesStat } from "../../types";

type EmployeesStatsCardsProps = {
  stats: EmployeesStat[];
};

const EmployeesStatsCards = ({ stats }: EmployeesStatsCardsProps) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(4, minmax(0, 1fr))",
        },
        gap: 4,
      }}
    >
      {stats.map((stat) => (
        <CustomKpiCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          iconString={stat.icon}
          iconColor={stat.color}
        >
          <Typography variant="caption" color="text.secondary">
            {stat.helper}
          </Typography>
        </CustomKpiCard>
      ))}
    </Box>
  );
};

export default EmployeesStatsCards;
