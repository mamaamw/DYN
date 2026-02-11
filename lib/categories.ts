import fs from 'fs';
import path from 'path';

export interface Category {
  name: string;
  label: string;
  description?: string;
  color: string;
  icon?: string;
}

const categoriesFilePath = path.join(process.cwd(), 'lib', 'categories.json');

export function getCategories(): Category[] {
  try {
    const data = fs.readFileSync(categoriesFilePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.categories || [];
  } catch (error) {
    console.error('Error reading categories:', error);
    return [];
  }
}

export function saveCategories(categories: Category[]): boolean {
  try {
    const data = { categories };
    fs.writeFileSync(categoriesFilePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }
}

export function addCategory(category: Omit<Category, 'name'> & { name: string }): boolean {
  const categories = getCategories();
  
  // Check if category already exists
  if (categories.some(c => c.name === category.name)) {
    return false;
  }
  
  categories.push({
    name: category.name,
    label: category.label,
    description: category.description || '',
    color: category.color || 'blue',
    icon: category.icon,
  });
  
  return saveCategories(categories);
}

export function updateCategory(name: string, updates: Partial<Omit<Category, 'name'>>): boolean {
  const categories = getCategories();
  const index = categories.findIndex(c => c.name === name);
  
  if (index === -1) {
    return false;
  }
  
  categories[index] = {
    ...categories[index],
    ...updates,
  };
  
  return saveCategories(categories);
}

export function deleteCategory(name: string): boolean {
  const categories = getCategories();
  const filtered = categories.filter(c => c.name !== name);
  
  if (filtered.length === categories.length) {
    return false; // Category not found
  }
  
  return saveCategories(filtered);
}

export function getCategoryColor(name: string): string {
  const categories = getCategories();
  const category = categories.find(c => c.name === name);
  return category?.color || 'blue';
}

export function getCategoryLabel(name: string): string {
  const categories = getCategories();
  const category = categories.find(c => c.name === name);
  return category?.label || name;
}

export function getCategoryIcon(name: string): string | undefined {
  const categories = getCategories();
  const category = categories.find(c => c.name === name);
  return category?.icon;
}
