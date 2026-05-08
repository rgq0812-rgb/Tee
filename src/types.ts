export type AppPath = 'player' | 'student' | 'pro';
export type Mode = 'strat' | 'mage' | 'pred' | 'clock';
export type GameMode = 'STROKE' | 'STABLEFORD' | 'MATCHPLAY';
export type Tab = 'dashboard' | 'map' | 'cam' | 'challenges' | 'scorecard' | 'circle' | 'settings' | 'chat';

export interface HoleScore {
  hole: number;
  par: number;
  strokes: number;
  putts: number;
  fairwayHit: boolean | null;
  gir: boolean | null;
  timestamp: number;
}

export interface Club {
  id: string;
  name: string;
  type: 'wood' | 'iron' | 'hybrid' | 'wedge' | 'putter';
  dist: number;
}

export interface GpsCoord {
  lat: number;
  lng: number;
}

export interface GreenZones {
  front: GpsCoord;
  middle: GpsCoord;
  back: GpsCoord;
}

export interface Hole {
  number: number;
  name: string;
  par: number;
  handicap: number;
  distanceTee: {
    black?: number;
    white?: number;
    yellow?: number;
    blue?: number;
    red?: number;
    ladies?: number; // Legacy support
  };
  teeBox: GpsCoord;
  green: GreenZones;
  layout?: 'straight' | 'left' | 'right';
  customImage?: string; // Base64 or URL
  hazards?: string[];
  description?: string;
  tip?: string;
}

export interface Course {
  id: string;
  name: string;
  subtitle?: string;
  location: string;
  city?: string;
  par: number;
  totalDistance: {
    black?: number;
    white?: number;
    yellow?: number;
    blue?: number;
    red?: number;
    ladies?: number; // Legacy support
  };
  rating: {
    slope: number;
    cr: number;
  };
  holes: Hole[];
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  target: number;
  caddie: string;
  reward: string;
}

export interface Caddie {
  id: string;
  name: string;
  title: string;
  zone: 'front' | 'middle' | 'back';
  color: string;
  voice: string;
  personality: string;
}
