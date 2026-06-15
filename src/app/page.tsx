/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MAJOR_ARCANA, MINOR_ARCANA, FULL_DECK } from "../deck";
import { SKINS, TarotSkin } from "../skins";

// --- CONSTANTS ---
const DEFAULT_SKIN = SKINS[0]; // Assuming the first skin is the default

// --- TYPES ---
type DeckType = "Major" | "Minor" | "Full";

type DeckInstance = {
  id: DeckType;
  cards: string[];
  gradient: string;
  borderColor: string;
  shadowColor: string;
  isShuffling: boolean;
};

type TarotCard = {
  id: string;
  name: string;
  isFlipped: boolean;
  isReversed: boolean;
  zIndex: number;
  x: number;
  y: number;
  backGradient: string;
  borderColor: string;
  skinFolder: string;
};

// --- HELPERS ---
function shuffle(array: string[]) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function formatFileName(name: string) {
  return name.toLowerCase().replace(/\s+/g, "") + ".jpg";
}

function getDeckShadow(count: number, color: string) {
  const visualCount = Math.min(count, 20);
  const thickness = Math.ceil(visualCount / 2.5);
  let shadow = "";
  for (let i = 1; i <= thickness; i++) {
    shadow += `${i}px ${i}px 0px ${color}${i === thickness ? "" : ", "}`;
  }
  return shadow || "0px 0px 0px transparent";
}

function generateNewCard(
  name: string,
  currentMaxZ: number,
  backGradient: string,
  borderColor: string,
  skinFolder: string
): TarotCard {
  return {
    id: Math.random().toString(36).substring(2, 9),
    name: name,
    isFlipped: false,
    isReversed: Math.random() > 0.8,
    zIndex: currentMaxZ + 1,
    x: (Math.random() - 0.5) * 150,
    y: (Math.random() - 0.5) * 150,
    backGradient,
    borderColor,
    skinFolder,
  };
}

