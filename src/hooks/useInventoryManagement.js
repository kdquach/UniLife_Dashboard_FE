import { useState, useCallback } from 'react';
import { message } from 'antd';
import {
  getOutOfStockProducts,
  getLowStockProducts,
} from '@/services/product.service';

// Hook quản lý logic hiển thị tồn kho
export const useInventoryManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loadingOutOfStock, setLoadingOutOfStock] = useState(false);
  const [loadingLowStock, setLoadingLowStock] = useState(false);

  // State cho sản phẩm hết hàng
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [outOfStockPagination, setOutOfStockPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // State cho sản phẩm sắp hết hàng
  const [lowStockItems, setLowStockItems] = useState([]);
  const [lowStockPagination, setLowStockPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Fetch danh sách sản phẩm hết hàng
  const fetchOutOfStockProducts = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoadingOutOfStock(true);
      try {
        const response = await getOutOfStockProducts({
          page,
          limit: pageSize,
        });

        setOutOfStockItems(response?.data || []);
        if (response?.pagination) {
          setOutOfStockPagination({
            current: response.pagination.page || page,
            pageSize: response.pagination.limit || pageSize,
            total: response.pagination.total || 0,
          });
        } else {
          // Fallback nếu không có pagination
          setOutOfStockPagination({
            current: page,
            pageSize: pageSize,
            total: response?.data?.length || 0,
          });
        }
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message ||
            'Không thể tải danh sách sản phẩm hết hàng'
        );
        console.error('Lỗi khi tải sản phẩm hết hàng:', error);
      } finally {
        setLoadingOutOfStock(false);
      }
    },
    [messageApi]
  );

  // Fetch danh sách sản phẩm sắp hết hàng
  const fetchLowStockProducts = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoadingLowStock(true);
      try {
        const response = await getLowStockProducts({
          page,
          limit: pageSize,
        });

        setLowStockItems(response?.data || []);
        if (response?.pagination) {
          setLowStockPagination({
            current: response.pagination.page || page,
            pageSize: response.pagination.limit || pageSize,
            total: response.pagination.total || 0,
          });
        } else {
          // Fallback nếu không có pagination
          setLowStockPagination({
            current: page,
            pageSize: pageSize,
            total: response?.data?.length || 0,
          });
        }
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message ||
            'Không thể tải danh sách sản phẩm sắp hết hàng'
        );
        console.error('Lỗi khi tải sản phẩm sắp hết hàng:', error);
      } finally {
        setLoadingLowStock(false);
      }
    },
    [messageApi]
  );

  return {
    contextHolder,
    messageApi,
    loadingOutOfStock,
    loadingLowStock,
    outOfStockItems,
    outOfStockPagination,
    lowStockItems,
    lowStockPagination,
    fetchOutOfStockProducts,
    fetchLowStockProducts,
  };
};
