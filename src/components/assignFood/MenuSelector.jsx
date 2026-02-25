import { List, Space, Typography, Tag, Badge, Empty } from 'antd';
import dayjs from 'dayjs';
import GIcon from '@/components/GIcon';

const { Text } = Typography;

// Map trạng thái thực đơn sang label + màu hiển thị
const getStatusMeta = (status) => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'active') {
    return { color: 'green', label: 'Đã xuất bản' };
  }

  if (normalized === 'inactive') {
    return { color: 'default', label: 'Ngưng sử dụng' };
  }

  return { color: 'orange', label: 'Nháp' };
};

const MenuSelector = ({ menus, selectedMenu, onSelectMenu }) => {
  if (!menus || menus.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có thực đơn nào"
      />
    );
  }

  return (
    <List
      dataSource={menus}
      renderItem={(menu) => (
        <List.Item
          key={menu._id}
          onClick={() => onSelectMenu(menu)}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            borderRadius: '6px',
            border:
              selectedMenu?._id === menu._id
                ? '2px solid #1890ff'
                : '1px solid #d9d9d9',
            backgroundColor:
              selectedMenu?._id === menu._id ? '#f0f5ff' : 'white',
            marginBottom: '8px',
            transition: 'all 0.3s ease',
            ':hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          }}
        >
          {(() => {
            const { color, label } = getStatusMeta(menu.status);
            const dateSource = menu.updatedAt || menu.createdAt;
            const hasDate = dateSource && dayjs(dateSource).isValid();

            return (
              <List.Item.Meta
                avatar={<GIcon name="calendar_today" />}
                title={
                  <Space size="small">
                    <Text strong>{menu.name || 'Thực đơn'}</Text>
                    <Tag color={color} style={{ marginLeft: '0' }}>
                      {label}
                    </Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {hasDate
                        ? dayjs(dateSource).format('DD/MM/YYYY HH:mm')
                        : '--/--/---- --:--'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      <GIcon name="restaurant_menu" />{' '}
                      {menu.foods?.length || 0} thực phẩm
                    </Text>
                  </Space>
                }
              />
            );
          })()}
          {selectedMenu?._id === menu._id && (
            <Badge
              count={<GIcon name="check_circle" style={{ color: '#52c41a' }} />}
            />
          )}
        </List.Item>
      )}
    />
  );
};

export default MenuSelector;
