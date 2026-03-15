// Quy doi don vi va tinh chi phi nguyen lieu theo don vi chuan
export const VALID_INGREDIENT_UNITS = [
  'kg',
  'g',
  'lít',
  'ml',
  'cái',
  'gói',
  'hộp',
  'lon',
];

export const normalizeUnit = (unit) => unit;

export const getDefaultStandardConfig = (unit) => {
  const normalizedUnit = normalizeUnit(unit);

  switch (normalizedUnit) {
    case 'kg':
      return { standardUnit: 'g', standardUnitFactor: 1000 };
    case 'g':
      return { standardUnit: 'g', standardUnitFactor: 1 };
    case 'lít':
      return { standardUnit: 'ml', standardUnitFactor: 1000 };
    case 'ml':
      return { standardUnit: 'ml', standardUnitFactor: 1 };
    default:
      return { standardUnit: normalizedUnit, standardUnitFactor: 1 };
  }
};

const canConvert = (fromUnit, toUnit) => {
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  const isWeight = (unit) => unit === 'kg' || unit === 'g';
  const isVolume = (unit) => unit === 'lít' || unit === 'ml';

  if (normalizedFrom === normalizedTo) {
    return true;
  }

  return (
    (isWeight(normalizedFrom) && isWeight(normalizedTo)) ||
    (isVolume(normalizedFrom) && isVolume(normalizedTo))
  );
};

export const convertQuantity = (quantity, fromUnit, toUnit) => {
  const safeQuantity = Number(quantity || 0);
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  if (!Number.isFinite(safeQuantity)) {
    return 0;
  }

  if (normalizedFrom === normalizedTo) {
    return safeQuantity;
  }

  if (normalizedFrom === 'kg' && normalizedTo === 'g') {
    return safeQuantity * 1000;
  }

  if (normalizedFrom === 'g' && normalizedTo === 'kg') {
    return safeQuantity / 1000;
  }

  if (normalizedFrom === 'lít' && normalizedTo === 'ml') {
    return safeQuantity * 1000;
  }

  if (normalizedFrom === 'ml' && normalizedTo === 'lít') {
    return safeQuantity / 1000;
  }

  return safeQuantity;
};

export const resolveStandardUnitCost = (ingredient) => {
  if (!ingredient || typeof ingredient !== 'object') {
    return 0;
  }

  const standardUnitCost = Number(ingredient.costPerStandardUnit);
  if (Number.isFinite(standardUnitCost) && standardUnitCost > 0) {
    return standardUnitCost;
  }

  const costPrice = Number(ingredient.costPrice);
  const standardUnitFactor = Number(ingredient.standardUnitFactor);

  if (
    Number.isFinite(costPrice) &&
    costPrice > 0 &&
    Number.isFinite(standardUnitFactor) &&
    standardUnitFactor > 0
  ) {
    return costPrice / standardUnitFactor;
  }

  return 0;
};

export const getRecipeQuantityInStandardUnit = (recipeItem, ingredient) => {
  const quantity = Number(recipeItem?.quantity || 0);
  const recipeUnit = normalizeUnit(recipeItem?.unit);
  const ingredientUnit = normalizeUnit(ingredient?.unit);
  const standardUnit = normalizeUnit(ingredient?.standardUnit);
  const standardUnitFactor = Number(ingredient?.standardUnitFactor || 1);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }

  if (recipeUnit && standardUnit && canConvert(recipeUnit, standardUnit)) {
    return convertQuantity(quantity, recipeUnit, standardUnit);
  }

  if (recipeUnit && ingredientUnit && recipeUnit === ingredientUnit) {
    return (
      quantity * (Number.isFinite(standardUnitFactor) ? standardUnitFactor : 1)
    );
  }

  return quantity;
};
