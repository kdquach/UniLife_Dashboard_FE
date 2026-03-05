import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Statistic,
  Empty,
  Button,
  Tooltip,
} from 'antd';
import GIcon from '@/components/GIcon';

// Component tab quản lý sản phẩm tồn kho
export default function ProductInventoryTab({
  stats,
  outOfStockItems,
  outOfStockPagination,
  loadingOutOfStock,
  lowStockItems,
  lowStockPagination,
  loadingLowStock,
  fetchOutOfStockProducts,
  fetchLowStockProducts,
  outOfStockColumns,
  lowStockColumns,
  getRowClassName,
}) {
  return (
    <div style={{ paddingTop: '24px' }}>
      {/* Thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            className="inventory-stat-card"
            style={{
              background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
              borderLeft: '4px solid #ff4d4f',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title={
                <span
                  style={{
                    fontSize: '14px',
                    color: '#8c8c8c',
                    fontWeight: '500',
                  }}
                >
                  Sản phẩm hết hàng
                </span>
              }
              value={stats.totalOutOfStock}
              prefix={
                <GIcon name="error_outline" style={{ color: '#ff4d4f' }} />
              }
              valueStyle={{
                color: '#ff4d4f',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
              suffix={
                <span style={{ fontSize: '14px', color: '#8c8c8c' }}>món</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            className="inventory-stat-card"
            style={{
              background: 'linear-gradient(135deg, #fffbf0 0%, #fff 100%)',
              borderLeft: '4px solid #faad14',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title={
                <span
                  style={{
                    fontSize: '14px',
                    color: '#8c8c8c',
                    fontWeight: '500',
                  }}
                >
                  Sản phẩm sắp hết hàng
                </span>
              }
              value={stats.totalLowStock}
              prefix={
                <GIcon name="warning_amber" style={{ color: '#faad14' }} />
              }
              valueStyle={{
                color: '#faad14',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
              suffix={
                <span style={{ fontSize: '14px', color: '#8c8c8c' }}>món</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            className="inventory-stat-card"
            style={{
              background: 'linear-gradient(135deg, #fff7e6 0%, #fff 100%)',
              borderLeft: '4px solid #ff7a45',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title={
                <span
                  style={{
                    fontSize: '14px',
                    color: '#8c8c8c',
                    fontWeight: '500',
                  }}
                >
                  Mức nguy hiểm (≤25%)
                </span>
              }
              value={stats.criticalItems}
              prefix={
                <GIcon name="priority_high" style={{ color: '#ff7a45' }} />
              }
              valueStyle={{
                color: '#ff7a45',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
              suffix={
                <span style={{ fontSize: '14px', color: '#8c8c8c' }}>món</span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng hết hàng */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GIcon
              name="error"
              style={{ color: '#ff4d4f', fontSize: '20px' }}
            />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>
              Sản phẩm Hết Hàng
            </span>
            <Tag color="red" style={{ marginLeft: '8px' }}>
              {outOfStockPagination.total} món
            </Tag>
          </div>
        }
        style={{
          marginBottom: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        extra={
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            <GIcon name="sync" style={{ marginRight: '4px' }} />
            Cập nhật tự động
          </span>
        }
      >
        {outOfStockItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#8c8c8c',
                    marginBottom: '4px',
                  }}
                >
                  <GIcon
                    name="check_circle"
                    style={{ color: '#52c41a', marginRight: '8px' }}
                  />
                  Không có sản phẩm hết hàng
                </p>
                <p style={{ fontSize: '12px', color: '#bfbfbf' }}>
                  Tất cả sản phẩm đều có tồn kho
                </p>
              </div>
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Table
            columns={outOfStockColumns}
            dataSource={outOfStockItems.map((item, index) => ({
              ...item,
              key: item._id || index,
            }))}
            loading={loadingOutOfStock}
            pagination={{
              current: outOfStockPagination.current,
              pageSize: outOfStockPagination.pageSize,
              total: outOfStockPagination.total,
              onChange: (page, pageSize) =>
                fetchOutOfStockProducts(page, pageSize),
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} sản phẩm`,
            }}
            scroll={{ x: 1000 }}
            size="middle"
            style={{ background: '#fff' }}
          />
        )}
      </Card>

      {/* Bảng sắp hết hàng */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GIcon
              name="warning"
              style={{ color: '#faad14', fontSize: '20px' }}
            />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>
              Sản phẩm Sắp Hết Hàng
            </span>
            <Tag color="orange" style={{ marginLeft: '8px' }}>
              {lowStockPagination.total} món
            </Tag>
          </div>
        }
        style={{
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        extra={
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            <GIcon name="info" style={{ marginRight: '4px' }} />
            Dưới ngưỡng cảnh báo
          </span>
        }
      >
        {lowStockItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#8c8c8c',
                    marginBottom: '4px',
                  }}
                >
                  <GIcon
                    name="check_circle"
                    style={{ color: '#52c41a', marginRight: '8px' }}
                  />
                  Không có sản phẩm sắp hết hàng
                </p>
                <p style={{ fontSize: '12px', color: '#bfbfbf' }}>
                  Tồn kho đều ở mức an toàn
                </p>
              </div>
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Table
            columns={lowStockColumns}
            dataSource={lowStockItems.map((item, index) => ({
              ...item,
              key: item._id || index,
            }))}
            loading={loadingLowStock}
            pagination={{
              current: lowStockPagination.current,
              pageSize: lowStockPagination.pageSize,
              total: lowStockPagination.total,
              onChange: (page, pageSize) =>
                fetchLowStockProducts(page, pageSize),
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} sản phẩm`,
            }}
            scroll={{ x: 1000 }}
            size="middle"
            style={{ background: '#fff' }}
            rowClassName={getRowClassName}
          />
        )}
      </Card>
    </div>
  );
}
