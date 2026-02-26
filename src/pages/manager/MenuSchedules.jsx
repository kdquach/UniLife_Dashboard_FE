import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
    Button,
    Dropdown,
    Modal,
    Select,
    Space,
    Spin,
    Tag,
    DatePicker,
} from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/useAuthStore';
import ScheduleHeader from '@/components/schedule/ScheduleHeader';
import { useMenuScheduling } from '@/hooks/useMenuScheduling';
import '@/styles/schedule-shared.css';

export default function MenuSchedulesPage() {
    const { user } = useAuthStore();
    const canteenId = user?.canteenId?._id || user?.canteenId || null;

    const {
        contextHolder,
        loading,
        weekDates,
        weekLabel,
        slots,
        cells,
        menus,
        goPrevWeek,
        goNextWeek,
        goToday,
        fetchSchedules,
        handleToggleSchedule,
        handleCreateScheduleForCell,
        handleUpdateSchedule,
        handleDuplicateSchedule,
        handleDeleteSchedule,
        handleViewMenuDetail,
    } = useMenuScheduling();

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createDate, setCreateDate] = useState(null);
    const [createSlotKey, setCreateSlotKey] = useState(null);
    const [createMenuId, setCreateMenuId] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailMenu, setDetailMenu] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSchedule, setEditSchedule] = useState(null);
    const [editDate, setEditDate] = useState(null);
    const [editSlotKey, setEditSlotKey] = useState(null);

    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [duplicateSchedule, setDuplicateScheduleState] = useState(null);
    const [duplicateDate, setDuplicateDate] = useState(null);
    const [duplicateSlotKey, setDuplicateSlotKey] = useState(null);

    useEffect(() => {
        if (canteenId) {
            fetchSchedules(canteenId);
        }
    }, [canteenId, fetchSchedules]);

    const activeMenus = useMemo(
        () => menus.filter((menu) => String(menu.status).toLowerCase() === 'active'),
        [menus],
    );

    const handleOpenCreate = (date, slotKey) => {
        setCreateDate(date);
        setCreateSlotKey(slotKey);
        setCreateMenuId(null);
        setCreateModalOpen(true);
    };

    const disabledScheduleDate = (current) => {
        if (!current) return false;

        const today = dayjs().startOf('day');
        const maxDate = today.add(7, 'day');

        return (
            current.isBefore(today, 'day')
            || current.isAfter(maxDate, 'day')
        );
    };

    const handleOpenEdit = (schedule, slotKey, date) => {
        if (!schedule) return;

        const now = dayjs();
        const start = dayjs(schedule.startAt);
        const end = dayjs(schedule.endAt);

        if (
            String(schedule.status).toLowerCase() === 'enabled'
            && now.isAfter(start)
            && now.isBefore(end)
        ) {
            // Comment: Không cho chỉnh sửa lịch đang trong thời gian hoạt động
            return Modal.warning({
                title: 'Không thể chỉnh sửa',
                content: 'Không thể chỉnh sửa lịch đang trong thời gian hoạt động.',
            });
        }

        setEditSchedule(schedule);
        setEditSlotKey(slotKey || resolveSlotKey(schedule.startAt));
        setEditDate(date || dayjs(schedule.startAt));
        setEditModalOpen(true);
    };

    const handleOpenDuplicate = (schedule, slotKey, date) => {
        if (!schedule) return;

        setDuplicateScheduleState(schedule);
        setDuplicateSlotKey(slotKey || resolveSlotKey(schedule.startAt));
        setDuplicateDate(date || dayjs(schedule.startAt));
        setDuplicateModalOpen(true);
    };

    const handleOpenDetailMenu = async (menuRef) => {
        const menuId =
            typeof menuRef === 'string' ? menuRef : menuRef?._id;
        if (!menuId) return;

        setDetailLoading(true);
        const menu = await handleViewMenuDetail(menuId);
        setDetailLoading(false);

        if (menu) {
            setDetailMenu(menu);
            setDetailOpen(true);
        }
    };

    return (
        <div className="schedule-page">
            {contextHolder}
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <ScheduleHeader
                    title="Lịch áp dụng thực đơn"
                    weekLabel={weekLabel}
                    onPrevWeek={goPrevWeek}
                    onToday={goToday}
                    onNextWeek={goNextWeek}
                />

                <div
                    className="schedule-layout"
                    style={{ gridTemplateColumns: '1fr' }}
                >
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                            <Spin />
                        </div>
                    ) : (
                        <div className="schedule-container">
                            {/* Header ngày trong tuần */}
                            <div className="week-header">
                                <div />
                                {weekDates.map((date) => {
                                    const isToday = date.isSame(new Date(), 'day');
                                    return (
                                        <div
                                            key={date.format('YYYY-MM-DD')}
                                            className={`day-box ${isToday ? 'today' : ''}`}
                                        >
                                            <div>{date.format('ddd')}</div>
                                            <div>{date.format('D/M')}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Ba hàng: ca sáng, ca trưa, ca chiều */}
                            {slots.map((slot) => (
                                <div key={slot.key} className="shift-row">
                                    <div className="shift-label">
                                        <div>{slot.label}</div>
                                        <div className="shift-time">{slot.timeRange}</div>
                                    </div>

                                    {weekDates.map((date) => {
                                        const dateKey = date.format('YYYY-MM-DD');
                                        const isToday = date.isSame(new Date(), 'day');
                                        const schedule = cells?.[slot.key]?.[dateKey];

                                        const menu = schedule?.menuId || {};
                                        const status = String(schedule?.status || '').toLowerCase();
                                        const isEnabled = status === 'enabled';

                                        let canDelete = false;
                                        if (schedule) {
                                            const now = dayjs();
                                            const start = dayjs(schedule.startAt);
                                            const end = dayjs(schedule.endAt);
                                            if (end.isValid() && (end.isBefore(now) || start.isAfter(now)) && !isEnabled) {
                                                // Comment: Chỉ cho phép xóa lịch đã tắt và đã qua thời gian áp dụng
                                                canDelete = true;
                                            }
                                        }

                                        const menuItems = [
                                            {
                                                key: 'view',
                                                label: 'Xem chi tiết menu',
                                                onClick: () => handleOpenDetailMenu(schedule?.menuId),
                                            },
                                            {
                                                key: 'edit',
                                                label: 'Chỉnh sửa lịch',
                                                onClick: () => handleOpenEdit(schedule, slot.key, date),
                                            },
                                            {
                                                key: 'duplicate',
                                                label: 'Nhân bản lịch',
                                                onClick: () => handleOpenDuplicate(schedule, slot.key, date),
                                            },
                                            canDelete && {
                                                key: 'delete',
                                                label: 'Xóa lịch',
                                                onClick: () => {
                                                    Modal.confirm({
                                                        title: 'Xóa lịch thực đơn',
                                                        content:
                                                            'Bạn có chắc chắn muốn xóa lịch áp dụng thực đơn này không?',
                                                        okText: 'Xóa',
                                                        okType: 'danger',
                                                        cancelText: 'Hủy',
                                                        onOk: () => handleDeleteSchedule(schedule._id),
                                                    });
                                                },
                                            },
                                            schedule && {
                                                key: 'toggle',
                                                label: isEnabled ? 'Tắt lịch này' : 'Bật lịch này',
                                                onClick: () => handleToggleSchedule(schedule._id),
                                            },
                                        ].filter(Boolean);

                                        return (
                                            <div
                                                key={`${slot.key}-${dateKey}`}
                                                className={`shift-cell ${isToday ? 'today-cell' : ''}`}
                                                onClick={() => {
                                                    if (!schedule) {
                                                        handleOpenCreate(date, slot.key);
                                                    }
                                                }}
                                                style={{ cursor: schedule ? 'default' : 'pointer' }}
                                            >
                                                {schedule ? (
                                                    <div
                                                        style={{
                                                            borderRadius: 8,
                                                            padding: '8px 10px',
                                                            backgroundColor: isEnabled
                                                                ? '#ecfdf3'
                                                                : '#f3f4f6',
                                                            border: `1px solid ${isEnabled ? '#16a34a' : '#9ca3af'}`,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 4,
                                                        }}
                                                    >
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
                                                                    fontWeight: 600,
                                                                    color: isEnabled ? '#166534' : '#4b5563',
                                                                }}
                                                            >
                                                                {menu.name || 'Thực đơn'}
                                                            </span>

                                                            <Dropdown
                                                                menu={{ items: menuItems }}
                                                                trigger={['click']}
                                                            >
                                                                <Button
                                                                    type="text"
                                                                    size="small"
                                                                    icon={<MoreOutlined />}
                                                                />
                                                            </Dropdown>
                                                        </div>

                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'flex-end',
                                                            }}
                                                        >
                                                            <Tag
                                                                color={isEnabled ? 'green' : 'default'}
                                                                style={{ marginLeft: 0 }}
                                                            >
                                                                {isEnabled ? 'Đang bật' : 'Đã tắt'}
                                                            </Tag>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Nhấn để tạo lịch</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {(!loading
                    && (!cells.morning || Object.keys(cells.morning).length === 0)
                    && (!cells.noon || Object.keys(cells.noon).length === 0)
                    && (!cells.afternoon || Object.keys(cells.afternoon).length === 0)) && (
                        <div style={{ color: 'var(--text-muted)' }}>
                            Không có lịch thực đơn nào trong tuần này.
                        </div>
                    )}

                <Modal
                    title={createDate && createSlotKey
                        ? `Tạo lịch thực đơn cho ${createDate.format('DD/MM/YYYY')} - ${slots.find((s) => s.key === createSlotKey)?.label}`
                        : 'Tạo lịch thực đơn'}
                    open={createModalOpen}
                    onOk={async () => {
                        if (!createMenuId) {
                            return;
                        }

                        const success = await handleCreateScheduleForCell({
                            menuId: createMenuId,
                            date: createDate,
                            slotKey: createSlotKey,
                        });

                        if (success) {
                            setCreateModalOpen(false);
                            setCreateDate(null);
                            setCreateSlotKey(null);
                            setCreateMenuId(null);
                        }
                    }}
                    onCancel={() => {
                        setCreateModalOpen(false);
                        setCreateDate(null);
                        setCreateSlotKey(null);
                        setCreateMenuId(null);
                    }}
                    okText="Lưu"
                    cancelText="Hủy"
                    destroyOnClose
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            Ngày áp dụng:{' '}
                            <strong>{createDate ? createDate.format('DD/MM/YYYY') : '--/--/----'}</strong>
                        </div>
                        <div>
                            Ca:{' '}
                            <strong>{slots.find((s) => s.key === createSlotKey)?.label || '---'}</strong>
                        </div>

                        <Select
                            placeholder="Chọn thực đơn"
                            value={createMenuId}
                            onChange={setCreateMenuId}
                            style={{ width: '100%' }}
                            options={activeMenus.map((menu) => ({
                                label: menu.name,
                                value: menu._id,
                            }))}
                        />
                    </Space>
                </Modal>

                <Modal
                    title="Chỉnh sửa lịch thực đơn"
                    open={editModalOpen}
                    okText="Lưu"
                    cancelText="Hủy"
                    onOk={async () => {
                        if (!editSchedule || !editDate || !editSlotKey) {
                            return;
                        }

                        const success = await handleUpdateSchedule({
                            scheduleId: editSchedule._id,
                            date: editDate,
                            slotKey: editSlotKey,
                        });

                        if (success) {
                            setEditModalOpen(false);
                            setEditSchedule(null);
                            setEditDate(null);
                            setEditSlotKey(null);
                        }
                    }}
                    onCancel={() => {
                        setEditModalOpen(false);
                        setEditSchedule(null);
                        setEditDate(null);
                        setEditSlotKey(null);
                    }}
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            Thực đơn:{' '}
                            <strong>{editSchedule?.menuId?.name || 'Thực đơn'}</strong>
                        </div>
                        <DatePicker
                            value={editDate}
                            onChange={setEditDate}
                            format="DD/MM/YYYY"
                            disabledDate={disabledScheduleDate}
                            style={{ width: '100%' }}
                        />
                        <Select
                            value={editSlotKey}
                            onChange={setEditSlotKey}
                            options={slots.map((s) => ({
                                value: s.key,
                                label: `${s.label} (${s.timeRange})`,
                            }))}
                            style={{ width: '100%' }}
                        />
                    </Space>
                </Modal>

                <Modal
                    title="Nhân bản lịch thực đơn"
                    open={duplicateModalOpen}
                    okText="Nhân bản"
                    cancelText="Hủy"
                    onOk={async () => {
                        if (!duplicateSchedule || !duplicateDate || !duplicateSlotKey) {
                            return;
                        }

                        const success = await handleDuplicateSchedule({
                            scheduleId: duplicateSchedule._id,
                            date: duplicateDate,
                            slotKey: duplicateSlotKey,
                        });

                        if (success) {
                            setDuplicateModalOpen(false);
                            setDuplicateScheduleState(null);
                            setDuplicateDate(null);
                            setDuplicateSlotKey(null);
                        }
                    }}
                    onCancel={() => {
                        setDuplicateModalOpen(false);
                        setDuplicateScheduleState(null);
                        setDuplicateDate(null);
                        setDuplicateSlotKey(null);
                    }}
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            Thực đơn gốc:{' '}
                            <strong>{duplicateSchedule?.menuId?.name || 'Thực đơn'}</strong>
                        </div>
                        <div>
                            Lịch gốc:{' '}
                            {duplicateSchedule ? (
                                <strong>
                                    {dayjs(duplicateSchedule.startAt).format('DD/MM/YYYY')} -{' '}
                                    {dayjs(duplicateSchedule.endAt).format('DD/MM/YYYY')}
                                </strong>
                            ) : (
                                '--/--/----'
                            )}
                        </div>
                        <DatePicker
                            value={duplicateDate}
                            onChange={setDuplicateDate}
                            format="DD/MM/YYYY"
                            disabledDate={disabledScheduleDate}
                            style={{ width: '100%' }}
                        />
                        <Select
                            value={duplicateSlotKey}
                            onChange={setDuplicateSlotKey}
                            options={slots.map((s) => ({
                                value: s.key,
                                label: `${s.label} (${s.timeRange})`,
                            }))}
                            style={{ width: '100%' }}
                        />
                    </Space>
                </Modal>

                <Modal
                    open={detailOpen}
                    title={detailMenu?.name || 'Chi tiết thực đơn'}
                    footer={null}
                    width={600}
                    onCancel={() => {
                        setDetailOpen(false);
                        setDetailMenu(null);
                    }}
                >
                    {detailLoading ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                            }}
                        >
                            <Spin />
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: 12, fontWeight: 500 }}>
                                Danh sách món trong thực đơn
                            </div>
                            {Array.isArray(detailMenu?.items) && detailMenu.items.length > 0 ? (
                                <ul style={{ paddingLeft: 18 }}>
                                    {detailMenu.items.map((item) => {
                                        const key = item._id || item.productId?._id || item.productId;
                                        const name = item.productId?.name || 'Món ăn';
                                        return <li key={key}>{name}</li>;
                                    })}
                                </ul>
                            ) : (
                                <div>Thực đơn chưa có món ăn nào</div>
                            )}
                        </>
                    )}
                </Modal>
            </Space>
        </div>
    );
}
