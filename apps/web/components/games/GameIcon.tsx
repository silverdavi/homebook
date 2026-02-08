"use client";

import Image from "next/image";

/**
 * GameIcon: renders a generated PNG icon instead of an emoji.
 * Falls back to emoji if the icon file doesn't exist.
 *
 * Usage:
 *   <GameIcon id="math-blitz" size={48} fallback="⚡" />
 */

interface GameIconProps {
  /** Icon ID matching the filename in /icons/games/256/ (without .png) */
  id: string;
  /** Display size in pixels (default 48) */
  size?: number;
  /** Emoji fallback if image fails to load */
  fallback?: string;
  /** Extra className */
  className?: string;
}

export function GameIcon({ id, size = 48, fallback, className = "" }: GameIconProps) {
  // Use 256px version for sizes ≤ 256, otherwise 512px
  const res = size <= 256 ? 256 : 512;
  const src = `/icons/games/${res}/${id}.png`;

  return (
    <Image
      src={src}
      alt={id}
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
      draggable={false}
      onError={(e) => {
        // On error, replace with emoji fallback
        if (fallback) {
          const target = e.currentTarget;
          const span = document.createElement("span");
          span.textContent = fallback;
          span.style.fontSize = `${size * 0.7}px`;
          span.style.display = "flex";
          span.style.alignItems = "center";
          span.style.justifyContent = "center";
          span.style.width = `${size}px`;
          span.style.height = `${size}px`;
          target.parentNode?.replaceChild(span, target);
        }
      }}
    />
  );
}
