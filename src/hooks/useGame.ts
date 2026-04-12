import { useState, useEffect, useCallback, useRef } from 'react';
import { RARITIES, Rarity } from '@/src/constants/rarities';
import { MOON_RARITIES } from '@/src/constants/moonRarities';

export type AmuletType = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Supreme' | 'GrandSupreme' | 'Galaxy' | 'Basic Ore' | 'Rare Ore' | 'Epic Ore' | 'Legendary Ore' | 'Mythical Ore';
export type PassiveType = '잭팟 러시' | '코인 샤워' | '경험치 파워' | '머신 러닝' | '표준 편차' | '버닝 다이스' | '은하 팽창' | '광속' | '풍요';

export interface AmuletStat {
  type: 'coin' | 'speed' | 'jackpotProb' | 'jackpotPower' | 'exp' | 'superJackpotProb' | 'superJackpotPower';
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
  type: PassiveType | '경험치 축복' | '버닝' | '재의 저주' | '광속';
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
  lastRollStatus: { isJackpot: boolean; isSuperJackpot?: boolean } | null;
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
  unlockedRegions: string[];
  currentRegion: string;
  spaceCoins: number;
  spaceMaxLevelBonusLevel: number;
  superJackpotProbLevel: number;
  superJackpotPowerLevel: number;
  moonInventory: Record<string, number>;
  fragments: Record<string, number>;
  pickaxeLevel: number;
  processingLevel: number;
  oreLuckLevel: number;
  oreMaxLevelBonusLevel: number;
  oreSuperJackpotProbLevel: number;
  galaxyExpansionStacks: number;
  lightSpeedRollCount: number;
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
  unlockedRegions: ['Earth'],
  currentRegion: 'Earth',
  spaceCoins: 0,
  spaceMaxLevelBonusLevel: 0,
  superJackpotProbLevel: 0,
  superJackpotPowerLevel: 0,
  moonInventory: {},
  fragments: {
    'Basic fragment': 0,
    'Rare fragment': 0,
    'Epic fragment': 0,
    'Legendary fragment': 0,
    'Mythical fragment': 0
  },
  pickaxeLevel: 0,
  processingLevel: 0,
  oreLuckLevel: 0,
  oreMaxLevelBonusLevel: 0,
  oreSuperJackpotProbLevel: 0,
  galaxyExpansionStacks: 0,
  lightSpeedRollCount: 0,
};

const BASE_COOLDOWN = 800; // 0.8 seconds
export const QUICK_PULSE_PRICES = [10, 100, 1000, 10000, 100000];

