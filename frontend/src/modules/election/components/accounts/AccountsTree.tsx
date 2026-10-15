"use client";

import { useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { AccountTreeNode } from "../../api/types";
import { ACCOUNT_TYPE_COLOR } from "./accountsShared";

type AccountsTreeProps = {
  nodes: AccountTreeNode[];
  loading?: boolean;
  onView: (account: AccountTreeNode) => void;
  onEdit: (account: AccountTreeNode) => void;
  onDelete: (account: AccountTreeNode) => void;
  canManage: boolean;
  canDelete: boolean;
};

const collectExpandableIds = (nodes: AccountTreeNode[]): string[] =>
  nodes.flatMap((node) =>
    (node.children ?? []).length > 0
      ? [node.id, ...collectExpandableIds(node.children)]
      : [],
  );

type RowProps = Omit<AccountsTreeProps, "nodes" | "loading"> & {
  node: AccountTreeNode;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
};

const TreeRow = ({
  node,
  level,
  expanded,
  onToggle,
  onView,
  onEdit,
  onDelete,
  canManage,
  canDelete,
}: RowProps) => {
  const hasChildren = (node.children ?? []).length > 0;
  const isFolder = hasChildren || !node.isPosting;
  const isOpen = expanded.has(node.id);

  return (
    <>
      <Box
        className="coa-tree-row"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          py: 1.5,
          pr: 2,
          pl: 2 + level * 4,
          borderBlockEnd: "1px solid",
          borderColor: "divider",
          transition: "background-color 0.15s ease",
          "&:hover": { backgroundColor: "action.hover" },
          "&:hover .coa-row-actions": { opacity: 1 },
        }}
      >
        <Box sx={{ width: 28, display: "flex", justifyContent: "center" }}>
          {hasChildren ? (
            <IconButton size="small" onClick={() => onToggle(node.id)}>
              <i
                className={isOpen ? "bx-chevron-down" : "bx-chevron-right"}
              />
            </IconButton>
          ) : null}
        </Box>

        <i
          className={
            isFolder
              ? isOpen
                ? "bx-folder-open"
                : "bx-folder"
              : "bx-radio-circle-marked"
          }
          style={{ fontSize: 18, opacity: 0.7 }}
        />

        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 64 }}>
          {node.code}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            flexGrow: 1,
            color: node.status === "inactive" ? "text.disabled" : "text.primary",
          }}
        >
          {node.name}
        </Typography>

        <Chip
          label={node.type}
          color={ACCOUNT_TYPE_COLOR[node.type]}
          variant="tonal"
          size="small"
          className="capitalize"
        />
        {node.status === "inactive" && (
          <Chip label="inactive" color="secondary" variant="tonal" size="small" />
        )}
        {node.isSystem ? (
          <Tooltip title="Built-in account — part of the standard chart and can't be deleted">
            <Chip
              label="Built-in"
              color="secondary"
              variant="tonal"
              size="small"
              icon={<i className="bx-lock-alt" />}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Custom account you added">
            <Chip
              label="Custom"
              color="info"
              variant="tonal"
              size="small"
              icon={<i className="bx-user" />}
            />
          </Tooltip>
        )}

        <Stack
          direction="row"
          spacing={0.5}
          className="coa-row-actions"
          sx={{ opacity: 0, transition: "opacity 0.15s ease" }}
        >
          <Tooltip title="View">
            <IconButton size="small" color="secondary" onClick={() => onView(node)}>
              <i className="bx-show" />
            </IconButton>
          </Tooltip>
          {canManage && (
            <Tooltip title="Edit account">
              <IconButton size="small" color="secondary" onClick={() => onEdit(node)}>
                <i className="bx-edit" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete &&
            (node.isSystem ? (
              <Tooltip title="System accounts can't be deleted">
                <span>
                  <IconButton size="small" color="error" disabled>
                    <i className="bx-trash" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="Delete account">
                <IconButton size="small" color="error" onClick={() => onDelete(node)}>
                  <i className="bx-trash" />
                </IconButton>
              </Tooltip>
            ))}
        </Stack>
      </Box>

      {isOpen &&
        (node.children ?? []).map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            level={level + 1}
            expanded={expanded}
            onToggle={onToggle}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canManage={canManage}
            canDelete={canDelete}
          />
        ))}
    </>
  );
};

const AccountsTree = ({
  nodes,
  loading,
  onView,
  onEdit,
  onDelete,
  canManage,
  canDelete,
}: AccountsTreeProps) => {
  const expandableIds = useMemo(() => collectExpandableIds(nodes), [nodes]);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(expandableIds),
  );

  // Re-expand whenever the tree data changes (e.g. after a filter or refetch).
  useEffect(() => {
    setExpanded(new Set(expandableIds));
  }, [expandableIds]);

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });

  if (loading) {
    return (
      <Box sx={{ p: 5 }}>
        <Skeleton height={48} />
        <Skeleton height={48} />
        <Skeleton height={48} />
      </Box>
    );
  }

  if (nodes.length === 0) {
    return (
      <Box className="flex flex-col items-center justify-center text-center p-8">
        <Typography variant="h6">No accounts found</Typography>
        <Typography variant="body2" color="text.secondary">
          Add an account or adjust your filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {nodes.map((node) => (
        <TreeRow
          key={node.id}
          node={node}
          level={0}
          expanded={expanded}
          onToggle={toggle}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          canManage={canManage}
          canDelete={canDelete}
        />
      ))}
    </Box>
  );
};

export default AccountsTree;
