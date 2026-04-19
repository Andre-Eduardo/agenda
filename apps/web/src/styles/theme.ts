import { createTheme, type MantineColorsTuple } from '@mantine/core';

// "The Clinical Editorial" — tonal blues/grays from Stitch project 4054613841908875098
// Reference: primary #455f88, primary_dim #39537c, primary_container #d6e3ff
const brand: MantineColorsTuple = [
  '#eff4f7', // 0: surface_container_low
  '#dfeaef', // 1: surface_container_high
  '#d6e3ff', // 2: primary_container
  '#a7b4ba', // 3: outline_variant
  '#707d82', // 4: outline
  '#546166', // 5: on_surface_variant
  '#455f88', // 6: PRIMARY
  '#39537c', // 7: primary_dim
  '#38527b', // 8: on_primary_container
  '#283439', // 9: on_surface
];

// Surface hierarchy (tonal layering — no solid borders for sectioning)
const surface: MantineColorsTuple = [
  '#ffffff', // 0: surface_container_lowest (cards, data modules)
  '#f7fafc', // 1: surface (primary canvas, background)
  '#eff4f7', // 2: surface_container_low (sidebar, nav)
  '#e7eff3', // 3: surface_container
  '#dfeaef', // 4: surface_container_high (overlays)
  '#d7e5eb', // 5: surface_container_highest
  '#ccdde4', // 6: surface_dim
  '#546166', // 7: on_surface_variant
  '#283439', // 8: on_surface
  '#0b0f10', // 9: inverse_surface
];

// Error tokens — sophisticated, not "alarming"
const danger: MantineColorsTuple = [
  '#fff7f7', // 0: on_error
  '#ff8b9a', // 1: error_container
  '#ff8b9a',
  '#9e3f4e', // 3: error
  '#9e3f4e',
  '#9e3f4e',
  '#782232', // 6: on_error_container
  '#4f0116', // 7: error_dim
  '#4f0116',
  '#4f0116',
];

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  colors: {
    brand,
    surface,
    danger,
  },
  white: '#ffffff',
  black: '#283439',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  headings: {
    fontFamily: 'Manrope, Inter, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2.5rem', lineHeight: '1.2', fontWeight: '700' },
      h2: { fontSize: '2rem', lineHeight: '1.25', fontWeight: '700' },
      h3: { fontSize: '1.5rem', lineHeight: '1.3', fontWeight: '600' },
      h4: { fontSize: '1.25rem', lineHeight: '1.35', fontWeight: '600' },
      h5: { fontSize: '1.125rem', lineHeight: '1.4', fontWeight: '600' },
      h6: { fontSize: '1rem', lineHeight: '1.45', fontWeight: '600' },
    },
  },
  defaultRadius: 'md',
  radius: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '10px',
    xl: '16px',
  },
  shadows: {
    xs: '0 1px 2px rgba(40, 52, 57, 0.04)',
    sm: '0 2px 8px rgba(40, 52, 57, 0.04)',
    md: '0 8px 24px rgba(40, 52, 57, 0.06)',
    lg: '0 12px 32px rgba(40, 52, 57, 0.08)',
    xl: '0 20px 48px rgba(40, 52, 57, 0.1)',
  },
});
