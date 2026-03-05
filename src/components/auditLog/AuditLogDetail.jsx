import { useState, useEffect } from 'react';
import {
  Modal,
  Spin,
  Descriptions,
  Tag,
  Button,
  Space,
  message,
  Alert,
  Collapse,
  Divider,
} from 'antd';
import {
  CopyOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuditLogService } from '@/services/auditLog.service';
import dayjs from 'dayjs';

// Component hiển thị chi tiết nhật ký
const AuditLogDetail = ({ logId, visible, onClose }) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(false);

  const { getAuditLogById } = useAuditLogService();

  // Lấy chi tiết nhật ký
  useEffect(() => {
    if (visible && logId) {
      fetchLogDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, logId]);

  const fetchLogDetail = async () => {
    try {
      setLoading(true);
      const response = await getAuditLogById(logId);
      setLog(response.data?.auditLog || response.data);
    } catch (error) {
      message.error('Lỗi khi tải chi tiết nhật ký');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Sao chép dữ liệu
  const handleCopy = (text) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    message.success('Đã sao chép vào clipboard');
  };

  if (!log) {
    return null;
  }

  // Lấy tên hành động dễ hiểu
  const getActionLabel = (action) => {
    const labels = {
      CREATE: 'Tạo mới',
      UPDATE: 'Cập nhật',
      DELETE: 'Xóa',
      ERROR: 'Lỗi',
    };
    return labels[action] || action;
  };

  // Lấy icon cho hành động
  const getActionIcon = (action) => {
    const icons = {
      CREATE: <CheckCircleOutlined />,
      UPDATE: <EditOutlined />,
      DELETE: <DeleteOutlined />,
      ERROR: <ExclamationCircleOutlined />,
    };
    return icons[action] || null;
  };

  // Xác định màu sắc cho từng trường
  const getActionColor = (action) => {
    const colors = {
      CREATE: 'green',
      UPDATE: 'blue',
      DELETE: 'red',
      ERROR: 'volcano',
    };
    return colors[action] || 'default';
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'blue',
      POST: 'green',
      PUT: 'orange',
      PATCH: 'cyan',
      DELETE: 'red',
    };
    return colors[method] || 'default';
  };

  // Tạo mô tả chi tiết về log
  const renderLogDescription = () => {
    if (!log.oldValues && !log.newValues) return null;

    // Lấy các trường đã thay đổi
    const allKeys = new Set([
      ...Object.keys(log.oldValues || {}),
      ...Object.keys(log.newValues || {}),
    ]);

    // Loại bỏ các field kỹ thuật
    const techFields = ['_id', '__v', 'password'];
    const displayKeys = Array.from(allKeys).filter(
      (key) => !techFields.includes(key)
    );

    if (displayKeys.length === 0) return null;

    // Tạo danh sách mô tả thay đổi
    const changes = displayKeys
      .map((key) => {
        const oldValue = log.oldValues?.[key];
        const newValue = log.newValues?.[key];

        // Format giá trị để hiển thị
        const formatValue = (val) => {
          if (val === undefined || val === null) return 'Không có';
          if (typeof val === 'boolean') return val ? 'Có' : 'Không';
          if (typeof val === 'object') return JSON.stringify(val, null, 2);
          return String(val);
        };

        const oldDisplay = formatValue(oldValue);
        const newDisplay = formatValue(newValue);

        // Nếu là tạo mới
        if (log.action === 'CREATE') {
          return {
            key,
            text: `${key}: ${newDisplay}`,
          };
        }

        // Nếu là xóa
        if (log.action === 'DELETE') {
          return {
            key,
            text: `${key}: ${oldDisplay}`,
          };
        }

        // Nếu là cập nhật và có thay đổi
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          return {
            key,
            text: `${key}: "${oldDisplay}" → "${newDisplay}"`,
          };
        }

        return null;
      })
      .filter(Boolean);

    if (changes.length === 0) return null;

    return (
      <ul style={{ margin: 0, paddingLeft: '20px' }}>
        {changes.map((change) => (
          <li
            key={change.key}
            style={{
              marginBottom: '10px',
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#262626',
            }}
          >
            {change.text}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          Chi tiết Hoạt động
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {log && (
          <div>
            {/* Thông tin chính - Dễ hiểu */}
            <Alert
              message={
                <Space>
                  {getActionIcon(log.action)}
                  <strong style={{ fontSize: '16px' }}>
                    {log.description}
                  </strong>
                </Space>
              }
              description={
                <div style={{ marginTop: 8 }}>
                  <Space direction="vertical" size="small">
                    <div>
                      <ClockCircleOutlined style={{ marginRight: 8 }} />
                      <strong>Thời gian:</strong>{' '}
                      {dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                      {' ('}
                      {dayjs(log.createdAt).fromNow()}
                      {')'}
                    </div>
                    <div>
                      <UserOutlined style={{ marginRight: 8 }} />
                      <strong>Người thực hiện:</strong> {log.userName || 'N/A'}
                      {log.userEmail && ` (${log.userEmail})`}
                    </div>
                  </Space>
                </div>
              }
              type={log.action === 'ERROR' ? 'error' : 'info'}
              style={{ marginBottom: 20 }}
              showIcon={false}
            />

            {/* Thông tin cơ bản */}
            <Descriptions
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="Loại hành động">
                <Tag
                  icon={getActionIcon(log.action)}
                  color={getActionColor(log.action)}
                >
                  {getActionLabel(log.action)}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Phân hệ">
                <Tag color="blue">{log.module}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Đối tượng">
                {log.resourceType}
              </Descriptions.Item>

              {log.resourceName && log.resourceName !== 'N/A' && (
                <Descriptions.Item label="Tên">
                  <strong>{log.resourceName}</strong>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Nội dung chi tiết */}
            {(log.oldValues || log.newValues) && (
              <>
                <Divider orientation="left">Nội dung chi tiết</Divider>
                <div
                  style={{
                    background: '#fafafa',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ marginBottom: 8, color: '#666' }}>
                    {log.action === 'CREATE' && 'Dữ liệu được tạo:'}
                    {log.action === 'UPDATE' && 'Những thay đổi:'}
                    {log.action === 'DELETE' && 'Dữ liệu đã xóa:'}
                  </div>
                  {renderLogDescription()}
                </div>
              </>
            )}

            {/* Thông tin lỗi (nếu có) */}
            {(log.errorMessage || log.errorStack) && (
              <>
                <Divider orientation="left" style={{ color: '#ff4d4f' }}>
                  <ExclamationCircleOutlined /> Chi tiết lỗi
                </Divider>
                <Alert
                  message="Thông báo lỗi"
                  description={log.errorMessage}
                  type="error"
                  style={{ marginBottom: 15 }}
                  showIcon
                />

                {log.errorStack && (
                  <Collapse
                    ghost
                    items={[
                      {
                        key: 'stack',
                        label: 'Xem chi tiết kỹ thuật (Stack Trace)',
                        children: (
                          <>
                            <pre
                              style={{
                                background: '#fff1f0',
                                padding: '10px',
                                borderRadius: '4px',
                                maxHeight: '200px',
                                overflow: 'auto',
                                color: '#d9534f',
                                fontSize: '12px',
                              }}
                            >
                              {log.errorStack}
                            </pre>
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopy(log.errorStack)}
                            >
                              Sao chép
                            </Button>
                          </>
                        ),
                      },
                    ]}
                  />
                )}
              </>
            )}

            {/* Thông tin kỹ thuật - Thu gọn */}
            <Divider orientation="left">
              <SettingOutlined /> Thông tin chi tiết
            </Divider>
            <Collapse
              ghost
              items={[
                {
                  key: 'technical',
                  label: 'Thông tin kỹ thuật (dành cho IT)',
                  children: (
                    <>
                      <Descriptions
                        bordered
                        column={2}
                        size="small"
                        style={{ marginBottom: 15 }}
                      >
                        <Descriptions.Item label="ID Nhật ký" span={2}>
                          <Space>
                            <code style={{ fontSize: '11px' }}>{log._id}</code>
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopy(log._id)}
                            />
                          </Space>
                        </Descriptions.Item>

                        {log.userId && (
                          <Descriptions.Item label="ID Người dùng" span={2}>
                            <code style={{ fontSize: '11px' }}>
                              {log.userId}
                            </code>
                          </Descriptions.Item>
                        )}

                        {log.resourceId && (
                          <Descriptions.Item label="ID Tài nguyên" span={2}>
                            <code style={{ fontSize: '11px' }}>
                              {log.resourceId}
                            </code>
                          </Descriptions.Item>
                        )}

                        <Descriptions.Item label="HTTP Method">
                          <Tag color={getMethodColor(log.method)}>
                            {log.method}
                          </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Status Code">
                          <Tag
                            color={
                              log.statusCode < 400
                                ? 'green'
                                : log.statusCode < 500
                                  ? 'orange'
                                  : 'red'
                            }
                          >
                            {log.statusCode}
                          </Tag>
                        </Descriptions.Item>

                        {log.endpoint && (
                          <Descriptions.Item label="Endpoint" span={2}>
                            <code style={{ fontSize: '11px' }}>
                              {log.endpoint}
                            </code>
                          </Descriptions.Item>
                        )}

                        {log.ipAddress && (
                          <Descriptions.Item label="Địa chỉ IP">
                            <code>{log.ipAddress}</code>
                          </Descriptions.Item>
                        )}

                        {log.canteenId && (
                          <Descriptions.Item label="ID Căn tin">
                            <code style={{ fontSize: '11px' }}>
                              {log.canteenId}
                            </code>
                          </Descriptions.Item>
                        )}

                        {log.userAgent && (
                          <Descriptions.Item label="User Agent" span={2}>
                            <div
                              style={{
                                maxHeight: '60px',
                                overflow: 'auto',
                                fontSize: '11px',
                              }}
                            >
                              <code>{log.userAgent}</code>
                            </div>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default AuditLogDetail;
