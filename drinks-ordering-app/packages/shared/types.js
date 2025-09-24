import beer from './assets/Beer.jpeg'
import alcoholic from './assets/alcohol.jpeg'
import nonalcoholic from './assets/non-alcoholic.jpeg'
import cocktail from './assets/cocktail.jpeg'
import mocktail from './assets/mock.jpeg'
import shot from './assets/shots.jpeg'
import cider from './assets/cider.jpeg'
import wine from './assets/Wine.jpeg'
import other from './assets/CocoCola.jpg'

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

export const DRINK_CATEGORY_IMAGES = {
  ALCOHOLIC: alcoholic,        
  NON_ALCOHOLIC: nonalcoholic,
  COCKTAIL: cocktail,
  MOCKTAIL: mocktail,
  SHOT: shot,
  BEER: beer,
  CIDER: cider,
  WINE: wine,
  OTHER: other,
};


export const getDrinkImage = (drinkType) => {
  const mappings = {
    'alcoholic': DRINK_CATEGORY_IMAGES.ALCOHOLIC,
    'non-alcoholic': DRINK_CATEGORY_IMAGES.NON_ALCOHOLIC,
    'cocktail': DRINK_CATEGORY_IMAGES.COCKTAIL,
    'mocktail': DRINK_CATEGORY_IMAGES.MOCKTAIL,
    'shot': DRINK_CATEGORY_IMAGES.SHOT,
    'beer': DRINK_CATEGORY_IMAGES.BEER,
    'cider': DRINK_CATEGORY_IMAGES.CIDER,
    'wine': DRINK_CATEGORY_IMAGES.WINE,
    'other': DRINK_CATEGORY_IMAGES.OTHER,
  };
  
  return mappings[drinkType] || DRINK_CATEGORY_IMAGES.OTHER;
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  BARTENDER: 'bartender',
};