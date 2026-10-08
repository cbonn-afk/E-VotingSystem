export type ExpenseCategoryPresentation = {
  icon: string;
  description: string;
};

const categoryPresentation: Record<string, ExpenseCategoryPresentation> = {
  fabrics: {
    icon: "bx bx-layer",
    description: "Fabric purchases used to produce customer orders.",
  },
  payroll: {
    icon: "bx bx-group",
    description: "Manual payroll-related operating expense.",
  },
  commission: {
    icon: "bx bx-money",
    description: "Commissions payable to sales partners or agents.",
  },
  utilities: {
    icon: "bx bx-plug",
    description: "General operating utilities.",
  },
  "electric-bill": {
    icon: "bx bx-bulb",
    description: "Electricity and power consumption.",
  },
  "water-bill": {
    icon: "bx bx-water",
    description: "Water supply and related charges.",
  },
  internet: {
    icon: "bx bx-wifi",
    description: "Internet, phone, and communication costs.",
  },
  rent: {
    icon: "bx bx-building-house",
    description: "Lease, rent, and occupancy costs.",
  },
  transportation: {
    icon: "bx bx-car",
    description: "Transport, delivery, and travel costs.",
  },
  "office-supplies": {
    icon: "bx bx-briefcase-alt-2",
    description: "Office supplies and routine consumables.",
  },
  repair: {
    icon: "bx bx-wrench",
    description: "Repairs and maintenance work.",
  },
  miscellaneous: {
    icon: "bx bx-dots-horizontal-rounded",
    description: "Other operating costs not listed above.",
  },
};

export const getExpenseCategoryPresentation = (
  slug: string,
): ExpenseCategoryPresentation =>
  categoryPresentation[slug] ?? {
    icon: "bx bx-receipt",
    description: "Record this operating expense under its assigned account.",
  };
