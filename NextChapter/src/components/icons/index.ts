export { Icon } from './Icon';
export type { IconName, IconProps } from './Icon';

export { ExtendedIcon } from './IconExtended';
export type { ExtendedIconName, ExtendedIconProps } from './IconExtended';

export { IconShowcase } from './IconShowcase';

// Re-export all icon names for convenience
export type AllIconNames = import('./Icon').IconName | import('./IconExtended').ExtendedIconName;