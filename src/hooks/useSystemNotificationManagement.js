import { useCallback, useMemo, useState } from "react";
import { message } from "antd";
import {
  createSystemNotification,
  getSystemNotificationById,
  getSystemNotifications,
  updateSystemNotification,
} from "@/services/notification.service";

const mapRecord = (item = {}) => ({
  ...item,
  id: item._id || item.id,
  canteenName: item?.canteenId?.name || "Toan he thong",
  createdByName: item?.createdBy?.fullName || "He thong",
});

const buildPayload = (values, actorRole) => {
  const payload = {
    title: values.title?.trim(),
    content: values.content?.trim(),
    targetRole: values.targetRole,
    isActive: values.isActive,
  };

  if (actorRole === "admin") {
    payload.canteenId = values.scope === "global" ? null : values.canteenId;
  }

  return payload;
};

const mergeRecord = (current, updated) => ({
  ...current,
  ...updated,
  id: updated?.id || current?.id,
  _id: updated?._id || current?._id,
  canteenName: updated?.canteenName || current?.canteenName,
  createdByName: updated?.createdByName || current?.createdByName,
});

const buildSystemNotificationListParams = (
  page,
  pageSize,
  nextFilters = {},
) => {
  const params = {
    page,
    limit: pageSize,
    sort: "-createdAt",
    search: nextFilters.search || undefined,
    targetRole:
      nextFilters.targetRole && nextFilters.targetRole !== "all"
        ? nextFilters.targetRole
        : undefined,
    scope:
      nextFilters.scope && nextFilters.scope !== "all"
        ? nextFilters.scope
        : undefined,
    isActive:
      nextFilters.status === "activeOnly"
        ? "true"
        : nextFilters.status === "inactiveOnly"
          ? "false"
          : undefined,
  };

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );
};

export const useSystemNotificationManagement = (actor = {}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    targetRole: "all",
    scope: "all",
    status: "all",
  });

  const actorRole = useMemo(
    () => String(actor?.role || "").toLowerCase(),
    [actor?.role],
  );

  const fetchList = useCallback(
    async (page = 1, pageSize = 10, customFilters = {}) => {
      setLoading(true);
      try {
        const nextFilters = {
          ...filters,
          ...customFilters,
        };

        const params = buildSystemNotificationListParams(
          page,
          pageSize,
          nextFilters,
        );

        const response = await getSystemNotifications(params);
        const mappedItems = Array.isArray(response?.items)
          ? response.items.map(mapRecord)
          : [];

        setItems(mappedItems);
        setPagination({
          current: response?.pagination?.page || page,
          pageSize: response?.pagination?.limit || pageSize,
          total: response?.pagination?.total || 0,
        });
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || "Khong the tai danh sach thong bao he thong",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, messageApi],
  );

  const fetchDetail = useCallback(
    async (notificationId) => {
      if (!notificationId) {
        setDetail(null);
        return null;
      }

      try {
        const response = await getSystemNotificationById(notificationId);
        const mapped = response ? mapRecord(response) : null;
        setDetail(mapped);
        return mapped;
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || "Khong the tai chi tiet thong bao",
        );
        return null;
      }
    },
    [messageApi],
  );

  const createItem = useCallback(
    async (values) => {
      setSaving(true);
      try {
        const payload = buildPayload(values, actorRole);
        await createSystemNotification(payload);
        messageApi.success("Tao thong bao he thong thanh cong");
        await fetchList(1, pagination.pageSize);
        return true;
      } catch (error) {
        messageApi.error(error?.response?.data?.message || "Khong the tao thong bao");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [actorRole, fetchList, messageApi, pagination.pageSize],
  );

  const updateItem = useCallback(
    async (notificationId, values) => {
      if (!notificationId) return false;

      setSaving(true);
      try {
        const payload = buildPayload(values, actorRole);
        const updated = await updateSystemNotification(notificationId, payload);
        const mappedUpdated = updated ? mapRecord(updated) : null;

        setItems((prev) =>
          prev.map((item) =>
            String(item.id) === String(notificationId)
              ? {
                ...item,
                ...mappedUpdated,
              }
              : item,
          ),
        );

        setDetail(mappedUpdated);
        messageApi.success("Cap nhat thong bao he thong thanh cong");
        return true;
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || "Khong the cap nhat thong bao",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [actorRole, messageApi],
  );

  const quickToggleStatus = useCallback(
    async (notificationId, currentStatus) => {
      if (!notificationId) return false;

      setSaving(true);
      try {
        const updated = await updateSystemNotification(notificationId, {
          isActive: !currentStatus,
        });

        const mappedUpdated = updated ? mapRecord(updated) : null;

        setItems((prev) =>
          prev.map((item) =>
            String(item.id) === String(notificationId)
              ? mergeRecord(item, mappedUpdated)
              : item,
          ),
        );

        setDetail((prev) => {
          if (!prev || String(prev.id) !== String(notificationId)) return prev;
          return mergeRecord(prev, mappedUpdated);
        });

        messageApi.success("Cap nhat trang thai thong bao thanh cong");
        return true;
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || "Khong the cap nhat trang thai thong bao",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [messageApi],
  );

  return {
    contextHolder,
    loading,
    saving,
    items,
    pagination,
    detail,
    selectedId,
    filters,
    setSelectedId,
    setFilters,
    fetchList,
    fetchDetail,
    createItem,
    updateItem,
    quickToggleStatus,
  };
};
