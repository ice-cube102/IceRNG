export interface Rarity {
  name: string;
  chance: number; // 1 in X
  color: string;
  glowColor: string;
  description: string;
  coinValue: number;
  icon: string;
}

export const RARITIES: Rarity[] = [
  {
    name: "Common",
    chance: 2,
    color: "text-slate-400",
    glowColor: "shadow-slate-400/20",
    description: "어디서나 볼 수 있는 흔한 기운입니다.",
    coinValue: 1,
    icon: "Circle"
  },
  {
    name: "Uncommon",
    chance: 5,
    color: "text-green-400",
    glowColor: "shadow-green-400/20",
    description: "조금은 특별한 초록빛 기운입니다.",
    coinValue: 5,
    icon: "Square"
  },
  {
    name: "Rare",
    chance: 20,
    color: "text-blue-400",
    glowColor: "shadow-blue-400/30",
    description: "푸른빛이 감도는 희귀한 기운입니다.",
    coinValue: 25,
    icon: "Triangle"
  },
  {
    name: "Epic",
    chance: 100,
    color: "text-purple-400",
    glowColor: "shadow-purple-400/40",
    description: "보랏빛 영웅의 기운이 느껴집니다.",
    coinValue: 150,
    icon: "Star"
  },
  {
    name: "Legendary",
    chance: 1000,
    color: "text-yellow-400",
    glowColor: "shadow-yellow-400/50",
    description: "전설 속에 등장하는 황금빛 아우라입니다.",
    coinValue: 2000,
    icon: "Hexagon"
  },
  {
    name: "Mythic",
    chance: 10000,
    color: "text-red-400",
    glowColor: "shadow-red-400/60",
    description: "신화적인 붉은 에너지가 폭발합니다.",
    coinValue: 25000,
    icon: "Flame"
  },
  {
    name: "Celestial",
    chance: 100000,
    color: "text-cyan-400",
    glowColor: "shadow-cyan-400/70",
    description: "천상의 우주 에너지가 응집되어 있습니다.",
    coinValue: 300000,
    icon: "Sun"
  },
  {
    name: "Galactic",
    chance: 1000000,
    color: "text-indigo-500",
    glowColor: "shadow-indigo-500/80",
    description: "은하계 전체의 힘을 담은 경이로운 아우라입니다.",
    coinValue: 5000000,
    icon: "Globe"
  },
  {
    name: "Universal",
    chance: 10000000,
    color: "text-pink-500",
    glowColor: "shadow-pink-500/90",
    description: "모든 것의 시작이자 끝입니다.",
    coinValue: 100000000,
    icon: "Moon"
  },
  {
    name: "Infinite",
    chance: 100000000,
    color: "text-white",
    glowColor: "shadow-white/100",
    description: "무한한 가능성. 우주의 진리 그 자체입니다.",
    coinValue: 2000000000,
    icon: "Infinity"
  }
];
