// src/deck.ts

export const MAJOR_ARCANA = [
  "The Fool", "The Magician", "The High Priestess", "The Empress",
  "The Emperor", "The Hierophant", "The Lovers", "The Chariot",
  "Strength", "The Hermit", "Wheel of Fortune", "Justice",
  "The Hanged Man", "Death", "Temperance", "The Devil",
  "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World"
];

const suits = ["Wands", "Cups", "Swords", "Pentacles"];
const values = [
  "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", 
  "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"
];

export const MINOR_ARCANA = suits.flatMap(suit => 
  values.map(value => `${value} of ${suit}`)
);

export const FULL_DECK = [...MAJOR_ARCANA, ...MINOR_ARCANA];