import { useState, useCallback } from 'react';
import { Modal, message } from 'antd';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getDeletedProducts,
  restoreProduct,
} from '@/services/product.service';

// Hook quản lý logic CRUD sản phẩm
export const useProductManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'deleted'

  // Fetch danh sách sản phẩm
  const fetchList = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pageSize,
        };

        if (searchText) {
          params.search = searchText;
        }

        if (filterStatus !== 'all') {
          params.status = filterStatus;
        }

        const response = await getAllProducts(params);
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
          error?.response?.data?.message || 'Không thể tải danh sách sản phẩm'
        );
        console.error('Lỗi khi tải sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    },
    [messageApi, searchText, filterStatus]
  );

  // Xem chi tiết sản phẩm
  const handleViewDetail = useCallback(
    async (record) => {
      try {
        const response = await getProductById(record._id);
        const product = response?.data?.product;
        if (!product) {
          throw new Error('Không có dữ liệu sản phẩm');
        }
        return product;
      } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        messageApi.error(
          error?.response?.data?.message || 'Không thể tải chi tiết sản phẩm'
        );
        return null;
      }
    },
    [messageApi]
  );

  // Xóa sản phẩm
  const handleDelete = useCallback(
    (record) => {
      Modal.confirm({
        title: 'Xác nhận xóa',
        content: `Bạn có chắc chắn muốn xóa sản phẩm "${record.name}"?`,
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteProduct(record._id);
            messageApi.success('Xóa sản phẩm thành công');
            fetchList();
          } catch (error) {
            messageApi.error(
              error?.response?.data?.message || 'Không thể xóa sản phẩm'
            );
          }
        },
      });
    },
    [messageApi, fetchList]
  );

  // Tạo sản phẩm mới
  const handleCreate = useCallback(
    async (formData) => {
      try {
        await createProduct(formData);
        messageApi.success('Tạo sản phẩm thành công');
        fetchList();
        return true;
      } catch (error) {
        messageApi.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        return false;
      }
    },
    [messageApi, fetchList]
  );

  // Cập nhật sản phẩm
  const handleUpdate = useCallback(
    async (id, formData) => {
      try {
        await updateProduct(id, formData);
        messageApi.success('Cập nhật sản phẩm thành công');
        fetchList();
        return true;
      } catch (error) {
        messageApi.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        return false;
      }
    },
    [messageApi, fetchList]
  );

  // Fetch danh sách sản phẩm đã xóa
  const fetchDeletedProducts = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pageSize,
        };

        if (searchText) {
          params.search = searchText;
        }

        const response = await getDeletedProducts(params);
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
          error?.response?.data?.message ||
            'Không thể tải danh sách sản phẩm đã xóa'
        );
        console.error('Lỗi khi tải sản phẩm đã xóa:', error);
      } finally {
        setLoading(false);
      }
    },
    [messageApi, searchText]
  );

  // Khôi phục sản phẩm đã xóa
  const handleRestore = useCallback(
    (record) => {
      Modal.confirm({
        title: 'Xác nhận khôi phục',
        content: `Bạn có chắc chắn muốn khôi phục sản phẩm "${record.name}"?`,
        okText: 'Khôi phục',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await restoreProduct(record._id);
            messageApi.success('Khôi phục sản phẩm thành công');
            fetchDeletedProducts();
          } catch (error) {
            messageApi.error(
              error?.response?.data?.message || 'Không thể khôi phục sản phẩm'
            );
          }
        },
      });
    },
    [messageApi, fetchDeletedProducts]
  );

  return {
    contextHolder,
    loading,
    items,
    pagination,
    searchText,
    filterStatus,
    viewMode,
    setSearchText,
    setFilterStatus,
    setViewMode,
    fetchList,
    fetchDeletedProducts,
    handleViewDetail,
    handleDelete,
    handleRestore,
    handleCreate,
    handleUpdate,
  };
};
