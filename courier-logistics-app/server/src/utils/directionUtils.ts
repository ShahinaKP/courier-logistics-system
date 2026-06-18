/**
 * Direction map — given current hub and destination hub, returns
 * the direction a bag should travel.
 *
 * Logical layout:
 *         RG-N
 *          |
 *         RG-C
 *        /    \
 *    RG-W      RG-E
 *        \    /
 *         RG-S
 */
const DIRECTION_MAP: Record<string, Record<string, string>> = {
  "RG-N": {
    "RG-S": "south",
    "RG-E": "east",
    "RG-W": "west",
    "RG-C": "south",
  },
  "RG-S": {
    "RG-N": "north",
    "RG-E": "east",
    "RG-W": "west",
    "RG-C": "north",
  },
  "RG-E": {
    "RG-N": "north",
    "RG-S": "south",
    "RG-W": "west",
    "RG-C": "west",
  },
  "RG-W": {
    "RG-N": "north",
    "RG-S": "south",
    "RG-E": "east",
    "RG-C": "east",
  },
  "RG-C": {
    "RG-N": "north",
    "RG-S": "south",
    "RG-E": "east",
    "RG-W": "west",
  },
};

/**
 * Returns the direction a package should travel from `fromRegionCode`
 * towards `toRegionCode`.
 * Returns "central" if same region (local delivery).
 */
export const getDirection = (
  fromRegionCode: string,
  toRegionCode: string,
): string => {
  if (fromRegionCode === toRegionCode) return "central";
  return DIRECTION_MAP[fromRegionCode]?.[toRegionCode] ?? "central";
};
