"use client";

import { Slider } from "@/components/ui/slider";

interface ProblemCountSliderProps {
  value: number;
  onChange: (count: number) => void;
}

export function ProblemCountSlider({
  value,
  onChange,
}: ProblemCountSliderProps) {
  return <Slider label="Number of Problems" min={5} max={30} value={value} onChange={onChange} />;
}
