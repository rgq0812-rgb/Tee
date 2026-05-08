import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../services/AuthProvider';

export enum GameMode {
  STROKE = 'STROKE',
  STABLEFORD = 'STABLEFORD',
  MATCHPLAY = 'MATCHPLAY'
}

export interface HoleScore {
  hole: number;
  par: number;
  strokes: number;
  putts: number;
  fairwayHit: boolean | null;
  updatedAt: any;
}

export interface Round {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  date: string;
  status: 'in-progress' | 'completed';
  gameMode: GameMode;
  handicap: number;
  totalScore: number;
  totalPutts: number;
  createdAt: any;
  updatedAt: any;
}

const SI_INDEX = [7, 11, 3, 15, 1, 13, 5, 17, 9, 8, 16, 4, 14, 2, 12, 6, 18, 10];

export function useScore() {
  const { user } = useAuth();
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [holes, setHoles] = useState<Record<number, HoleScore>>({});

  // Calculate Stableford points for a hole
  const calculateStableford = (strokes: number, par: number, holeIndex: number, handicap: number) => {
    const extraStrokes = Math.floor(handicap / 18) + (SI_INDEX[holeIndex - 1] <= (handicap % 18) ? 1 : 0);
    const netScore = strokes - extraStrokes;
    const diff = par - netScore;
    
    if (diff <= -2) return 0; // Double bogey net or worse
    if (diff === -1) return 1; // Bogey net
    if (diff === 0) return 2; // Par net
    if (diff === 1) return 3; // Birdie net
    if (diff === 2) return 4; // Eagle net
    if (diff >= 3) return 5; // Albatros net or better
    return 0;
  };

  const saveHoleScore = async (roundId: string, holeData: Omit<HoleScore, 'updatedAt'>) => {
    if (!user) return;
    const path = `rounds/${roundId}/holes/${holeData.hole}`;
    try {
      await setDoc(doc(db, path), {
        ...holeData,
        updatedAt: new Date()
      });
      setHoles(prev => ({ ...prev, [holeData.hole]: { ...holeData, updatedAt: new Date() } }));
      
      // Update round totals
      const allHoles = { ...holes, [holeData.hole]: holeData };
      const totalScore = Object.values(allHoles).reduce((acc: number, h: any) => acc + (h.strokes - h.par), 0);
      const totalPutts = Object.values(allHoles).reduce((acc: number, h: any) => acc + h.putts, 0);
      
      await updateDoc(doc(db, `rounds/${roundId}`), {
        totalScore,
        totalPutts,
        updatedAt: new Date()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return { activeRound, holes, saveHoleScore, calculateStableford };
}
