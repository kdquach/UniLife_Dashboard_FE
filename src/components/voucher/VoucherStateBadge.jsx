import React from "react";
import { Tag } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InboxOutlined,
  EditOutlined,
} from "@ant-design/icons";

const stateConfig = {
  Draft: {
    color: "#f5f5f5",
    textColor: "#8c8c8c",
    borderColor: "#d9d9d9",
    label: "Bản nháp",
    icon: <EditOutlined />,
  },
  Upcoming: {
    color: "#e6f7ff",
    textColor: "#1890ff",
    borderColor: "#91d5ff",
    label: "Sắp diễn ra",
    icon: <ClockCircleOutlined />,
  },
  Active: {
    color: "#f6ffed",
    textColor: "#52c41a",
    borderColor: "#b7eb8f",
    label: "Hoạt động",
    icon: <CheckCircleOutlined />,
  },
  Inactive: {
    color: "#fff7e6",
    textColor: "#fa8c16",
    borderColor: "#ffc069",
    label: "Tạm ngưng",
    icon: <StopOutlined />,
  },
  Expired: {
    color: "#fff2f0",
    textColor: "#ff4d4f",
    borderColor: "#ffccc7",
    label: "Hết hạn",
    icon: <CloseCircleOutlined />,
  },
  OutOfQuota: {
    color: "#fff0f6",
    textColor: "#eb2f96",
    borderColor: "#ffadd2",
    label: "Hết lượt",
    icon: <WarningOutlined />,
  },
  Archived: {
    color: "#f0f0f0",
    textColor: "#595959",
    borderColor: "#bfbfbf",
    label: "Đã lưu trữ",
    icon: <InboxOutlined />,
  },
};

export default function VoucherStateBadge({ state }) {
  const config = stateConfig[state] || {
    color: "#f5f5f5",
    textColor: "#8c8c8c",
    borderColor: "#d9d9d9",
    label: state,
    icon: null,
  };

  return (
    <Tag
      icon={config.icon}
      style={{
        backgroundColor: config.color,
        color: config.textColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: 20,
        padding: "3px 12px",
        fontSize: 12,
        fontWeight: 600,
        lineHeight: "20px",
      }}
    >
      {config.label}
    </Tag>
  );
}
