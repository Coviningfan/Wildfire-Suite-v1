export interface RoomPreset {
  id: string;
  label: string;
  width: number;
  depth: number;
  ceiling: number;
  suggestedFixtures: number;
}

export const ROOM_PRESETS: RoomPreset[] = [
  { id: 'custom', label: 'Custom', width: 0, depth: 0, ceiling: 0, suggestedFixtures: 0 },
  { id: 'small-theater', label: 'Small Theater Stage', width: 12, depth: 8, ceiling: 6, suggestedFixtures: 4 },
  { id: 'large-theater', label: 'Large Theater Stage', width: 18, depth: 12, ceiling: 8, suggestedFixtures: 8 },
  { id: 'nightclub', label: 'Nightclub / Bar', width: 10, depth: 8, ceiling: 3, suggestedFixtures: 6 },
  { id: 'escape-room', label: 'Escape Room', width: 5, depth: 4, ceiling: 2.7, suggestedFixtures: 2 },
  { id: 'haunted-corridor', label: 'Haunted House Corridor', width: 8, depth: 2.5, ceiling: 2.7, suggestedFixtures: 3 },
  { id: 'gallery', label: 'Gallery / Exhibition', width: 15, depth: 10, ceiling: 4, suggestedFixtures: 6 },
  { id: 'studio', label: 'Production Studio', width: 8, depth: 6, ceiling: 3.5, suggestedFixtures: 4 },
];
