import { useCallback, useState } from "react";
import {
  getMyProfile,
  updateProfile,
  uploadAvatar as uploadAvatarService,
} from "@/services/profile.service";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyProfile();
      const user = result?.data ?? result;
      setProfile(user);
      return user;
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to fetch profile";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMe = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateProfile(payload);
      const user = result?.data ?? result;
      setProfile(user);
      return user;
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to update profile";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const result = await uploadAvatarService(form);
      const user = result?.data ?? result;
      setProfile(user);
      return user;
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to upload avatar";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProfile(null);
    setError(null);
  }, []);

  return {
    profile,
    loading,
    error,
    fetchMe,
    updateMe,
    uploadAvatar,
    reset,
  };
}
