"use client";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useExpenseCategories } from "../../hooks/useExpenseEntryApi";
import { getExpenseCategoryPresentation } from "../../utils/expenseCategoryPresentation";
import { expenseRoutes } from "../../utils/expenseRoutes";

type ExpenseCategoryDialogProps = {
  open: boolean;
  onClose: () => void;
};

const NewExpenseCategoryDialog = ({
  open,
  onClose,
}: ExpenseCategoryDialogProps) => {
  const router = useRouter();
  const categoriesQuery = useExpenseCategories();
  const categories = categoriesQuery.data?.data ?? [];

  const selectCategory = (categoryId: string) => {
    onClose();
    router.push(expenseRoutes.createWithCategory(categoryId));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack spacing={0.75}>
          <Typography variant="h5">What expense are you recording?</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a category to start. You can change it on the expense form
            before saving.
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        {categoriesQuery.isPending ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : categoriesQuery.isError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void categoriesQuery.refetch()}
              >
                Retry
              </Button>
            }
          >
            Expense categories could not be loaded.
          </Alert>
        ) : (
          <Box
            role="list"
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {categories.map((category) => {
              const presentation = getExpenseCategoryPresentation(
                category.slug,
              );

              return (
                <ButtonBase
                  key={category.id}
                  role="listitem"
                  onClick={() => selectCategory(category.id)}
                  sx={{
                    display: "block",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 3,
                    textAlign: "left",
                    transition:
                      "border-color 150ms ease, background-color 150ms ease, transform 150ms ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                      transform: "translateY(-2px)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Stack spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        width: 44,
                        height: 44,
                        borderRadius: 1.5,
                        color: "primary.main",
                        bgcolor: "primary.lighterOpacity",
                        fontSize: 24,
                      }}
                    >
                      <i className={presentation.icon} />
                    </Box>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {category.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {presentation.description}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {category.expenseAccount.name}
                    </Typography>
                  </Stack>
                </ButtonBase>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewExpenseCategoryDialog;
