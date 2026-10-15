import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CustomTableColumn } from "@components/app/CustomTable";

import type { MemberResource } from "../../api/types";
import { formatDate } from "../../utils/electionFormat";
import ElectionStatusChip from "../shared/ElectionStatusChip";

type MemberColumnActions = {
  canManage: boolean;
  onDelete: (member: MemberResource) => void;
  onEdit: (member: MemberResource) => void;
};

export const getMemberColumns = ({
  canManage,
  onDelete,
  onEdit,
}: MemberColumnActions): CustomTableColumn<MemberResource>[] => [
  {
    id: "memberCode",
    label: "Member Code",
    width: 150,
    render: (member) => (
      <Typography fontWeight={600}>{member.member_code}</Typography>
    ),
  },
  {
    id: "name",
    label: "Name",
    minWidth: 220,
    flex: 1.2,
    render: (member) => (
      <Typography fontWeight={600}>{member.name}</Typography>
    ),
  },
  {
    id: "birthDate",
    label: "Birth Date",
    width: 130,
    render: (member) => formatDate(member.birth_date),
  },
  {
    id: "address",
    label: "Address",
    minWidth: 200,
    flex: 1,
    render: (member) => member.address || "—",
  },
  {
    id: "standing",
    label: "Standing",
    width: 140,
    render: (member) => (
      <ElectionStatusChip
        status={member.is_delinquent ? "delinquent" : "good_standing"}
      />
    ),
  },
  ...(canManage
    ? [
        {
          id: "actions",
          label: "Actions",
          width: 110,
          align: "right" as const,
          render: (member: MemberResource) => (
            <Stack direction="row" justifyContent="flex-end" sx={{ inlineSize: "100%" }}>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(member)}>
                  <i className="bx bx-edit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(member)}
                >
                  <i className="bx bx-trash" />
                </IconButton>
              </Tooltip>
            </Stack>
          ),
        },
      ]
    : []),
];
