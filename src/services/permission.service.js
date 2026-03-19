import { api } from "@/services/axios.config";

export const getAllPermissions = async () => {
    const response = await api.get("/roles/permissions");
    return response.data;
};

export const getPermissionDetail = async (permissionId) => {
    const response = await api.get(`/roles/permissions/${permissionId}`);
    return response.data;
};

export const createPermission = async (data) => {
    const response = await api.post("/roles/permissions", data);
    return response.data;
};

export const updatePermission = async (permissionId, data) => {
    const response = await api.patch(`/roles/permissions/${permissionId}`, data);
    return response.data;
};

export const deletePermission = async (permissionId) => {
    const response = await api.delete(`/roles/permissions/${permissionId}`);
    return response.data;
};

export const getAllRoles = async () => {
    const response = await api.get("/roles");
    return response.data;
};

export const getPermissionsByRole = async (roleId) => {
    const response = await api.get(`/roles/${roleId}/permissions`);
    return response.data;
};

export const assignPermissionToRole = async (roleId, permissionId) => {
    const response = await api.post("/roles/assign-permission", {
        roleId,
        permissionId,
    });
    return response.data;
};

export const removePermissionFromRole = async (roleId, permissionId) => {
    const response = await api.delete(
        `/roles/remove-permission/${roleId}/${permissionId}`,
    );
    return response.data;
};

// ===== User-Role =====

export const getRolesByUser = async (userId) => {
    const response = await api.get(`/roles/user/${userId}/roles`);
    return response.data;
};

export const assignRoleToUser = async (userId, roleId) => {
    const response = await api.post("/roles/assign-user", {
        userId,
        roleId,
    });
    return response.data;
};

export const removeRoleFromUser = async (userId, roleId) => {
    const response = await api.delete(`/roles/remove-user/${userId}/${roleId}`);
    return response.data;
};
