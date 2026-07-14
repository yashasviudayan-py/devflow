"use client";

import { Search } from "lucide-react";
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
    <label className="relative block flex-1">
      <span className="sr-only">{label ?? placeholder}</span>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        strokeWidth={1.75}
      />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="field-control pl-9"
      />
    </label>
  );
}
