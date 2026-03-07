import React, { useEffect, useState } from "react";
import { Form, Button, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/store/useAuthStore";
import { getAllProductCategories } from "@/services/productCategory.service";
import { getAllProducts } from "@/services/product.service";
import { getAllCanteens } from "@/services/canteen.service";
import { exportVouchers } from "@/services/voucher.service";
import { useVoucherManagement } from "@/hooks/useVoucherManagement";
import dayjs from "dayjs";

// Components
import VoucherListView from "@/components/voucher/VoucherListView";
import VoucherFormModal from "@/components/voucher/VoucherFormModal";

export default function VoucherManagementPage() {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const isManager = user?.role === "manager";
  const userCanteenId = user?.canteenId?._id || user?.canteenId;

  // Metadata states
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [canteens, setCanteens] = useState([]);

  // UI States
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Custom hook
  const {
    contextHolder,
    loading,
    items,
    pagination,
    searchText,
    filterState,
    filterScope,
    filterDiscountType,
    setSearchText,
    setFilterState,
    setFilterScope,
    setFilterDiscountType,
    setSortField,
    fetchList,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleStateChange,
    handleGenerateCode,
    handleClone,
  } = useVoucherManagement();

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, prodRes, canRes] = await Promise.all([
          getAllProductCategories({ limit: 100 }),
          getAllProducts({ limit: 200, status: "active" }),
          getAllCanteens({ limit: 50 }),
        ]);
        setCategories(
          catRes?.data?.map((c) => ({ label: c.name, value: c._id })) || [],
        );
        setProducts(
          prodRes?.data?.map((p) => ({
            label: `${p.name} - ${p.price?.toLocaleString()}đ`,
            value: p._id,
          })) || [],
        );
        setCanteens(canRes?.data?.canteens || []);
      } catch (error) {
        console.error("Meta fetch error", error);
      }
    };
    fetchMeta();
    fetchList();
  }, [fetchList]);

  // Handle Export
  const handleExport = async (format = "xlsx") => {
    try {
      const p = { format };
      if (filterState !== "all") p.state = filterState;
      if (isManager && userCanteenId) p.canteenId = userCanteenId;

      const blob = await exportVouchers(p);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      const ext = format === "csv" ? "csv" : "xlsx";
      link.setAttribute(
        "download",
        `Voucher_Export_${dayjs().format("YYYYMMDD")}.${ext}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
    }
  };

  const exportMenuItems = [
    {
      key: "xlsx",
      label: "Xuất Excel (.xlsx)",
      icon: <FileExcelOutlined />,
      onClick: () => handleExport("xlsx"),
    },
    {
      key: "csv",
      label: "Xuất CSV (.csv)",
      icon: <FileTextOutlined />,
      onClick: () => handleExport("csv"),
    },
  ];

  // Navigate to detail page
  const openView = (record) => {
    navigate(`${record._id}`);
  };

  const openCreate = () => {
    setFormMode("create");
    form.resetFields();
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setFormMode("edit");
    setSelectedVoucher(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      displayDescription: record.displayDescription,
      internalDescription: record.internalDescription,
      discountType: record.discountType,
      discountValue: record.discountValue,
      maxDiscountCap: record.maxDiscountCap,
      scope: record.scope,
      canteen_ids: record.canteen_ids?.map((c) => c._id || c),
      applyTo: record.applyTo,
      categoryIds: record.categoryIds?.map((c) => c._id || c),
      productIds: record.productIds?.map((p) => p._id || p),
      minOrderValue: record.minOrderValue,
      minItemQuantity: record.minItemQuantity,
      totalLimit: record.totalLimit,
      usagePerUser: record.usagePerUser,
      allowStackWithCombo: record.allowStackWithCombo,
      dateRange: [dayjs(record.startDatetime), dayjs(record.endDatetime)],
      timeRange: record.timeRestriction
        ? [
            dayjs(record.timeRestriction.fromTime, "HH:mm"),
            dayjs(record.timeRestriction.toTime, "HH:mm"),
          ]
        : undefined,
    });
    setFormOpen(true);
  };

  const submitForm = async (payload) => {
    const success =
      formMode === "create"
        ? await handleCreate(payload)
        : await handleUpdate(selectedVoucher._id, payload);

    if (success) {
      setFormOpen(false);
      form.resetFields();
    }
  };

  const execClone = async (record) => {
    const draftData = await handleClone(record._id);
    if (draftData) {
      setFormMode("create");
      form.setFieldsValue({
        name: `${draftData.name} (Copy)`,
        displayDescription: draftData.displayDescription,
        internalDescription: draftData.internalDescription,
        discountType: draftData.discountType,
        discountValue: draftData.discountValue,
        maxDiscountCap: draftData.maxDiscountCap,
        scope: draftData.scope,
        canteen_ids: draftData.canteen_ids,
        applyTo: draftData.applyTo,
        categoryIds: draftData.categoryIds,
        productIds: draftData.productIds,
        minOrderValue: draftData.minOrderValue,
        minItemQuantity: draftData.minItemQuantity,
        totalLimit: draftData.totalLimit,
        usagePerUser: draftData.usagePerUser,
        allowStackWithCombo: draftData.allowStackWithCombo,
      });
      setFormOpen(true);
    }
  };

  return (
    <>
      {contextHolder}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
          marginTop: -8,
        }}
      >
        <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
          <Button icon={<DownloadOutlined />}>Xuất báo cáo ▾</Button>
        </Dropdown>
      </div>

      <VoucherListView
        loading={loading}
        items={items}
        pagination={pagination}
        searchText={searchText}
        filterState={filterState}
        filterScope={filterScope}
        filterDiscountType={filterDiscountType}
        onSearchChange={setSearchText}
        onFilterStateChange={setFilterState}
        onFilterScopeChange={setFilterScope}
        onFilterDiscountTypeChange={setFilterDiscountType}
        onSortChange={setSortField}
        onSearch={() => fetchList(1, pagination.pageSize)}
        onPaginationChange={fetchList}
        onAdd={openCreate}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        onStateChange={handleStateChange}
        onClone={execClone}
        managerRole={isManager}
      />

      <VoucherFormModal
        open={formOpen}
        mode={formMode}
        voucherState={formMode === "edit" ? selectedVoucher?.state : null}
        form={form}
        categories={categories}
        products={products}
        canteens={canteens}
        managerRole={isManager}
        userCanteenId={userCanteenId}
        onSubmit={submitForm}
        onCancel={() => setFormOpen(false)}
        onGenerateCode={handleGenerateCode}
      />
    </>
  );
}
