import type { EmploymentType } from "../api/types";

export type EmployeeContribution = number | null;

export type EmployeeTypeDefinition = {
  value: string;
  label: string;
  baseRate: number;
  overtimeRate: number;
  employmentType: EmploymentType;
  sss: EmployeeContribution;
  philHealth: EmployeeContribution;
  pagIbig: EmployeeContribution;
};

export const employeeTypeDefinitions = [
  {
    value: "INTERN / OJT",
    label: "INTERN / OJT",
    baseRate: 300,
    overtimeRate: 50,
    employmentType: "Contractual",
    sss: null,
    philHealth: null,
    pagIbig: null,
  },
  {
    value: "PART TIME",
    label: "PART TIME",
    baseRate: 505,
    overtimeRate: 82,
    employmentType: "Part-time",
    sss: null,
    philHealth: null,
    pagIbig: null,
  },
  {
    value: "PRODUCTION STAFF",
    label: "PRODUCTION STAFF",
    baseRate: 505,
    overtimeRate: 82,
    employmentType: "Regular",
    sss: 252.5,
    philHealth: 125,
    pagIbig: 100,
  },
  {
    value: "PRODUCTION HEAD",
    label: "PRODUCTION HEAD",
    baseRate: 600,
    overtimeRate: 97.5,
    employmentType: "Regular",
    sss: 275,
    philHealth: 125,
    pagIbig: 100,
  },
  {
    value: "JUNIOR GRAPHIC DESIGNER",
    label: "JUNIOR GRAPHIC DESIGNER",
    baseRate: 505,
    overtimeRate: 82,
    employmentType: "Regular",
    sss: 252.5,
    philHealth: 125,
    pagIbig: 100,
  },
  {
    value: "SENIOR GRAPHIC DESIGNER",
    label: "SENIOR GRAPHIC DESIGNER",
    baseRate: 600,
    overtimeRate: 97.5,
    employmentType: "Regular",
    sss: 275,
    philHealth: 125,
    pagIbig: 100,
  },
  {
    value: "SECRETARY",
    label: "SECRETARY",
    baseRate: 600,
    overtimeRate: 97.5,
    employmentType: "Regular",
    sss: 275,
    philHealth: 125,
    pagIbig: 100,
  },
  {
    value: "TAILOR",
    label: "TAILOR",
    baseRate: 0,
    overtimeRate: 0,
    employmentType: "Contractual",
    sss: null,
    philHealth: null,
    pagIbig: null,
  },
] satisfies EmployeeTypeDefinition[];

export type EmployeeTypeValue =
  (typeof employeeTypeDefinitions)[number]["value"];

export const defaultEmployeeType = employeeTypeDefinitions[0];

export const findEmployeeTypeDefinition = (value?: string | null) =>
  employeeTypeDefinitions.find((type) => type.value === value) ?? null;

export const formatContribution = (value: EmployeeContribution) =>
  value === null ? "N/A" : value.toLocaleString("en-PH");
