import { useState, useEffect, useCallback, useRef } from 'react';
import { RARITIES, Rarity } from '@/src/constants/rarities';

export type AmuletType = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Supreme';
export type PassiveType = 'Jackpot Rush' | 'Coin Shower' | 'EXP Power' | 'Machine Learning' | 'Standard Deviation' | 'Burning Dice';

export interface AmuletStat {
  type: 'coin' | 'speed' | 'jackpotProb' | 'jackpotPower' | 'exp';
  value: number;
}

export interface AmuletPassive {
  type: PassiveType;
  value1: number;
  value2: number;
}

export interface Amulet {
  id: string;
  type: AmuletType;
  luckMultiplier: number;
  stats: AmuletStat[];
  passives: AmuletPassive[];
}

export interface ActiveBuff {
  type: PassiveType | 'EXP Blessing' | 'Burning' | 'Curse of Ash';
  expiry: number;
  value1: number;
  value2: number;
  stacks?: number;
  accumulated?: number;
}

export interface GameState {
  rolls: number;
  coins: number;
  luck: number;
  inventory: Record<string, number>;
  bestRoll: string | null;
  rarestAura: string | null;
  lastRollTime: number;
  equippedAura: string | null;
  rollHistory: string[];
  luckyCloverCount: number;
  quickPulseCount: number;
  jackpotProbLevel: number;
  jackpotPowerLevel: number;
  synthesizerUnlocked: boolean;
  lastRollStatus: { isJackpot: boolean } | null;
  level: number;
  exp: number;
  amulet: Amulet | null;
  jackpotCount: number;
  rollCountForBuff: number;
  burningDiceCounter: number;
  activeBuffs: ActiveBuff[];
  passiveCooldowns: Record<string, number>;
  stdDevMultiplier: number;
  autoRoll: boolean;
}

const INITIAL_STATE: GameState = {
  rolls: 0,
  coins: 0,
  luck: 1,
  inventory: {},
  bestRoll: null,
  rarestAura: null,
  lastRollTime: 0,
  equippedAura: null,
  rollHistory: [],
  luckyCloverCount: 0,
  quickPulseCount: 0,
  jackpotProbLevel: 0,
  jackpotPowerLevel: 0,
  synthesizerUnlocked: false,
  lastRollStatus: null,
  level: 1,
  exp: 0,
  amulet: null,
  jackpotCount: 0,
  rollCountForBuff: 0,
  burningDiceCounter: 0,
  activeBuffs: [],
  passiveCooldowns: {},
  stdDevMultiplier: 1,
  autoRoll: false,
};

const BASE_COOLDOWN = 800; // 0.8 seconds
export const QUICK_PULSE_PRICES = [10, 100, 1000, 10000, 100000];

