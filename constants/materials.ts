export interface SurfaceMaterial {
  id: string;
  label: string;
  uvReflectance: number;
}

export const SURFACE_MATERIALS: SurfaceMaterial[] = [
  { id: 'default', label: 'Default (No Reflection)', uvReflectance: 0 },
  { id: 'white-paint', label: 'White Paint', uvReflectance: 0.10 },
  { id: 'light-concrete', label: 'Light Concrete', uvReflectance: 0.15 },
  { id: 'dark-surface', label: 'Dark / Black Surface', uvReflectance: 0.03 },
  { id: 'concrete', label: 'Raw Concrete', uvReflectance: 0.12 },
  { id: 'wood', label: 'Wood Paneling', uvReflectance: 0.06 },
  { id: 'mirror', label: 'Mirror / Metallic', uvReflectance: 0.70 },
  { id: 'tile', label: 'Glazed Tile', uvReflectance: 0.08 },
];
