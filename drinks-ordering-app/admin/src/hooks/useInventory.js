import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../api/inventory';

export const useInventory = () => {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDrinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryAPI.fetchAllDrinks();
      setDrinks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrinks();
    console.log("Fetching drinks from inventory API");
  }, [fetchDrinks]);

  const createDrink = async (drinkData) => {
    try {
      const newDrink = await inventoryAPI.createDrink(drinkData);
      setDrinks(prev => [...prev, newDrink]);
      return newDrink;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateDrink = async (drinkId, drinkData) => {
    try {
      const updatedDrink = await inventoryAPI.updateDrink(drinkId, drinkData);
      setDrinks(prev => prev.map(drink => 
        drink.id === drinkId ? { ...drink, ...updatedDrink } : drink
      ));
      return updatedDrink;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleAvailability = async (drinkId, available) => {
    try {
      const updatedDrink = await inventoryAPI.toggleAvailability(drinkId, available);
      setDrinks(prev => prev.map(drink => 
        drink.id === drinkId ? { ...drink, available } : drink
      ));
      return updatedDrink;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDrink = async (drinkId) => {
    try {
      await inventoryAPI.deleteDrink(drinkId);
      setDrinks(prev => prev.filter(drink => drink.id !== drinkId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update threshold for ALL drinks
  const updateGlobalThreshold = async (threshold) => {
    try {
      const result = await inventoryAPI.updateGlobalThreshold(threshold);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update threshold for SINGLE drink
  const updateDrinkThreshold = async (drinkId, threshold) => {
    try {
      const updatedDrink = await inventoryAPI.updateDrinkThreshold(drinkId, threshold);
      setDrinks(prev => prev.map(drink => 
        drink.id === drinkId ? { ...drink, ...updatedDrink } : drink
      ));
      return updatedDrink;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    drinks,
    loading,
    error,
    refetch: fetchDrinks,
    createDrink,
    updateDrink,
    toggleAvailability,
    deleteDrink,
    updateGlobalThreshold,
    updateDrinkThreshold
  };
};

// !! I do not think this is being used anywhere anymore !!
export const useDrink = (drinkId) => {
  const [drink, setDrink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDrink = useCallback(async () => {
    if (!drinkId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryAPI.fetchDrink(drinkId);
      setDrink(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [drinkId]);

  useEffect(() => {
    fetchDrink();
  }, [fetchDrink]);

  // Update threshold for this drink
  const updateThreshold = async (threshold) => {
    if (!drinkId) return;
    try {
      const updated = await inventoryAPI.updateDrinkThreshold(drinkId, threshold);
      setDrink(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    drink,
    loading,
    error,
    refetch: fetchDrink,
    updateThreshold
  };
};
