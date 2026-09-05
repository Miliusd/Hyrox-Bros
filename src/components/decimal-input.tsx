"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "step"> & {
  value: string | number;
  onValueChange: (value: string) => void;
  min?: number | string;
  step?: number | string;
};

// Keep the typed separator locally: numeric parents turn "2," into 2.
export function DecimalInput({ value, onValueChange, min, step, ...props }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const [emitted, setEmitted] = useState(String(value));
  const input = useRef<HTMLInputElement>(null);
  const text = draft !== null && String(value) === emitted ? draft : String(value);
  useEffect(() => {
    const normalized = text.trim().replace(",", ".");
    const number = Number(normalized);
    let error = "";
    if (normalized && (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) || !Number.isFinite(number))) error = "Enter a number using a comma or dot for decimals.";
    else if (normalized && min !== undefined && number < Number(min)) error = `Enter at least ${min}.`;
    else if (normalized && step !== undefined && step !== "any") {
      const units = (number - Number(min ?? 0)) / Number(step);
      if (Math.abs(units - Math.round(units)) > 0.000001) error = `Use increments of ${step}.`;
    }
    input.current?.setCustomValidity(error);
  }, [text, min, step]);
  return <input {...props} ref={input} type="text" inputMode="decimal" value={text}
    onChange={(event) => {
      const raw = event.target.value;
      const normalized = raw.trim().replace(",", ".");
      const number = Number(normalized);
      const validNumber = /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) && Number.isFinite(number);
      let error = "";
      if (normalized && !validNumber) error = "Enter a number using a comma or dot for decimals.";
      else if (normalized && min !== undefined && number < Number(min)) error = `Enter at least ${min}.`;
      else if (normalized && step !== undefined && step !== "any") {
        const units = (number - Number(min ?? 0)) / Number(step);
        if (Math.abs(units - Math.round(units)) > 0.000001) error = `Use increments of ${step}.`;
      }
      event.currentTarget.setCustomValidity(error);
      setDraft(raw);
      // Invalid/incomplete drafts remain visible, but never become NaN in the plan.
      if (!normalized || validNumber) {
        setEmitted(typeof value === "number" ? String(Number(normalized)) : normalized);
        onValueChange(normalized);
        // Numeric parents stringify the emitted value without trailing separators.
      }
    }} />;
}
