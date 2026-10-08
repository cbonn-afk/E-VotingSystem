import Button from "@mui/material/Button";

import Link from "@components/Link";

const NewJournalEntryButton = () => {
  return (
    <Button
      component={Link}
      href="/accounting/journals/new"
      variant="contained"
      startIcon={<i className="bx bx-book-add" />}
    >
      New Journal Entry
    </Button>
  );
};

export default NewJournalEntryButton;
