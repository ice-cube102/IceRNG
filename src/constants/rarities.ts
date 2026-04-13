export interface Rarity {
  name: string;
  chance: number; // 1 in X
  color: string;
  glowColor: string;
  description: string;
  coinValue: number;
  spaceCoinValue?: number;
  gemValue?: number;
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
    coinValue: 500000,
    spaceCoinValue: 1,
    icon: "Globe"
  },
  {
    name: "Universal",
    chance: 10000000,
    color: "text-pink-500",
    glowColor: "shadow-pink-500/90",
    description: "모든 것의 시작이자 끝입니다.",
    coinValue: 2000000,
    spaceCoinValue: 5,
    icon: "Moon"
  },
  {
    name: "Dimensional",
    chance: 50000000,
    color: "text-teal-400",
    glowColor: "shadow-teal-400/90",
    description: "차원의 경계를 허무는 신비로운 기운입니다.",
    coinValue: 10000000,
    spaceCoinValue: 25,
    icon: "Cloud"
  },
  {
    name: "Ethereal",
    chance: 250000000,
    color: "text-emerald-400",
    glowColor: "shadow-emerald-400/90",
    description: "형체를 알 수 없는 영적인 에너지입니다.",
    coinValue: 40000000,
    spaceCoinValue: 100,
    icon: "Eye"
  },
  {
    name: "Omniscient",
    chance: 1000000000,
    color: "text-rose-500",
    glowColor: "shadow-rose-500/90",
    description: "모든 것을 꿰뚫어 보는 전지전능한 아우라입니다.",
    coinValue: 150000000,
    spaceCoinValue: 500,
    icon: "Sparkles"
  },
  {
    name: "Singularity",
    chance: 5000000000,
    color: "text-fuchsia-500",
    glowColor: "shadow-fuchsia-500/100",
    description: "시공간이 붕괴되는 특이점의 폭발입니다.",
    coinValue: 600000000,
    spaceCoinValue: 2500,
    icon: "Zap"
  },
  {
    name: "Transcendent",
    chance: 25000000000,
    color: "text-amber-500",
    glowColor: "shadow-amber-500/100",
    description: "필멸의 한계를 초월한 절대자의 기운입니다.",
    coinValue: 2500000000,
    spaceCoinValue: 10000,
    icon: "Crown"
  },
  {
    name: "Absolute",
    chance: 100000000000,
    color: "text-red-600",
    glowColor: "shadow-red-600/100",
    description: "절대적인 힘을 가진 아우라입니다.",
    coinValue: 10000000000,
    spaceCoinValue: 50000,
    icon: "Flame"
  },
  {
    name: "Eternal",
    chance: 500000000000,
    color: "text-blue-600",
    glowColor: "shadow-blue-600/100",
    description: "영원불멸의 에너지가 소용돌이칩니다.",
    coinValue: 40000000000,
    spaceCoinValue: 250000,
    icon: "Circle"
  },
  {
    name: "Uranium",
    chance: 2500000000000,
    color: "text-green-600",
    glowColor: "shadow-green-600/100",
    description: "태초의 우주가 품고 있던 근원의 힘입니다.",
    coinValue: 50000000000,
    spaceCoinValue: 250000,
    gemValue: 1,
    icon: "Hexagon"
  },
  {
    name: "Apex",
    chance: 10000000000000,
    color: "text-purple-600",
    glowColor: "shadow-purple-600/100",
    description: "모든 아우라의 정점에 선 존재입니다.",
    coinValue: 150000000000,
    spaceCoinValue: 1000000,
    gemValue: 3,
    icon: "Star"
  },
  {
    name: "Genesis",
    chance: 50000000000000,
    color: "text-yellow-600",
    glowColor: "shadow-yellow-600/100",
    description: "새로운 우주를 창조할 수 있는 기운입니다.",
    coinValue: 500000000000,
    spaceCoinValue: 5000000,
    gemValue: 10,
    icon: "Sun"
  },
  {
    name: "Aetherial",
    chance: 250000000000000,
    color: "text-cyan-500",
    glowColor: "shadow-cyan-500/100",
    description: "천상의 빛을 발산하는 신성한 아우라입니다.",
    coinValue: 1500000000000,
    spaceCoinValue: 20000000,
    gemValue: 30,
    icon: "Cloud"
  },
  {
    name: "Astral",
    chance: 1000000000000000,
    color: "text-indigo-600",
    glowColor: "shadow-indigo-600/100",
    description: "별들의 영혼이 깃든 아우라입니다.",
    coinValue: 5000000000000,
    spaceCoinValue: 80000000,
    gemValue: 100,
    icon: "Star"
  },
  {
    name: "Void",
    chance: 5000000000000000,
    color: "text-slate-800",
    glowColor: "shadow-slate-800/100",
    description: "모든 것을 집어삼키는 공허의 힘입니다.",
    coinValue: 20000000000000,
    spaceCoinValue: 300000000,
    gemValue: 300,
    icon: "Moon"
  },
  {
    name: "Enigma",
    chance: 25000000000000000,
    color: "text-fuchsia-600",
    glowColor: "shadow-fuchsia-600/100",
    description: "해독할 수 없는 우주의 수수께끼입니다.",
    coinValue: 80000000000000,
    spaceCoinValue: 1000000000,
    gemValue: 1000,
    icon: "Eye"
  },
  {
    name: "Zenith",
    chance: 100000000000000000,
    color: "text-rose-600",
    glowColor: "shadow-rose-600/100",
    description: "도달할 수 있는 가장 높은 경지입니다.",
    coinValue: 300000000000000,
    spaceCoinValue: 5000000000,
    gemValue: 3000,
    icon: "Crown"
  },
  {
    name: "Infinite",
    chance: 500000000000000000,
    color: "text-white",
    glowColor: "shadow-white/100",
    description: "무한한 가능성. 우주의 진리 그 자체입니다.",
    coinValue: 1000000000000000,
    spaceCoinValue: 25000000000,
    gemValue: 10000,
    icon: "Infinity"
  },
  {
    name: "Aleph-0",
    chance: 1000000000000000000,
    color: "text-white",
    glowColor: "shadow-white/100",
    description: "무한을 넘어선 첫 번째 수.",
    coinValue: 10000000000000000,
    spaceCoinValue: 250000000000,
    gemValue: 100000,
    icon: "Sigma"
  }
];
