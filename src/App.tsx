import React, { useState, useEffect } from 'react';
import { useGame, Amulet, AmuletType, AmuletPassive, AmuletStat, QUICK_PULSE_PRICES } from './hooks/useGame';
import { RARITIES } from './constants/rarities';
import { Coins, Sparkles, Trophy, Timer, Activity, TrendingUp, Star, Zap, Medal, Package as InventoryIcon, ChevronRight, ShoppingBag, Flame, Skull, AlertCircle, Circle, Square, Triangle, Hexagon, Sun, Globe, Moon, Infinity as InfinityIcon, Cloud, Eye, Crown, RotateCcw, Pickaxe, Gem, Settings, Sigma, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, signInWithPopup, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from './lib/firebase';

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
  Infinity: InfinityIcon,
  Sigma
};

const getIcon = (iconName: string, className: string) => {
  const IconComponent = ICON_MAP[iconName] || Star;
  return <IconComponent className={className} />;
};

const formatNumber = (num: number) => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 't';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'b';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'm';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
  return num.toString();
};

const formatAmuletStat = (stat: AmuletStat) => {
  switch (stat.type) {
    case 'coin': return `코인 x${stat.value.toFixed(2)}`;
    case 'speed': return `속도 x${(1 - stat.value).toFixed(2)}`;
    case 'jackpotProb': return `잭팟 확률 +${(stat.value * 100).toFixed(1)}%`;
    case 'jackpotPower': return `잭팟 파워 +${(stat.value * 100).toFixed(0)}%`;
    case 'spaceCoin': return `우주 코인 x${stat.value.toFixed(2)}`;
  }
};

const formatPassiveDesc = (p: AmuletPassive) => {
  if (p.type === '잭팟 러시') return `상시 잭팟 확률 +5%, 잭팟 파워 +50%`;
  if (p.type === '코인 샤워') return `상시 코인 획득량 x1.5`;
  if (p.type === '행운의 파워') return `상시 행운 x1.2`;
  if (p.type === '머신 러닝') return `오토 뽑기 기능 잠금 해제`;
  if (p.type === '표준 편차') return `매 뽑기마다 48% 확률로 행운 x0.99, 52% 확률로 행운 x1.01`;
  if (p.type === '버닝 다이스') return `상시 속도 x0.9, 뽑기 시 50% 확률로 아우라 획득 개수 x2`;
  if (p.type === '은하 팽창') return `뽑기 시 행운 배수가 영구적으로 x1.0005 증가합니다.`;
  if (p.type === '광속') return `10회 뽑기 시 쿨타임이 영구적으로 x0.998 감소합니다. (최소 0.1초)`;
  if (p.type === 'Milky Way!') return `뽑기 시 31.4% 확률로 행운 배수가 x1.00314 증가합니다.`;
  return '';
};

