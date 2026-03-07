import { useState, useCallback } from "react";
import { message, Modal } from "antd";
import {
  getVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  generateVoucherCode,
  publishVoucher,
  deactivateVoucher,
  reactivateVoucher,
  archiveVoucher,
  cloneVoucher,
} from "@/services/voucher.service";

export const useVoucherManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filters State
  const [searchText, setSearchText] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [filterDiscountType, setFilterDiscountType] = useState("all");
  const [sortField, setSortField] = useState("-createdAt");

  // Fetch Danh sách Voucher
  const fetchList = useCallback(
    async (page = 1, pageSize = 10, customFilters = {}) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pageSize,
          search: searchText || undefined,
          state: filterState !== "all" ? filterState : undefined,
          scope: filterScope !== "all" ? filterScope : undefined,
          discountType:
            filterDiscountType !== "all" ? filterDiscountType : undefined,
          sort: sortField || undefined,
          ...customFilters,
        };

        const response = await getVouchers(params);
        setItems(response?.data || []);
        if (response?.pagination) {
          setPagination({
            current: response.pagination.page,
            pageSize: response.pagination.limit,
            total: response.pagination.total,
          });
        }
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || "Không thể tải danh sách voucher",
        );
        console.error("Lỗi khi tải voucher:", error);
      } finally {
        setLoading(false);
      }
    },
    [
      messageApi,
      searchText,
      filterState,
      filterScope,
      filterDiscountType,
      sortField,
    ],
  );

  // Xem chi tiết voucher
  const handleViewDetail = useCallback(
    async (id) => {
      try {
        const response = await getVoucherById(id);
        const voucher = response?.data?.voucher;
        if (!voucher) {
          throw new Error("Không có dữ liệu voucher");
        }
        return response.data; // Trả về cả voucher và statistics
      } catch (error) {
        console.error("Lỗi khi tải chi tiết voucher:", error);
        messageApi.error(
          error?.response?.data?.message || "Không thể tải chi tiết voucher",
        );
        return null;
      }
    },
    [messageApi],
  );

  // Tạo mới voucher
  const handleCreate = useCallback(
    async (formData) => {
      try {
        await createVoucher(formData);
        messageApi.success("Tạo voucher thành công");
        fetchList(1, pagination.pageSize);
        return true;
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || "Lỗi khi tạo voucher",
        );
        return false;
      }
    },
    [messageApi, fetchList, pagination],
  );

  // Cập nhật voucher
  const handleUpdate = useCallback(
    async (id, formData) => {
      try {
        await updateVoucher(id, formData);
        messageApi.success("Cập nhật voucher thành công");
        fetchList(pagination.current, pagination.pageSize);
        return true;
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || "Lỗi khi cập nhật voucher",
        );
        return false;
      }
    },
    [messageApi, fetchList, pagination],
  );

  // Xóa voucher (Draft)
  const handleDelete = useCallback(
    (record) => {
      Modal.confirm({
        title: "Xác nhận xóa voucher",
        content: `Bạn có chắc chắn muốn xóa voucher có mã "${record.code}"? Hành động này không thể hoàn tác.`,
        okText: "Xóa",
        cancelText: "Hủy",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteVoucher(record._id);
            messageApi.success("Xóa voucher thành công");
            fetchList(pagination.current, pagination.pageSize);
          } catch (error) {
            messageApi.error(
              error?.response?.data?.message || "Không thể xóa voucher này",
            );
          }
        },
      });
    },
    [messageApi, fetchList, pagination],
  );

  // Thay đổi trạng thái chung (Publish, Deactivate, Reactivate, Archive)
  const handleStateChange = useCallback(
    async (action, record) => {
      const actionMap = {
        publish: { name: "Xuất bản", func: publishVoucher },
        deactivate: { name: "Tạm ngưng", func: deactivateVoucher },
        reactivate: { name: "Kích hoạt lại", func: reactivateVoucher },
        archive: { name: "Lưu trữ", func: archiveVoucher },
      };

      const selectedAction = actionMap[action];
      if (!selectedAction) return;

      Modal.confirm({
        title: `Xác nhận ${selectedAction.name.toLowerCase()}`,
        content: `Bạn có chắc muốn ${selectedAction.name.toLowerCase()} voucher "${
          record.code
        }"?`,
        okText: "Đồng ý",
        cancelText: "Hủy",
        cancelButtonProps: { style: { borderRadius: 8 } },
        okButtonProps: {
          style: { borderRadius: 8 },
          danger: action === "deactivate" || action === "archive",
          type:
            action === "publish" || action === "reactivate"
              ? "primary"
              : "default",
        },
        onOk: async () => {
          try {
            await selectedAction.func(record._id);
            messageApi.success(`${selectedAction.name} voucher thành công`);
            fetchList(pagination.current, pagination.pageSize);
          } catch (error) {
            messageApi.error(
              error?.response?.data?.message ||
                `Lỗi khi ${selectedAction.name.toLowerCase()} voucher`,
            );
          }
        },
      });
    },
    [messageApi, fetchList, pagination],
  );

  // Generate mã Voucher Tự động
  const handleGenerateCode = useCallback(async () => {
    try {
      const response = await generateVoucherCode();
      return response?.data?.code;
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi tạo mã tự động");
      return null;
    }
  }, [messageApi]);

  // Clone Voucher
  const handleClone = useCallback(
    async (id) => {
      try {
        const response = await cloneVoucher(id);
        const clonedVoucher = response?.data?.voucher;
        if (clonedVoucher) {
          messageApi.success(
            response?.message ||
              "Nhân bản thành công. Vui lòng cập nhật các trường bắt buộc.",
          );
          return clonedVoucher;
        }
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || "Lỗi khi nhân bản voucher",
        );
        return null;
      }
    },
    [messageApi],
  );

  return {
    contextHolder,
    loading,
    items,
    pagination,
    searchText,
    filterState,
    filterScope,
    filterDiscountType,
    sortField,
    setSearchText,
    setFilterState,
    setFilterScope,
    setFilterDiscountType,
    setSortField,
    fetchList,
    handleViewDetail,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleStateChange,
    handleGenerateCode,
    handleClone,
  };
};
