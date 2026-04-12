import { createTheme, MantineColorsTuple } from '@mantine/core';

const brand: MantineColorsTuple = [
  '#f1f5f9', // 0: Background/Surface (f7fafc approximated)
  '#e2e8f0', // 1: Surface Variant
  '#cbd5e1', // 2: Outline Variant
  '#94a3b8', // 3: Outline
  '#64748b', // 4: Secondary
  '#455f88', // 5: PRIMARY (the base color)
  '#39537c', // 6: Primary Dim
  '#254067', // 7: On Primary Fixed
  '#1e293b', // 8: On Surface
  '#0f172a', // 9: Inverse Surface
];

export const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand,
  },
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Manrope, sans-serif',
  },
  defaultRadius: 'md',
  // Add other theme configurations here
});
