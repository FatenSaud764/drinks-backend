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
  ALCOHOLIC: 'alcoholic',
  NON_ALCOHOLIC: 'non-alcoholic',
  COCKTAIL: 'cocktail',
  MOCKTAIL: 'mocktail',
  SHOT: 'shot',
  BEER: 'beer',
  CIDER: 'cider',
  WINE: 'wine',
  WATER: 'water',
  OTHER: 'other',
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  BARTENDER: 'bartender',
};