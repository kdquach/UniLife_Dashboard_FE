import { useEffect, useState, useCallback } from "react";
import { Card, Space, Button, Select, Input, Rate, DatePicker, Drawer, Typography, Form, message, Modal } from "antd";
import dayjs from "dayjs";
import { getFeedbackList, getFeedbackById, getFeedbackReplies, createFeedbackReply, updateFeedbackReply, deleteFeedbackReply } from "@/services/feedback.service";
import { useAuthStore } from "@/store/useAuthStore";
import ResponsiveDataTable from "@/components/ResponsiveDataTable";
const { Text, Title } = Typography;
const { TextArea } = Input;

export default function FeedbackManagementPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const [rating, setRating] = useState();
    const [fromDate, setFromDate] = useState(null);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyForm] = Form.useForm();
    const [replyLoading, setReplyLoading] = useState(false);

    const [editingReplyId, setEditingReplyId] = useState(null);
    const [editingReplyText, setEditingReplyText] = useState("");
    const [replyActionLoadingId, setReplyActionLoadingId] = useState(null);

    const fetchList = useCallback(
        async (page = pagination.current, pageSize = pagination.pageSize) => {
            try {
                setLoading(true);
                const params = {
                    page,
                    limit: pageSize,
                    rating,
                };
                if (fromDate) {
                    params.fromDate = fromDate.startOf("day").toISOString();
                }
                const { data, pagination: serverPagination } = await getFeedbackList(params);
                setItems(data || []);
                setPagination({
                    current: serverPagination?.page || page,
                    pageSize: serverPagination?.limit || pageSize,
                    total: serverPagination?.total || data.length || 0,
                });
            } catch (err) {
                console.error("Failed to load feedback list", err);
                message.error("Không thể tải danh sách phản hồi");
            } finally {
                setLoading(false);
            }
        },
        [rating, fromDate, pagination.current, pagination.pageSize, user]
    );

    useEffect(() => {
        fetchList(1, pagination.pageSize);
    }, [rating, fromDate, user]);

    const handleTableChange = (pager) => {
        fetchList(pager.current, pager.pageSize)
    };

    const openDetail = async (record) => {
        try {
            setLoading(true);
            const id = record._id || record.id;
            const full = id ? await getFeedbackById(id) : null;
            const feedback = full || record;
            setSelected(feedback);
            setEditingReplyId(null);
            setEditingReplyText("");
            if (feedback?._id || feedback?.id) {
                const { data: replyData } = await getFeedbackReplies(feedback._id || feedback.id, {
                    limit: 100,
                });
                setReplies(replyData || []);
            } else {
                setReplies([]);
            }
            setDrawerOpen(true);
            replyForm.resetFields();
        } catch (err) {
            console.error("Failed to load feedback detail", err);
            message.error("Không thể tải chi tiết phản hồi");
        } finally {
            setLoading(false);
        }
    };

    const handleReplySubmit = async (values) => {
        if (!selected?._id && !selected?.id) return;
        try {
            setReplyLoading(true);
            const feedbackId = selected._id || selected.id;
            const reply = await createFeedbackReply(feedbackId, values.message);
            if (reply) {
                message.success("Đã gửi phản hồi tới khách hàng");
                // Refresh replies list
                const { data: replyData } = await getFeedbackReplies(feedbackId, {
                    limit: 100,
                });
                setReplies(replyData || []);
                replyForm.resetFields();
            }
        } catch (err) {
            console.error("Failed to reply feedback", err);
            message.error("Không thể gửi phản hồi");
        } finally {
            setReplyLoading(false);
        }
    };

    const handleStartEditReply = (reply) => {
        setEditingReplyId(reply._id || reply.id);
        setEditingReplyText(reply.reply || "");
    };

    const handleCancelEditReply = () => {
        setEditingReplyId(null);
        setEditingReplyText("");
    };

    const handleUpdateReply = async (reply) => {
        if (!selected?._id && !selected?.id) return;
        const replyId = reply._id || reply.id;
        if (!replyId) return;

        try {
            setReplyActionLoadingId(replyId);
            await updateFeedbackReply(replyId, editingReplyText);
            message.success("Đã cập nhật phản hồi");
            const feedbackId = selected._id || selected.id;
            const { data: replyData } = await getFeedbackReplies(feedbackId, { limit: 100 });
            setReplies(replyData || []);
            setEditingReplyId(null);
            setEditingReplyText("");
        } catch (err) {
            console.error("Failed to update reply", err);
            message.error("Không thể cập nhật phản hồi");
        } finally {
            setReplyActionLoadingId(null);
        }
    };

    const handleDeleteReply = async (reply) => {
        if (!selected?._id && !selected?.id) return;
        const replyId = reply._id || reply.id;
        if (!replyId) return;

        Modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc muốn xóa phản hồi này?",
            okText: "Xóa",
            cancelText: "Hủy",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    setReplyActionLoadingId(replyId);
                    await deleteFeedbackReply(replyId);
                    message.success("Đã xóa phản hồi");
                    const feedbackId = selected._id || selected.id;
                    const { data: replyData } = await getFeedbackReplies(feedbackId, { limit: 100 });
                    setReplies(replyData || []);
                } catch (err) {
                    console.error("Failed to delete reply", err);
                    message.error("Không thể xóa phản hồi");
                } finally {
                    setReplyActionLoadingId(null);
                }
            },
        });
    };

    const columns = [
        {
            title: "Khách hàng",
            dataIndex: ["userId", "fullName"],
            key: "customerName",
            render: (_, record) => record.userId?.fullName || "Anonymous",
        },
        {
            title: "Sản phẩm",
            dataIndex: ["productId", "name"],
            key: "productName",
            render: (_, record) => record.productId?.name || "(Unknown product)",
        },
        {
            title: "Đánh giá",
            dataIndex: "rating",
            key: "rating",
            render: (value) => <Rate disabled defaultValue={Number(value) || 0} />,
        },
        {
            title: "Nội dung",
            dataIndex: "comment",
            key: "comment",
            ellipsis: true,
            render: (text) => text || "(No comment)",
        },
        {
            title: "Thời gian tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_, record) => (
                <Button type="link" onClick={() => openDetail(record)}>
                    Xem / Trả lời
                </Button>
            ),
        },
    ];

    return (
        <Card title="Customer Feedback" bordered={false}>
            <div className="dashboard-filter-bar" style={{ marginBottom: 16 }}>
                <div className="dashboard-filter-item">
                    <Select
                        allowClear
                        placeholder="Rating"
                        style={{ width: "100%" }}
                        value={rating}
                        onChange={setRating}
                        options={[
                            { label: "All", value: undefined },
                            { label: <Rate disabled defaultValue={1} />, value: 1 },
                            { label: <Rate disabled defaultValue={2} />, value: 2 },
                            { label: <Rate disabled defaultValue={3} />, value: 3 },
                            { label: <Rate disabled defaultValue={4} />, value: 4 },
                            { label: <Rate disabled defaultValue={5} />, value: 5 },
                        ]}
                    />
                </div>
                <div className="dashboard-filter-item">
                    <DatePicker value={fromDate} onChange={setFromDate} style={{ width: "100%" }} />
                </div>
                <div className="dashboard-filter-actions">
                    <Button onClick={() => fetchList(1, pagination.pageSize)}>Refresh</Button>
                </div>
            </div>

            <ResponsiveDataTable
                rowKey={(record) => record._id || record.id}
                loading={loading}
                columns={columns}
                dataSource={items}
                pagination={pagination}
                onChange={handleTableChange}
                mobileFields={[
                    "customerName",
                    "rating",
                    "comment",
                    "action",
                ]}
            />

            <Drawer
                width={480}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Feedback Detail"
            >
                {selected && (
                    <Space direction="vertical" style={{ width: "100%" }} size="large">
                        <div>
                            <Title level={5}>Feedback</Title>
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Text strong>Customer:</Text>
                                <Text>{selected.userId?.fullName || "Anonymous"}</Text>
                                <Text strong>Product:</Text>
                                <Text>{selected.productId?.name || "(Unknown product)"}</Text>
                                <Text strong>Rating:</Text>
                                <Rate disabled defaultValue={Number(selected.rating) || 0} />
                                <Text strong>Comment:</Text>
                                <Text>{selected.comment || "(No comment)"}</Text>
                            </Space>
                        </div>

                        <div>
                            <Title level={5}>Manager Replies</Title>
                            {Array.isArray(replies) && replies.length > 0 ? (
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    {replies
                                        .slice()
                                        .sort(
                                            (a, b) =>
                                                new Date(a.createdAt || 0).getTime() -
                                                new Date(b.createdAt || 0).getTime(),
                                        )
                                        .map((reply) => (
                                            <Card key={reply._id || reply.id} size="small">
                                                <Space direction="vertical" style={{ width: "100%" }}>
                                                    <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
                                                        <Text strong>{reply.userId?.fullName || "Manager"}</Text>
                                                        <Text type="secondary">
                                                            {reply.createdAt
                                                                ? dayjs(reply.createdAt).format("DD/MM/YYYY HH:mm")
                                                                : ""}
                                                        </Text>
                                                    </Space>

                                                    {editingReplyId === (reply._id || reply.id) ? (
                                                        <>
                                                            <Input.TextArea
                                                                rows={3}
                                                                value={editingReplyText}
                                                                onChange={(e) => setEditingReplyText(e.target.value)}
                                                            />
                                                            <Space style={{ justifyContent: "flex-end", width: "100%" }}>
                                                                <Button onClick={handleCancelEditReply}>Hủy</Button>
                                                                <Button
                                                                    type="primary"
                                                                    loading={replyActionLoadingId === (reply._id || reply.id)}
                                                                    onClick={() => handleUpdateReply(reply)}
                                                                >
                                                                    Lưu
                                                                </Button>
                                                            </Space>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Text>{reply.reply}</Text>
                                                            {(user && (user._id === reply.userId?._id || user.role === "admin")) && (
                                                                <Space style={{ justifyContent: "flex-end", width: "100%" }}>
                                                                    <Button size="small" onClick={() => handleStartEditReply(reply)}>
                                                                        Sửa
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        danger
                                                                        loading={replyActionLoadingId === (reply._id || reply.id)}
                                                                        onClick={() => handleDeleteReply(reply)}
                                                                    >
                                                                        Xóa
                                                                    </Button>
                                                                </Space>
                                                            )}
                                                        </>
                                                    )}
                                                </Space>
                                            </Card>
                                        ))}
                                </Space>
                            ) : (
                                <Text type="secondary">No replies yet.</Text>
                            )}
                        </div>

                        <div>
                            <Title level={5}>Reply to Customer</Title>
                            <Form
                                layout="vertical"
                                form={replyForm}
                                onFinish={handleReplySubmit}
                            >
                                <Form.Item
                                    name="message"
                                    label="Message"
                                    rules={[{ required: true, message: "Please enter your reply" }]}
                                >
                                    <TextArea rows={4} placeholder="Write your reply to the customer..." />
                                </Form.Item>
                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={replyLoading}
                                    >
                                        Send Reply
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </Space>
                )}
            </Drawer>
        </Card>
    );
}
