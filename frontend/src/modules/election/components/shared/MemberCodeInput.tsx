"use client";

import { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import CustomTextField from "@core/components/mui/TextField";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";

import type { MemberOption } from "../../api/types";
import { useMemberSearch } from "../../hooks/useVotingApi";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called with the code when Enter is pressed, or when a search result is chosen. */
  onSubmit: (code: string) => void;
  autoSearch: boolean;
  scope: "registration" | "voting";
  disabled?: boolean;
  large?: boolean;
};

const clean = (value: string) => value.replace(/[^a-zA-Z0-9-]/g, "");

export default function MemberCodeInput({
  label,
  value,
  onChange,
  onSubmit,
  autoSearch,
  scope,
  disabled,
  large,
}: Props) {
  const [text, setText] = useState("");
  const debounced = useDebouncedValue(text.trim(), 300);
  const search = useMemberSearch(scope, debounced, autoSearch);
  const options: MemberOption[] = search.data?.data ?? [];
  const fontSize = large ? { "& input": { fontSize: "1.6rem", fontWeight: 700 } } : undefined;

  if (autoSearch) {
    return (
      <Autocomplete<MemberOption>
        fullWidth
        disabled={disabled}
        options={options}
        loading={search.isFetching}
        filterOptions={(items) => items}
        getOptionLabel={(option) => `${option.member_code} - ${option.name}`}
        isOptionEqualToValue={(a, b) => a.member_code === b.member_code}
        noOptionsText={
          debounced.length < 2 ? "Type at least 2 characters" : "No members found"
        }
        inputValue={text}
        onInputChange={(_, next) => setText(next)}
        onChange={(_, option) => {
          if (!option) return;
          onChange(option.member_code);
          onSubmit(option.member_code);
          setText("");
        }}
        renderInput={(params) => (
          <TextField {...params} autoFocus label={label} sx={fontSize} />
        )}
      />
    );
  }

  return (
    <CustomTextField
      autoFocus
      fullWidth
      disabled={disabled}
      label={label}
      value={value}
      onChange={(event) => onChange(clean(event.target.value))}
      onKeyDown={(event) => {
        if (event.key === "Enter" && value) {
          event.preventDefault();
          onSubmit(value);
        }
      }}
      sx={fontSize}
    />
  );
}
