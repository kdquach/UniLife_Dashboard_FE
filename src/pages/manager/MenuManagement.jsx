import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Card,
    Row,
    Col,
    Input,
    Button,
    Table,
    Tag,
    Space,
    Modal,
    Select,
    DatePicker,
} from 'antd';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/useAuthStore';
import { useMenuManagement } from '@/hooks/useMenuManagement';
import GIcon from '@/components/GIcon';
import { DATE_FORMAT } from '@/config/constants';
import { useGlobalSearchStore } from '@/store/useGlobalSearchStore';
import '@/styles/menu-management.css';

// Trang quản lý danh sách thực đơn
const MenuManagementPage = () => {
    const { user } = useAuthStore();
    const {
        contextHolder,
        loading,
        menus,
        schedules,
        fetchData,
        pagination,
        handleTableChange,
        handleCreateEmptyMenu,
        handleRenameMenu,
        handleDeleteMenu,
        handleViewMenuDetail,
    } = useMenuManagement();

    const [newMenuName, setNewMenuName] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [appliedDateFilter, setAppliedDateFilter] = useState(null);
    const [editMenuId, setEditMenuId] = useState(null);
    const [editMenuName, setEditMenuName] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editMenuDetail, setEditMenuDetail] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailMenu, setDetailMenu] = useState(null);
    const { keyword } = useGlobalSearchStore();

    useEffect(() => {
        const canteenId = user?.canteenId?._id || user?.canteenId;
        if (canteenId) {
            fetchData(canteenId);
        }
    }, [user, fetchData]);

    // Map schedule theo menu để lấy ngày đang áp dụng
    const schedulesByMenu = useMemo(() => {
        const map = {};

        schedules
            .filter((schedule) => schedule?.status === 'enabled')
            .forEach((schedule) => {
                const menuRef = schedule.menuId;
                const menuId =
                    typeof menuRef === 'string' ? menuRef : menuRef?._id;

                if (!menuId) return;

                const existing = map[menuId];
                const currentStart = dayjs(schedule.startAt);
                if (!currentStart.isValid()) return;

                if (!existing) {
                    map[menuId] = schedule;
                    return;
                }

                const existingStart = dayjs(existing.startAt);
                if (!existingStart.isValid() || currentStart.isBefore(existingStart)) {
                    map[menuId] = schedule;
                }
            });

        return map;
    }, [schedules]);

    const filteredMenus = useMemo(() => {
        const search = keyword.trim().toLowerCase();
        const hasDateFilter = !!appliedDateFilter;
        const filterDate = hasDateFilter ? appliedDateFilter.startOf('day') : null;

        return menus.filter((menu) => {
            if (statusFilter !== 'all' && menu.status !== statusFilter) {
                return false;
            }

            if (search && !menu.name?.toLowerCase().includes(search)) {
                return false;
            }

            if (hasDateFilter) {
                const relatedSchedules = schedules.filter((schedule) => {
                    const menuRef = schedule.menuId;
                    const menuId =
                        typeof menuRef === 'string' ? menuRef : menuRef?._id;

                    if (menuId !== menu._id || schedule.status !== 'enabled') {
                        return false;
                    }

                    const start = dayjs(schedule.startAt);
                    const end = dayjs(schedule.endAt);

                    if (!start.isValid() || !end.isValid()) return false;

                    return (
                        !filterDate.isBefore(start.startOf('day')) &&
                        !filterDate.isAfter(end.endOf('day'))
                    );
                });

                if (relatedSchedules.length === 0) {
                    return false;
                }
            }

            return true;
        });
    }, [menus, schedules, statusFilter, appliedDateFilter, keyword]);

    const dataSource = useMemo(
        () =>
            filteredMenus.map((menu, index) => {
                const hasDateFilter = !!appliedDateFilter;
                const filterDate = hasDateFilter
                    ? appliedDateFilter.startOf('day')
                    : null;

                let scheduleToShow = schedulesByMenu[menu._id];

                if (hasDateFilter && filterDate) {
                    const relatedSchedules = schedules.filter((schedule) => {
                        const menuRef = schedule.menuId;
                        const menuId =
                            typeof menuRef === 'string' ? menuRef : menuRef?._id;

                        if (menuId !== menu._id || schedule.status !== 'enabled') {
                            return false;
                        }

                        const start = dayjs(schedule.startAt);
                        const end = dayjs(schedule.endAt);

                        if (!start.isValid() || !end.isValid()) return false;

                        return (
                            !filterDate.isBefore(start.startOf('day')) &&
                            !filterDate.isAfter(end.endOf('day'))
                        );
                    });

                    if (relatedSchedules.length > 0) {
                        scheduleToShow = relatedSchedules.reduce((earliest, current) => {
                            const currentStart = dayjs(current.startAt);
                            if (!earliest) return current;
                            const earliestStart = dayjs(earliest.startAt);
                            if (!earliestStart.isValid() || currentStart.isBefore(earliestStart)) {
                                return current;
                            }
                            return earliest;
                        }, null);
                    }
                }

                let appliedDateText = 'Chưa áp dụng';
                if (scheduleToShow) {
                    const start = dayjs(scheduleToShow.startAt);
                    const end = dayjs(scheduleToShow.endAt);

                    if (start.isValid() && end.isValid()) {
                        if (start.isSame(end, 'day')) {
                            appliedDateText = start.format('DD/MM/YYYY');
                        } else {
                            appliedDateText = `${start.format('DD/MM/YYYY')} - ${end.format(
                                'DD/MM/YYYY',
                            )}`;
                        }
                    }
                }

                return {
                    key: menu._id,
                    index: index + 1,
                    name: menu.name,
                    status: menu.status,
                    appliedDateText,
                };
            }),
        [filteredMenus, schedulesByMenu, appliedDateFilter, schedules],
    );

    const renderStatusCell = (status) => {
        if (status === 'active') {
            return <Tag color="green">Đang hoạt động</Tag>;
        }
        if (status === 'inactive') {
            return <Tag>Ngưng sử dụng</Tag>;
        }

        return <Tag color="blue">Nháp</Tag>;
    };

    const handleOpenEditMenu = useCallback(
        async (record) => {
            setEditMenuId(record.key);
            setEditMenuName(record.name);

            const menu = await handleViewMenuDetail(record.key);
            if (menu) {
                setEditMenuDetail(menu);
            } else {
                setEditMenuDetail(null);
            }

            setIsEditModalOpen(true);
        },
        [handleViewMenuDetail],
    );

    const columns = [
        {
            title: 'STT',
            dataIndex: 'index',
            width: 70,
        },
        {
            title: 'Tên thực đơn',
            dataIndex: 'name',
            ellipsis: true,
            render: (value, record) => (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditMenu(record);
                        }}
                    >
                        {value}
                    </span>
                    {record.status === 'active' ? null : (
                        <div className="menu-row-actions">
                            <Button
                                type="text"
                                danger
                                size="small"
                                icon={<GIcon name="delete_outline" />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMenu(record.key, record.name);
                                }}
                            />
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Ngày đang áp dụng',
            dataIndex: 'appliedDateText',
            width: 220,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 140,
            render: (value) => renderStatusCell(value),
        },
    ];

    const handleCreateMenuClick = useCallback(async () => {
        const success = await handleCreateEmptyMenu(newMenuName);
        if (success) {
            setNewMenuName('');
        }
    }, [handleCreateEmptyMenu, newMenuName]);

    return (
        <>
            {contextHolder}

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Card title="Tạo thực đơn rỗng">
                            <Space.Compact style={{ width: '100%' }}>
                                <Input
                                    placeholder="Nhập tên thực đơn"
                                    value={newMenuName}
                                    onChange={(e) => setNewMenuName(e.target.value)}
                                    onPressEnter={handleCreateMenuClick}
                                />
                                <Button
                                    type="primary"
                                    onClick={handleCreateMenuClick}
                                    loading={loading}
                                >
                                    Tạo mới
                                </Button>
                            </Space.Compact>
                        </Card>
                    </Col>
                </Row>

                <Card title="Danh sách thực đơn" bodyStyle={{ paddingTop: 8 }}>
                    <Space
                        style={{
                            marginBottom: 16,
                            width: '100%',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                        }}
                    >
                        <Space wrap>
                            <Select
                                style={{ minWidth: 180 }}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value)}
                                options={[
                                    { value: 'all', label: 'Tất cả trạng thái' },
                                    { value: 'draft', label: 'Nháp' },
                                    { value: 'active', label: 'Đang hoạt động' },
                                    { value: 'inactive', label: 'Ngưng sử dụng' },
                                ]}
                            />
                            <DatePicker
                                allowClear
                                value={appliedDateFilter}
                                onChange={(value) => setAppliedDateFilter(value)}
                                placeholder="Lọc theo ngày áp dụng"
                                format={DATE_FORMAT}
                                style={{ minWidth: 180 }}
                            />
                        </Space>
                    </Space>
                    <Table
                        loading={loading}
                        columns={columns}
                        dataSource={dataSource}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng ${total} thực đơn`,
                            onChange: (page, pageSize) => {
                                handleTableChange({ current: page, pageSize });
                            },
                        }}
                        rowKey="key"
                    />
                </Card>

                <Modal
                    title="Đổi tên thực đơn"
                    open={isEditModalOpen}
                    onOk={async () => {
                        const success = await handleRenameMenu(editMenuId, editMenuName);
                        if (success) {
                            setIsEditModalOpen(false);
                            setEditMenuId(null);
                            setEditMenuName('');
                            setEditMenuDetail(null);
                        }
                    }}
                    onCancel={() => {
                        setIsEditModalOpen(false);
                        setEditMenuId(null);
                        setEditMenuName('');
                        setEditMenuDetail(null);
                    }}
                    okText="Lưu"
                    cancelText="Hủy"
                    destroyOnClose
                >
                    <Input
                        placeholder="Nhập tên thực đơn"
                        value={editMenuName}
                        onChange={(e) => setEditMenuName(e.target.value)}
                    />
                    {editMenuDetail && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                Danh sách món trong thực đơn
                            </div>
                            {Array.isArray(editMenuDetail.items) && editMenuDetail.items.length > 0 ? (
                                <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                                    {editMenuDetail.items.map((item) => {
                                        const key = item._id || item.productId?._id || item.productId;
                                        const name = item.productId?.name || 'Món ăn';
                                        return <li key={key}>{name}</li>;
                                    })}
                                </ul>
                            ) : (
                                <div>Thực đơn chưa có món ăn nào</div>
                            )}
                        </div>
                    )}
                </Modal>
            </Space>
        </>
    );
};

export default MenuManagementPage;
