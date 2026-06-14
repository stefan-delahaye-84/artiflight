"use client";

import { useEffect, useRef, useState } from "react";
import { useArtlightConfig } from "../lib/config-context";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CategoryInput({
  value,
  onChange,
  placeholder = "hiking, food, tech…",
}: Props) {
  const { basePath } = useArtlightConfig();
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch existing categories once on mount.
  useEffect(() => {
    fetch(`${basePath}/api/categories`)
      .then((r) => r.json())
      .then((cats: string[]) => setAllCategories(cats))
      .catch(() => {});
  }, [basePath]);

  // Recompute suggestions whenever the value or focus state changes.
  useEffect(() => {
    if (!focused) {
      setOpen(false);
      return;
    }
    const q = value.trim().toLowerCase();
    const filtered = q
      ? allCategories.filter((c) => c.toLowerCase().includes(q))
      : allCategories;

    setSuggestions(filtered);
    setOpen(filtered.length > 0);
    setActiveIndex(-1);
  }, [value, focused, allCategories]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function select(cat: string) {
    onChange(cat);
    setOpen(false);
    setFocused(false);
    inputRef.current?.blur();
  }

  // True when the typed value is non-empty and not an exact match.
  const isNew =
    value.trim().length > 0 &&
    !allCategories.some((c) => c.toLowerCase() === value.trim().toLowerCase());

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          // Delay so mousedown on a suggestion fires before the dropdown closes.
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="input pr-16"
        />
        {isNew && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            nieuw
          </span>
        )}
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover py-1 shadow-md text-sm overflow-hidden">
          {suggestions.map((cat, i) => (
            <li
              key={cat}
              onMouseDown={() => select(cat)}
              className={[
                "cursor-pointer px-3 py-1.5 capitalize transition-colors",
                i === activeIndex
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              {cat}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
