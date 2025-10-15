// Types used across the application
export const ORDER_STATUSES = {
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
};

export const DRINK_CATEGORIES = {
  NON_ALCOHOLIC: 'non-alcoholic', // Non-alcoholic drinks (that has alcoholic choices)
  COCKTAIL: 'cocktail',
  MOCKTAIL: 'mocktail', // Cocktails with no alcohol
  SHOT: 'shot', // Shot glass drinks
  BEER: 'beer', // All alcoholic beer
  CIDER: 'cider', // All alcoholic ciders
  SPRITZER: 'spritzer', // Wine spritzers e.g. Aperol Spritz, Brutal Fruit
  WINE: 'wine',
  SPIRITS: 'spirits', // Alcoholic drinks that has spirits and side-mixer (e.g. brandy and coke)
  WATER: 'water', // Tap, sparkling, bottled
  SOFT_DRINK: 'soft-drink', // Sodas, Coke, Fanta, etc.
  ENERGY_DRINK: 'energy-drink', // Red Bull, Monster, etc.
  JUICE: 'juice', // Fresh juices, bottled juices
  MILKSHAKE: 'milkshake', // Dairy-based shakes
  OTHER: 'other', // Items that don't quite fit into the other categories :)
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  BARTENDER: 'bartender',
};