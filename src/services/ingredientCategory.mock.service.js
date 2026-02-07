import { INGREDIENT_CATEGORY_SEED } from "@/utils/ingredientCategoryMockData";

const STORAGE_KEY = "unilife_mock_ingredient_categories";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadSeed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INGREDIENT_CATEGORY_SEED));
  return [...INGREDIENT_CATEGORY_SEED];
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let cache = loadSeed();

function ensureCache() {
  if (!Array.isArray(cache) || cache.length === 0) {
    cache = loadSeed();
  }
  return cache;
}

function generateId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export async function listIngredientCategories({ page = 1, pageSize = 8 } = {}) {
  await delay(250);
  const list = ensureCache();
  const total = list.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: list.slice(start, end),
    total,
    page,
    pageSize,
  };
}

export async function getIngredientCategoryById(id) {
  await delay(150);
  const item = ensureCache().find((c) => c._id === id) || null;
  return item;
}

export async function createIngredientCategory(payload) {
  await delay(300);
  const now = new Date().toISOString();
  const newItem = {
    _id: generateId(),
    name: String(payload?.name || "").trim(),
    description: String(payload?.description || "").trim(),
    createdAt: now,
    updatedAt: now,
  };
  cache = [newItem, ...ensureCache()];
  persist(cache);
  return newItem;
}

export async function updateIngredientCategory(id, payload) {
  await delay(300);
  const now = new Date().toISOString();
  const list = ensureCache();
  const idx = list.findIndex((c) => c._id === id);
  if (idx === -1) return null;

  const updated = {
    ...list[idx],
    name: payload?.name !== undefined ? String(payload.name).trim() : list[idx].name,
    description:
      payload?.description !== undefined
        ? String(payload.description).trim()
        : list[idx].description,
    updatedAt: now,
  };

  list[idx] = updated;
  cache = [...list];
  persist(cache);
  return updated;
}

export async function deleteIngredientCategory(id) {
  await delay(200);
  const list = ensureCache();
  const next = list.filter((c) => c._id !== id);
  cache = next;
  persist(cache);
  return true;
}
