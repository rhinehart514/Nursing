export enum GameStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  ERROR = 'ERROR'
}

export enum VitalsCondition {
  STABLE = 'STABLE',
  DETERIORATING = 'DETERIORATING',
  CRITICAL = 'CRITICAL',
  FLATLINE = 'FLATLINE'
}

export enum VisualState {
  NORMAL = 'NORMAL',
  PALE = 'PALE', // Shock, Anemia
  FLUSHED = 'FLUSHED', // Fever, Sepsis start
  CYANOTIC = 'CYANOTIC', // Hypoxia
  SWEATING = 'SWEATING', // MI, Hypoglycemia
  UNCONSCIOUS = 'UNCONSCIOUS'
}

export interface VitalSigns {
  heartRate: number;
  bpSystolic: number;
  bpDiastolic: number;
  spo2: number;
  respRate: number;
  temperature: number;
  condition: VitalsCondition;
}

export interface BowtieOptions {
  potentialConditions: string[]; // Center of bowtie (Select 1)
  potentialActions: string[];    // Left side (Select 2)
  potentialMonitoring: string[]; // Right side (Select 2)
}

export interface GameTurnResponse {
  narrative: string;
  feedback: string;
  question: string; // Instructions for the bowtie
  vitalSigns: VitalSigns;
  visualState: VisualState; 
  patientHealth: number;
  isGameOver: boolean;
  isVictory: boolean;
  learningReport?: string[];
  bowtie?: BowtieOptions; // New field for NGN Bowtie questions
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'system' | 'ai';
  text: string;
  timestamp: number;
}