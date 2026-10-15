import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";

const DATE = "2026-10-20";
const HELP = `/daily/${DATE}`;

function rectangleArea(id: string, length: number, width: number): Question {
  const answer = length * width;
  return numericQ(id, `Area of a ${length} cm by ${width} cm rectangle?`, answer, `${length} × ${width} = ${answer} cm².`, HELP, { unit: "cm²" });
}

function rectanglePerimeter(id: string, length: number, width: number): Question {
  const answer = 2 * length + 2 * width;
  return numericQ(id, `Perimeter of a ${length} cm by ${width} cm rectangle?`, answer, `2(${length}) + 2(${width}) = ${answer} cm.`, HELP, { unit: "cm" });
}

function triangleArea(id: string, base: number, height: number): Question {
  const answer = (base * height) / 2;
  return numericQ(id, `Area of a triangle with base ${base} cm and height ${height} cm?`, answer, `${base} × ${height} ÷ 2 = ${answer} cm².`, HELP, { unit: "cm²" });
}

function boxVolume(id: string, length: number, width: number, height: number): Question {
  const answer = length * width * height;
  return numericQ(id, `Volume of a ${length} cm × ${width} cm × ${height} cm box?`, answer, `${length} × ${width} × ${height} = ${answer} cm³.`, HELP, { unit: "cm³" });
}

const versionA: Question[] = [
  rectangleArea("a-a1", 9, 4),
  rectangleArea("a-a2", 12, 7),
  rectangleArea("a-a3", 15, 6),
  rectangleArea("a-a4", 11, 8),
  rectangleArea("a-a5", 20, 5),
  rectanglePerimeter("a-p1", 9, 4),
  rectanglePerimeter("a-p2", 12, 7),
  rectanglePerimeter("a-p3", 15, 6),
  rectanglePerimeter("a-p4", 11, 8),
  rectanglePerimeter("a-p5", 20, 5),
  triangleArea("a-t1", 10, 6),
  triangleArea("a-t2", 14, 8),
  triangleArea("a-t3", 9, 4),
  triangleArea("a-t4", 16, 5),
  boxVolume("a-v1", 5, 4, 3),
  boxVolume("a-v2", 8, 3, 2),
  boxVolume("a-v3", 6, 5, 4),
  boxVolume("a-v4", 10, 2, 7),
];

const versionB: Question[] = [
  rectangleArea("b-a1", 8, 5),
  rectangleArea("b-a2", 13, 6),
  rectangleArea("b-a3", 14, 9),
  rectangleArea("b-a4", 16, 7),
  rectangleArea("b-a5", 25, 4),
  rectanglePerimeter("b-p1", 8, 5),
  rectanglePerimeter("b-p2", 13, 6),
  rectanglePerimeter("b-p3", 14, 9),
  rectanglePerimeter("b-p4", 16, 7),
  rectanglePerimeter("b-p5", 25, 4),
  triangleArea("b-t1", 12, 7),
  triangleArea("b-t2", 15, 6),
  triangleArea("b-t3", 18, 4),
  triangleArea("b-t4", 11, 8),
  boxVolume("b-v1", 7, 4, 3),
  boxVolume("b-v2", 9, 2, 5),
  boxVolume("b-v3", 6, 6, 3),
  boxVolume("b-v4", 12, 3, 2),
];

export const day20261020: Day = {
  date: DATE,
  title: "Day 33 — Around, across, and inside",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Perimeter", "Area", "Volume and units"],
  versionA,
  versionB,
};
