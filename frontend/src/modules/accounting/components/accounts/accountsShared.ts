import type {
  AccountTreeNode,
  AccountTypeValue,
} from "../../api/types";

// Shared chip color per account core type — used by the table, tree, and chips.
export const ACCOUNT_TYPE_COLOR: Record<
  AccountTypeValue,
  "primary" | "warning" | "info" | "success" | "error"
> = {
  asset: "primary",
  liability: "warning",
  equity: "info",
  revenue: "success",
  expense: "error",
};

export const ACCOUNT_TYPES: AccountTypeValue[] = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
];

export type ParentOption = {
  id: string;
  code: string;
  name: string;
  type: AccountTypeValue;
  level: number;
  isPosting: boolean;
};

// Flatten the account tree into an indented list for the parent-account picker.
export const flattenAccountTree = (
  nodes: AccountTreeNode[] = [],
  level = 0,
): ParentOption[] =>
  nodes.flatMap((node) => [
    {
      id: node.id,
      code: node.code,
      name: node.name,
      type: node.type,
      level,
      isPosting: node.isPosting,
    },
    ...flattenAccountTree(node.children ?? [], level + 1),
  ]);
