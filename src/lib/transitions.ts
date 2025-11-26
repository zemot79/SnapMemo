export type TransitionId =
  | "fade"
  | "crossDissolve"
  | "dipBlack"
  | "slide"
  | "zoom"
  | "glitch"
  | "blur"
  | "filmBurn";

export interface ClipTransition {
  clipId: string;
  nextClipId: string;
  transition: TransitionId;
  duration: number;
}

/**
 * Random transition picking between the user-selected list.
 */
export function buildTransitionMap(
  items: { id: string; type: string }[],
  selectedTransitions: TransitionId[],
  transitionDuration: number
): ClipTransition[] {
  if (items.length < 2) return [];

  const result: ClipTransition[] = [];

  for (let i = 0; i < items.length - 1; i++) {
    const from = items[i];
    const to = items[i + 1];

    const picked =
      selectedTransitions[
        Math.floor(Math.random() * selectedTransitions.length)
      ];

    result.push({
      clipId: from.id,
      nextClipId: to.id,
      transition: picked,
      duration: transitionDuration,
    });
  }

  return result;
}

/**
 * FFmpeg filter builder – coming later.
 */
export function ffmpegFilterForTransition(
  transition: TransitionId,
  duration: number
) {
  switch (transition) {
    case "fade":
    case "crossDissolve":
      return `xfade=transition=fade:duration=${duration}`;

    case "dipBlack":
      return `xfade=transition=fadeblack:duration=${duration}`;

    case "slide":
      return `xfade=transition=slideleft:duration=${duration}`;

    case "zoom":
      return `xfade=transition=zoom:duration=${duration}`;

    case "blur":
      return `xfade=transition=radial:duration=${duration}`;

    case "glitch":
      return `xfade=transition=glitch:duration=${duration}`;

    case "filmBurn":
      return `xfade=transition=fadewhite:duration=${duration}`;

    default:
      return `xfade=transition=fade:duration=${duration}`;
  }
}