const formatEnchantPassiveDesc = (p: string) => {
  if (p === '붉은 피의 저주') return `빨간색 계열 아우라 뽑기 시 행운 x1.005, 최소 쿨타임 0.25초`;
  if (p === '시간 여행') return `뽑기 횟수에 따라 최소 쿨타임 감소 (최대 0.1초)`;
  if (p === '멀티 다이스') return `일정 확률로 아우라 다중 획득 (최대 5개)`;
  if (p === '합성에 합성에 합성을 더해서') return `합성 시 일정 확률로 2배/3배 합성`;
  if (p === '뽑기 기계') return `오토 뽑기 해금, 매 뽑기마다 코인/우주 코인 0.5% 소모`;
  if (p === '광속 팽창') return `뽑기 시 확정적으로 행운 배수 x1.005 증가`;
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
          행운 x{(amulet.luckMultiplier * (amulet.enchantment?.statMultiplier || 1)).toFixed(2)}
        </Badge>
        {amulet.stats.map((stat, i) => (
          <Badge key={i} variant="outline" className="bg-black/20 border-white/10 text-white mr-1 mb-1">
            {stat.type === 'coin' || stat.type === 'spaceCoin' ? 
              `${stat.type === 'coin' ? '코인' : '우주 코인'} x${(stat.value * (amulet.enchantment?.statMultiplier || 1)).toFixed(2)}` :
              formatAmuletStat(stat)
            }
          </Badge>
        ))}
        {amulet.passives.map((passive, i) => (
          <div key={i} className="mt-2 p-2 rounded bg-black/30 text-xs text-slate-300 border border-white/10">
            <span className="font-bold text-white block mb-1">[{passive.type}]</span>
            {formatPassiveDesc(passive)}
          </div>
        ))}
        {amulet.enchantment && (
          <div className="mt-2 p-2 rounded bg-fuchsia-900/30 text-xs text-fuchsia-300 border border-fuchsia-500/30">
            <span className="font-bold text-fuchsia-400 block mb-1">[인챈트 {amulet.enchantment.tier}티어]</span>
            스탯 배수 x{amulet.enchantment.statMultiplier.toFixed(2)}
            {amulet.enchantment.passives.map((p, i) => (
              <div key={i} className="mt-1">
                <span className="font-bold text-fuchsia-200">[{p}]</span> {formatEnchantPassiveDesc(p)}
              </div>
            ))}
          </div>
        )}
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
    enchantAmulet,
    redeemCode,
    setAmulet,
    payCoins,
    toggleAutoRoll,
    resetGame,
    hasMachineLearning,
    setState,
    amuletStats,
    buffStats
  } = useGame();

  const [cloverAmount, setCloverAmount] = useState(1);
  const [pendingAmulet, setPendingAmulet] = useState<Amulet | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("구글 로그인 성공!");
    } catch (error: any) {
      toast.error("구글 로그인 실패: " + error.message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
      toast.success("게스트 로그인 성공!");
    } catch (error: any) {
      toast.error("게스트 로그인 실패: " + error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("로그인 성공!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("회원가입 성공!");
      }
    } catch (error: any) {
      toast.error("인증 실패: " + error.message);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">로딩 중...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-jua">
        <Toaster theme="dark" position="bottom-right" />
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-cyan-400 font-black tracking-tight">IceRNG</CardTitle>
            <CardDescription className="text-slate-400">운을 시험해보세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl">
                {isLogin ? '로그인' : '회원가입'}
              </Button>
            </form>
            
            <div className="text-center">
              <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-slate-400 hover:text-white transition-colors">
                {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
              </button>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">또는</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button onClick={handleGoogleLogin} variant="outline" className="bg-white text-black hover:bg-slate-200 font-bold py-3 rounded-xl border-0">
                구글 로그인
              </Button>
              <Button onClick={handleGuestLogin} variant="outline" className="bg-slate-800 text-white hover:bg-slate-700 font-bold py-3 rounded-xl border-slate-700">
                게스트 로그인
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpgrade = (cost: number, type: any, value: number, name: string, count: number = 1, currency: 'coins' | 'spaceCoins' | 'gems' = 'coins') => {
    if (buyUpgrade(cost, type, value, count, currency)) {
      toast.success(`${name} 구매 완료!`);
    } else {
      let currencyName = '코인';
      if (currency === 'spaceCoins') currencyName = '우주 코인';
      else if (currency === 'gems') currencyName = '보석';
      toast.error(`${currencyName}이 부족합니다.`);
    }
  };

  const handleBuyAmulet = (type: AmuletType, cost: number, currency: 'coins' | 'spaceCoins' = 'coins') => {
    const balance = currency === 'coins' ? state.coins : state.spaceCoins;
    if (balance >= cost) {
      if (currency === 'coins') {
        if (payCoins(cost)) {
          const newAmulet = generateAmulet(type);
          setPendingAmulet(newAmulet);
        }
      } else {
        // Handle space coins payment
        setState(prev => ({ ...prev, spaceCoins: prev.spaceCoins - cost }));
        const newAmulet = generateAmulet(type);
        setPendingAmulet(newAmulet);
      }
    } else {
      toast.error(`${currency === 'coins' ? '코인' : '우주 코인'}이 부족합니다.`);
    }
  };

  const totalCloverCost = 50 * cloverAmount;
  const totalCloverValue = 0.1 * cloverAmount;
  const maxClover = 1000000;
  const isCloverMaxed = state.luckyCloverCount >= maxClover;

  const quickPulseCost = QUICK_PULSE_PRICES[state.quickPulseCount] || 0;

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
                  {pendingAmulet.enchantment ? '기존 유지 (버리기)' : '기존 유지 (버리기)'}
                </Button>
                <Button className="flex-1 py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]" onClick={() => {
                  setAmulet(pendingAmulet);
                  setPendingAmulet(null);
                  toast.success(pendingAmulet.enchantment ? "인챈트된 아뮬렛을 장착했습니다!" : "새로운 아뮬렛을 장착했습니다!");
                }}>
                  {pendingAmulet.enchantment ? '인챈트 아뮬렛 장착' : '새 아뮬렛 장착'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
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
              className="bg-slate-900 border border-red-900/50 p-6 rounded-3xl max-w-md w-full shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">데이터 초기화</h2>
                <p className="text-slate-400">정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
              </div>
              <div className="flex gap-4 mt-8">
                <Button className="flex-1 py-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg rounded-xl" onClick={() => setShowResetModal(false)}>
                  취소
                </Button>
                <Button className="flex-1 py-6 bg-red-600 hover:bg-red-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]" onClick={() => {
                  localStorage.removeItem('rng-game-state-v15');
                  window.location.reload();
                }}>
                  초기화
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
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">IceRNG</h1>
              </div>
              <p className="text-xs font-medium text-cyan-400 tracking-widest uppercase">운을 시험해보세요</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">행운 배수</p>
                  <p className="text-sm font-black text-cyan-400">x{totalLuck.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">쿨타임</p>
                  <p className="text-sm font-black text-emerald-400">{(actualCooldown / 1000).toFixed(2)}초</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">총 뽑기</p>
                  <p className="text-sm font-black text-purple-400">{state.rolls.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">잭팟 확률</p>
                  <p className="text-sm font-black text-yellow-400">{totalJackpotProb.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">잭팟 파워</p>
                  <p className="text-sm font-black text-orange-400">+{totalJackpotPower.toFixed(0)}%</p>
                </div>
              </div>

              {/* Buffs Display */}
              {(state.activeBuffs.length > 0 || Object.entries(state.passiveCooldowns).some(([_, cd]) => (cd as number) > Date.now())) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Array.from(new Set(state.activeBuffs.map(b => b.type))).map(type => {
                    const buff = state.activeBuffs.find(b => b.type === type)!;
                    const isDebuff = buff.type === '재의 저주' || buff.type === '버닝';
                    const colorClass = isDebuff ? 'bg-red-900/30 border-red-500/50 text-red-300' : 'bg-indigo-900/30 border-indigo-500/50 text-indigo-300';
                    const Icon = buff.type === '버닝' ? Flame : buff.type === '재의 저주' ? Skull : Activity;
                    return (
                      <Badge key={type} variant="outline" className={`${colorClass} py-0.5 px-2 text-[10px]`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {buff.type} 
                        {buff.stacks ? ` (${buff.stacks})` : ''}
                        <span className="ml-1 opacity-70">{Math.ceil((buff.expiry - Date.now()) / 1000)}s</span>
                      </Badge>
                    );
                  })}
                  {Object.entries(state.passiveCooldowns).map(([type, cd], idx) => {
                    if ((cd as number) <= Date.now()) return null;
                    return (
                      <Badge key={`cd-${idx}`} variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-400 py-0.5 px-2 text-[10px]">
                        <Timer className="w-3 h-3 mr-1" />
                        {type} CD
                        <span className="ml-1 opacity-70">{Math.ceil(((cd as number) - Date.now()) / 1000)}s</span>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Quick Stats next to IceRNG */}
            <div className="hidden md:flex items-center gap-4 ml-6 pl-6 border-l border-slate-800">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">코인</p>
                <p className="text-lg font-black text-yellow-400 flex items-center justify-center gap-1">
                  <Coins className="w-4 h-4" />
                  {formatNumber(state.coins)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">우주 코인</p>
                <p className="text-lg font-black text-indigo-400 flex items-center justify-center gap-1">
                  <Globe className="w-4 h-4" />
                  {formatNumber(state.spaceCoins)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">보석</p>
                <p className="text-lg font-black text-fuchsia-400 flex items-center justify-center gap-1">
                  <Gem className="w-4 h-4" />
                  {formatNumber(state.gems)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="md:hidden flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="font-black text-yellow-400 text-lg">{formatNumber(state.coins)}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
                <Globe className="w-5 h-5 text-indigo-400" />
                <span className="font-black text-indigo-400 text-lg">{formatNumber(state.spaceCoins)}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
                <Gem className="w-5 h-5 text-fuchsia-400" />
                <span className="font-black text-fuchsia-400 text-lg">{formatNumber(state.gems)}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={resetGame}
              className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="데이터 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
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
                          +{formatNumber(state.lastRollStatus?.earnedCoins || 0)} 코인 {state.lastRollStatus?.isJackpot && '(잭팟!)'}
                        </div>
                        {state.lastRollStatus?.earnedSpaceCoins ? (
                          <div className="text-indigo-400/80 font-bold text-sm flex items-center gap-1">
                            +{formatNumber(state.lastRollStatus.earnedSpaceCoins)} 우주 코인 {state.lastRollStatus?.isJackpot && '(잭팟!)'}
                          </div>
                        ) : null}
                        {state.lastRollStatus?.earnedGems ? (
                          <div className="text-fuchsia-400/80 font-bold text-sm flex items-center gap-1">
                            +{formatNumber(state.lastRollStatus.earnedGems)} 보석
                          </div>
                        ) : null}
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
                <TabsTrigger value="inventory" className="flex-1 rounded-xl py-3 text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                  <InventoryIcon className="w-4 h-4 mr-2" /> 인벤토리
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 rounded-xl py-3 text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                  <Settings className="w-4 h-4 mr-2" /> 설정
                </TabsTrigger>
                {state.gems > 0 && (
                  <TabsTrigger value="enchant" className="flex-1 rounded-xl py-3 text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    <Gem className="w-4 h-4 mr-2" /> 인챈트
                  </TabsTrigger>
                )}
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

                    {state.quickPulseCount < 10 && (
                      <ShopItem 
                        name="신속의 파동" 
                        desc="-0.08초 쿨타임 감소" 
                        cost={quickPulseCost} 
                        icon={<Timer className="w-4 h-4" />}
                        onBuy={() => handleUpgrade(quickPulseCost, 'cooldown', 0.08, "신속의 파동")}
                      />
                    )}

                    {state.jackpotProbLevel < 80 && (
                      <ShopItem 
                        name="잭팟 확률 증가" 
                        desc={`+1% 확률로 잭팟 발동 (현재: ${state.jackpotProbLevel}%)`}
                        cost={Math.floor(1000 * Math.pow(2, 2 + 0.1 * state.jackpotProbLevel))} 
                        icon={<Star className="w-4 h-4" />}
                        onBuy={() => handleUpgrade(Math.floor(1000 * Math.pow(2, 2 + 0.1 * state.jackpotProbLevel)), 'jackpotProb', 1, "잭팟 확률 증가")}
                      />
                    )}

                    {state.jackpotPowerLevel < 30 && (
                      <ShopItem 
                        name="잭팟 파워 증가" 
                        desc={`+10% 잭팟 보상 배수 (현재: +${state.jackpotPowerLevel * 10}%)`}
                        cost={Math.floor(1000 * Math.pow(2, 2 + 0.1 * state.jackpotPowerLevel))} 
                        icon={<Activity className="w-4 h-4" />}
                        onBuy={() => handleUpgrade(Math.floor(1000 * Math.pow(2, 2 + 0.1 * state.jackpotPowerLevel)), 'jackpotPower', 1, "잭팟 파워 증가")}
                      />
                    )}

                    {!state.synthesizerUnlocked && (
                      <ShopItem 
                        name="아우라 합성소 해금" 
                        desc="같은 아우라 5개를 모아 상위 아우라로 합성합니다." 
                        cost={10000} 
                        icon={<Zap className="w-4 h-4" />}
                        onBuy={() => handleUpgrade(10000, 'synthesizer', 0, "아우라 합성소")}
                      />
                    )}

                    {(state.spaceCoins > 0 || state.spaceJackpotPowerLevel > 0 || state.spaceCoinMultLevel > 0 || state.spaceLuckLevel > 0) && (
                      <>
                        <div className="pt-4 pb-2">
                          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <Globe className="w-4 h-4" /> 우주 코인 업그레이드
                          </h3>
                        </div>
                        
                        {state.spaceJackpotPowerLevel < 15 && (
                          <ShopItem 
                            name="우주적 잭팟 파워" 
                            desc={`+20% 잭팟 보상 배수 (현재: +${state.spaceJackpotPowerLevel * 20}%)`}
                            cost={Math.floor(100 * Math.pow(2, state.spaceJackpotPowerLevel))} 
                            icon={<Activity className="w-4 h-4 text-indigo-400" />}
                            onBuy={() => handleUpgrade(Math.floor(100 * Math.pow(2, state.spaceJackpotPowerLevel)), 'spaceJackpotPower', 1, "우주적 잭팟 파워", 1, 'spaceCoins')}
                            currency="spaceCoins"
                          />
                        )}

                        {state.spaceCoinMultLevel < 5 && (
                          <ShopItem 
                            name="우주적 코인 증폭" 
                            desc={`+20% 우주 코인 획득량 (현재: +${state.spaceCoinMultLevel * 20}%, 최대 +100%)`}
                            cost={Math.floor(10 * Math.pow(2, state.spaceCoinMultLevel))} 
                            icon={<Globe className="w-4 h-4 text-indigo-400" />}
                            onBuy={() => handleUpgrade(Math.floor(10 * Math.pow(2, state.spaceCoinMultLevel)), 'spaceCoinMult', 1, "우주적 코인 증폭", 1, 'spaceCoins')}
                            currency="spaceCoins"
                          />
                        )}

                        {state.spaceLuckLevel < 50000 && (
                          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">우주적 행운</span>
                                  <span className="text-[10px] text-slate-500 font-medium">+{0.2 * state.spaceLuckLevel}x 행운 배수 (Lv.{state.spaceLuckLevel}/50000)</span>
                                </div>
                              </div>
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={() => handleUpgrade(10 * cloverAmount, 'spaceLuck', 1, `우주적 행운 x${cloverAmount}`, cloverAmount, 'spaceCoins')}
                                disabled={state.spaceCoins < 10 * cloverAmount}
                                className="bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800/50 text-[10px] font-black h-8 px-4 rounded-lg disabled:opacity-50"
                              >
                                {(10 * cloverAmount).toLocaleString()}
                              </Button>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {[1, 5, 10, 50, 100, 1000, 10000].map(amt => (
                                <button 
                                  key={amt}
                                  onClick={() => setCloverAmount(amt)}
                                  className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-colors ${cloverAmount === amt ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                  x{amt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {(state.gems > 0 || state.gemLuckLevel > 0 || state.enchantTableUnlocked) && (
                      <>
                        <div className="pt-4 pb-2">
                          <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                            <Gem className="w-4 h-4" /> 보석 업그레이드
                          </h3>
                        </div>

                        {state.gemMultLevel < 5 && (
                          <ShopItem 
                            name="보석 배수 증가" 
                            desc={`+20% 보석 획득량 (현재: +${state.gemMultLevel * 20}%, 최대 +100%)`}
                            cost={[10, 20, 50, 100, 500][state.gemMultLevel]} 
                            icon={<Gem className="w-4 h-4 text-fuchsia-400" />}
                            onBuy={() => handleUpgrade([10, 20, 50, 100, 500][state.gemMultLevel], 'gemMult', 0.2, "보석 배수 증가", 1, 'gems')}
                            currency="gems"
                          />
                        )}

                        {!state.enchantTableUnlocked && (
                          <ShopItem 
                            name="인챈트 테이블 해금" 
                            desc="아뮬렛에 추가 스탯과 패시브를 부여할 수 있습니다." 
                            cost={50} 
                            icon={<Zap className="w-4 h-4 text-fuchsia-400" />}
                            onBuy={() => handleUpgrade(50, 'enchantTable', 1, "인챈트 테이블", 1, 'gems')}
                            currency="gems"
                          />
                        )}

                        {state.gemLuckLevel < 50000 && (
                          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-fuchsia-400">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">보석 행운</span>
                                  <span className="text-[10px] text-slate-500 font-medium">+{0.5 * state.gemLuckLevel}x 행운 배수 (Lv.{state.gemLuckLevel}/50000)</span>
                                </div>
                              </div>
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={() => handleUpgrade(1 * cloverAmount, 'gemLuck', 0.5 * cloverAmount, `보석 행운 +${0.5 * cloverAmount}x`, cloverAmount, 'gems')}
                                disabled={state.gems < 1 * cloverAmount || state.gemLuckLevel + cloverAmount > 50000}
                                className="bg-fuchsia-900/50 text-fuchsia-200 hover:bg-fuchsia-800/50 text-[10px] font-black h-8 px-4 rounded-lg disabled:opacity-50"
                              >
                                {(1 * cloverAmount).toLocaleString()}
                              </Button>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {[1, 5, 10, 50, 100, 1000, 10000].map(amt => (
                                <button 
                                  key={amt}
                                  onClick={() => setCloverAmount(amt)}
                                  className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-colors ${cloverAmount === amt ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                  x{amt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
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
                    <Button variant="outline" className="bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 flex flex-col h-auto py-2" onClick={() => handleBuyAmulet('Dimensional', 5000, 'spaceCoins')}>
                      <span className="font-bold text-xs">차원 아뮬렛</span>
                      <span className="text-[10px] flex items-center gap-1"><Globe className="w-3 h-3" /> 5,000</span>
                    </Button>
                    <Button variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 flex flex-col h-auto py-2" onClick={() => handleBuyAmulet('Galactic', 20000, 'spaceCoins')}>
                      <span className="font-bold text-xs">은하 아뮬렛</span>
                      <span className="text-[10px] flex items-center gap-1"><Globe className="w-3 h-3" /> 20,000</span>
                    </Button>
                  </div>
                  <CardContent className="p-4 flex-1 overflow-y-auto">
                    <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">현재 장착된 아뮬렛</h3>
                    <AmuletCard amulet={state.amulet} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="enchant">
                <Card className="bg-slate-900/20 border-slate-800/50 h-[650px] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-800/50">
                    <CardTitle className="text-lg text-white">인챈트 테이블</CardTitle>
                    <CardDescription>아뮬렛에 추가 스탯과 패시브를 부여할 수 있습니다.</CardDescription>
                  </div>
                  <CardContent className="p-4 flex-1 overflow-y-auto">
                    {state.enchantTableUnlocked && state.amulet ? (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                          <Zap className="w-4 h-4" /> 인챈트 테이블
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Button 
                            variant="outline" 
                            className="bg-fuchsia-950/30 border-fuchsia-800/50 text-fuchsia-500 hover:bg-fuchsia-900/50 flex flex-col h-auto py-3" 
                            onClick={() => {
                              if (!state.amulet) { toast.error("아뮬렛을 장착하세요."); return; }
                              const newAmulet = enchantAmulet(1);
                              if (newAmulet) {
                                setPendingAmulet(newAmulet);
                                toast.success("새로운 아뮬렛 발견!");
                              } else toast.error("보석이 부족합니다.");
                            }}
                          >
                            <span className="font-bold text-xs mb-1">1티어 인챈트</span>
                            <span className="text-[10px] flex items-center gap-1"><Gem className="w-3 h-3" /> 10</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="bg-fuchsia-900/40 border-fuchsia-700/50 text-fuchsia-400 hover:bg-fuchsia-800/50 flex flex-col h-auto py-3" 
                            onClick={() => {
                              if (!state.amulet) { toast.error("아뮬렛을 장착하세요."); return; }
                              const newAmulet = enchantAmulet(2);
                              if (newAmulet) {
                                setPendingAmulet(newAmulet);
                                toast.success("새로운 아뮬렛 발견!");
                              } else toast.error("보석이 부족합니다.");
                            }}
                          >
                            <span className="font-bold text-xs mb-1">2티어 인챈트</span>
                            <span className="text-[10px] flex items-center gap-1"><Gem className="w-3 h-3" /> 50</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="bg-fuchsia-800/50 border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-700/50 flex flex-col h-auto py-3" 
                            onClick={() => {
                              if (!state.amulet) { toast.error("아뮬렛을 장착하세요."); return; }
                              const newAmulet = enchantAmulet(3);
                              if (newAmulet) {
                                setPendingAmulet(newAmulet);
                                toast.success("새로운 아뮬렛 발견!");
                              } else toast.error("보석이 부족합니다.");
                            }}
                          >
                            <span className="font-bold text-xs mb-1">3티어 인챈트</span>
                            <span className="text-[10px] flex items-center gap-1"><Gem className="w-3 h-3" /> 200</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Zap className="w-12 h-12 mb-4 opacity-20" />
                        <p>인챈트 테이블을 잠금 해제하거나 아뮬렛을 장착하세요.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory">
                <Card className="bg-slate-900/20 border-slate-800/50 h-[650px] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-800/50">
                    <CardTitle className="text-lg text-white">인벤토리</CardTitle>
                    <CardDescription>획득한 아우라 목록입니다.</CardDescription>
                  </div>
                  <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                      {RARITIES.map((rarity) => {
                        const count = state.inventory[rarity.name] || 0;
                        if (count === 0) return null;
                        return (
                          <div key={rarity.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                            <div className="flex items-center gap-3">
                              {getIcon(rarity.icon, `w-5 h-5 ${rarity.color}`)}
                              <span className={`font-bold ${rarity.color}`}>{rarity.name}</span>
                            </div>
                            <span className="text-slate-400 text-sm font-bold">x{formatNumber(count)}</span>
                          </div>
                        );
                      })}
                      {Object.keys(state.inventory).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-600">
                          <InventoryIcon className="w-12 h-12 mb-4 opacity-10" />
                          <p className="text-sm font-medium">인벤토리가 비어있습니다</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="bg-slate-900/20 border-slate-800/50 h-[650px] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-800/50">
                    <CardTitle className="text-lg text-white">설정</CardTitle>
                    <CardDescription>게임 설정 및 코드 입력</CardDescription>
                  </div>
                  <CardContent className="p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">코드 입력</h3>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          id="redeemCodeInput"
                          placeholder="코드를 입력하세요" 
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                        <Button 
                          onClick={() => {
                            const input = document.getElementById('redeemCodeInput') as HTMLInputElement;
                            if (input && input.value) {
                              if (input.value === 'RESET') {
                                resetGame();
                                return;
                              }
                              const res = redeemCode(input.value);
                              if (res.success) {
                                toast.success(res.message);
                                input.value = '';
                              } else {
                                toast.error(res.message);
                              }
                            }
                          }}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                        >
                          확인
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">업데이트 로그</h3>
                      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
                        <p className="font-bold text-cyan-400">v1.5 업데이트</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>우주 코인 및 보석 화폐 추가</li>
                          <li>신규 아우라 5종 추가</li>
                          <li>인챈트 시스템 추가</li>
                          <li>설정 탭 및 인벤토리 탭 추가</li>
                          <li>UI 개선 및 밸런스 조정</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">계정 관리</h3>
                      <Button 
                        variant="outline" 
                        className="w-full font-bold border-red-900/50 text-red-400 hover:bg-red-900/20"
                        onClick={() => signOut(auth)}
                      >
                        로그아웃
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">위험 구역</h3>
                      <Button 
                        variant="destructive" 
                        className="w-full font-bold"
                        onClick={() => setShowResetModal(true)}
                      >
                        데이터 초기화
                      </Button>
                    </div>
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
                        <h3 className="text-sm font-bold text-slate-400 mb-2">지구 아우라</h3>
                        {RARITIES.slice(0, -1).map((rarity, idx) => {
                          const count = state.inventory[rarity.name] || 0;
                          const nextRarity = RARITIES[idx + 1];
                          if (nextRarity.name === 'Aleph-0' && (state.inventory['Infinite'] || 0) < 314) return null;
                          
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
      {/* Enchant Modal removed */}
    </div>
  );
}

function ShopItem({ name, desc, cost, icon, onBuy, disabled = false, currency = 'coins' }: any) {
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
        className="bg-white text-black hover:bg-cyan-50 text-[10px] font-black h-8 px-4 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
      >
        {currency === 'spaceCoins' && <Globe className="w-3 h-3" />}
        {cost.toLocaleString()}
      </Button>
    </div>
  );
}
