/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MAJOR_ARCANA, MINOR_ARCANA, FULL_DECK } from "../deck";
import { SKINS, TarotSkin } from "../skins";

const DEFAULT_SKIN = SKINS[0];

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
  skinExtension: string;
};

function shuffle(array: string[]) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function formatFileName(name: string, ext: string = "jpg") {
  return name.toLowerCase().replace(/\s+/g, "") + "." + ext;
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
  skinExtension: string,
  skinFolder: string,
  isReversed: boolean 
): TarotCard {
  return {
    id: Math.random().toString(36).substring(2, 9),
    name: name,
    isFlipped: false,
    isReversed: isReversed,
    zIndex: currentMaxZ + 1,
    x: (Math.random() - 0.5) * 150,
    y: (Math.random() - 0.5) * 150,
    backGradient,
    borderColor,
    skinFolder,
    skinExtension: skinExtension,
  };
}

const DustParticles = () => {
  const [particles, setParticles] = useState<{ left: string; top: string; duration: number; delay: number; opacity: number }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 30 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
      opacity: 0.1 + Math.random() * 0.4
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            opacity: [0, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
          style={{ left: p.left, top: p.top }}
        />
      ))}
    </div>
  );
};

export default function Home() {
  const [introStage, setIntroStage] = useState<"black" | "center" | "moving" | "done">("black");
  const [activeDecks, setActiveDecks] = useState<DeckInstance[]>([]);
  const [cardsOnTable, setCardsOnTable] = useState<TarotCard[]>([]);
  const [maxZ, setMaxZ] = useState(1);
  const [selectedSkin, setSelectedSkin] = useState<TarotSkin>(SKINS[0]);
  const [isSkinMenuOpen, setIsSkinMenuOpen] = useState(false);
  const [allowReversed, setAllowReversed] = useState(true);
  const [revealedMajors, setRevealedMajors] = useState<string[]>([]);
  const [cinematicCard, setCinematicCard] = useState<TarotCard | null>(null);
  const [showCinematics, setShowCinematics] = useState(true);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const lastTapRef = useRef<{ [key: string]: number }>({});

  const playSound = (file: string) => {
    const audio = new Audio(`/sounds/${file}`);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const t1 = setTimeout(() => setIntroStage("center"), 800);
    
    const t2 = setTimeout(() => {
      setActiveDecks([{
        id: "Major",
        cards: shuffle(MAJOR_ARCANA),
        gradient: "#450a0a",
        borderColor: "border-red-500/40",
        shadowColor: "#2a0000",
        isShuffling: false,
      }]);
      setIntroStage("moving");
    }, 2000);

    const t3 = setTimeout(() => setIntroStage("done"), 3200);

    return () => { 
      clearTimeout(t1); 
      clearTimeout(t2); 
      clearTimeout(t3); 
    };
  }, []);

  useEffect(() => {
    const ambient = ambientRef.current;
    if (!ambient) return;

    ambient.muted = isMuted;
    ambient.volume = 0.4; 

    if (introStage === "done" && !isMuted) {
      ambient.play().catch(() => {
        console.log("Ambient audio waiting for user interaction to unlock...");
      });
    } 
    
    if (isMuted) {
      ambient.pause();
    }
  }, [introStage, isMuted]);

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
    if (ambientRef.current && ambientRef.current.paused && !isMuted) {
      ambientRef.current.play().catch(() => {});
    }
    const targetDeck = activeDecks.find((d) => d.id === deckId);
    if (!targetDeck || targetDeck.cards.length === 0 || targetDeck.isShuffling) return;

    playSound("draw.mp3");

    const shouldBeReversed = allowReversed ? Math.random() > 0.7 : false;

    const newCard = generateNewCard(
      targetDeck.cards[0], 
      maxZ, 
      targetDeck.gradient, 
      targetDeck.borderColor,
      selectedSkin.extension, 
      selectedSkin.folder,
      shouldBeReversed 
    );

    setMaxZ((prev) => prev + 1);
    setCardsOnTable((prev) => [...prev, newCard]);
    setActiveDecks((prev) => prev.map((d) => (d.id === deckId ? { ...d, cards: d.cards.slice(1) } : d)));
  };

  const handleCardTap = (id: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[id] || 0;
    
    if (now - lastTap < 350) {
      flipCard(id);
      lastTapRef.current[id] = 0; 
    } else {
      lastTapRef.current[id] = now; 
    }
  };

  const flipCard = (id: string) => {
    const card = cardsOnTable.find(c => c.id === id);
    if (!card) return;
    playSound("flip.mp3");

    const isMajor = MAJOR_ARCANA.includes(card.name);
    if (showCinematics && !card.isFlipped && isMajor && !revealedMajors.includes(card.name)) {
      setCinematicCard(card);
      setRevealedMajors(prev => [...prev, card.name]);
      setTimeout(() => setCinematicCard(null), 1000);
    }

    setCardsOnTable((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: !c.isFlipped, zIndex: maxZ + 1 } : c)));
    setMaxZ((prev) => prev + 1);
  };

  const shuffleIndividualDeck = (type: DeckType) => {
    playSound("shuffle.mp3");
    setActiveDecks((prev) => prev.map((d) => d.id === type ? { ...d, isShuffling: true } : d));
    setTimeout(() => {
      setActiveDecks((prev) =>
        prev.map((d) => (d.id === type ? { ...d, cards: shuffle(d.cards), isShuffling: false } : d))
      );
    }, 800);
  };

  const resetAll = () => {
    setCardsOnTable(prev => prev.map(c => ({ ...c, x: -1000, opacity: 0 })));

    setTimeout(() => {
      setCardsOnTable([]);
      setRevealedMajors([]);
      setActiveDecks((prev) => prev.map((d) => {
        const base = d.id === "Major" ? MAJOR_ARCANA : d.id === "Minor" ? MINOR_ARCANA : FULL_DECK;
        return { ...d, cards: shuffle(base) };
      }));
    }, 500);
  };

  return (
    <main className="flex flex-col h-dvh w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans relative overscroll-none select-none">
      <audio ref={ambientRef} src="/sounds/ambient.mp3" loop preload="auto" />
      
      <AnimatePresence>
        {introStage !== "done" && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="fixed inset-0 bg-black z-50 pointer-events-none" />
        )}
      </AnimatePresence>

      {/* INTRO DECK */}
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
              className="w-20 h-28 md:w-28 md:h-40 rounded-2xl border-2 border-red-500/40 relative bg-zinc-900 shadow-2xl"
              style={{ boxShadow: getDeckShadow(20, "#2a0000") }}
            >
              <img 
                src={`/images/${selectedSkin.folder}/back.${selectedSkin.extension}`} 
                onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== `/images/${DEFAULT_SKIN.folder}/back.${DEFAULT_SKIN.extension}`) {
                        target.src = `/images/${DEFAULT_SKIN.folder}/back.${DEFAULT_SKIN.extension}`;
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
        className="py-3 md:py-0 md:h-24 bg-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row items-center z-40 shadow-xl shrink-0 gap-3 md:gap-0"
      >
        {/* Left Section: Deck Select */}
        <div className="w-full md:w-60 flex justify-center items-center md:h-full md:border-r border-zinc-800 flex-row md:flex-col order-2 md:order-1 gap-2 md:gap-0">
          <span className="hidden md:block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2">Select your deck</span>
          <div className="flex gap-1 bg-black p-1 rounded-xl border border-zinc-800">
            {(["Major", "Minor", "Full"] as DeckType[]).map((type) => (
              <button
                key={type}
                onClick={() => toggleDeck(type)}
                className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold transition-all uppercase ${
                  activeDecks.find((d) => d.id === type) ? "text-amber-400 bg-zinc-800" : "text-zinc-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Center Section: Title + Toggle */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 order-1 md:order-2 w-full px-2">
          <h1 className="text-xl md:text-2xl font-serif font-black text-amber-500 tracking-[0.2em] md:tracking-[0.4em] uppercase text-center leading-none">
            Tarot Reader
          </h1>
          
          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 rounded-full bg-black/20 border border-white/5">
            <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest md:tracking-[0.2em] text-zinc-500 whitespace-nowrap">
              Cinematic Reveals
            </span>
            <button 
              onClick={() => setShowCinematics(!showCinematics)}
              className="relative w-7 md:w-8 h-3 md:h-4 bg-zinc-900 rounded-full border border-zinc-700 transition-colors"
            >
              <motion.div 
                animate={{ 
                  x: showCinematics ? (window.innerWidth < 768 ? 14 : 18) : 2, 
                  backgroundColor: showCinematics ? "#f59e0b" : "#3f3f46" 
                }}
                className="absolute top-0 md:top-0.5 w-2.5 h-2.5 rounded-full"
              />
            </button>
          </div>
        </div>

        {/* Right Section: Skin Selector & Audio */}
        <div className="w-full md:w-60 flex justify-center items-center relative order-3 md:order-3 gap-3 md:gap-0">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 md:p-2 hover:bg-white/5 rounded-full transition-colors group"
            title={isMuted ? "Unmute Ambient" : "Mute Ambient"}
          >
            {isMuted ? (
              <svg className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 group-hover:text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg className="w-4 h-4 md:w-5 md:h-5 text-amber-500 group-hover:text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>
          
          <button onClick={() => setIsSkinMenuOpen(!isSkinMenuOpen)} className="px-3 md:px-4 py-1.5 md:py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:border-amber-500/50 transition-all">
            Skin: {selectedSkin.name}
          </button>
          
          <AnimatePresence>
            {isSkinMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 10 }} 
                className="absolute top-12 md:top-14 right-4 md:right-auto bg-zinc-900 border border-zinc-800 p-2 rounded-xl shadow-2xl min-w-35 z-50"
              >
                {SKINS.map((skin) => (
                  <button key={skin.name} onClick={() => { setSelectedSkin(skin); setIsSkinMenuOpen(false); }} className="w-full text-left px-3 py-2 text-[9px] md:text-[10px] uppercase font-bold text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-md transition-all">
                    {skin.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* MAIN BODY */}
      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden">
        
        {/* SIDEBAR (Bottom row on mobile, left column on desktop) */}
        <aside className="w-full md:w-60 h-44 md:h-auto bg-zinc-900/40 border-t md:border-t-0 md:border-r border-zinc-800 flex flex-row md:flex-col items-center p-2 md:p-6 z-30 shadow-inner overflow-x-auto overflow-y-hidden md:overflow-hidden md:overflow-y-auto shrink-0 gap-6 md:gap-0 [&::-webkit-scrollbar]:hidden">
          
          {/* REVERSED TOGGLE */}
          <motion.div 
            animate={{ opacity: introStage === "done" ? 1 : 0 }}
            className="flex flex-col items-center justify-center md:w-full md:border-b border-zinc-800/50 md:pb-6 md:mb-8 shrink-0 px-4 md:px-0"
          >
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 md:mb-3 whitespace-nowrap">Reversed?</span>
            <button 
              onClick={() => setAllowReversed(!allowReversed)}
              className="relative w-10 md:w-12 h-5 md:h-6 bg-black rounded-full border border-zinc-800 transition-colors duration-300"
            >
              <motion.div 
                animate={{ 
                  x: allowReversed ? (window.innerWidth < 768 ? 20 : 24) : 4,
                  backgroundColor: allowReversed ? "#f59e0b" : "#3f3f46" 
                }}
                className="absolute top-0.75 md:top-1 w-3 md:w-4 h-3 md:h-4 rounded-full shadow-lg"
              />
            </button>
            <span className={`hidden md:block text-[8px] font-bold mt-2 uppercase tracking-widest transition-colors ${allowReversed ? 'text-amber-500' : 'text-zinc-600'}`}>
              {allowReversed ? 'Enabled' : 'Disabled'}
            </span>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {activeDecks.map((deck) => (
              <motion.div
                key={deck.id}
                layout
                layoutId={deck.id === "Major" ? "shared-major-deck" : undefined}
                className="flex flex-col items-center shrink-0 w-24 md:w-full"
                transition={{ layout: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] } }}
              >
                <motion.div
                  key={selectedSkin.name}
                  initial={{ rotateY: 90 }}
                  onClick={() => drawCard(deck.id)}
                  animate={
                    deck.isShuffling
                      ? { 
                          x: [0, -8, 8, -10, 10, -10, 10, 0],
                          y: [0, -3, 3, -3, 3, 0],
                          rotate: [0, -3, 3, -2, 2, -3, 3, 0],
                          rotateY: 0
                        }
                      : { x: 0, y: 0, rotate: 0, rotateY: 0 }
                  }
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className={`w-20 h-28 md:w-28 md:h-40 bg-zinc-900 rounded-2xl border-2 ${
                    deck.cards.length === 0 ? "border-zinc-700 opacity-40 grayscale" : deck.borderColor
                  } cursor-pointer relative group`}
                  style={{
                    boxShadow: getDeckShadow(deck.cards.length, deck.shadowColor),
                    transformOrigin: "center center"
                  }}
                >
                  <img 
                    src={`/images/${selectedSkin.folder}/back.${selectedSkin.extension}`}
                    onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== `/images/${DEFAULT_SKIN.folder}/back.${DEFAULT_SKIN.extension}`) {
                            target.src = `/images/${DEFAULT_SKIN.folder}/back.${DEFAULT_SKIN.extension}`;
                        }
                    }}
                    draggable={false} alt="" className="absolute inset-0 w-full h-full object-cover rounded-[14px]" 
                  />
                  <div className="absolute inset-0 mix-blend-multiply rounded-[14px]" style={{ backgroundColor: deck.cards.length === 0 ? "#27272a" : deck.gradient }} />
                </motion.div>

                <div className="mt-2 md:mt-3 flex flex-col items-center">
                  <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${deck.cards.length === 0 ? "text-zinc-700" : "text-zinc-400"}`}>{deck.id}</span>
                  {deck.cards.length > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); shuffleIndividualDeck(deck.id); }} className="text-[7px] md:text-[8px] font-bold text-zinc-600 hover:text-amber-500 uppercase tracking-[0.3em] transition-colors">[ Shuffle ]</button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </aside>

        {/* TABLETOP */}
        <motion.section 
          animate={{ opacity: introStage === "done" ? 1 : 0 }} 
          className="flex-1 relative bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-zinc-900 to-black overflow-hidden touch-none"
        >
          <div 
            className="absolute inset-0 opacity-40 mix-blend-luminosity pointer-events-none"
            style={{ backgroundImage: "url('/images/wood.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />
          <DustParticles />

          <AnimatePresence>
            {cardsOnTable.map((card) => (
              <motion.div
                key={card.id}
                initial={{ x: -600, opacity: 0, rotate: -15 }}
                animate={{ x: card.x, y: card.y, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                drag dragMomentum={false}
                onTap={() => handleCardTap(card.id)}
                onDragStart={() => {
                  setMaxZ((prev) => prev + 1);
                  setCardsOnTable((prev) => prev.map((c) => (c.id === card.id ? { ...c, zIndex: maxZ + 1 } : c)));
                }}
                style={{ zIndex: card.zIndex, perspective: 1200 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-44 md:w-40 md:h-64 cursor-grab active:cursor-grabbing"
              >
                {/* 3D Rotating Card Container */}
                <motion.div className="w-full h-full relative" animate={{ rotateY: card.isFlipped ? 180 : 0 }} transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }} style={{ transformStyle: "preserve-3d" }}>
                  
                  {/* Back of Card */}
                  <div className={`absolute inset-0 bg-zinc-900 rounded-[10px] md:rounded-2xl border-2 md:border-4 ${card.borderColor} shadow-2xl overflow-hidden`} style={{ backfaceVisibility: "hidden" }}>
                    <img 
                        src={`/images/${card.skinFolder}/back.${card.skinExtension}`} 
                        onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== `/images/${DEFAULT_SKIN.folder}/back.${DEFAULT_SKIN.extension}`) {
                                target.src = `/images/${DEFAULT_SKIN.folder}/back.${DEFAULT_SKIN.extension}`;
                            }
                        }}
                        alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                    />
                    <div className="absolute inset-0 mix-blend-multiply pointer-events-none" style={{ backgroundColor: card.backGradient }} />
                  </div>

                  {/* Front of Card */}
                  <div className="absolute inset-0 rounded-[10px] md:rounded-2xl border-2 md:border-4 border-amber-600/50 shadow-2xl bg-[#fcf5e5] overflow-hidden" style={{ backfaceVisibility: "hidden", transform: `rotateY(180deg) ${card.isReversed ? "rotateZ(180deg)" : ""}` }}>
                    <img 
                        src={`/images/${card.skinFolder}/${formatFileName(card.name, card.skinExtension)}`}
                        onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            const fallbackSrc = `/images/${DEFAULT_SKIN.folder}/${formatFileName(card.name, DEFAULT_SKIN.extension)}`;
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
                      className="absolute top-[calc(100%+8px)] md:top-[calc(100%+12px)] left-0 right-0 flex flex-col items-center pointer-events-none"
                    >
                      <span className="text-[7px] md:text-[8px] font-bold text-amber-500/80 uppercase tracking-[0.2em] md:tracking-[0.3em] drop-shadow-sm leading-tight text-center whitespace-nowrap">
                        {card.name}
                      </span>
                      
                      {card.isReversed && (
                        <span className="text-[6px] md:text-[7px] font-medium text-amber-600/60 uppercase tracking-[0.2em] mt-1 italic">
                          (Reversed)
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div className="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none font-bold text-[8px] md:text-[10px] tracking-[0.4em] md:tracking-[0.5em] uppercase italic text-center w-full">Double-tap / click to flip</div>
          
          <AnimatePresence>
            {cardsOnTable.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }} 
                onClick={resetAll} 
                className="absolute bottom-10 md:bottom-8 right-4 md:right-8 bg-zinc-100 hover:bg-red-600 hover:text-white text-zinc-900 font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-xl shadow-2xl z-50 transition-all active:scale-95 uppercase text-[9px] md:text-[10px] tracking-widest"
              >
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </motion.section>
      </div>

      {/* CINEMATIC REVEAL */}
      <AnimatePresence>
        {cinematicCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-xl pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100, rotateY: 180, opacity: 0 }}
              animate={{ scale: 1.1, y: 0, rotateY: 0, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 200, damping: 25, duration: 0.8 }}
              className="relative w-48 h-72 md:w-64 md:h-96 flex flex-col items-center justify-center"
            >
              <div className="relative w-full h-full">
                <img 
                  src={`/images/${cinematicCard.skinFolder}/${formatFileName(cinematicCard.name, cinematicCard.skinExtension)}`} 
                  style={{ transform: cinematicCard.isReversed ? 'rotate(180deg)' : 'none' }}
                  className="w-full h-full object-fill rounded-2xl md:rounded-3xl border-2 md:border-4 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.4)] md:shadow-[0_0_60px_rgba(251,191,36,0.4)]"
                />
              </div>

              <div className="absolute -bottom-16 md:-bottom-24 w-[180%] md:w-[150%] text-center">
                <h2 className="font-serif text-xl sm:text-3xl md:text-4xl text-amber-400 tracking-[0.2em] md:tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,0,0,1)] leading-tight">
                  {cinematicCard.name}
                  {cinematicCard.isReversed && (
                    <span className="block text-xs md:text-sm mt-1 md:mt-2 opacity-60 tracking-[0.4em] md:tracking-[0.5em] italic">(Reversed)</span>
                  )}
                </h2>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}