import fs from 'fs';
import path from 'path';

const ROLES_FILE = path.join(process.cwd(), 'lib', 'roles.json');

export interface Role {
  name: string;
  label: string;
  description: string;
  color: string;
  isSystem: boolean;
}

interface RolesData {
  roles: Role[];
}

export function getRoles(): Role[] {
  try {
    const data = fs.readFileSync(ROLES_FILE, 'utf-8');
    const rolesData: RolesData = JSON.parse(data);
    return rolesData.roles;
  } catch (error) {
    console.error('Error reading roles file:', error);
    return [];
  }
}

export function saveRoles(roles: Role[]): boolean {
  try {
    const rolesData: RolesData = { roles };
    fs.writeFileSync(ROLES_FILE, JSON.stringify(rolesData, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving roles file:', error);
    return false;
  }
}

export function getRole(name: string): Role | undefined {
  const roles = getRoles();
  return roles.find(role => role.name === name);
}

export function addRole(role: Omit<Role, 'isSystem'>): boolean {
  const roles = getRoles();
  
  // Check if role already exists
  if (roles.some(r => r.name === role.name)) {
    return false;
  }
  
  roles.push({ ...role, isSystem: false });
  return saveRoles(roles);
}

export function updateRole(name: string, updates: Partial<Omit<Role, 'name' | 'isSystem'>>): boolean {
  const roles = getRoles();
  const index = roles.findIndex(r => r.name === name);
  
  if (index === -1) {
    return false;
  }
  
  // Don't allow updating system roles' core properties
  if (roles[index].isSystem && (updates.label || updates.color)) {
    return false;
  }
  
  roles[index] = { ...roles[index], ...updates };
  return saveRoles(roles);
}

export function deleteRole(name: string): boolean {
  const roles = getRoles();
  const role = roles.find(r => r.name === name);
  
  // Don't allow deleting system roles
  if (!role || role.isSystem) {
    return false;
  }
  
  const filteredRoles = roles.filter(r => r.name !== name);
  return saveRoles(filteredRoles);
}

export function getRoleColor(roleName: string): string {
  const role = getRole(roleName);
  if (!role) return 'slate';
  
  return role.color;
}

export function getRoleLabel(roleName: string): string {
  const role = getRole(roleName);
  if (!role) return roleName;
  
  return role.label;
}
