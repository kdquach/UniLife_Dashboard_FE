import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  message,
} from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuditLogService } from '@/services/auditLog.service';
import dayjs from 'dayjs';

// Component bảng hiển thị nhật ký hoạt động
const AuditLogTable = ({ onViewDetail }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    action: undefined,
    resourceType: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const { getAllAuditLogs } = useAuditLogService();

  // Lấy danh sách nhật ký
  const fetchAuditLogs = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await getAllAuditLogs({
        page,
        limit,
        ...filters,
      });

      setLogs(response.data || []);
      setPagination({
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || 20,
        total: response.pagination?.total || 0,
      });
    } catch (error) {
      message.error('Lỗi khi tải danh sách nhật ký');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy dữ liệu khi component mount hoặc filters thay đổi
  useEffect(() => {
    fetchAuditLogs(1, 20);
  }, [filters]);

  // Lấy dữ liệu khi pagination thay đổi
  useEffect(() => {
    fetchAuditLogs(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize]);

  // Xử lý lọc
  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
    setPagination({ ...pagination, current: 1 });
  };

  // Xử lý lọc theo khoảng thời gian
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
      setPagination({ ...pagination, current: 1 });
      return;
    }

    // Clear bộ lọc ngày khi người dùng xóa range
    setFilters({
      ...filters,
      startDate: undefined,
      endDate: undefined,
    });
    setPagination({ ...pagination, current: 1 });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      action: undefined,
      resourceType: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setPagination({ ...pagination, current: 1 });
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 90,
      render: (action) => {
        const colors = {
          CREATE: 'green',
          UPDATE: 'blue',
          DELETE: 'red',
          ERROR: 'volcano',
        };
        return <Tag color={colors[action] || 'default'}>{action}</Tag>;
      },
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      width: 100,
    },
    {
      title: 'Tài nguyên',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 100,
    },
    {
      title: 'Người dùng',
      dataIndex: 'userName',
      key: 'userName',
      width: 200,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
    },
    // {
    //   title: 'Mã trạng thái',
    //   dataIndex: 'statusCode',
    //   key: 'statusCode',
    //   width: 100,
    //   render: (code) => {
    //     let color = 'green';
    //     if (code >= 300 && code < 400) color = 'orange';
    //     if (code >= 400 && code < 500) color = 'red';
    //     if (code >= 500) color = 'volcano';
    //     return <Tag color={color}>{code}</Tag>;
    //   },
    // },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onViewDetail && onViewDetail(record._id)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card>
      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Lọc theo hành động"
            allowClear
            value={filters.action}
            onChange={(value) => handleFilterChange('action', value)}
            style={{ width: '100%' }}
            options={[
              { label: 'Tạo mới', value: 'CREATE' },
              { label: 'Cập nhật', value: 'UPDATE' },
              { label: 'Xóa', value: 'DELETE' },
              { label: 'Lỗi', value: 'ERROR' },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Lọc theo loại tài nguyên"
            allowClear
            value={filters.resourceType}
            onChange={(value) => handleFilterChange('resourceType', value)}
            style={{ width: '100%' }}
            options={[
              { label: 'Người dùng', value: 'Người dùng' },
              { label: 'Sản phẩm', value: 'Sản phẩm' },
              { label: 'Danh mục sản phẩm', value: 'Danh mục sản phẩm' },
              { label: 'Nguyên liệu', value: 'Nguyên liệu' },
              { label: 'Danh mục nguyên liệu', value: 'Danh mục nguyên liệu' },
              { label: 'Công thức', value: 'Công thức' },
              { label: 'Đơn hàng', value: 'Đơn hàng' },
              { label: 'Thực đơn', value: 'Thực đơn' },
              { label: 'Ca làm việc', value: 'Ca làm việc' },
              { label: 'Quyền hạn', value: 'Quyền hạn' },
              { label: 'Phiếu giảm giá', value: 'Phiếu giảm giá' },
              { label: 'Banner', value: 'Banner' },
              { label: 'Phản hồi', value: 'Phản hồi' },
              { label: 'Căn tin', value: 'Căn tin' },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <DatePicker.RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                fetchAuditLogs(pagination.current, pagination.pageSize)
              }
            >
              Làm mới
            </Button>
            <Button onClick={handleResetFilters}>Reset</Button>
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
          showTotal: (total) => `Tổng cộng: ${total} nhật ký`,
        }}
        onChange={(pag) => setPagination(pag)}
        rowKey="_id"
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default AuditLogTable;
