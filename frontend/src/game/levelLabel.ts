/**
 * Display names for levels (D-081). Level numbers stay fixed inside the app
 * (D-056): they key progress, links and notes. System Design is a new subject,
 * so its levels are shown counted from 1 with an "SD" prefix: Level 28 is
 * "SD 1". Algorithm levels keep their numbers.
 */
export const FIRST_SYSTEM_DESIGN_LEVEL = 28;

/** "7" for an algorithm level, "SD 1" for Level 28. */
export function levelShort(number: number): string {
  return number >= FIRST_SYSTEM_DESIGN_LEVEL
    ? `SD ${number - FIRST_SYSTEM_DESIGN_LEVEL + 1}`
    : `${number}`;
}

/** "Level 7" for an algorithm level, "SD 1" for Level 28. */
export function levelLabel(number: number): string {
  return number >= FIRST_SYSTEM_DESIGN_LEVEL
    ? levelShort(number)
    : `Level ${number}`;
}
