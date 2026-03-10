import { useEffect, useState } from "react";

const WAVES = [
  { radius: 2000, duration: 2 }, 
  { radius: 3000, duration: 2 }, 
  { radius: 5000, duration: 1 }, 
];


export const useSearchWaves = () => {
  const [waveIndex, setWaveIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWaveIndex((prev) => (prev + 1) % WAVES.length);
    }, WAVES[waveIndex].duration * 1000);

    return () => clearTimeout(timer);
  }, [waveIndex]);

  return WAVES[waveIndex];
};