export default function Home() {
  const [introStage, setIntroStage] = useState<"black" | "center" | "moving" | "done">("black");
  const [activeDecks, setActiveDecks] = useState<DeckInstance[]>([]);
  const [cardsOnTable, setCardsOnTable] = useState<TarotCard[]>([]);
  const [maxZ, setMaxZ] = useState(1);
  const [selectedSkin, setSelectedSkin] = useState<TarotSkin>(SKINS[0]);
  const [isSkinMenuOpen, setIsSkinMenuOpen] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setIntroStage("center"), 800);
    const t2 = setTimeout(() => {
      setActiveDecks([
        {
          id: "Major",
          cards: shuffle(MAJOR_ARCANA),
          gradient: "#450a0a",
          borderColor: "border-red-500/40",
          shadowColor: "#2a0000",
          isShuffling: false,
        },
      ]);
      setIntroStage("moving");
    }, 2000);
    const t3 = setTimeout(() => setIntroStage("done"), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const toggleDeck = (type: DeckType) => {
    const exists = activeDecks.find((d) => d.id === type);
    if (exists) {
      setActiveDecks(activeDecks.filter((d) => d.id !== type));
    } else {
      const base = type === "Major" ? MAJOR_ARCANA : type === "Minor" ? MINOR_ARCANA : FULL_DECK;
      const config = {
        Major: { grad: "#450a0a", border: "border-red-500/40", shadow: "#2a0000" },
        Minor: { grad: "#172554", border: "border-blue-500/40", shadow: "#000814" },
        Full: { grad: "#312e81", border: "border-indigo-500/40", shadow: "#0f0c29" },
      }[type];

      setActiveDecks([...activeDecks, {
        id: type,
        cards: shuffle(base),
        gradient: config.grad,
        borderColor: config.border,
        shadowColor: config.shadow,
        isShuffling: false,
      }]);
    }
  };

  const drawCard = (deckId: DeckType) => {
    const targetDeck = activeDecks.find((d) => d.id === deckId);
    if (!targetDeck || targetDeck.cards.length === 0 || targetDeck.isShuffling) return;

    const newCard = generateNewCard(targetDeck.cards[0], maxZ, targetDeck.gradient, targetDeck.borderColor, selectedSkin.folder);
    setMaxZ((prev) => prev + 1);
    setCardsOnTable((prev) => [...prev, newCard]);
    setActiveDecks((prev) => prev.map((d) => (d.id === deckId ? { ...d, cards: d.cards.slice(1) } : d)));
  };

  const flipCard = (id: string) => {
    setCardsOnTable((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: !c.isFlipped, zIndex: maxZ + 1 } : c)));
    setMaxZ((prev) => prev + 1);
  };

  const shuffleIndividualDeck = (type: DeckType) => {
    setActiveDecks((prev) => prev.map((d) => d.id === type ? { ...d, isShuffling: true } : d));
    setTimeout(() => {
      setActiveDecks((prev) =>
        prev.map((d) => (d.id === type ? { ...d, cards: shuffle(d.cards), isShuffling: false } : d))
      );
    }, 800);
  };

  const resetAll = () => {
    setCardsOnTable([]);
    setActiveDecks((prev) => prev.map((d) => {
      const base = d.id === "Major" ? MAJOR_ARCANA : d.id === "Minor" ? MINOR_ARCANA : FULL_DECK;
      return { ...d, cards: shuffle(base) };
    }));
  };

  return (
    <main className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans relative">
      <AnimatePresence>
        {introStage !== "done" && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="fixed inset-0 bg-black z-50 pointer-events-none" />
        )}
      </AnimatePresence>

      {/* 1. INTRO DECK */}
      <AnimatePresence>
        {introStage === "center" && (
          <div className="fixed inset-0 z-60 flex items-center justify-center pointer-events-none">
            <motion.div
              layoutId="shared-major-deck"
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1.6, opacity: 1 }}
              exit={{ scale: 1 }}
              transition={{ 
                layout: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] },
                opacity: { duration: 0.5 }
              }}
              className="w-28 h-40 rounded-2xl border-2 border-red-500/40 relative bg-zinc-900 shadow-2xl"
              style={{ boxShadow: getDeckShadow(20, "#2a0000") }}
            >
              <img 
                src={`/images/${selectedSkin.folder}/back.jpg`} 
                onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== `/images/${DEFAULT_SKIN.folder}/back.jpg`) {
                        target.src = `/images/${DEFAULT_SKIN.folder}/back.jpg`;
                    }
                }}
                draggable={false} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 rounded-2xl" 
              />
              <div className="absolute inset-0 mix-blend-multiply rounded-2xl" style={{ backgroundColor: "#450a0a" }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <motion.header
        animate={{ opacity: introStage === "done" ? 1 : 0, y: introStage === "done" ? 0 : -20 }}
        className="h-24 bg-zinc-900 border-b border-zinc-800 flex items-center z-40 shadow-xl"
      >
        <div className="w-60 flex justify-center items-center h-full border-r border-zinc-800 flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2">Select your deck</span>
          <div className="flex gap-1 bg-black p-1 rounded-xl border border-zinc-800">
            {(["Major", "Minor", "Full"] as DeckType[]).map((type) => (
              <button
                key={type}
                onClick={() => toggleDeck(type)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase ${
                  activeDecks.find((d) => d.id === type) ? "text-amber-400 bg-zinc-800" : "text-zinc-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex justify-center"><h1 className="text-2xl font-serif font-black text-amber-500 tracking-[0.4em] uppercase text-center">Tarot Reader</h1></div>
        <div className="w-60 flex justify-center items-center relative">
          <button onClick={() => setIsSkinMenuOpen(!isSkinMenuOpen)} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-amber-500/50 transition-all">Skin: {selectedSkin.name}</button>
          <AnimatePresence>
            {isSkinMenuOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-14 bg-zinc-900 border border-zinc-800 p-2 rounded-xl shadow-2xl min-w-35 z-50">
                {SKINS.map((skin) => (
                  <button key={skin.name} onClick={() => { setSelectedSkin(skin); setIsSkinMenuOpen(false); }} className="w-full text-left px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-md transition-all">{skin.name}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-60 bg-zinc-900/40 border-r border-zinc-800 flex flex-col justify-evenly items-center p-6 z-30 shadow-inner">
          <AnimatePresence>
            {activeDecks.map((deck) => (
              <motion.div
                key={deck.id}
                layoutId={deck.id === "Major" ? "shared-major-deck" : undefined}
                className="flex flex-col items-center w-full"
                transition={{ layout: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] } }}
              >
                <motion.div
                  onClick={() => drawCard(deck.id)}
                  animate={
                    deck.isShuffling
                      ? { 
                          x: [0, -8, 8, -10, 10, -10, 10, 0],
                          y: [0, -3, 3, -3, 3, 0],
                          rotate: [0, -3, 3, -2, 2, -3, 3, 0]
                        }
                      : { x: 0, y: 0, rotate: 0 }
                  }
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className={`w-28 h-40 bg-zinc-900 rounded-2xl border-2 ${
                    deck.cards.length === 0 ? "border-zinc-700 opacity-40 grayscale" : deck.borderColor
                  } cursor-pointer relative group`}
                  style={{
                    boxShadow: getDeckShadow(deck.cards.length, deck.shadowColor),
                    transformOrigin: "center center"
                  }}
                >
                  <img 
                    src={`/images/${selectedSkin.folder}/back.jpg`} 
                    onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== `/images/${DEFAULT_SKIN.folder}/back.jpg`) {
                            target.src = `/images/${DEFAULT_SKIN.folder}/back.jpg`;
                        }
                    }}
                    draggable={false} alt="" className="absolute inset-0 w-full h-full object-cover rounded-[14px]" 
                  />
                  <div className="absolute inset-0 mix-blend-multiply rounded-[14px]" style={{ backgroundColor: deck.cards.length === 0 ? "#27272a" : deck.gradient }} />
                </motion.div>

                <div className="mt-3 flex flex-col items-center">
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${deck.cards.length === 0 ? "text-zinc-700" : "text-zinc-400"}`}>{deck.id} Deck</span>
                  {deck.cards.length > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); shuffleIndividualDeck(deck.id); }} className="text-[8px] font-bold text-zinc-600 hover:text-amber-500 uppercase tracking-[0.3em] transition-colors">[ Shuffle ]</button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </aside>

        {/* TABLETOP */}
        <motion.section animate={{ opacity: introStage === "done" ? 1 : 0 }} className="flex-1 relative bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-zinc-900 to-black overflow-hidden">
          <AnimatePresence>
            {cardsOnTable.map((card) => (
              <motion.div
        key={card.id}
        initial={{ x: -600, opacity: 0, rotate: -15 }}
        animate={{ x: card.x, y: card.y, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        drag dragMomentum={false}
        onDoubleClick={() => flipCard(card.id)}
        onDragStart={() => {
          setMaxZ((prev) => prev + 1);
          setCardsOnTable((prev) => prev.map((c) => (c.id === card.id ? { ...c, zIndex: maxZ + 1 } : c)));
        }}
        style={{ zIndex: card.zIndex, perspective: 1200 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-64 cursor-grab active:cursor-grabbing"
      >
        {/* The 3D Rotating Card Container */}
        <motion.div className="w-full h-full relative" animate={{ rotateY: card.isFlipped ? 180 : 0 }} transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }} style={{ transformStyle: "preserve-3d" }}>
          
          {/* Back of Card */}
          <div className={`absolute inset-0 bg-zinc-900 rounded-2xl border-4 ${card.borderColor} shadow-2xl overflow-hidden`} style={{ backfaceVisibility: "hidden" }}>
            <img 
                src={`/images/${card.skinFolder}/back.jpg`} 
                onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== `/images/${DEFAULT_SKIN.folder}/back.jpg`) {
                        target.src = `/images/${DEFAULT_SKIN.folder}/back.jpg`;
                    }
                }}
                alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
            />
            <div className="absolute inset-0 mix-blend-multiply pointer-events-none" style={{ backgroundColor: card.backGradient }} />
          </div>

          {/* Front of Card */}
          <div className="absolute inset-0 rounded-2xl border-4 border-amber-600/50 shadow-2xl bg-[#fcf5e5] overflow-hidden" style={{ backfaceVisibility: "hidden", transform: `rotateY(180deg) ${card.isReversed ? "rotateZ(180deg)" : ""}` }}>
            <img 
                src={`/images/${card.skinFolder}/${formatFileName(card.name)}`} 
                onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const fallbackSrc = `/images/${DEFAULT_SKIN.folder}/${formatFileName(card.name)}`;
                    if (target.src !== fallbackSrc) {
                        target.src = fallbackSrc;
                    }
                }}
                alt="" draggable={false} className="w-full h-full object-fill pointer-events-none" 
            />
          </div>
        </motion.div>

        <AnimatePresence>
        {card.isFlipped && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[calc(100%+12px)] left-0 right-0 flex flex-col items-center pointer-events-none"
          >
            <span className="text-[8px] font-bold text-amber-500/80 uppercase tracking-[0.3em] drop-shadow-sm leading-tight text-center">
              {card.name}
            </span>
            
            {card.isReversed && (
              <span className="text-[7px] font-medium text-amber-600/60 uppercase tracking-[0.2em] mt-1 italic">
                (Reversed)
              </span>
            )}
          </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
            ))}
          </AnimatePresence>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none font-bold text-[10px] tracking-[0.5em] uppercase italic text-center">Double-click to flip</div>
          <AnimatePresence>{cardsOnTable.length > 0 && (<motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={resetAll} className="fixed bottom-8 right-8 bg-zinc-100 hover:bg-red-600 hover:text-white text-zinc-900 font-bold px-5 py-2.5 rounded-xl shadow-2xl z-50 transition-all active:scale-95 uppercase text-[10px] tracking-widest">Clear Tabletop</motion.button>)}</AnimatePresence>
        </motion.section>
      </div>
    </main>
  );
}