export function useGame() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('rng-game-state-v14');
    if (saved) return JSON.parse(saved);
    return INITIAL_STATE;
  });

  const [currentRoll, setCurrentRoll] = useState<Rarity | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  const isRollingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('rng-game-state-v14', JSON.stringify(state));
  }, [state]);

  // Calculate active amulet stats
  let amuletLuck = 1;
  let amuletCoin = 1;
  let amuletSpeed = 0;
  let amuletJackpotProb = 0;
  let amuletJackpotPower = 0;
  let amuletSuperJackpotProb = 0;
  let amuletSuperJackpotPower = 0;
  let amuletExp = 1;
  let hasMachineLearning = false;

  if (state.amulet) {
    amuletLuck = state.amulet.luckMultiplier;
    state.amulet.stats.forEach(s => {
      if (s.type === 'coin') amuletCoin += (s.value - 1);
      if (s.type === 'speed') amuletSpeed += s.value;
      if (s.type === 'jackpotProb') amuletJackpotProb += s.value;
      if (s.type === 'jackpotPower') amuletJackpotPower += s.value;
      if (s.type === 'superJackpotProb') amuletSuperJackpotProb += s.value;
      if (s.type === 'superJackpotPower') amuletSuperJackpotPower += s.value;
      if (s.type === 'exp') amuletExp += s.value;
    });
    state.amulet.passives.forEach(p => {
      if (p.type === '머신 러닝') hasMachineLearning = true;
      if (p.type === '잭팟 러시') {
        amuletJackpotProb += p.value1;
        amuletJackpotPower += p.value2;
      }
      if (p.type === '코인 샤워') {
        amuletCoin *= p.value1;
      }
      if (p.type === '경험치 파워') {
        amuletExp *= p.value1;
        amuletLuck *= p.value2;
      }
      if (p.type === '버닝 다이스') {
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
      if (b.type === '잭팟 러시') {
        const scale = 1 + (b.accumulated || 0) * 0.1;
        buffJackpotProb += b.value1 * scale;
        buffJackpotPower += b.value2 * scale;
      } else if (b.type === '코인 샤워') {
        const scale = 1 + Math.log10(1 + (b.accumulated || 0)) * 0.5;
        buffCoinMult *= (1 + (b.value1 - 1) * scale);
        buffSpeedRed += b.value2 * scale;
      } else if (b.type === '경험치 파워') {
        const scale = 1 + Math.log10(1 + (b.accumulated || 0)) * 0.2;
        buffExpMult *= (1 + (b.value1 - 1) * scale);
        buffLuckMult *= (1 + (b.value2 - 1) * scale);
      } else if (b.type === '경험치 축복') {
        buffExpMult *= b.value1;
        buffLuckMult *= b.value2;
      } else if (b.type === '버닝') {
        const scale = 1 + (b.accumulated || 0) * 0.02;
        buffSpeedRed += b.value1 * scale;
        buffAuraAmount = Math.max(buffAuraAmount, Math.floor(b.value2 * scale));
      } else if (b.type === '재의 저주') {
        buffSpeedRed -= b.value1; // Negative speed reduction = slower
        buffAuraAmount = Math.max(buffAuraAmount, b.value2);
      } else if (b.type === '광속') {
        buffSpeedRed += b.value1;
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
      const currentRarities = state.currentRegion === 'Moon' ? MOON_RARITIES : RARITIES;
      let selectedRarity = currentRarities[0];

      let newStdDev = state.stdDevMultiplier;
      if (state.amulet?.passives.some(p => p.type === '표준 편차')) {
        if (Math.random() < 0.48) newStdDev *= 0.99;
        else newStdDev *= 1.01;
      }

      let galaxyExpansionMult = 1;
      if (state.amulet?.passives.some(p => p.type === '은하 팽창')) {
        galaxyExpansionMult = Math.pow(1.0005, state.galaxyExpansionStacks);
      }

      // Base Jackpot: 1% prob, 200% (2.0) power
      const jackpotProb = Math.min(0.8, 0.01 + (state.jackpotProbLevel * 0.01) + amuletJackpotProb + buffJackpotProb);
      const isJackpot = Math.random() < jackpotProb;
      const jackpotPower = Math.min(5.0, 2.0 + (state.jackpotPowerLevel * 0.1) + amuletJackpotPower + buffJackpotPower);
      
      // Super Jackpot: 0.1% base prob, 300% (3.0) base power
      const superJackpotProb = Math.min(0.25, 0.001 + (state.superJackpotProbLevel * 0.005) + amuletSuperJackpotProb + (state.oreSuperJackpotProbLevel * 0.005));
      const isSuperJackpot = Math.random() < superJackpotProb;
      const superJackpotPower = Math.min(5.0, 3.0 + (state.superJackpotPowerLevel * 0.2) + amuletSuperJackpotPower);

      // Jackpot applies Jackpot Power / 2 as Luck Multiplier
      let jackpotLuckBonus = isJackpot ? (jackpotPower / 2) : 1;
      if (isSuperJackpot) {
        jackpotLuckBonus *= (superJackpotPower / 2);
      }
      
      const totalLuck = state.luck * amuletLuck * buffLuckMult * newStdDev * jackpotLuckBonus * galaxyExpansionMult;

      for (let i = currentRarities.length - 1; i >= 0; i--) {
        const rarity = currentRarities[i];
        let probability = (1 / rarity.chance) * totalLuck;

        if (rollValue < probability) {
          selectedRarity = rarity;
          break;
        }
      }
      
      let coinMultiplier = isJackpot ? jackpotPower : 1;
      if (isSuperJackpot) coinMultiplier *= superJackpotPower;

      const selectedIndex = currentRarities.findIndex(r => r.name === selectedRarity.name);
      let trueBaseProb = 0;
      let trueLuckProb = 0;
      let probNotCaughtYetBase = 1;
      let probNotCaughtYetLuck = 1;

      for (let i = currentRarities.length - 1; i >= 0; i--) {
        const rarity = currentRarities[i];
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
        const newMoonInventory = { ...prev.moonInventory };
        const amountToGive = Math.floor(buffAuraAmount);
        
        if (prev.currentRegion === 'Moon') {
          newMoonInventory[selectedRarity.name] = (newMoonInventory[selectedRarity.name] || 0) + amountToGive;
        } else {
          newInventory[selectedRarity.name] = (newInventory[selectedRarity.name] || 0) + amountToGive;
        }

        const currentRarities = prev.currentRegion === 'Moon' ? MOON_RARITIES : RARITIES;
        const currentBestIndex = currentRarities.findIndex(r => r.name === prev.bestRoll);
        const newRollIndex = currentRarities.findIndex(r => r.name === selectedRarity.name);
        
        const currentRarestIndex = currentRarities.findIndex(r => r.name === prev.rarestAura);
        const newRarestAura = newRollIndex > currentRarestIndex ? selectedRarity.name : prev.rarestAura;

        let abundanceMult = 1;
        if (prev.amulet?.passives.some(p => p.type === '풍요')) {
          abundanceMult = 2;
        }

        const baseExp = Math.max(10, Math.floor(selectedRarity.coinValue / 5));
        const expGain = baseExp * amuletExp * buffExpMult * abundanceMult;
        
        let earnedCoins = 0;
        let earnedSpaceCoins = 0;
        if (prev.currentRegion === 'Moon') {
          earnedSpaceCoins = Math.floor(selectedRarity.coinValue * coinMultiplier * amuletCoin * buffCoinMult * abundanceMult);
        } else {
          earnedCoins = Math.floor(selectedRarity.coinValue * coinMultiplier * amuletCoin * buffCoinMult * abundanceMult);
        }

        let newJackpotCount = prev.jackpotCount;
        let newRollCount = prev.rollCountForBuff + 1;
        let newBurningCounter = prev.burningDiceCounter + 1;
        let newGalaxyExpansionStacks = prev.galaxyExpansionStacks + 1;
        let newLightSpeedRollCount = prev.lightSpeedRollCount + 1;
        const newBuffs = [...prev.activeBuffs];
        const newCooldowns = { ...prev.passiveCooldowns };

        if (isJackpot) {
          newJackpotCount++;
        }

        if (prev.amulet?.passives.some(p => p.type === '버닝 다이스') && Math.random() < 0.5) {
          buffAuraAmount *= 2;
        }

        if (prev.amulet?.passives.some(p => p.type === '광속') && newLightSpeedRollCount >= 100) {
          if (!newCooldowns['광속'] || newCooldowns['광속'] <= Date.now()) {
            newBuffs.push({ type: '광속', expiry: Date.now() + 10000, value1: 0.5, value2: 0 });
            newCooldowns['광속'] = Date.now() + 20000;
            newLightSpeedRollCount = 0;
          }
        }

        let newExp = prev.exp;
        let newLevel = prev.level;
        
        const actualMaxLevel = 100 + prev.spaceMaxLevelBonusLevel * 10 + prev.oreMaxLevelBonusLevel * 10;

        {
          newExp += expGain;
          let expReq = 100 * newLevel;
          while (newExp >= expReq && newLevel < actualMaxLevel) {
            newExp -= expReq;
            newLevel++;
            expReq = 100 * newLevel;
          }
          if (newLevel >= actualMaxLevel) {
            newLevel = actualMaxLevel;
            newExp = 0;
          }
        }

        const newUnlockedRegions = [...prev.unlockedRegions];
        if (selectedRarity.name === 'Galactic' && !newUnlockedRegions.includes('Moon')) {
          newUnlockedRegions.push('Moon');
        }
        if (selectedRarity.name === 'Uranium' && prev.currentRegion === 'Moon' && !newUnlockedRegions.includes('Underworld')) {
          newUnlockedRegions.push('Underworld');
        }

        return {
          ...prev,
          rolls: prev.rolls + 1,
          coins: prev.coins + earnedCoins,
          spaceCoins: prev.spaceCoins + earnedSpaceCoins,
          inventory: newInventory,
          moonInventory: newMoonInventory,
          bestRoll: !prev.bestRoll || newRollIndex > currentBestIndex ? selectedRarity.name : prev.bestRoll,
          rarestAura: newRarestAura || currentRarities[0].name,
          lastRollTime: Date.now(),
          rollHistory: [selectedRarity.name, ...prev.rollHistory].slice(0, 8),
          lastRollStatus: { isJackpot, isSuperJackpot },
          level: newLevel,
          exp: newExp,
          jackpotCount: newJackpotCount,
          rollCountForBuff: newRollCount,
          burningDiceCounter: newBurningCounter,
          galaxyExpansionStacks: newGalaxyExpansionStacks,
          lightSpeedRollCount: newLightSpeedRollCount,
          activeBuffs: newBuffs,
          passiveCooldowns: newCooldowns,
          stdDevMultiplier: newStdDev,
          unlockedRegions: newUnlockedRegions
        };
      });
    }, 10);
  }, [state.luck, state.lastRollTime, actualCooldown, state.jackpotProbLevel, state.jackpotPowerLevel, amuletLuck, amuletCoin, amuletJackpotProb, amuletJackpotPower, amuletExp, buffJackpotProb, buffJackpotPower, buffCoinMult, buffExpMult, buffLuckMult, buffAuraAmount, state.stdDevMultiplier, state.amulet, state.currentRegion]);

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

  const resetGame = useCallback(() => {
    if (window.confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setState(INITIAL_STATE);
      localStorage.removeItem('rng-game-state-v14');
      window.location.reload();
    }
  }, []);

  const equipAura = useCallback((auraName: string) => {
    setState(prev => ({ ...prev, equippedAura: auraName }));
  }, []);

  const synthesize = useCallback((rarityIndex: number, max: boolean = false, isMoon: boolean = false) => {
    const currentRarities = isMoon ? MOON_RARITIES : RARITIES;
    if (rarityIndex >= currentRarities.length - 1) return false;
    const currentRarity = currentRarities[rarityIndex];
    const nextRarity = currentRarities[rarityIndex + 1];
    
    let success = false;
    setState(prev => {
      const inventoryKey = isMoon ? 'moonInventory' : 'inventory';
      const count = prev[inventoryKey][currentRarity.name] || 0;
      if (count >= 5) {
        const crafts = max ? Math.floor(count / 5) : 1;
        const newInventory = { ...prev[inventoryKey] };
        newInventory[currentRarity.name] -= crafts * 5;
        newInventory[nextRarity.name] = (newInventory[nextRarity.name] || 0) + crafts;
        success = true;
        return { ...prev, [inventoryKey]: newInventory };
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
          if (prev.jackpotProbLevel >= 79) return prev; // 1% base + 79% upgrade = 80%
          return { ...prev, coins: prev.coins - cost, jackpotProbLevel: prev.jackpotProbLevel + count };
        } else if (type === 'jackpotPower') {
          if (prev.jackpotPowerLevel >= 30) return prev; // 200% base + 300% upgrade = 500%
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

  const buySpaceUpgrade = useCallback((cost: number, type: 'maxLevel' | 'superJackpotProb' | 'superJackpotPower', count: number = 1) => {
    if (state.spaceCoins >= cost) {
      setState(prev => {
        if (type === 'maxLevel') {
          if (prev.spaceMaxLevelBonusLevel >= 100) return prev;
          return { ...prev, spaceCoins: prev.spaceCoins - cost, spaceMaxLevelBonusLevel: prev.spaceMaxLevelBonusLevel + count };
        } else if (type === 'superJackpotProb') {
          if (prev.superJackpotProbLevel >= 40) return prev; // 40 * 0.5% = 20%
          return { ...prev, spaceCoins: prev.spaceCoins - cost, superJackpotProbLevel: prev.superJackpotProbLevel + count };
        } else if (type === 'superJackpotPower') {
          if (prev.superJackpotPowerLevel >= 10) return prev; // 10 * 20% = 200%
          return { ...prev, spaceCoins: prev.spaceCoins - cost, superJackpotPowerLevel: prev.superJackpotPowerLevel + count };
        }
        return prev;
      });
      return true;
    }
    return false;
  }, [state.spaceCoins]);

  const changeRegion = useCallback((region: string) => {
    if (state.unlockedRegions.includes(region)) {
      setState(prev => ({ ...prev, currentRegion: region }));
    }
  }, [state.unlockedRegions]);

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
        passives.push({ type: '잭팟 러시', value1: 0.05 + Math.random() * 0.05, value2: 0.5 + Math.random() * 1.5 });
      } else if (r < 0.01) {
        passives.push({ type: '코인 샤워', value1: 2 + Math.random() * 2, value2: 0.05 + Math.random() * 0.15 });
      }
    } else if (type === 'Supreme' || type === 'GrandSupreme') {
      luckMultiplier = 2.5;
      numStats = Math.random() < 0.7 ? 3 : 4;
      
      const passivePool: PassiveType[] = ['잭팟 러시', '코인 샤워', '경험치 파워', '머신 러닝', '표준 편차', '버닝 다이스'];
      
      const getPassive = (pType: PassiveType): AmuletPassive => {
        switch(pType) {
          case '잭팟 러시': return { type: pType, value1: 0.05, value2: 0.5 };
          case '코인 샤워': return { type: pType, value1: 1.5, value2: 0 };
          case '경험치 파워': return { type: pType, value1: 2, value2: 1.2 };
          case '머신 러닝': return { type: pType, value1: 0, value2: 0 };
          case '표준 편차': return { type: pType, value1: 0, value2: 0 };
          case '버닝 다이스': return { type: pType, value1: 0.1, value2: 2 };
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
    } else if (type === 'Galaxy') {
      luckMultiplier = 3.0;
      numStats = 4;
      passives.push({ type: '머신 러닝', value1: 0, value2: 0 });
      const galaxyPassives: PassiveType[] = ['은하 팽창', '광속', '풍요'];
      const randomPassive = galaxyPassives[Math.floor(Math.random() * galaxyPassives.length)];
      passives.push({ type: randomPassive, value1: 0, value2: 0 });
      
      const availableStats: AmuletStat['type'][] = ['coin', 'speed', 'jackpotProb', 'jackpotPower', 'superJackpotProb', 'superJackpotPower'];
      const pickedStats = availableStats.sort(() => 0.5 - Math.random()).slice(0, numStats);
      const stats: AmuletStat[] = pickedStats.map(statType => {
        let value = 0;
        switch (statType) {
          case 'coin': value = 1.1 + Math.random() * 0.1; break;
          case 'speed': value = 0.05 + Math.random() * 0.07; break;
          case 'jackpotProb': value = 0.05 + Math.random() * 0.07; break;
          case 'jackpotPower': value = 0.40 + Math.random() * 0.45; break;
          case 'superJackpotProb': value = 0.02 + Math.random() * 0.02; break;
          case 'superJackpotPower': value = 0.25 + Math.random() * 0.45; break;
          case 'exp': value = 0; break;
        }
        return { type: statType, value };
      });
      return { id, type, luckMultiplier, stats, passives };
    } else if (type === 'Basic Ore') {
      luckMultiplier = 1.5;
      numStats = 2;
    } else if (type === 'Rare Ore') {
      luckMultiplier = 2.0;
      numStats = 3;
    } else if (type === 'Epic Ore') {
      luckMultiplier = 2.5;
      numStats = 3;
      passives.push({ type: '경험치 파워', value1: 2, value2: 0 });
    } else if (type === 'Legendary Ore') {
      luckMultiplier = 3.0;
      numStats = 4;
      passives.push({ type: '잭팟 러시', value1: 0.1, value2: 1.0 });
    } else if (type === 'Mythical Ore') {
      luckMultiplier = 4.0;
      numStats = 4;
      passives.push({ type: '머신 러닝', value1: 0, value2: 0 });
      passives.push({ type: '풍요', value1: 0, value2: 0 });
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

  const paySpaceCoins = useCallback((amount: number) => {
    let success = false;
    setState(prev => {
      if (prev.spaceCoins >= amount) {
        success = true;
        return { ...prev, spaceCoins: prev.spaceCoins - amount };
      }
      return prev;
    });
    return success;
  }, []);

  const addFragments = useCallback((newFragments: Record<string, number>) => {
    setState(prev => {
      const updatedFragments = { ...prev.fragments };
      for (const [type, count] of Object.entries(newFragments)) {
        updatedFragments[type] = (updatedFragments[type] || 0) + count;
      }
      return { ...prev, fragments: updatedFragments };
    });
  }, []);

  const buyOreUpgrade = useCallback((cost: number, fragmentType: string, type: 'pickaxe' | 'processing' | 'oreLuck' | 'oreMaxLevel' | 'oreSuperJackpotProb', count: number = 1) => {
    setState(prev => {
      const currentFragments = prev.fragments[fragmentType] || 0;
      if (currentFragments >= cost) {
        const newFragments = { ...prev.fragments };
        newFragments[fragmentType] -= cost;

        if (type === 'pickaxe') {
          if (count > 0 && prev.pickaxeLevel >= 20) return prev; // +50% per level, max +1000% (20 levels)
          return { ...prev, fragments: newFragments, pickaxeLevel: prev.pickaxeLevel + count };
        } else if (type === 'processing') {
          if (count > 0 && prev.processingLevel >= 12) return prev; // -5% per level, max -60% (12 levels)
          return { ...prev, fragments: newFragments, processingLevel: prev.processingLevel + count };
        } else if (type === 'oreLuck') {
          const maxLevel = prev.level * 100;
          if (count > 0 && prev.oreLuckLevel >= maxLevel) return prev;
          const actualCount = count > 0 ? Math.min(count, maxLevel - prev.oreLuckLevel) : 0;
          return { ...prev, fragments: newFragments, oreLuckLevel: prev.oreLuckLevel + actualCount };
        } else if (type === 'oreMaxLevel') {
          if (count > 0 && prev.oreMaxLevelBonusLevel >= 10) return prev; // +10 per level, max +100 (10 levels)
          return { ...prev, fragments: newFragments, oreMaxLevelBonusLevel: prev.oreMaxLevelBonusLevel + count };
        } else if (type === 'oreSuperJackpotProb') {
          if (count > 0 && prev.oreSuperJackpotProbLevel >= 40) return prev; // +0.5% per level, max +20% (40 levels)
          return { ...prev, fragments: newFragments, oreSuperJackpotProbLevel: prev.oreSuperJackpotProbLevel + count };
        }
      }
      return prev;
    });
  }, []);

  return {
    state,
    currentRoll,
    isRolling,
    cooldownRemaining,
    actualCooldown,
    roll,
    buyUpgrade,
    buySpaceUpgrade,
    changeRegion,
    equipAura,
    synthesize,
    generateAmulet,
    setAmulet,
    payCoins,
    paySpaceCoins,
    addFragments,
    buyOreUpgrade,
    toggleAutoRoll,
    resetGame,
    hasMachineLearning,
    amuletStats: {
      luck: amuletLuck,
      coin: amuletCoin,
      speed: amuletSpeed,
      jackpotProb: amuletJackpotProb,
      jackpotPower: amuletJackpotPower,
      superJackpotProb: amuletSuperJackpotProb,
      superJackpotPower: amuletSuperJackpotPower,
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
