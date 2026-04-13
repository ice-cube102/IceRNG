import { useState, useEffect, useCallback, useRef } from 'react';
import { RARITIES, Rarity } from '@/src/constants/rarities';

export type AmuletType = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Supreme' | 'GrandSupreme' | 'Dimensional' | 'Galactic';
export type PassiveType = '잭팟 러시' | '코인 샤워' | '행운의 파워' | '머신 러닝' | '표준 편차' | '버닝 다이스' | '은하 팽창' | '광속' | 'Milky Way!';
export type EnchantPassiveType = '붉은 피의 저주' | '시간 여행' | '멀티 다이스' | '합성에 합성에 합성을 더해서' | '뽑기 기계' | '광속 팽창';

export interface AmuletStat {
  type: 'coin' | 'speed' | 'jackpotProb' | 'jackpotPower' | 'spaceCoin';
  value: number;
}

export interface AmuletPassive {
  type: PassiveType;
  value1: number;
  value2: number;
}

export interface Enchantment {
  tier: 1 | 2 | 3;
  statMultiplier: number;
  passives: EnchantPassiveType[];
}

export interface Amulet {
  id: string;
  type: AmuletType;
  luckMultiplier: number;
  stats: AmuletStat[];
  passives: AmuletPassive[];
  enchantment?: Enchantment;
}

export interface ActiveBuff {
  type: PassiveType | '행운의 축복' | '버닝' | '재의 저주' | 'Sorry4DataReset';
  expiry: number;
  value1: number;
  value2: number;
  stacks?: number;
  accumulated?: number;
}

export interface GameState {
  rolls: number;
  coins: number;
  spaceCoins: number;
  gems: number;
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
  spaceJackpotPowerLevel: number;
  spaceCoinMultLevel: number;
  spaceLuckLevel: number;
  gemLuckLevel: number;
  synthesizerUnlocked: boolean;
  enchantTableUnlocked: boolean;
  lastRollStatus: { isJackpot: boolean, earnedCoins: number, earnedSpaceCoins: number, earnedGems: number } | null;
  amulet: Amulet | null;
  jackpotCount: number;
  rollCountForBuff: number;
  burningDiceCounter: number;
  lightSpeedRollCount: number;
  lightSpeedMultiplier: number;
  activeBuffs: ActiveBuff[];
  passiveCooldowns: Record<string, number>;
  stdDevMultiplier: number;
  autoRoll: boolean;
  redeemedCodes: string[];
  betaUI: boolean;
}

const INITIAL_STATE: GameState = {
  rolls: 0,
  coins: 0,
  spaceCoins: 0,
  gems: 0,
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
  spaceJackpotPowerLevel: 0,
  spaceCoinMultLevel: 0,
  spaceLuckLevel: 0,
  gemLuckLevel: 0,
  synthesizerUnlocked: false,
  enchantTableUnlocked: false,
  lastRollStatus: null,
  amulet: null,
  jackpotCount: 0,
  rollCountForBuff: 0,
  burningDiceCounter: 0,
  lightSpeedRollCount: 0,
  lightSpeedMultiplier: 1,
  activeBuffs: [],
  passiveCooldowns: {},
  stdDevMultiplier: 1,
  autoRoll: false,
  redeemedCodes: [],
  betaUI: false,
};

const BASE_COOLDOWN = 1000; // 1.0 seconds
export const QUICK_PULSE_PRICES = [10, 100, 1000, 10000, 100000];

