import React, { useState } from 'react';
import { useGame, Amulet, AmuletType, AmuletPassive, AmuletStat, QUICK_PULSE_PRICES } from './hooks/useGame';
import { RARITIES } from './constants/rarities';
import { Coins, Sparkles, Trophy, Timer, Activity, TrendingUp, Star, Zap, Medal, Package as InventoryIcon, ChevronRight, ShoppingBag, Flame, Skull, AlertCircle, Circle, Square, Triangle, Hexagon, Sun, Globe, Moon, Infinity as InfinityIcon, Cloud, Eye, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const ICON_MAP: Record<string, any> = {
  Circle,
  Square,
  Triangle,
  Star,
  Hexagon,
  Flame,
  Sun,
  Globe,
  Moon,
  Cloud,
  Eye,
  Sparkles,
  Zap,
  Crown,
  Infinity: InfinityIcon
};

const getIcon = (iconName: string, className: string) => {
  const IconComponent = ICON_MAP[iconName] || Star;
  return <IconComponent className={className} />;
};

const formatAmuletStat = (stat: AmuletStat) => {
  switch (stat.type) {
    case 'coin': return `코인 x${stat.value.toFixed(2)}`;
    case 'speed': return `속도 -${(stat.value * 100).toFixed(1)}%`;
    case 'jackpotProb': return `잭팟 확률 +${(stat.value * 100).toFixed(1)}%`;
    case 'jackpotPower': return `잭팟 파워 +${(stat.value * 100).toFixed(0)}%`;
    case 'exp': return `경험치 +${(stat.value * 100).toFixed(0)}%`;
  }
};

const formatPassiveDesc = (p: AmuletPassive) => {
  if (p.type === 'Jackpot Rush') return `상시 잭팟 확률 +5%, 잭팟 파워 +50%`;
  if (p.type === 'Coin Shower') return `상시 코인 획득량 x1.5`;
  if (p.type === 'EXP Power') return `상시 경험치 획득량 x2, 행운 x1.2`;
  if (p.type === 'Machine Learning') return `오토 뽑기 기능 잠금 해제`;
  if (p.type === 'Standard Deviation') return `매 뽑기마다 48% 확률로 행운 x0.99, 52% 확률로 행운 x1.01`;
  if (p.type === 'Burning Dice') return `상시 속도 -10%, 뽑기 시 50% 확률로 아우라 획득 개수 x2`;
  return '';
};

const AmuletCard = ({ amulet, isNew }: { amulet: Amulet | null, isNew?: boolean }) => {
  if (!amulet) return <div className="p-4 border border-slate-800 rounded-xl text-center text-slate-500">장착된 아뮬렛 없음</div>;
  
  const rarity = RARITIES.find(r => r.name === amulet.type) || RARITIES[0];
  const colorClass = `${rarity.color} border-current/20 bg-current/10`;

  return (
    <div className={`p-4 rounded-xl border ${colorClass} ${isNew ? 'ring-2 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        {getIcon(rarity.icon, "w-5 h-5")}
        <span className="font-bold">{amulet.type} 아뮬렛</span>
      </div>
      <div className="space-y-1">
        <Badge variant="outline" className="bg-black/20 border-white/10 text-white mr-1 mb-1">
          행운 x{amulet.luckMultiplier}
        </Badge>
        {amulet.stats.map((stat, i) => (
          <Badge key={i} variant="outline" className="bg-black/20 border-white/10 text-white mr-1 mb-1">
            {formatAmuletStat(stat)}
          </Badge>
        ))}
        {amulet.passives.map((passive, i) => (
          <div key={i} className="mt-2 p-2 rounded bg-black/30 text-xs text-slate-300 border border-white/10">
            <span className="font-bold text-white block mb-1">[{passive.type}]</span>
            {formatPassiveDesc(passive)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const { 
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
    amuletStats,
    buffStats
  } = useGame();

  const [cloverAmount, setCloverAmount] = useState(1);
  const [pendingAmulet, setPendingAmulet] = useState<Amulet | null>(null);

  const handleUpgrade = (cost: number, type: any, value: number, name: string, count: number = 1) => {
    if (buyUpgrade(cost, type, value, count)) {
      toast.success(`${name} 구매 완료!`);
    } else {
      toast.error("코인이 부족합니다.");
    }
  };

  const handleBuyAmulet = (type: AmuletType, cost: number) => {
    if (state.coins >= cost) {
      if (payCoins(cost)) {
        const newAmulet = generateAmulet(type);
        setPendingAmulet(newAmulet);
      }
    } else {
      toast.error("코인이 부족합니다.");
    }
  };

  const totalCloverCost = 50 * cloverAmount;
  const totalCloverValue = 0.1 * cloverAmount;
  const maxClover = state.level * 1000;
  const isCloverMaxed = state.luckyCloverCount >= maxClover;

  const quickPulseCost = QUICK_PULSE_PRICES[state.quickPulseCount] || 0;

  const expReq = 100 * state.level;
  const expProgress = (state.exp / expReq) * 100;

  const totalJackpotProb = 1 + (state.jackpotProbLevel * 1) + (amuletStats.jackpotProb * 100) + (buffStats.jackpotProb * 100);
  const totalJackpotPower = 200 + (state.jackpotPowerLevel * 10) + (amuletStats.jackpotPower * 100) + (buffStats.jackpotPower * 100);

  const jackpotLuckBonus = state.lastRollStatus?.isJackpot ? ((2.0 + (state.jackpotPowerLevel * 0.1) + amuletStats.jackpotPower + buffStats.jackpotPower) / 2) : 1;
  const totalLuck = state.luck * amuletStats.luck * buffStats.luckMult * state.stdDevMultiplier * jackpotLuckBonus;

  const rarestAuraObj = RARITIES.find(r => r.name === state.rarestAura) || RARITIES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-jua selection:bg-cyan-900 selection:text-cyan-50">
      <Toaster 
        theme="dark" 
        position="bottom-right" 
        toastOptions={{ 
          duration: 1500,
          className: 'bg-green-600 text-white border-green-700 font-jua'
        }} 
      />
      
      {/* Amulet Replacement Modal */}
      <AnimatePresence>
        {pendingAmulet && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-3xl w-full shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-6 text-center tracking-tight">새로운 아뮬렛 발견!</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 mb-3 text-center uppercase tracking-widest">현재 장착 중</h3>
                  <AmuletCard amulet={state.amulet} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-cyan-400 mb-3 text-center uppercase tracking-widest">새로운 아뮬렛</h3>
                  <AmuletCard amulet={pendingAmulet} isNew />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <Button className="flex-1 py-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg rounded-xl" onClick={() => setPendingAmulet(null)}>
                  기존 유지 (버리기)
                </Button>
                <Button className="flex-1 py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]" onClick={() => {
                  setAmulet(pendingAmulet);
                  setPendingAmulet(null);
                  toast.success("새로운 아뮬렛을 장착했습니다!");
                }}>
                  새 아뮬렛 장착
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div 
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border ${rarestAuraObj.glowColor} ${rarestAuraObj.color}`}
              style={{
                backgroundColor: `color-mix(in srgb, currentColor 20%, transparent)`,
                borderColor: `color-mix(in srgb, currentColor 30%, transparent)`
              }}
            >
              {getIcon(rarestAuraObj.icon, `w-8 h-8`)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">IceRNG</h1>
              <p className="text-xs font-medium text-cyan-400 tracking-widest uppercase">운을 시험해보세요</p>
              
              {/* Buffs Display */}
              {(state.activeBuffs.length > 0 || Object.entries(state.passiveCooldowns).some(([_, cd]) => cd > Date.now())) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {state.activeBuffs.map((buff, idx) => {
                    const isDebuff = buff.type === 'Curse of Ash' || buff.type === 'Burning';
                    const colorClass = isDebuff ? 'bg-red-900/30 border-red-500/50 text-red-300' : 'bg-indigo-900/30 border-indigo-500/50 text-indigo-300';
                    const Icon = buff.type === 'Burning' ? Flame : buff.type === 'Curse of Ash' ? Skull : Activity;
                    return (
                      <Badge key={idx} variant="outline" className={`${colorClass} py-0.5 px-2 text-[10px]`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {buff.type} 
                        {buff.stacks ? ` (${buff.stacks})` : ''}
                        <span className="ml-1 opacity-70">{Math.ceil((buff.expiry - Date.now()) / 1000)}s</span>
                      </Badge>
                    );
                  })}
                  {Object.entries(state.passiveCooldowns).map(([type, cd], idx) => {
                    if (cd <= Date.now()) return null;
                    return (
                      <Badge key={`cd-${idx}`} variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-400 py-0.5 px-2 text-[10px]">
                        <Timer className="w-3 h-3 mr-1" />
                        {type} CD
                        <span className="ml-1 opacity-70">{Math.ceil((cd - Date.now()) / 1000)}s</span>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Quick Stats next to IceRNG */}
            <div className="hidden md:flex items-center gap-4 ml-6 pl-6 border-l border-slate-800">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">행운 배수</p>
                <p className="text-lg font-black text-cyan-400">x{totalLuck.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">쿨타임</p>
                <p className="text-lg font-black text-emerald-400">{(actualCooldown / 1000).toFixed(2)}초</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">총 뽑기</p>
                <p className="text-lg font-black text-purple-400">{state.rolls.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">잭팟 확률</p>
                <p className="text-lg font-black text-yellow-400">{totalJackpotProb.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">잭팟 파워</p>
                <p className="text-lg font-black text-orange-400">+{totalJackpotPower.toFixed(0)}%</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-400">Lv.{state.level}</span>
                <span className="text-[10px] text-slate-500">{Math.floor(state.exp)} / {expReq} EXP</span>
              </div>
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${expProgress}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-950/50 px-5 py-2.5 rounded-2xl border border-slate-800">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-mono text-xl font-bold text-yellow-400">{state.coins.toLocaleString()}</span>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: Main Game Area (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Roll Display */}
            <Card className="bg-slate-900/40 border-slate-800/50 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center p-8">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80 pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {currentRoll ? (
                  <motion.div
                    key={state.rolls}
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="relative z-10 flex flex-col items-center"
                  >
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className={`absolute inset-0 blur-3xl opacity-20 ${currentRoll.color.replace('text-', 'bg-')}`}
                    />
                    
                    {state.lastRollStatus?.isJackpot && (
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mb-4 px-4 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 font-black text-sm tracking-widest uppercase flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" /> 잭팟 터짐!
                      </motion.div>
                    )}

                    <div 
                      className={`mb-6 p-6 rounded-3xl bg-slate-950/50 border shadow-2xl ${currentRoll.color} border-current/20 bg-current/10`}
                    >
                      {getIcon(currentRoll.icon, "w-24 h-24")}
                    </div>
                    
                    <h2 className={`text-5xl sm:text-6xl font-black mb-4 tracking-tighter ${currentRoll.color} drop-shadow-lg`}>
                      {currentRoll.name}
                    </h2>
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex flex-col items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 font-jua">
                        <span className="text-slate-400 text-xs">기본 확률 : {Math.min(100, currentRoll.baseProb || 0).toFixed(1)}%</span>
                        <span className="text-cyan-400 text-xs">행운 적용 후 확률 : {Math.min(100, currentRoll.luckProb || 0).toFixed(1)}%</span>
                      </div>
                      <div className="text-yellow-400/80 font-bold text-sm flex items-center gap-1">
                        +{Math.floor(currentRoll.coinValue * (state.lastRollStatus?.isJackpot ? (2.0 + (state.jackpotPowerLevel * 0.1) + amuletStats.jackpotPower + buffStats.jackpotPower) : 1) * amuletStats.coin * buffStats.coinMult).toLocaleString()} 코인
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-500 font-medium text-lg tracking-widest uppercase"
                  >
                    뽑기를 시작하세요
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Bar for Cooldown */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-75 ease-linear"
                  style={{ width: `${100 - (cooldownRemaining / actualCooldown) * 100}%` }}
                />
              </div>
            </Card>

            {/* Controls */}
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={roll} 
                disabled={isRolling || cooldownRemaining > 0}
                className="flex-1 py-8 text-2xl font-black bg-white text-black hover:bg-cyan-50 transition-all rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {cooldownRemaining > 0 ? `${(cooldownRemaining / 1000).toFixed(1)}초` : '아우라 뽑기'}
              </Button>
              
              {hasMachineLearning && (
                <Button 
                  size="lg"
                  variant={state.autoRoll ? "default" : "outline"}
                  onClick={toggleAutoRoll}
                  className={`flex-1 py-8 text-xl font-black transition-all rounded-2xl ${state.autoRoll ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'}`}
                >
                  {state.autoRoll ? '오토 뽑기 중지' : '오토 뽑기 시작'}
                </Button>
              )}
            </div>

          </div>

          {/* Right: Sidebar (5 cols) */}
          <div className="lg:col-span-5">
            <Tabs defaultValue="shop" className="w-full">
              <TabsList className="w-full bg-slate-900/40 border border-slate-800/50 p-1.5 rounded-2xl mb-6 flex flex-wrap h-auto">
                <TabsTrigger value="shop" className="flex-1 rounded-xl py-3 text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                  <ShoppingBag className="w-4 h-4 mr-2" /> 상점
                </TabsTrigger>
                <TabsTrigger value="amulets" className="flex-1 rounded-xl py-3 text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                  <Medal className="w-4 h-4 mr-2" /> 아뮬렛
                </TabsTrigger>
                {state.synthesizerUnlocked && (
                  <TabsTrigger value="synthesizer" className="flex-1 rounded-xl py-3 text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    <Zap className="w-4 h-4 mr-2" /> 합성소
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="shop" className="space-y-4">
                <Card className="bg-slate-900/20 border-slate-800/50 overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    
                    {/* Lucky Clover Multi-Purchase Item */}
                    {!isCloverMaxed && (
                      <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">행운의 네잎클로버</span>
                              <span className="text-[10px] text-slate-500 font-medium">+{totalCloverValue.toFixed(1)}x 행운 배수 (Lv.{state.luckyCloverCount}/{maxClover})</span>
                            </div>
                          </div>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleUpgrade(totalCloverCost, 'luck', totalCloverValue, `행운의 네잎클로버 x${cloverAmount}`, cloverAmount)}
                            disabled={state.coins < totalCloverCost || state.luckyCloverCount + cloverAmount > maxClover}
                            className="bg-white text-black hover:bg-cyan-50 text-[10px] font-black h-8 px-4 rounded-lg disabled:opacity-50"
                          >
                            {totalCloverCost.toLocaleString()}
                          </Button>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {[1, 5, 10, 50, 100, 1000, 10000].map(amt => (
                            <button 
                              key={amt}
                              onClick={() => setCloverAmount(amt)}
                              className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-colors ${cloverAmount === amt ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                              x{amt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {state.quickPulseCount < 5 && (
                      <ShopItem 
                        name="신속의 파동" 
                        desc="-0.08초 쿨타임 감소" 
                        cost={quickPulseCost} 
                        icon={<Timer className="w-4 h-4" />}
                        onBuy={() => handleUpgrade(quickPulseCost, 'cooldown', 0.08, "신속의 파동")}
                      />
                    )}

                    <ShopItem 
                      name="잭팟 확률 증가" 
                      desc={`+1% 확률로 잭팟 발동 (현재: ${state.jackpotProbLevel}%)`}
                      cost={1000 * (state.jackpotProbLevel + 1)} 
                      icon={<Star className="w-4 h-4" />}
                      onBuy={() => handleUpgrade(1000 * (state.jackpotProbLevel + 1), 'jackpotProb', 1, "잭팟 확률 증가")}
                    />

                    <ShopItem 
                      name="잭팟 파워 증가" 
                      desc={`+10% 잭팟 보상 배수 (현재: +${state.jackpotPowerLevel * 10}%)`}
                      cost={2000 * (state.jackpotPowerLevel + 1)} 
                      icon={<Activity className="w-4 h-4" />}
                      onBuy={() => handleUpgrade(2000 * (state.jackpotPowerLevel + 1), 'jackpotPower', 1, "잭팟 파워 증가")}
                    />

                    {!state.synthesizerUnlocked && (
                      <ShopItem 
                        name="아우라 합성소 해금" 
                        desc="같은 아우라 5개를 모아 상위 아우라로 합성합니다." 
                        cost={10000} 
                        icon={<Zap className="w-4 h-4" />}
                        onBuy={() => handleUpgrade(10000, 'synthesizer', 0, "아우라 합성소")}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amulets">
                <Card className="bg-slate-900/20 border-slate-800/50 h-[650px] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-800/50">
                    <CardTitle className="text-lg text-white">아뮬렛 상점</CardTitle>
                    <CardDescription>강력한 스탯을 제공하는 아뮬렛을 뽑으세요.</CardDescription>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 border-b border-slate-800/50">
                    <Button variant="outline" className="bg-orange-950/30 border-orange-800/50 text-orange-500 hover:bg-orange-900/50 flex flex-col h-auto py-2" onClick={() => handleBuyAmulet('Bronze', 1000)}>
                      <span className="font-bold text-xs">브론즈 뽑기</span>
                      <span className="text-[10px]">1,000</span>
                    </Button>
                    <Button variant="outline" className="bg-slate-400/10 border-slate-400/30 text-slate-300 hover:bg-slate-400/20 flex flex-col h-auto py-2" onClick={() => handleBuyAmulet('Silver', 5000)}>
                      <span className="font-bold text-xs">실버 뽑기</span>
                      <span className="text-[10px]">5,000</span>
                    </Button>
                    <Button variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 flex flex-col h-auto py-2" onClick={() => handleBuyAmulet('Gold', 20000)}>
                      <span className="font-bold text-xs">골드 뽑기</span>
                      <span className="text-[10px]">20,000</span>
                    </Button>
                    <Button variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 flex flex-col h-auto py-2" onClick={() => handleBuyAmulet('Diamond', 100000)}>
                      <span className="font-bold text-xs">다이아 뽑기</span>
                      <span className="text-[10px]">100,000</span>
                    </Button>
                    <Button variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 flex flex-col h-auto py-2" onClick={() => handleBuyAmulet('Supreme', 500000)}>
                      <span className="font-bold text-xs">슈프림 뽑기</span>
                      <span className="text-[10px]">500,000</span>
                    </Button>
                    <Button variant="outline" className="bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 flex flex-col h-auto py-2" onClick={() => handleBuyAmulet('GrandSupreme', 50000000)}>
                      <span className="font-bold text-xs">그랜드 슈프림</span>
                      <span className="text-[10px]">50,000,000</span>
                    </Button>
                  </div>
                  <CardContent className="p-4 flex-1 overflow-y-auto">
                    <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">현재 장착된 아뮬렛</h3>
                    <AmuletCard amulet={state.amulet} />
                  </CardContent>
                </Card>
              </TabsContent>

              {state.synthesizerUnlocked && (
                <TabsContent value="synthesizer">
                  <Card className="bg-slate-900/20 border-slate-800/50 h-[650px] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-800/50">
                      <CardTitle className="text-lg text-white">아우라 합성소</CardTitle>
                      <CardDescription>같은 아우라 5개를 모아 다음 등급으로 합성합니다.</CardDescription>
                    </div>
                    <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {RARITIES.slice(0, -1).map((rarity, idx) => {
                          const count = state.inventory[rarity.name] || 0;
                          const nextRarity = RARITIES[idx + 1];
                          
                          return (
                            <div key={rarity.name} className={`flex flex-col gap-2 p-4 rounded-2xl border ${count === 0 ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-900/40 border-slate-800/50'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getIcon(rarity.icon, `w-5 h-5 ${rarity.color}`)}
                                  <span className={`font-bold ${rarity.color}`}>{rarity.name}</span>
                                  <span className="text-slate-400 text-xs">x{count.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm"
                                    disabled={count < 5} 
                                    onClick={() => {
                                      if (synthesize(idx)) toast.success(
                                        <div className="flex items-center gap-2">
                                          {getIcon(nextRarity.icon, `w-4 h-4 ${nextRarity.color}`)}
                                          <span>{nextRarity.name} 합성 성공!</span>
                                        </div>
                                      );
                                    }}
                                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                                  >
                                    합성 (5개)
                                  </Button>
                                  <Button 
                                    size="sm"
                                    disabled={count < 5} 
                                    onClick={() => {
                                      if (synthesize(idx, true)) toast.success(
                                        <div className="flex items-center gap-2">
                                          {getIcon(nextRarity.icon, `w-4 h-4 ${nextRarity.color}`)}
                                          <span>{nextRarity.name} 최대 합성 성공!</span>
                                        </div>
                                      );
                                    }}
                                    className="bg-purple-900/50 hover:bg-purple-800 text-purple-300 text-xs font-bold"
                                  >
                                    최대 합성
                                  </Button>
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                결과: {getIcon(nextRarity.icon, `w-3 h-3 ${nextRarity.color}`)} <span className={nextRarity.color}>{nextRarity.name}</span>
                              </div>
                            </div>
                          );
                        })}
                        {Object.keys(state.inventory).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-32 text-slate-600">
                            <Zap className="w-12 h-12 mb-4 opacity-10" />
                            <p className="text-sm font-medium">합성할 아우라가 없습니다</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopItem({ name, desc, cost, icon, onBuy, disabled = false }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">{name}</span>
          <span className="text-[10px] text-slate-500 font-medium">{desc}</span>
        </div>
      </div>
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={onBuy}
        disabled={disabled}
        className="bg-white text-black hover:bg-cyan-50 text-[10px] font-black h-8 px-4 rounded-lg disabled:opacity-50"
      >
        {cost.toLocaleString()}
      </Button>
    </div>
  );
}
