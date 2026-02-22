import { useEffect, useState } from 'react';
import {
  Card,
  Space,
  Row,
  Col,
  Divider,
  Empty,
  Alert,
  Tag,
  Skeleton,
} from 'antd';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/useAuthStore';
import { useAssignFoodToMenu } from '@/hooks/useAssignFoodToMenu';
import { getAllProducts } from '@/services/product.service';
import MenuSelector from '@/components/assignFood/MenuSelector';
import FoodGrid from '@/components/assignFood/FoodGrid';
import SelectedFoodsPreview from '@/components/assignFood/SelectedFoodsPreview';
import AssignActions from '@/components/assignFood/AssignActions';
import GIcon from '@/components/GIcon';

export default function AssignFoodToMenu() {
  const { user } = useAuthStore();
  const [foods, setFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(false);

  const {
    contextHolder,
    menus,
    selectedMenu,
    menuLoading,
    selectedFoods,
    loading,
    fetchMenus,
    handleSelectMenu,
    handleAddFood,
    handleRemoveFood,
    handleReorderFoods,
    handleAssignFoods,
    handlePublish,
    handlePreview,
  } = useAssignFoodToMenu();

  // Fetch thực đơn khi component mount
  useEffect(() => {
    if (user?.canteenId) {
      fetchMenus(user.canteenId, 'daily', new Date());
    }
  }, [user?.canteenId, fetchMenus]);

  // Fetch danh sách thực phẩm có sẵn
  useEffect(() => {
    const fetchFoods = async () => {
      setFoodsLoading(true);
      try {
        const response = await getAllProducts({
          status: 'available',
          canteenId: user?.canteenId,
          limit: 100,
        });
        setFoods(response?.data || []);
      } catch (error) {
        console.error('Lỗi khi tải thực phẩm:', error);
      } finally {
        setFoodsLoading(false);
      }
    };

    if (user?.canteenId) {
      fetchFoods();
    }
  }, [user?.canteenId]);

  return (
    <>
      {contextHolder}

      <div style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <Card style={{ marginBottom: '16px' }}>
            <Row align="middle" justify="space-between">
              <Col flex="auto">
                <h2
                  style={{
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <GIcon name="lunch_dining" />
                  Phân bổ thực phẩm vào thực đơn
                </h2>
              </Col>
              <Col>
                <Tag
                  color="blue"
                  style={{ fontSize: '14px', padding: '4px 12px' }}
                >
                  {dayjs(new Date()).format('DD/MM/YYYY')}
                </Tag>
              </Col>
            </Row>
          </Card>

          {/* Alert hướng dẫn */}
          <Alert
            message="Hướng dẫn sử dụng"
            description="1. Chọn thực đơn ở bên trái • 2. Lựa chọn thực phẩm ở giữa • 3. Sắp xếp thứ tự • 4. Nhấn 'Phân bổ' để lưu"
            type="info"
            icon={<GIcon name="info" />}
            showIcon
          />

          {/* Main content */}
          <Row gutter={[16, 16]}>
            {/* Left: Menu selector */}
            <Col xs={24} md={8}>
              <Card title="Chọn thực đơn">
                {menuLoading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : menus.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có thực đơn nào"
                  />
                ) : (
                  <MenuSelector
                    menus={menus}
                    selectedMenu={selectedMenu}
                    onSelectMenu={handleSelectMenu}
                  />
                )}
              </Card>
            </Col>

            {/* Right: Food selection */}
            <Col xs={24} md={16}>
              <Space
                direction="vertical"
                size="large"
                style={{ width: '100%' }}
              >
                {/* Available foods */}
                <Card title={`Thực phẩm có sẵn (${foods.length})`}>
                  {foodsLoading ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                  ) : foods.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có thực phẩm nào"
                    />
                  ) : (
                    <FoodGrid
                      foods={foods}
                      selectedFoods={selectedFoods}
                      onAddFood={handleAddFood}
                    />
                  )}
                </Card>

                {/* Selected foods preview */}
                {selectedFoods.length > 0 && (
                  <Card
                    title={`Đã chọn (${selectedFoods.length})`}
                    style={{ borderLeft: '4px solid #52c41a' }}
                  >
                    <SelectedFoodsPreview
                      foods={selectedFoods}
                      onRemoveFood={handleRemoveFood}
                      onReorderFoods={handleReorderFoods}
                    />
                  </Card>
                )}

                {/* Actions */}
                <AssignActions
                  selectedMenu={selectedMenu}
                  selectedFoodsCount={selectedFoods.length}
                  loading={loading}
                  onAssign={handleAssignFoods}
                  onPublish={handlePublish}
                  onPreview={handlePreview}
                />
              </Space>
            </Col>
          </Row>
        </Space>
      </div>
    </>
  );
}