export function useGame() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('rng-game-state-v11');
    if (saved) return JSON.parse(saved);
    return INITIAL_STATE;
  });

  const [currentRoll, setCurrentRoll] = useState<Rarity | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  const isRollingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('rng-game-state-v11', JSON.stringify(state));
  }, [state]);

  // Calculate active amulet stats
  let amuletLuck = 1;
  let amuletCoin = 1;
  let amuletSpeed = 0;
  let amuletJackpotProb = 0;
  let amuletJackpotPower = 0;
  let amuletExp = 1;
  let hasMachineLearning = false;

  if (state.amulet) {
    amuletLuck = state.amulet.luckMultiplier;
    state.amulet.stats.forEach(s => {
      if (s.type === 'coin') amuletCoin += (s.value - 1);
      if (s.type === 'speed') amuletSpeed += s.value;
      if (s.type === 'jackpotProb') amuletJackpotProb += s.value;
      if (s.type === 'jackpotPower') amuletJackpotPower += s.value;
      if (s.type === 'exp') amuletExp += s.value;
    });
    state.amulet.passives.forEach(p => {
      if (p.type === 'Machine Learning') hasMachineLearning = true;
      if (p.type === 'Jackpot Rush') {
        amuletJackpotProb += p.value1;
        amuletJackpotPower += p.value2;
      }
      if (p.type === 'Coin Shower') {
        amuletCoin *= p.value1;
      }
      if (p.type === 'EXP Power') {
        amuletExp *= p.value1;
        amuletLuck *= p.value2;
      }
      if (p.type === 'Burning Dice') {
        amuletSpeed -= p.value1;
      }
    });
  }

  const now = Date.now();
  let buffJackpotProb = 0;
  let buffJackpotPower = 0;
  let buffCoinMult = 1;
  let buffSpeedRed = 0;
  let buffExpMult = 1;
  let buffLuckMult = 1;
  let buffAuraAmount = 1;

  state.activeBuffs.forEach(b => {
    if (b.expiry > now) {
      if (b.type === 'Jackpot Rush') {
        const scale = 1 + (b.accumulated || 0) * 0.1;
        buffJackpotProb += b.value1 * scale;
        buffJackpotPower += b.value2 * scale;
      } else if (b.type === 'Coin Shower') {
        const scale = 1 + Math.log10(1 + (b.accumulated || 0)) * 0.5;
        buffCoinMult *= (1 + (b.value1 - 1) * scale);
        buffSpeedRed += b.value2 * scale;
      } else if (b.type === 'EXP Power') {
        const scale = 1 + Math.log10(1 + (b.accumulated || 0)) * 0.2;
        buffExpMult *= (1 + (b.value1 - 1) * scale);
        buffLuckMult *= (1 + (b.value2 - 1) * scale);
      } else if (b.type === 'EXP Blessing') {
        buffExpMult *= b.value1;
        buffLuckMult *= b.value2;
      } else if (b.type === 'Burning') {
        const scale = 1 + (b.accumulated || 0) * 0.02;
        buffSpeedRed += b.value1 * scale;
        buffAuraAmount = Math.max(buffAuraAmount, Math.floor(b.value2 * scale));
      } else if (b.type === 'Curse of Ash') {
        buffSpeedRed -= b.value1; // Negative speed reduction = slower
        buffAuraAmount = Math.max(buffAuraAmount, b.value2);
      }
    }
  });

  const baseWithUpgrade = BASE_COOLDOWN - (state.quickPulseCount * 80);
  const actualCooldown = baseWithUpgrade * Math.max(0.1, (1 - (amuletSpeed + buffSpeedRed)));

  // Cooldown timer & Buff expiry
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      
      setState(prev => {
        let changed = false;
        const newCooldowns = { ...prev.passiveCooldowns };
        
        const newBuffs = prev.activeBuffs;

        const elapsed = now - prev.lastRollTime;
        const remaining = Math.max(0, actualCooldown - elapsed);
        setCooldownRemaining(remaining);

        if (changed) return { ...prev, activeBuffs: newBuffs, passiveCooldowns: newCooldowns };
        return prev;
      });

    }, 50);
    return () => clearInterval(timer);
  }, [actualCooldown]);

  const roll = useCallback(() => {
    if (isRollingRef.current) return;
    const now = Date.now();
    
    if (now - state.lastRollTime < actualCooldown) return;

    isRollingRef.current = true;
    setIsRolling(true);
    
    setTimeout(() => {
      const rollValue = Math.random();
      let selectedRarity = RARITIES[0];

      let newStdDev = state.stdDevMultiplier;
      if (state.amulet?.passives.some(p => p.type === 'Standard Deviation')) {
        if (Math.random() < 0.48) newStdDev *= 0.99;
        else newStdDev *= 1.01;
      }

      // Base Jackpot: 1% prob, 200% (2.0) power
      const jackpotProb = 0.01 + (state.jackpotProbLevel * 0.01) + amuletJackpotProb + buffJackpotProb;
      const isJackpot = Math.random() < jackpotProb;
      const jackpotPower = 2.0 + (state.jackpotPowerLevel * 0.1) + amuletJackpotPower + buffJackpotPower;
      
      // Jackpot applies Jackpot Power / 2 as Luck Multiplier
      const jackpotLuckBonus = isJackpot ? (jackpotPower / 2) : 1;
      const totalLuck = state.luck * amuletLuck * buffLuckMult * newStdDev * jackpotLuckBonus;

      for (let i = RARITIES.length - 1; i >= 0; i--) {
        const rarity = RARITIES[i];
        let probability = (1 / rarity.chance) * totalLuck;

        if (rollValue < probability) {
          selectedRarity = rarity;
          break;
        }
      }
      
      const coinMultiplier = isJackpot ? jackpotPower : 1;

      const selectedIndex = RARITIES.findIndex(r => r.name === selectedRarity.name);
      let trueBaseProb = 0;
      let trueLuckProb = 0;
      let probNotCaughtYetBase = 1;
      let probNotCaughtYetLuck = 1;

      for (let i = RARITIES.length - 1; i >= 0; i--) {
        const rarity = RARITIES[i];
        const pBase = Math.min(1, 1 / rarity.chance);
        const pLuck = Math.min(1, (1 / rarity.chance) * totalLuck);
        
        if (i === selectedIndex) {
          trueBaseProb = i === 0 ? probNotCaughtYetBase : probNotCaughtYetBase * pBase;
          trueLuckProb = i === 0 ? probNotCaughtYetLuck : probNotCaughtYetLuck * pLuck;
          break;
        }

        probNotCaughtYetBase *= (1 - pBase);
        probNotCaughtYetLuck *= (1 - pLuck);
      }

      setCurrentRoll({
        ...selectedRarity,
        baseProb: trueBaseProb * 100,
        luckProb: trueLuckProb * 100
      });
      setIsRolling(false);
      isRollingRef.current = false;

      setState(prev => {
        const newInventory = { ...prev.inventory };
        const amountToGive = Math.floor(buffAuraAmount);
        newInventory[selectedRarity.name] = (newInventory[selectedRarity.name] || 0) + amountToGive;

        const currentBestIndex = RARITIES.findIndex(r => r.name === prev.bestRoll);
        const newRollIndex = RARITIES.findIndex(r => r.name === selectedRarity.name);
        
        const currentRarestIndex = RARITIES.findIndex(r => r.name === prev.rarestAura);
        const newRarestAura = newRollIndex > currentRarestIndex ? selectedRarity.name : prev.rarestAura;

        const baseExp = Math.max(10, Math.floor(selectedRarity.coinValue / 5));
        const expGain = baseExp * amuletExp * buffExpMult;
        
        const earnedCoins = Math.floor(selectedRarity.coinValue * coinMultiplier * amuletCoin * buffCoinMult);

        let newJackpotCount = prev.jackpotCount;
        let newRollCount = prev.rollCountForBuff + 1;
        let newBurningCounter = prev.burningDiceCounter + 1;
        const newBuffs = [...prev.activeBuffs];

        if (isJackpot) {
          newJackpotCount++;
        }

        if (prev.amulet?.passives.some(p => p.type === 'Burning Dice') && Math.random() < 0.5) {
          buffAuraAmount *= 2;
        }

        let newExp = prev.exp;
        let newLevel = prev.level;
        
        {
          newExp += expGain;
          let expReq = 100 * newLevel;
          while (newExp >= expReq && newLevel < 100) {
            newExp -= expReq;
            newLevel++;
            expReq = 100 * newLevel;
          }
          if (newLevel >= 100) {
            newLevel = 100;
            newExp = 0;
          }
        }

        return {
          ...prev,
          rolls: prev.rolls + 1,
          coins: prev.coins + earnedCoins,
          inventory: newInventory,
          bestRoll: newRollIndex > currentBestIndex ? selectedRarity.name : prev.bestRoll,
          rarestAura: newRarestAura || RARITIES[0].name,
          lastRollTime: Date.now(),
          rollHistory: [selectedRarity.name, ...prev.rollHistory].slice(0, 8),
          lastRollStatus: { isJackpot },
          level: newLevel,
          exp: newExp,
          jackpotCount: newJackpotCount,
          rollCountForBuff: newRollCount,
          burningDiceCounter: newBurningCounter,
          activeBuffs: newBuffs,
          stdDevMultiplier: newStdDev,
        };
      });
    }, 10);
  }, [state.luck, state.lastRollTime, actualCooldown, state.jackpotProbLevel, state.jackpotPowerLevel, amuletLuck, amuletCoin, amuletJackpotProb, amuletJackpotPower, amuletExp, buffJackpotProb, buffJackpotPower, buffCoinMult, buffExpMult, buffLuckMult, buffAuraAmount, state.stdDevMultiplier, state.amulet]);

  // Auto Roll Loop
  const rollRef = useRef(roll);
  useEffect(() => {
    rollRef.current = roll;
  }, [roll]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;

    const loop = () => {
      if (!isActive) return;
      if (state.autoRoll && hasMachineLearning) {
        rollRef.current();
        timeoutId = setTimeout(loop, actualCooldown + 50);
      }
    };

    if (state.autoRoll && hasMachineLearning) {
      timeoutId = setTimeout(loop, 50);
    }

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [state.autoRoll, hasMachineLearning, actualCooldown]);

  const toggleAutoRoll = useCallback(() => {
    if (hasMachineLearning) {
      setState(prev => ({ ...prev, autoRoll: !prev.autoRoll }));
    }
  }, [hasMachineLearning]);

  const equipAura = useCallback((auraName: string) => {
    setState(prev => ({ ...prev, equippedAura: auraName }));
  }, []);

  const synthesize = useCallback((rarityIndex: number, max: boolean = false) => {
    if (rarityIndex >= RARITIES.length - 1) return false;
    const currentRarity = RARITIES[rarityIndex];
    const nextRarity = RARITIES[rarityIndex + 1];
    
    let success = false;
    setState(prev => {
      const count = prev.inventory[currentRarity.name] || 0;
      if (count >= 5) {
        const crafts = max ? Math.floor(count / 5) : 1;
        const newInventory = { ...prev.inventory };
        newInventory[currentRarity.name] -= crafts * 5;
        newInventory[nextRarity.name] = (newInventory[nextRarity.name] || 0) + crafts;
        success = true;
        return { ...prev, inventory: newInventory };
      }
      return prev;
    });
    return success;
  }, []);

  const buyUpgrade = useCallback((cost: number, type: 'luck' | 'cooldown' | 'jackpotProb' | 'jackpotPower' | 'synthesizer', value: number, count: number = 1) => {
    if (state.coins >= cost) {
      setState(prev => {
        if (type === 'luck') {
          const maxLevel = prev.level * 500;
          if (prev.luckyCloverCount >= maxLevel) return prev;
          const actualCount = Math.min(count, maxLevel - prev.luckyCloverCount);
          const actualValue = (value / count) * actualCount;
          return { ...prev, coins: prev.coins - cost, luck: prev.luck + actualValue, luckyCloverCount: prev.luckyCloverCount + actualCount };
        } else if (type === 'cooldown') {
          if (prev.quickPulseCount >= 5) return prev;
          return { ...prev, coins: prev.coins - cost, quickPulseCount: prev.quickPulseCount + 1 };
        } else if (type === 'jackpotProb') {
          return { ...prev, coins: prev.coins - cost, jackpotProbLevel: prev.jackpotProbLevel + count };
        } else if (type === 'jackpotPower') {
          return { ...prev, coins: prev.coins - cost, jackpotPowerLevel: prev.jackpotPowerLevel + count };
        } else if (type === 'synthesizer') {
          return { ...prev, coins: prev.coins - cost, synthesizerUnlocked: true };
        }
        return prev;
      });
      return true;
    }
    return false;
  }, [state.coins]);

  const generateAmulet = useCallback((type: AmuletType): Amulet => {
    const id = Math.random().toString(36).substr(2, 9);
    let luckMultiplier = 1;
    let numStats = 0;
    let passives: AmuletPassive[] = [];

    if (type === 'Bronze') {
      luckMultiplier = 1.25;
      numStats = Math.random() < 0.8 ? 1 : 2;
    } else if (type === 'Silver') {
      luckMultiplier = 1.5;
      const r = Math.random();
      if (r < 0.2) numStats = 1;
      else if (r < 0.8) numStats = 2;
      else numStats = 3;
    } else if (type === 'Gold') {
      luckMultiplier = 1.75;
      const r = Math.random();
      if (r < 0.15) numStats = 2;
      else if (r < 0.65) numStats = 3;
      else numStats = 4;
    } else if (type === 'Diamond') {
      luckMultiplier = 2.0;
      numStats = Math.random() < 0.7 ? 3 : 4;
      
      const r = Math.random();
      if (r < 0.005) {
        passives.push({ type: 'Jackpot Rush', value1: 0.05 + Math.random() * 0.05, value2: 0.5 + Math.random() * 1.5 });
      } else if (r < 0.01) {
        passives.push({ type: 'Coin Shower', value1: 2 + Math.random() * 2, value2: 0.05 + Math.random() * 0.15 });
      }
    } else if (type === 'Supreme' || type === 'GrandSupreme') {
      luckMultiplier = 2.5;
      numStats = Math.random() < 0.7 ? 3 : 4;
      
      const passivePool: PassiveType[] = ['Jackpot Rush', 'Coin Shower', 'EXP Power', 'Machine Learning', 'Standard Deviation', 'Burning Dice'];
      
      const getPassive = (pType: PassiveType): AmuletPassive => {
        switch(pType) {
          case 'Jackpot Rush': return { type: pType, value1: 0.05, value2: 0.5 };
          case 'Coin Shower': return { type: pType, value1: 1.5, value2: 0 };
          case 'EXP Power': return { type: pType, value1: 2, value2: 1.2 };
          case 'Machine Learning': return { type: pType, value1: 0, value2: 0 };
          case 'Standard Deviation': return { type: pType, value1: 0, value2: 0 };
          case 'Burning Dice': return { type: pType, value1: 0.1, value2: 2 };
        }
      };

      const firstPassive = passivePool[Math.floor(Math.random() * passivePool.length)];
      passives.push(getPassive(firstPassive));

      if (type === 'GrandSupreme') {
        let secondPassive = passivePool[Math.floor(Math.random() * passivePool.length)];
        while (secondPassive === firstPassive) {
          secondPassive = passivePool[Math.floor(Math.random() * passivePool.length)];
        }
        passives.push(getPassive(secondPassive));
      }
    }

    const availableStats: AmuletStat['type'][] = ['coin', 'speed', 'jackpotProb', 'jackpotPower', 'exp'];
    const pickedStats = availableStats.sort(() => 0.5 - Math.random()).slice(0, numStats);

    const stats: AmuletStat[] = pickedStats.map(statType => {
      let value = 0;
      switch (statType) {
        case 'coin': value = 1.05 + Math.random() * 0.10; break;
        case 'speed': 
          if (type === 'Supreme') value = 0.03 + Math.random() * 0.09;
          else value = 0.03 + Math.random() * 0.07;
          break;
        case 'jackpotProb': 
          if (type === 'Supreme') value = 0.01 + Math.random() * 0.06;
          else value = 0.01 + Math.random() * 0.04;
          break;
        case 'jackpotPower': 
          if (type === 'Supreme') value = 0.05 + Math.random() * 0.15;
          else value = 0.05 + Math.random() * 0.10;
          break;
        case 'exp': 
          if (type === 'Supreme') value = 0.15 + Math.random() * 0.55;
          else value = 0.15 + Math.random() * 0.35;
          break;
      }
      return { type: statType, value };
    });

    return { id, type, luckMultiplier, stats, passives };
  }, []);

  const setAmulet = useCallback((amulet: Amulet | null) => {
    setState(prev => ({ ...prev, amulet }));
  }, []);

  const payCoins = useCallback((amount: number) => {
    let success = false;
    setState(prev => {
      if (prev.coins >= amount) {
        success = true;
        return { ...prev, coins: prev.coins - amount };
      }
      return prev;
    });
    return success;
  }, []);

  return {
    state,
    currentRoll,
    isRolling,
    cooldownRemaining,
    actualCooldown,
    roll,
    buyUpgrade,
    equipAura,
    synthesize,
    generateAmulet,
    setAmulet,
    payCoins,
    toggleAutoRoll,
    hasMachineLearning,
    amuletStats: {
      luck: amuletLuck,
      coin: amuletCoin,
      speed: amuletSpeed,
      jackpotProb: amuletJackpotProb,
      jackpotPower: amuletJackpotPower,
      exp: amuletExp
    },
    buffStats: {
      jackpotProb: buffJackpotProb,
      jackpotPower: buffJackpotPower,
      coinMult: buffCoinMult,
      speedRed: buffSpeedRed,
      expMult: buffExpMult,
      luckMult: buffLuckMult,
      auraAmount: buffAuraAmount
    }
  };
}
