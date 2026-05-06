export type PredefinedSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type BreakpointSize = PredefinedSize;

// The underscore is used to represent the default value.
export type BreakpointRule = '_' | BreakpointSize;

type BreakpointMap = [string, string, string, string, string, string] & {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
};

const breakpoints = ['475px', '640px', '768px', '1024px', '1280px', '1536px'] as BreakpointMap;

Object.assign(breakpoints, {
    xs: breakpoints[0],
    sm: breakpoints[1],
    md: breakpoints[2],
    lg: breakpoints[3],
    xl: breakpoints[4],
    '2xl': breakpoints[5],
});

export {breakpoints};
