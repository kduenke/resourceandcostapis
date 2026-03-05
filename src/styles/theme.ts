export const colors = {
  primary: {
    electricBlue: '#1A00E2',
    energyBlue: '#0000B3',
  },
  secondary: {
    deepBlue: '#000085',
    navyBlue: '#0D0061',
    pureWhite: '#FFFFFF',
    lightGray2: '#FAFAFA',
    lightGray: '#D9D9D6',
  },
  tertiary: {
    turquoise: '#00BBC3',
    brightIndigo: '#5D52EC',
    blue: '#0078D4',
    lavender: '#AAC0F6',
    mint: '#CFF3E8',
    fuschia: '#D12ACA',
    skyBlue: '#00FFFF',
    plum: '#590055',
  },
  accent: {
    lightGreen: '#D4EC8E',
    lightYellow: '#FFE399',
    lightOrange: '#FFA38B',
    lightMagenta: '#D59ED7',
  },
} as const;

export const httpMethodColors: Record<string, { bg: string; text: string }> = {
  GET: { bg: '#D4EC8E', text: '#1a1a1a' },
  POST: { bg: '#AAC0F6', text: '#0D0061' },
  PUT: { bg: '#FFE399', text: '#1a1a1a' },
  PATCH: { bg: '#FFA38B', text: '#1a1a1a' },
  DELETE: { bg: '#D59ED7', text: '#590055' },
};
