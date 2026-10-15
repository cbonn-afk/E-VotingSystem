import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CustomTableColumn } from "@components/app/CustomTable";

import type { AssemblyResource } from "../../api/types";
import { assemblyTransitions } from "../../data/electionOptions";
import ElectionStatusChip from "../shared/ElectionStatusChip";

type AssemblyColumnActions = {
  canManage: boolean;
  onChangeStatus: (assembly: AssemblyResource) => void;
  onDelete: (assembly: AssemblyResource) => void;
  onEdit: (assembly: AssemblyResource) => void;
};

export const getAssemblyColumns = ({
  canManage,
  onChangeStatus,
  onDelete,
  onEdit,
}: AssemblyColumnActions): CustomTableColumn<AssemblyResource>[] => [
  {
    id: "year",
    label: "Year",
    width: 100,
    render: (assembly) => <Typography fontWeight={700}>{assembly.year}</Typography>,
  },
  {
    id: "name",
    label: "Assembly",
    minWidth: 240,
    flex: 1.5,
    render: (assembly) => assembly.name,
  },
  {
    id: "status",
    label: "Status",
    width: 150,
    render: (assembly) => <ElectionStatusChip status={assembly.status} />,
  },
  {
    id: "registered",
    label: "Registered",
    width: 120,
    align: "right",
    value: (assembly) => assembly.registrations_count ?? 0,
  },
  ...(canManage
    ? [
        {
          id: "actions",
          label: "Actions",
          width: 140,
          align: "right" as const,
          render: (assembly: AssemblyResource) => (
            <Stack direction="row" justifyContent="flex-end" sx={{ inlineSize: "100%" }}>
              <Tooltip title="Rename">
                <IconButton size="small" onClick={() => onEdit(assembly)}>
                  <i className="bx bx-edit" />
                </IconButton>
              </Tooltip>
              {assemblyTransitions[assembly.status].length > 0 && (
                <Tooltip title="Change status">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onChangeStatus(assembly)}
                  >
                    <i className="bx bx-transfer-alt" />
                  </IconButton>
                </Tooltip>
              )}
              {assembly.status === "draft" &&
                (assembly.registrations_count ?? 0) === 0 && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDelete(assembly)}
                    >
                      <i className="bx bx-trash" />
                    </IconButton>
                  </Tooltip>
                )}
            </Stack>
          ),
        },
      ]
    : []),
];
