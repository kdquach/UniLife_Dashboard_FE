import { useState } from 'react';
import { Card, Tabs, Button, Space, message } from 'antd';
import { ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import AuditLogTable from '@/components/auditLog/AuditLogTable';
import AuditStatistics from '@/components/auditLog/AuditStatistics';
import AuditErrorLogs from '@/components/auditLog/AuditErrorLogs';
import AuditLogDetail from '@/components/auditLog/AuditLogDetail';
import { useAuditLogService } from '@/services/auditLog.service';
import { useAuthStore } from '@/store/useAuthStore';

// Main page quản lý Audit Log
const AuditLogPage = () => {
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');

  const { user } = useAuthStore();
  const { deleteOldAuditLogs } = useAuditLogService();

  // Xử lý xem chi tiết
  const handleViewDetail = (logId) => {
    setSelectedLogId(logId);
    setDetailVisible(true);
  };

  // Xử lý xóa nhật ký cũ (Admin only)
  const handleDeleteOldLogs = async () => {
    if (user?.role !== 'admin') {
      message.error('Chỉ admin có quyền xóa nhật ký cũ');
      return;
    }

    if (
      !window.confirm(
        'Bạn chắc chắn muốn xóa nhật ký hoạt động cũ hơn 90 ngày?'
      )
    ) {
      return;
    }

    try {
      const response = await deleteOldAuditLogs(90);
      message.success(response.data?.message || 'Xóa nhật ký thành công');
    } catch (error) {
      message.error('Lỗi khi xóa nhật ký cũ');
      console.error(error);
    }
  };

  // Cấu hình tabs
  const tabItems = [
    {
      key: 'logs',
      label: 'Nhật ký hoạt động',
      children: <AuditLogTable onViewDetail={handleViewDetail} />,
    },
    {
      key: 'statistics',
      label: 'Thống kê',
      children: <AuditStatistics />,
    },
    {
      key: 'errors',
      label: 'Danh sách lỗi',
      children: <AuditErrorLogs onViewDetail={handleViewDetail} />,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card
        title="Quản lý Nhật Ký Hoạt Động Hệ Thống"
        extra={
          <Space>
            {user?.role === 'admin' && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteOldLogs}
              >
                Xóa nhật ký cũ
              </Button>
            )}
          </Space>
        }
      >
        <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
      </Card>

      {/* Modal chi tiết nhật ký */}
      {detailVisible && (
        <AuditLogDetail
          logId={selectedLogId}
          visible={detailVisible}
          onClose={() => {
            setDetailVisible(false);
            setSelectedLogId(null);
          }}
        />
      )}
    </div>
  );
};

export default AuditLogPage;
