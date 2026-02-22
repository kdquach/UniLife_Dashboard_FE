import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  Tag,
  Space,
  Image,
  Tooltip,
} from 'antd';
import GIcon from '@/components/GIcon';

export default function FoodGrid({ foods, selectedFoods, onAddFood }) {
  const isSelected = (foodId) => {
    return selectedFoods.some((f) => f._id === foodId);
  };

  return (
    <Row gutter={[16, 16]}>
      {foods.map((food) => {
        const selected = isSelected(food._id);
        return (
          <Col xs={24} sm={12} md={8} key={food._id}>
            <Card
              hoverable
              cover={
                <div
                  style={{
                    height: '150px',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  <Image
                    src={food.image || 'https://via.placeholder.com/200'}
                    alt={food.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    preview={false}
                  />
                </div>
              }
              style={{
                border: selected ? '2px solid #52c41a' : '1px solid #d9d9d9',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              {selected && (
                <Badge
                  count={
                    <GIcon name="check_circle" style={{ color: '#52c41a' }} />
                  }
                  style={{ position: 'absolute', top: 10, right: 10 }}
                />
              )}

              <Space
                direction="vertical"
                style={{ width: '100%' }}
                size="small"
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {food.name}
                  </div>
                  {food.categoryId && (
                    <Tag color="blue" style={{ marginLeft: '0' }}>
                      {typeof food.categoryId === 'string'
                        ? food.categoryId
                        : food.categoryId.name}
                    </Tag>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '14px',
                    color: '#ff4d4f',
                    fontWeight: 'bold',
                  }}
                >
                  {food.price?.toLocaleString('vi-VN')} đ
                </div>

                <Tooltip
                  title={
                    selected
                      ? 'Thực phẩm đã được chọn'
                      : 'Nhấn để chọn thực phẩm'
                  }
                >
                  <Button
                    type={selected ? 'primary' : 'default'}
                    block
                    icon={<GIcon name={selected ? 'check' : 'add'} />}
                    onClick={() => !selected && onAddFood(food)}
                    disabled={selected}
                    style={{
                      backgroundColor: selected ? '#52c41a' : undefined,
                      borderColor: selected ? '#52c41a' : undefined,
                    }}
                  >
                    {selected ? 'Đã chọn' : 'Chọn'}
                  </Button>
                </Tooltip>
              </Space>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
