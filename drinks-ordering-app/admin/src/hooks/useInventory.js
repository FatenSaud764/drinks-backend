/**
 * @author Kirsten Sanders
 * @description This is a hook that manages the inventory of drinks.
*/

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

  // Update low stock threshold for ALL drinks
  const updateGlobalLowStockThreshold = async (threshold) => {
    try {
      const result = await inventoryAPI.updateGlobalLowStockLevel(threshold);
      // Refresh drinks after threshold change
      await fetchDrinks();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update unavailable threshold for ALL drinks
  const updateGlobalUnavailableThreshold = async (threshold) => {
    try {
      const result = await inventoryAPI.updateGlobalUnavailableLevel(threshold);
      // Refresh drinks after threshold change
      await fetchDrinks();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update low stock threshold for SINGLE drink
  const updateDrinkLowStockThreshold = async (drinkId, threshold) => {
    try {
      const updatedDrink = await inventoryAPI.updateDrinkLowStockLevel(drinkId, threshold);
      setDrinks(prev => prev.map(drink => 
        drink.id === drinkId ? { ...drink, ...updatedDrink } : drink
      ));
      return updatedDrink;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update unavailable threshold for SINGLE drink
  const updateDrinkUnavailableThreshold = async (drinkId, threshold) => {
    try {
      const updatedDrink = await inventoryAPI.updateDrinkUnavailableLevel(drinkId, threshold);
      setDrinks(prev => prev.map(drink => 
        drink.id === drinkId ? { ...drink, ...updatedDrink } : drink
      ));
      return updatedDrink;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
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
    updateGlobalLowStockThreshold,
    updateGlobalUnavailableThreshold,
    updateDrinkLowStockThreshold,
    updateDrinkUnavailableThreshold,
    clearError
  };
};