export function useGame() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('rng-game-state-v15');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...INITIAL_STATE, 
          ...parsed, 
          activeBuffs: parsed.activeBuffs || [],
          passiveCooldowns: parsed.passiveCooldowns || {},
        };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [currentRoll, setCurrentRoll] = useState<Rarity | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  const isRollingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('rng-game-state-v15', JSON.stringify(state));
  }, [state]);

  // Calculate active amulet stats
  let amuletLuck = 1;
  let amuletCoin = 1;
  let amuletSpeed = 0;
  let amuletJackpotProb = 0;
  let amuletJackpotPower = 0;
  let hasMachineLearning = false;

  if (state.amulet) {
    amuletLuck = state.amulet.luckMultiplier;
    state.amulet.stats.forEach(s => {
      if (s.type === 'coin') amuletCoin += (s.value - 1);
      if (s.type === 'speed') amuletSpeed += s.value;
      if (s.type === 'jackpotProb') amuletJackpotProb += s.value;
      if (s.type === 'jackpotPower') amuletJackpotPower += s.value;
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
      if (p.type === '행운의 파워') {
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
      } else if (b.type === '행운의 파워') {
        const scale = 1 + Math.log10(1 + (b.accumulated || 0)) * 0.2;
        buffLuckMult *= (1 + (b.value2 - 1) * scale);
      } else if (b.type === '행운의 축복') {
        buffLuckMult *= b.value2;
      } else if (b.type === '버닝') {
        const scale = 1 + (b.accumulated || 0) * 0.02;
        buffSpeedRed += b.value1 * scale;
        buffAuraAmount = Math.max(buffAuraAmount, Math.floor(b.value2 * scale));
      } else if (b.type === '재의 저주') {
        buffSpeedRed -= b.value1; // Negative speed reduction = slower
        buffAuraAmount = Math.max(buffAuraAmount, b.value2);
      } else if (b.type === 'Sorry4DataReset') {
        buffLuckMult *= b.value1;
      }
    }
  });

  let baseWithUpgrade = BASE_COOLDOWN;
  
  if (state.quickPulseCount > 0) {
    if (state.quickPulseCount <= 5) {
      baseWithUpgrade *= Math.pow(0.8, state.quickPulseCount);
    } else {
      baseWithUpgrade *= Math.pow(0.8, 5) * Math.pow(0.9, state.quickPulseCount - 5);
    }
  }

  let minCooldown = 200; // Default 0.2s
  
  if (state.amulet?.enchantment?.passives.includes('시간 여행')) {
    if (state.rolls > 50000) minCooldown = 100;
    else if (state.rolls > 20000) minCooldown = 120;
    else if (state.rolls > 10000) minCooldown = 140;
    else if (state.rolls > 5000) minCooldown = 160;
    else if (state.rolls > 1000) minCooldown = 180;
  }

  if (state.amulet?.enchantment?.passives.includes('붉은 피의 저주')) {
    minCooldown = Math.max(250, minCooldown + 50); // 0.25s base, if time travel exists it reduces from 0.25s? The prompt says "시간 여행이 있으면 0.02초씩 감소죠?". Let's just say minCooldown = 250 - (200 - minCooldown);
    minCooldown = 250 - (200 - minCooldown);
  }

  let finalCooldownMult = Math.max(0.1, (1 - (amuletSpeed + buffSpeedRed))) * state.lightSpeedMultiplier;
  if (state.activeBuffs.some(b => b.type === 'Sorry4DataReset' && b.expiry > Date.now())) {
    finalCooldownMult *= 0.8;
  }

  const actualCooldown = Math.max(minCooldown, baseWithUpgrade * finalCooldownMult);

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
      const currentRarities = RARITIES;
      let selectedRarity = currentRarities[0];

      let newStdDev = state.stdDevMultiplier;
      if (state.amulet?.passives.some(p => p.type === '표준 편차')) {
        if (Math.random() < 0.48) newStdDev *= 0.99;
        else newStdDev *= 1.01;
      }

      // Base Jackpot: 1% prob, 200% (2.0) power
      const jackpotProb = Math.min(0.8, 0.01 + (state.jackpotProbLevel * 0.01) + amuletJackpotProb + buffJackpotProb);
      const isJackpot = Math.random() < jackpotProb;
      const jackpotPower = Math.min(8.0, 2.0 + (state.jackpotPowerLevel * 0.1) + (state.spaceJackpotPowerLevel * 0.2) + amuletJackpotPower + buffJackpotPower);
      
      const spaceLuckBonus = 1 + (state.spaceLuckLevel * 0.2) + (state.gemLuckLevel * 0.5);

      let totalLuck = state.luck * amuletLuck * buffLuckMult * newStdDev * spaceLuckBonus;

      if (state.amulet?.enchantment?.passives.includes('광속 팽창') && state.amulet.passives.some(p => p.type === '광속') && state.amulet.passives.some(p => p.type === '은하 팽창')) {
        totalLuck *= 1.005;
      }

      for (let i = currentRarities.length - 1; i >= 0; i--) {
        const rarity = currentRarities[i];
        let probability = (1 / rarity.chance) * totalLuck;

        if (rollValue < probability) {
          selectedRarity = rarity;
          break;
        }
      }
      
      let coinMultiplier = 1;
      if (isJackpot) coinMultiplier = jackpotPower;

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
        let amountToGive = Math.floor(buffAuraAmount);
        
        if (prev.amulet?.enchantment?.passives.includes('멀티 다이스')) {
          if (Math.random() < 0.2) {
            amountToGive += 1;
            if (Math.random() < 0.1) {
              amountToGive += 1;
              if (Math.random() < 0.05) {
                amountToGive += 1;
                if (Math.random() < 0.01) {
                  amountToGive += 1;
                }
              }
            }
          }
        }

        if (prev.amulet?.passives.some(p => p.type === '버닝 다이스') && Math.random() < 0.5) {
          amountToGive *= 2;
        }
        
        newInventory[selectedRarity.name] = (newInventory[selectedRarity.name] || 0) + amountToGive;

        const currentRarities = RARITIES;
        const currentBestIndex = currentRarities.findIndex(r => r.name === prev.bestRoll);
        const newRollIndex = currentRarities.findIndex(r => r.name === selectedRarity.name);
        
        const currentRarestIndex = currentRarities.findIndex(r => r.name === prev.rarestAura);
        const newRarestAura = newRollIndex > currentRarestIndex ? selectedRarity.name : prev.rarestAura;

        let abundanceMult = 1;
        if (prev.amulet?.passives.some(p => p.type === '풍요')) {
          abundanceMult = 2;
        }
        
        let earnedCoins = Math.floor(selectedRarity.coinValue * coinMultiplier * amuletCoin * buffCoinMult * abundanceMult * (1 + prev.spaceCoinMultLevel * 0.2));
        let earnedSpaceCoins = selectedRarity.spaceCoinValue ? Math.floor(selectedRarity.spaceCoinValue * coinMultiplier * amuletCoin * buffCoinMult * abundanceMult * (1 + prev.spaceCoinMultLevel * 0.2)) : 0;
        let earnedGems = selectedRarity.gemValue ? selectedRarity.gemValue * amountToGive * 5 : 0;

        let newJackpotCount = prev.jackpotCount;
        let newRollCount = prev.rollCountForBuff + 1;
        let newBurningCounter = prev.burningDiceCounter + 1;
        let newLightSpeedRollCount = prev.lightSpeedRollCount + 1;
        let newLightSpeedMultiplier = prev.lightSpeedMultiplier;
        let newLuck = prev.luck;
        let newCoins = prev.coins;
        let newSpaceCoins = prev.spaceCoins;
        const newBuffs = [...prev.activeBuffs];
        const newCooldowns = { ...prev.passiveCooldowns };

        if (isJackpot) {
          newJackpotCount++;
        }

        if (prev.amulet?.enchantment?.passives.includes('뽑기 기계')) {
          newCoins = Math.floor(newCoins * 0.995);
          newSpaceCoins = Math.floor(newSpaceCoins * 0.995);
        }

        if (prev.amulet?.enchantment?.passives.includes('붉은 피의 저주')) {
          if (['Mythic', 'Universal', 'Omniscient', 'Absolute'].includes(selectedRarity.name)) {
            newLuck *= 1.005;
          }
        }

        if (prev.amulet?.passives.some(p => p.type === '은하 팽창')) {
          newLuck *= 1.0005;
        }
        
        if (prev.amulet?.passives.some(p => p.type === 'Milky Way!') && Math.random() < 0.314) {
          newLuck *= 1.00314;
        }

        if (prev.amulet?.passives.some(p => p.type === '광속')) {
          newLightSpeedRollCount++;
          if (newLightSpeedRollCount % 10 === 0) {
            newLightSpeedMultiplier *= 0.995;
          }
        }

        return {
          ...prev,
          rolls: prev.rolls + 1,
          coins: newCoins + earnedCoins,
          spaceCoins: newSpaceCoins + earnedSpaceCoins,
          gems: prev.gems + earnedGems,
          luck: newLuck,
          inventory: newInventory,
          bestRoll: !prev.bestRoll || newRollIndex > currentBestIndex ? selectedRarity.name : prev.bestRoll,
          rarestAura: newRarestAura || currentRarities[0].name,
          lastRollTime: Date.now(),
          rollHistory: [selectedRarity.name, ...prev.rollHistory].slice(0, 8),
          lastRollStatus: { isJackpot, earnedCoins, earnedSpaceCoins, earnedGems },
          jackpotCount: newJackpotCount,
          rollCountForBuff: newRollCount,
          burningDiceCounter: newBurningCounter,
          lightSpeedRollCount: newLightSpeedRollCount,
          lightSpeedMultiplier: newLightSpeedMultiplier,
          activeBuffs: newBuffs,
          passiveCooldowns: newCooldowns,
          stdDevMultiplier: newStdDev,
        };
      });
    }, 10);
  }, [state.luck, state.lastRollTime, actualCooldown, state.jackpotProbLevel, state.jackpotPowerLevel, amuletLuck, amuletCoin, amuletJackpotProb, amuletJackpotPower, buffJackpotProb, buffJackpotPower, buffCoinMult, buffLuckMult, buffAuraAmount, state.stdDevMultiplier, state.amulet]);

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
      localStorage.removeItem('rng-game-state-v15');
      window.location.reload();
    }
  }, []);

  const equipAura = useCallback((auraName: string) => {
    setState(prev => ({ ...prev, equippedAura: auraName }));
  }, []);

  const synthesize = useCallback((rarityIndex: number, max: boolean = false) => {
    const currentRarities = RARITIES;
    if (rarityIndex >= currentRarities.length - 1) return false;
    const currentRarity = currentRarities[rarityIndex];
    const nextRarity = currentRarities[rarityIndex + 1];
    
    let success = false;
    setState(prev => {
      if (nextRarity.name === 'Aleph-0' && (prev.inventory['Infinite'] || 0) === 0) return prev;
      
      const inventoryKey = 'inventory';
      const count = prev[inventoryKey][currentRarity.name] || 0;
      if (count >= 5) {
        let crafts = max ? Math.floor(count / 5) : 1;
        const newInventory = { ...prev[inventoryKey] };
        newInventory[currentRarity.name] -= crafts * 5;

        let multiplier = 1;
        if (prev.amulet?.enchantment?.passives.includes('합성에 합성에 합성을 더해서') && nextRarity.name !== 'Infinite') {
          // Reduce chance closer to Infinity
          const distanceToInfinity = currentRarities.length - 1 - rarityIndex;
          const chanceMult = Math.max(0.1, distanceToInfinity / 10);
          
          if (Math.random() < 0.1 * chanceMult) multiplier = 3;
          else if (Math.random() < 0.4 * chanceMult) multiplier = 2;
        }

        newInventory[nextRarity.name] = (newInventory[nextRarity.name] || 0) + (crafts * multiplier);
        success = true;
        return { ...prev, [inventoryKey]: newInventory, equippedAura: nextRarity.name };
      }
      return prev;
    });
    return success;
  }, []);

  const buyUpgrade = useCallback((cost: number, type: 'luck' | 'cooldown' | 'jackpotProb' | 'jackpotPower' | 'synthesizer' | 'spaceJackpotPower' | 'spaceCoinMult' | 'spaceLuck' | 'gemLuck' | 'enchantTable', value: number, count: number = 1, currency: 'coins' | 'spaceCoins' | 'gems' = 'coins') => {
    let success = false;
    setState(prev => {
      if (currency === 'coins' && prev.coins >= cost) {
        const newState = { ...prev };
        newState.coins -= cost;

        if (type === 'luck') {
          const maxLevel = 1000000;
          if (prev.luckyCloverCount >= maxLevel) return prev;
          const actualCount = Math.min(count, maxLevel - prev.luckyCloverCount);
          const actualValue = (value / count) * actualCount;
          newState.luck += actualValue;
          newState.luckyCloverCount += actualCount;
        } else if (type === 'cooldown') {
          if (prev.quickPulseCount >= 10) return prev;
          newState.quickPulseCount += 1;
        } else if (type === 'jackpotProb') {
          if (prev.jackpotProbLevel >= 80) return prev;
          newState.jackpotProbLevel += count;
        } else if (type === 'jackpotPower') {
          if (prev.jackpotPowerLevel >= 30) return prev;
          newState.jackpotPowerLevel += count;
        } else if (type === 'synthesizer') {
          newState.synthesizerUnlocked = true;
        }
        success = true;
        return newState;
      } else if (currency === 'spaceCoins' && prev.spaceCoins >= cost) {
        const newState = { ...prev };
        newState.spaceCoins -= cost;
        if (type === 'spaceJackpotPower') {
          if (prev.spaceJackpotPowerLevel >= 15) return prev;
          newState.spaceJackpotPowerLevel += count;
        } else if (type === 'spaceCoinMult') {
          const maxLevel = 5;
          if (prev.spaceCoinMultLevel >= maxLevel) return prev;
          const actualCount = Math.min(count, maxLevel - prev.spaceCoinMultLevel);
          newState.spaceCoinMultLevel += actualCount;
        } else if (type === 'spaceLuck') {
          const maxLevel = 50000;
          if (prev.spaceLuckLevel >= maxLevel) return prev;
          const actualCount = Math.min(count, maxLevel - prev.spaceLuckLevel);
          newState.spaceLuckLevel += actualCount;
        }
        success = true;
        return newState;
      } else if (currency === 'gems' && prev.gems >= cost) {
        const newState = { ...prev };
        newState.gems -= cost;
        if (type === 'gemLuck') {
          const maxLevel = 50000;
          if (prev.gemLuckLevel >= maxLevel) return prev;
          const actualCount = Math.min(count, maxLevel - prev.gemLuckLevel);
          newState.gemLuckLevel += actualCount;
          newState.luck += actualCount * 0.5;
        } else if (type === 'enchantTable') {
          newState.enchantTableUnlocked = true;
        }
        success = true;
        return newState;
      }
      return prev;
    });
    return success;
  }, []);

  const redeemCode = useCallback((code: string) => {
    let success = false;
    let message = '';
    setState(prev => {
      const newState = { ...prev };
      if (!['Sorry4DataReset', 'PressStart!', 'DevLUCK', 'DevONLY', 'Vulcan'].includes(code)) {
        if (prev.redeemedCodes.includes(code)) {
          message = '이미 사용된 코드입니다.';
          return prev;
        }
        newState.redeemedCodes = [...prev.redeemedCodes, code];
      }
      
      if (code === 'Sorry4DataReset') {
        newState.activeBuffs.push({
          type: 'Sorry4DataReset',
          expiry: Date.now() + 3 * 60 * 60 * 1000, // 3 hours
          value1: 1.5, // luck mult
          value2: 0.8 // cooldown mult
        });
        message = '보상 버프가 지급되었습니다! (3시간)';
        success = true;
      } else if (code === 'PressStart!') {
        newState.coins += 1000;
        message = '1000 코인이 지급되었습니다!';
        success = true;
      } else if (code === 'DevLUCK') {
        newState.luck *= 100;
        message = '행운이 100배 증가했습니다!';
        success = true;
      } else if (code === 'Vulcan') {
        newState.coins += 1000000000000;
        newState.luck *= 100;
        message = 'Vulcan 보상이 지급되었습니다!';
        success = true;
      } else if (code === 'DevONLY') {
        newState.coins += 100000000000000;
        newState.spaceCoins += 100000000000000;
        newState.gems += 100000000000000;
        message = '개발자 보상이 지급되었습니다!';
        success = true;
      } else {
        message = '유효하지 않은 코드입니다.';
        return prev;
      }
      
      return newState;
    });
    return { success, message };
  }, []);

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
      
      const passivePool: PassiveType[] = ['잭팟 러시', '코인 샤워', '행운의 파워', '머신 러닝', '표준 편차', '버닝 다이스'];
      
      const getPassive = (pType: PassiveType): AmuletPassive => {
        switch(pType) {
          case '잭팟 러시': return { type: pType, value1: 0.05, value2: 0.5 };
          case '코인 샤워': return { type: pType, value1: 1.5, value2: 0 };
          case '행운의 파워': return { type: pType, value1: 2, value2: 1.2 };
          case '머신 러닝': return { type: pType, value1: 0, value2: 0 };
          case '표준 편차': return { type: pType, value1: 0, value2: 0 };
          case '버닝 다이스': return { type: pType, value1: 0.1, value2: 2 };
          default: return { type: pType, value1: 0, value2: 0 };
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
    } else if (type === 'Dimensional') {
      luckMultiplier = 3.0;
      numStats = 4;
      if (Math.random() < 0.2) passives.push({ type: '머신 러닝', value1: 0, value2: 0 });
      
      const dimensionalPassives: PassiveType[] = ['은하 팽창', '광속'];
      const firstPassive = dimensionalPassives[Math.floor(Math.random() * dimensionalPassives.length)];
      passives.push({ type: firstPassive, value1: 0, value2: 0 });
    } else if (type === 'Galactic') {
      luckMultiplier = 3.5;
      numStats = 4;
      
      const hasML = Math.random() < 0.25;
      if (hasML) passives.push({ type: '머신 러닝', value1: 0, value2: 0 });
      
      const galacticPassives: PassiveType[] = ['은하 팽창', '광속', 'Milky Way!'];
      const firstPassive = galacticPassives[Math.floor(Math.random() * galacticPassives.length)];
      passives.push({ type: firstPassive, value1: 0, value2: 0 });

      if (!hasML && Math.random() < 0.3) {
        let secondPassive = galacticPassives[Math.floor(Math.random() * galacticPassives.length)];
        while (secondPassive === firstPassive) {
          secondPassive = galacticPassives[Math.floor(Math.random() * galacticPassives.length)];
        }
        passives.push({ type: secondPassive, value1: 0, value2: 0 });
      }
    }

    let availableStats: AmuletStat['type'][] = ['coin', 'speed', 'jackpotProb', 'jackpotPower'];
    if (type === 'Dimensional' || type === 'Galactic') {
      availableStats.push('spaceCoin');
    }
    const pickedStats = availableStats.sort(() => 0.5 - Math.random()).slice(0, numStats);

    const stats: AmuletStat[] = pickedStats.map(statType => {
      let value = 0;
      switch (statType) {
        case 'coin': 
          if (type === 'Dimensional') value = 1.1 + Math.random() * 0.1;
          else if (type === 'Galactic') value = 1.1 + Math.random() * 0.15;
          else value = 1.05 + Math.random() * 0.10; 
          break;
        case 'speed': 
          if (type === 'Dimensional') value = 0.05 + Math.random() * 0.07;
          else if (type === 'Galactic') value = 0.07 + Math.random() * 0.05;
          else if (type === 'Supreme') value = 0.03 + Math.random() * 0.09;
          else value = 0.03 + Math.random() * 0.07;
          break;
        case 'jackpotProb': 
          if (type === 'Dimensional') value = 0.05 + Math.random() * 0.10;
          else if (type === 'Galactic') value = 0.08 + Math.random() * 0.07;
          else if (type === 'Supreme') value = 0.01 + Math.random() * 0.06;
          else value = 0.01 + Math.random() * 0.04;
          break;
        case 'jackpotPower': 
          if (type === 'Dimensional') value = 0.40 + Math.random() * 0.45;
          else if (type === 'Galactic') value = 0.45 + Math.random() * 0.55;
          else if (type === 'Supreme') value = 0.05 + Math.random() * 0.15;
          else value = 0.05 + Math.random() * 0.10;
          break;
        case 'spaceCoin':
          if (type === 'Dimensional') value = 1.08 + Math.random() * 0.07;
          else if (type === 'Galactic') value = 1.08 + Math.random() * 0.07;
          break;
      }
      return { type: statType, value };
    });

    return { id, type, luckMultiplier, stats, passives };
  }, []);

  const setAmulet = useCallback((amulet: Amulet | null) => {
    setState(prev => ({ ...prev, amulet }));
  }, []);

  const enchantAmulet = useCallback((tier: 1 | 2 | 3): Amulet | null => {
    let newAmulet: Amulet | null = null;
    setState(prev => {
      if (!prev.amulet) return prev;
      
      let cost = 0;
      if (tier === 1) cost = 10;
      else if (tier === 2) cost = 50;
      else if (tier === 3) cost = 200;

      if (prev.gems < cost) return prev;

      let statMultiplier = 1;
      if (tier === 1) statMultiplier = 1.05 + Math.random() * 0.05;
      else if (tier === 2) statMultiplier = 1.1 + Math.random() * 0.15;
      else if (tier === 3) statMultiplier = 1.2 + Math.random() * 0.1;

      let passives: EnchantPassiveType[] = [];
      const passivePool: EnchantPassiveType[] = ['붉은 피의 저주', '시간 여행', '멀티 다이스', '합성에 합성에 합성을 더해서', '뽑기 기계'];
      
      // Secret passive check
      if (prev.amulet.passives.some(p => p.type === '광속') && prev.amulet.passives.some(p => p.type === '은하 팽창')) {
        if (Math.random() < 0.02) {
          passives.push('광속 팽창');
        }
      }

      if (tier === 2 && Math.random() < 0.05 && passives.length < 1) {
        passives.push(passivePool[Math.floor(Math.random() * passivePool.length)]);
      } else if (tier === 3) {
        if (Math.random() < 0.25 && passives.length < 2) {
          passives.push(passivePool[Math.floor(Math.random() * passivePool.length)]);
        }
        if (Math.random() < 0.25 && passives.length < 2) {
          const p = passivePool[Math.floor(Math.random() * passivePool.length)];
          if (!passives.includes(p)) passives.push(p);
        }
      }

      newAmulet = {
        ...prev.amulet,
        enchantment: {
          tier,
          statMultiplier,
          passives
        }
      };

      return { ...prev, gems: prev.gems - cost };
    });
    return newAmulet;
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
    enchantAmulet,
    redeemCode,
    setAmulet,
    payCoins,
    toggleAutoRoll,
    resetGame,
    hasMachineLearning,
    setState,
    amuletStats: {
      luck: amuletLuck,
      coin: amuletCoin,
      speed: amuletSpeed,
      jackpotProb: amuletJackpotProb,
      jackpotPower: amuletJackpotPower
    },
    buffStats: {
      jackpotProb: buffJackpotProb,
      jackpotPower: buffJackpotPower,
      coinMult: buffCoinMult,
      speedRed: buffSpeedRed,
      luckMult: buffLuckMult,
      auraAmount: buffAuraAmount
    }
  };
}
