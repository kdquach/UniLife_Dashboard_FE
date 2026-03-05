import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Select, message, Spin } from 'antd';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuditLogService } from '@/services/auditLog.service';

// Component thống kê hoạt động hệ thống
const AuditStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  const { getActivityStatistics } = useAuditLogService();

  // Lấy thống kê hoạt động
  const fetchStatistics = async (selectedDays) => {
    try {
      setLoading(true);
      const response = await getActivityStatistics(selectedDays);
      setStatistics(response.data);
    } catch (error) {
      message.error('Lỗi khi tải thống kê hoạt động');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy dữ liệu khi component mount
  useEffect(() => {
    fetchStatistics(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  if (loading) {
    return <Spin />;
  }

  // Chuẩn bị dữ liệu cho biểu đồ
  const actionByTypeData = (statistics?.actionsByType || []).map((item) => ({
    name: item._id || 'Unknown',
    value: item.count,
  }));

  // Màu sắc cho biểu đồ
  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#FF6B9D',
    '#C44569',
    '#6BCB77',
    '#4D96FF',
    '#FFD60A',
    '#FFC300',
  ];

  // Cấu hình cột bảng Top users
  const userColumns = [
    {
      title: 'Tên nhân viên',
      dataIndex: 'userName',
      key: 'userName',
      render: (text, record) => text || `User ${record._id}` || 'Unknown',
    },
    {
      title: 'Số lần hoạt động',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        {/* Bộ lọc */}
        <Card style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <label style={{ marginBottom: 8, display: 'block' }}>
                Thống kê theo khoảng thời gian (ngày)
              </label>
              <Select
                value={days}
                onChange={setDays}
                style={{ width: '100%' }}
                options={[
                  { label: '7 ngày', value: 7 },
                  { label: '30 ngày', value: 30 },
                  { label: '90 ngày', value: 90 },
                  { label: '365 ngày', value: 365 },
                ]}
              />
            </Col>
          </Row>
        </Card>

        {/* Tổng hoạt động */}
        <Card style={{ marginBottom: 20 }}>
          <Statistic
            title="Tổng số hoạt động"
            value={statistics?.totalActions || 0}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>

        {/* Biểu đồ hoạt động theo loại */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={12}>
            <Card title="Hoạt động theo loại hành động">
              {actionByTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={actionByTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>Không có dữ liệu</p>
              )}
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Tỷ lệ hoạt động">
              {actionByTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={actionByTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {actionByTypeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p>Không có dữ liệu</p>
              )}
            </Card>
          </Col>
        </Row>

        {/* Top 10 nhân viên hoạt động nhiều nhất */}
        <Card title="Top 10 nhân viên hoạt động nhiều nhất">
          <Table
            columns={userColumns}
            dataSource={statistics?.actionsByUser || []}
            pagination={false}
            rowKey="_id"
          />
        </Card>
      </div>
    </Spin>
  );
};

export default AuditStatistics;
