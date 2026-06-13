// Maps recipe categories to a representative emoji, purely for visual flair
// in recipe cards and detail pages. Falls back to a generic plate icon.
const CATEGORY_EMOJIS = {
  dessert: '🍰',
  breakfast: '🥞',
  lunch: '🥪',
  dinner: '🍲',
  appetizer: '🥟',
  snack: '🍿',
  drink: '🥤',
  beverage: '🥤',
  salad: '🥗',
  soup: '🍜',
  vegan: '🌱',
  vegetarian: '🥦',
  seafood: '🦞',
  bread: '🍞',
  pasta: '🍝',
  pizza: '🍕',
};

export function categoryEmoji(category) {
  if (!category) return '🍽️';
  return CATEGORY_EMOJIS[category.trim().toLowerCase()] || '🍽️';
}
