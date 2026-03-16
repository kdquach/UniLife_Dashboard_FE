import { useEffect, useState } from "react";
import { Card, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useLocation, useParams } from "react-router-dom";
import { getNotificationById } from "@/services/notification.service";

export default function NotificationReadDetailPage() {
  const { Text, Paragraph } = Typography;
  const { id } = useParams();
  const location = useLocation();
  const preloaded = location.state?.notification || null;

  const [loading, setLoading] = useState(!preloaded);
  const [notification, setNotification] = useState(preloaded);

  useEffect(() => {
    let active = true;

    const loadDetail = async () => {
      if (!id) return;
      if (preloaded?.id && String(preloaded.id) === String(id)) return;

      try {
        setLoading(true);
        const full = await getNotificationById(id);
        if (!active) return;

        if (!full) {
          setNotification(null);
          return;
        }

        setNotification({
          id: full._id || full.id,
          title: full.title,
          content: full.content || "",
          type: full.type || "system",
          createdAt: full.createdAt,
          isRead: Boolean(full.isRead),
        });
      } catch {
        if (active) {
          setNotification(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      active = false;
    };
  }, [id, preloaded]);

  if (loading) {
    return (
      <Card bordered={false}>
        <Text type="secondary">Đang tải thông báo...</Text>
      </Card>
    );
  }

  if (!notification) {
    return (
      <Card bordered={false}>
        <Text type="secondary">Không tìm thấy thông báo.</Text>
      </Card>
    );
  }

  return (
    <Card bordered={false}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Space size={8} wrap>
          <Tag color="geekblue">Thông báo hệ thống</Tag>
          <Tag color={notification?.isRead ? "default" : "green"}>
            {notification?.isRead ? "Đã xem" : "Chưa xem"}
          </Tag>
        </Space>

        <Typography.Title level={4} style={{ margin: 0 }}>
          {notification?.title || "Thông báo"}
        </Typography.Title>

        <Text type="secondary">
          {notification?.createdAt
            ? dayjs(notification.createdAt).format("DD/MM/YYYY HH:mm")
            : "-"}
        </Text>

        <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
          {notification?.content || "(Không có nội dung)"}
        </Paragraph>
      </Space>
    </Card>
  );
}
