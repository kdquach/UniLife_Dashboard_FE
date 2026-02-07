import { api } from "@/services/axios.config";

export async function getMyProfile() {
  const response = await api.get("/profile");
  return response.data;
}

export async function updateProfile(data) {
  const response = await api.patch("/profile", data);
  return response.data;
}

export async function uploadAvatar(formData) {
  const response = await api.post("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
