import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  Card,
  message,
  Select,
  Row,
  Col,
  Space,
} from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuditLogService } from '@/services/auditLog.service';
import dayjs from 'dayjs';

// Component hiển thị danh sách lỗi hệ thống
const AuditErrorLogs = ({ onViewDetail }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [days, setDays] = useState(7);

  const { getErrorLogs } = useAuditLogService();

  // Lấy danh sách lỗi
  const fetchErrorLogs = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await getErrorLogs({
        page,
        limit,
        days,
      });

      setLogs(response.data || []);
      setPagination({
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || 20,
        total: response.pagination?.total || 0,
      });
    } catch (error) {
      message.error('Lỗi khi tải danh sách lỗi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy dữ liệu khi component mount hoặc days thay đổi
  useEffect(() => {
    fetchErrorLogs(1, 20);
  }, [days]);

  // Lấy dữ liệu khi pagination thay đổi
  useEffect(() => {
    fetchErrorLogs(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize]);

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: 'Người dùng',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    {
      title: 'Message lỗi',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      ellipsis: true,
      render: (text) => (
        <span
          title={text}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method) => {
        const colors = {
          GET: 'blue',
          POST: 'green',
          PUT: 'orange',
          PATCH: 'cyan',
          DELETE: 'red',
        };
        return <Tag color={colors[method] || 'default'}>{method}</Tag>;
      },
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onViewDetail && onViewDetail(record._id)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card>
      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <label style={{ marginBottom: 8, display: 'block' }}>
            Lọc theo khoảng thời gian
          </label>
          <Select
            value={days}
            onChange={setDays}
            style={{ width: '100%' }}
            options={[
              { label: 'Hôm nay', value: 1 },
              { label: '7 ngày', value: 7 },
              { label: '30 ngày', value: 30 },
              { label: '90 ngày', value: 90 },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                fetchErrorLogs(pagination.current, pagination.pageSize)
              }
            >
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng: ${total} lỗi`,
        }}
        onChange={(pag) => setPagination(pag)}
        rowKey="_id"
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default AuditErrorLogs;
