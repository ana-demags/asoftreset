export type PaletteName = 'stone' | 'mist' | 'dew' | 'tide' | 'haze';

export interface Palette {
  name: PaletteName;
  label: string;
  background: string;
  stroke: string;
  colors: [string, string, string, string, string, string];
}

export const palettes: Record<PaletteName, Palette> = {
  stone: {
    name: 'stone',
    label: 'stone',
    background: '#f2efe8',
    stroke: '#4a4540',
    colors: ['#a89888', '#8b7d6e', '#c4b8a8', '#9a8b78', '#b5a090', '#d4c8b8'],
  },
  mist: {
    name: 'mist',
    label: 'mist',
    background: '#edf2f6',
    stroke: '#3a5068',
    colors: ['#6c90a8', '#4a6e8c', '#a4bfcc', '#5878a0', '#8caab8', '#c4d4de'],
  },
  dew: {
    name: 'dew',
    label: 'dew',
    background: '#f0f4f0',
    stroke: '#3d5045',
    colors: ['#7a9a88', '#5c7a6a', '#9ab5a4', '#6a8a7a', '#8aaa98', '#b8c8bc'],
  },
  tide: {
    name: 'tide',
    label: 'tide',
    background: '#f2f4f4',
    stroke: '#3d4a4a',
    colors: ['#7a9696', '#5e8282', '#9ab0b0', '#6a8a8a', '#8aa0a0', '#b8c8c8'],
  },
  haze: {
    name: 'haze',
    label: 'haze',
    background: '#f0eef4',
    stroke: '#4c4858',
    colors: ['#a89cb8', '#8c80a0', '#c4bcd4', '#9488a8', '#b4a8c4', '#d8d4e0'],
  },
};

export const paletteOrder: PaletteName[] = ['stone', 'mist', 'dew', 'tide', 'haze'];
