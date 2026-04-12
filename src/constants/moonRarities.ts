export interface Rarity {
  name: string;
  chance: number; // 1 in X
  color: string;
  glowColor: string;
  description: string;
  coinValue: number;
  icon: string;
}

export const MOON_RARITIES: Rarity[] = [
  {
    name: "Stardust",
    chance: 2,
    color: "text-slate-300",
    glowColor: "shadow-slate-300/20",
    description: "우주의 먼지입니다.",
    coinValue: 1,
    icon: "Sparkles"
  },
  {
    name: "Meteorite",
    chance: 10,
    color: "text-stone-400",
    glowColor: "shadow-stone-400/20",
    description: "우주에서 날아온 운석입니다.",
    coinValue: 5,
    icon: "Hexagon"
  },
  {
    name: "Lunar Eclipse",
    chance: 50,
    color: "text-red-300",
    glowColor: "shadow-red-300/30",
    description: "달이 태양을 가리는 현상입니다.",
    coinValue: 30,
    icon: "Moon"
  },
  {
    name: "Supernova",
    chance: 250,
    color: "text-orange-400",
    glowColor: "shadow-orange-400/40",
    description: "별의 화려한 최후입니다.",
    coinValue: 200,
    icon: "Sun"
  },
  {
    name: "Black Hole",
    chance: 1000,
    color: "text-zinc-900",
    glowColor: "shadow-zinc-900/80",
    description: "빛조차 빠져나갈 수 없는 공간입니다.",
    coinValue: 1000,
    icon: "Circle"
  },
  {
    name: "Quasar",
    chance: 5000,
    color: "text-cyan-300",
    glowColor: "shadow-cyan-300/60",
    description: "우주에서 가장 밝은 천체입니다.",
    coinValue: 6000,
    icon: "Zap"
  },
  {
    name: "Dark Matter",
    chance: 25000,
    color: "text-purple-900",
    glowColor: "shadow-purple-900/70",
    description: "우주의 대부분을 차지하는 미지의 물질입니다.",
    coinValue: 40000,
    icon: "Cloud"
  },
  {
    name: "Cosmic Web",
    chance: 100000,
    color: "text-indigo-400",
    glowColor: "shadow-indigo-400/80",
    description: "우주의 거대한 구조망입니다.",
    coinValue: 200000,
    icon: "Globe"
  },
  {
    name: "Uranium",
    chance: 500000,
    color: "text-green-500",
    glowColor: "shadow-green-500/90",
    description: "지하 세계로 가는 열쇠가 될 방사성 물질입니다.",
    coinValue: 1500000,
    icon: "Triangle"
  },
  {
    name: "Antimatter",
    chance: 2500000,
    color: "text-rose-600",
    glowColor: "shadow-rose-600/100",
    description: "물질과 반대되는 성질을 가진 반물질입니다.",
    coinValue: 10000000,
    icon: "Flame"
  },
  {
    name: "Multiverse",
    chance: 10000000,
    color: "text-fuchsia-400",
    glowColor: "shadow-fuchsia-400/100",
    description: "수많은 우주가 겹쳐진 다중 우주입니다.",
    coinValue: 50000000,
    icon: "Infinity"
  },
  {
    name: "The Big Bang",
    chance: 50000000,
    color: "text-yellow-200",
    glowColor: "shadow-yellow-200/100",
    description: "우주의 탄생, 그 자체입니다.",
    coinValue: 300000000,
    icon: "Crown"
  }
];
