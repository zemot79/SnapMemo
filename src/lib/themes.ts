export interface ColorTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  gradient?: string;
}

export const themes: ColorTheme[] = [
  {
    id: "classic",
    name: "Classic Neutral",
    description: "Timeless, professional, elegant",
    colors: {
      primary: "#d4af37",
      secondary: "#8b7355",
      accent: "#f5f5dc",
      text: "#2c2c2c",
      background: "#fafafa",
    },
  },
  {
    id: "dopamine",
    name: "Dopamine Brights",
    description: "Joyful, vibrant, mood-boosting",
    colors: {
      primary: "#ff6b9d",
      secondary: "#ffd93d",
      accent: "#6bcf7f",
      text: "#1a1a1a",
      background: "#ffffff",
    },
    gradient: "linear-gradient(135deg, #ff6b9d 0%, #ffd93d 50%, #6bcf7f 100%)",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    description: "Futuristic, edgy, high-energy",
    colors: {
      primary: "#ff006e",
      secondary: "#8338ec",
      accent: "#00f5ff",
      text: "#ffffff",
      background: "#0a0e27",
    },
    gradient: "linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #00f5ff 100%)",
  },
  {
    id: "earth",
    name: "Earth & Sage",
    description: "Organic, grounded, peaceful",
    colors: {
      primary: "#6b8e23",
      secondary: "#8b7355",
      accent: "#d2b48c",
      text: "#2c2c2c",
      background: "#f5f5f0",
    },
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    description: "Professional, trustworthy, deep",
    colors: {
      primary: "#0a2463",
      secondary: "#3e92cc",
      accent: "#65c3ba",
      text: "#ffffff",
      background: "#1e3d59",
    },
    gradient: "linear-gradient(135deg, #0a2463 0%, #3e92cc 50%, #65c3ba 100%)",
  },
  {
    id: "sunset",
    name: "Sunset Gradient",
    description: "Warm, optimistic, creative",
    colors: {
      primary: "#ff6b6b",
      secondary: "#ff8e53",
      accent: "#ffd93d",
      text: "#2c2c2c",
      background: "#fff5f0",
    },
    gradient: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ffd93d 100%)",
  },
];

export const getThemeById = (id: string): ColorTheme => {
  return themes.find((t) => t.id === id) || themes[0];
};
