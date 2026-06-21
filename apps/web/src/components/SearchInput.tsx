"use client";

import { useEffect, useRef, useState } from "react";

type SearchInputProps = {
  // The committed value (from the URL). Local typing state syncs to this so an
  // external change (e.g. "Reset filters") clears the box.
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  // Debounce window in ms; keystrokes within it coalesce into one onChange.
  delayMs?: number;
  label?: string;
};

const inputClassName =
  "block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

/**
 * Debounced search box. Keeps its own text state for responsiveness and only
 * calls `onChange` after the user pauses, so we don't hit the API on every
 * keystroke. Debounce lives here (no dependency) to keep call sites simple.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  delayMs = 300,
  label,
}: SearchInputProps) {
  const [text, setText] = useState(value);

  // Re-sync when the committed value changes from the outside (reset, navigation).
  useEffect(() => {
    setText(value);
  }, [value]);

  // Always call the latest onChange without re-arming the timer on each render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    // Already committed — nothing to debounce (also avoids a redundant navigation).
    if (text === value) {
      return;
    }

    const handle = setTimeout(() => onChangeRef.current(text), delayMs);
    return () => clearTimeout(handle);
  }, [text, value, delayMs]);

  return (
    <label className="block flex-1 text-sm font-medium text-neutral-700">
      {label ? <span className="mb-1 block">{label}</span> : null}
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={inputClassName}
      />
    </label>
  );
}
