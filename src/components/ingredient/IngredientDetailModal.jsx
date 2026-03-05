import { Modal, Descriptions, Tag, Space, Spin, Button } from 'antd';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { getIngredientById } from '@/services/ingredient.service';

// Modal xem chi tiết nguyên liệu
export default function IngredientDetailModal({
  open,
  ingredientId,
  onClose,
  onEdit,
}) {
  const [loading, setLoading] = useState(false);
  const [ingredient, setIngredient] = useState(null);

  // Fetch dữ liệu chi tiết khi mở modal
  useEffect(() => {
    if (open && ingredientId) {
      const fetchDetail = async () => {
        setLoading(true);
        try {
          const response = await getIngredientById(ingredientId);
          setIngredient(response.data.ingredient);
        } catch (error) {
          console.error('Lỗi khi lấy chi tiết nguyên liệu:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [open, ingredientId]);

  // Xác định màu tag cho trạng thái tồn kho
  const getStockStatusColor = (stock, threshold) => {
    if (stock === 0) return 'error';
    if (stock <= threshold) return 'warning';
    return 'success';
  };

  // Xác định text trạng thái tồn kho
  const getStockStatusText = (stock, threshold) => {
    if (stock === 0) return 'Hết hàng';
    if (stock <= threshold) return 'Sắp hết';
    return 'Bình thường';
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Chi tiết nguyên liệu"
      width={700}
      footer={
        ingredient && [
          <Button key="close" onClick={onClose}>
            Đóng
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              onEdit(ingredient);
              onClose();
            }}
          >
            Chỉnh sửa
          </Button>,
        ]
      }
    >
      <Spin spinning={loading}>
        {ingredient && (
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="Tên nguyên liệu">
              <strong>{ingredient.name}</strong>
            </Descriptions.Item>

            <Descriptions.Item label="Danh mục">
              {ingredient.categoryId?.name || 'Không xác định'}
            </Descriptions.Item>

            <Descriptions.Item label="Cơ sở">
              {ingredient.canteenId?.name || 'Không xác định'}
            </Descriptions.Item>

            <Descriptions.Item label="Tồn kho hiện tại">
              <Space>
                <strong>
                  {ingredient.stock} {ingredient.unit}
                </strong>
                <Tag
                  color={getStockStatusColor(
                    ingredient.stock,
                    ingredient.lowStockThreshold
                  )}
                >
                  {getStockStatusText(
                    ingredient.stock,
                    ingredient.lowStockThreshold
                  )}
                </Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Đơn vị tính">
              {ingredient.unit}
            </Descriptions.Item>

            <Descriptions.Item label="Ngưỡng cảnh báo">
              {ingredient.lowStockThreshold} {ingredient.unit}
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <Tag color={ingredient.isActive ? 'success' : 'default'}>
                {ingredient.isActive ? 'Hoạt động' : 'Tạm ngưng'}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Ngày tạo">
              {dayjs(ingredient.createdAt).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>

            <Descriptions.Item label="Cập nhật lần cuối">
              {dayjs(ingredient.updatedAt).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Spin>
    </Modal>
  );
}
