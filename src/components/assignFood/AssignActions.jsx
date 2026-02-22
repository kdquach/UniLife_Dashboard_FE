import {
  Space,
  Button,
  Statistic,
  Row,
  Col,
  Divider,
  Alert,
  Card,
  Tooltip,
} from 'antd';
import GIcon from '@/components/GIcon';

export default function AssignActions({
  selectedMenu,
  selectedFoodsCount,
  loading,
  onAssign,
  onPublish,
  onPreview,
}) {
  const isReady = selectedMenu && selectedFoodsCount > 0;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Divider />

      {/* Warnings */}
      {!selectedMenu && (
        <Alert
          type="warning"
          message="Vui lòng chọn thực đơn"
          description="Hãy chọn một thực đơn từ bên trái trước khi phân bổ thực phẩm"
          icon={<GIcon name="warning" />}
          showIcon
          closable
        />
      )}

      {selectedMenu && selectedFoodsCount === 0 && (
        <Alert
          type="warning"
          message="Chưa chọn thực phẩm"
          description="Hãy chọn ít nhất 1 thực phẩm từ danh sách ở trên"
          icon={<GIcon name="info" />}
          showIcon
          closable
        />
      )}

      {/* Info card */}
      <Card
        style={{
          backgroundColor: '#fafafa',
          borderLeft: '4px solid #1890ff',
        }}
      >
        <Row gutter={[32, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Thực đơn được chọn"
              value={
                selectedMenu
                  ? selectedMenu.type === 'daily'
                    ? 'Hôm nay'
                    : 'Tuần này'
                  : '---'
              }
              prefix={<GIcon name="calendar_today" />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Thực phẩm chọn"
              value={selectedFoodsCount}
              suffix="món"
              valueStyle={{
                color: selectedFoodsCount > 0 ? '#52c41a' : '#999',
              }}
              prefix={<GIcon name="restaurant_menu" />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Tổng giá trị"
              value={selectedFoodsCount > 0 ? '---' : '0'}
              suffix="đ"
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Action buttons */}
      <Row gutter={[12, 12]} justify="flex-end">
        <Col xs={24} sm={12} md="auto">
          <Tooltip
            title={
              !isReady
                ? 'Hãy chọn thực đơn và ít nhất 1 thực phẩm'
                : 'Xem trước trước khi lưu'
            }
          >
            <Button
              block
              onClick={onPreview}
              disabled={!isReady}
              icon={<GIcon name="visibility" />}
              size="large"
            >
              Xem trước
            </Button>
          </Tooltip>
        </Col>
        <Col xs={24} sm={12} md="auto">
          <Tooltip
            title={
              !isReady
                ? 'Hãy chọn thực đơn và ít nhất 1 thực phẩm'
                : 'Phân bổ thực phẩm vào thực đơn'
            }
          >
            <Button
              block
              type="primary"
              onClick={onAssign}
              loading={loading}
              disabled={!isReady}
              icon={<GIcon name="check" />}
              size="large"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Phân bổ
            </Button>
          </Tooltip>
        </Col>
        <Col xs={24} sm={12} md="auto">
          <Tooltip
            title={
              !selectedMenu ? 'Hãy chọn thực đơn trước' : 'Xuất bản thực đơn'
            }
          >
            <Button
              block
              type="default"
              onClick={onPublish}
              loading={loading}
              disabled={!selectedMenu}
              icon={<GIcon name="publish" />}
              size="large"
            >
              Xuất bản
            </Button>
          </Tooltip>
        </Col>
      </Row>

      {/* Info */}
      <Alert
        type="success"
        message="Mẹo"
        description="Nhấn 'Phân bổ' để lưu thay đổi, sau đó 'Xuất bản' để hiển thị thực đơn cho khách hàng"
        icon={<GIcon name="lightbulb" />}
        showIcon
        closable
      />
    </Space>
  );
}
