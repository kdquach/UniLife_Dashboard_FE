import { Card, Row, Col, Table, Tag, Statistic, Empty } from 'antd';
import GIcon from '@/components/GIcon';

// Component tab quản lý nguyên liệu tồn kho
export default function IngredientInventoryTab({
  stats,
  lowStockIngredients,
  ingredientPagination,
  ingredientLoading,
  lowStockIngredientColumns,
  fetchLowStockIngredients,
}) {
  return (
    <div style={{ paddingTop: '24px' }}>
      {/* Thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12}>
          <Card
            hoverable
            className="inventory-stat-card"
            style={{
              background: 'linear-gradient(135deg, #fff7e6 0%, #fff 100%)',
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
                  Nguyên liệu sắp hết
                </span>
              }
              value={stats.totalLowStockIngredients}
              prefix={
                <GIcon name="warning_amber" style={{ color: '#faad14' }} />
              }
              valueStyle={{
                color: '#faad14',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
              suffix={
                <span style={{ fontSize: '14px', color: '#8c8c8c' }}>loại</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            hoverable
            className="inventory-stat-card"
            style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fff 100%)',
              borderLeft: '4px solid #f59e0b',
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
              value={stats.criticalIngredients}
              prefix={
                <GIcon name="priority_high" style={{ color: '#f59e0b' }} />
              }
              valueStyle={{
                color: '#f59e0b',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
              suffix={
                <span style={{ fontSize: '14px', color: '#8c8c8c' }}>loại</span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng nguyên liệu sắp hết */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GIcon
              name="warning"
              style={{ color: '#faad14', fontSize: '20px' }}
            />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>
              Nguyên Liệu Sắp Hết
            </span>
            <Tag color="orange" style={{ marginLeft: '8px' }}>
              {ingredientPagination.total} loại
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
        {lowStockIngredients.length === 0 ? (
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
                  Không có nguyên liệu sắp hết
                </p>
                <p style={{ fontSize: '12px', color: '#bfbfbf' }}>
                  Tồn kho nguyên liệu đều ở mức an toàn
                </p>
              </div>
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Table
            columns={lowStockIngredientColumns}
            dataSource={lowStockIngredients.map((item, index) => ({
              ...item,
              key: item._id || index,
            }))}
            loading={ingredientLoading}
            pagination={{
              current: ingredientPagination.current,
              pageSize: ingredientPagination.pageSize,
              total: ingredientPagination.total,
              onChange: (page, pageSize) =>
                fetchLowStockIngredients(page, pageSize),
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} nguyên liệu`,
            }}
            scroll={{ x: 1000 }}
            size="middle"
            style={{ background: '#fff' }}
          />
        )}
      </Card>
    </div>
  );
}
