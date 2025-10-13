import beer from './assets/Beer.jpeg'
import alcoholic from './assets/alcohol.jpeg'
import nonalcoholic from './assets/non-alcoholic.jpeg'
import cocktail from './assets/cocktail.jpeg'
import mocktail from './assets/mock.jpeg'
import shot from './assets/shots.jpeg'
import cider from './assets/cider.jpeg'
import wine from './assets/Wine.jpeg'
import other from './assets/CocoCola.jpg'
import water from './assets/StillWater.jpg'

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
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  BARTENDER: 'bartender',
};