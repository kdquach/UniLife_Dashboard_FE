import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { message } from 'antd';
import {
    getAllMenuSchedules,
    getAllMenus,
    createMenuSchedule,
    toggleMenuScheduleStatus,
    getMenuById,
    updateMenuSchedule,
    duplicateMenuSchedule,
    deleteMenuSchedule,
} from '@/services/menu.service';

// Slot thời gian cố định cho lịch menu
const MENU_SLOTS = [
    {
        key: 'morning',
        label: 'Ca sáng',
        timeRange: '07:00 - 9:00',
    },
    {
        key: 'noon',
        label: 'Ca trưa',
        timeRange: '9:00 - 13:00',
    },
    {
        key: 'afternoon',
        label: 'Ca chiều',
        timeRange: '13:00 - 18:00',
    },
];

// Xác định ca sáng/trưa/chiều dựa vào thời gian bắt đầu
const resolveSlotKey = (startAt) => {
    const hour = dayjs(startAt).hour();
    if (Number.isNaN(hour)) return 'morning';
    if (hour < 9) return 'morning';
    if (hour < 13) return 'noon';
    return 'afternoon';
};

// Hook quản lý logic hiển thị lịch áp dụng thực đơn theo tuần (2 ca)
export const useMenuScheduling = () => {
    const [messageApi, contextHolder] = message.useMessage();

    const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'));
    const [loading, setLoading] = useState(false);
    const [schedulesRaw, setSchedulesRaw] = useState([]);
    const [currentCanteenId, setCurrentCanteenId] = useState(null);
    const [menus, setMenus] = useState([]);

    // cells[slotKey][dateKey] = schedule | null
    const [cells, setCells] = useState({
        morning: {},
        noon: {},
        afternoon: {},
    });

    const weekStart = useMemo(() => currentWeek.startOf('day'), [currentWeek]);
    const weekEnd = useMemo(() => weekStart.add(6, 'day'), [weekStart]);
    const weekDates = useMemo(
        () => Array.from({ length: 7 }, (_, index) => weekStart.add(index, 'day')),
        [weekStart],
    );

    const weekLabel = useMemo(
        () => `${weekStart.format('D MMM')} - ${weekEnd.format('D MMM, YYYY')}`,
        [weekStart, weekEnd],
    );

    // Build map cells từ danh sách schedule theo tuần hiện tại
    const buildCells = useCallback(() => {
        if (!schedulesRaw.length) {
            setCells({ morning: {}, noon: {}, afternoon: {} });
            return;
        }

        const nextCells = {
            morning: {},
            noon: {},
            afternoon: {},
        };

        const weekStartDay = weekStart.startOf('day');
        const weekEndDay = weekEnd.endOf('day');

        const schedulesForWeek = schedulesRaw.filter((schedule) => {
            const start = dayjs(schedule.startAt);
            const end = dayjs(schedule.endAt);

            if (!start.isValid() || !end.isValid()) return false;

            return start.isBefore(weekEndDay) && end.isAfter(weekStartDay);
        });

        if (!schedulesForWeek.length) {
            setCells({ morning: {}, noon: {}, afternoon: {} });
            return;
        }

        schedulesForWeek.forEach((schedule) => {
            const slotKey = resolveSlotKey(schedule.startAt);
            if (!nextCells[slotKey]) return;

            const start = dayjs(schedule.startAt).startOf('day');
            const end = dayjs(schedule.endAt).endOf('day');

            weekDates.forEach((date) => {
                const current = date.startOf('day');
                // Chỉ những ngày nằm trong khoảng áp dụng của schedule mới được hiển thị.
                if (current.isBefore(start) || current.isAfter(end)) return;

                const dateKey = current.format('YYYY-MM-DD');

                // Mỗi ô chỉ hiển thị 1 lịch, ưu tiên lịch đầu tiên tìm được
                if (!nextCells[slotKey][dateKey]) {
                    nextCells[slotKey][dateKey] = schedule;
                }
            });
        });

        setCells(nextCells);
    }, [schedulesRaw, weekDates, weekStart, weekEnd]);

    useEffect(() => {
        buildCells();
    }, [buildCells]);

    // Lấy danh sách lịch thực đơn theo căng tin
    const fetchSchedules = useCallback(
        async (canteenId) => {
            if (!canteenId) return;

            setCurrentCanteenId(canteenId);
            setLoading(true);
            try {
                const [schedulesRes, menusRes] = await Promise.all([
                    getAllMenuSchedules({ canteenId }),
                    getAllMenus({ canteenId }),
                ]);

                const list = schedulesRes?.data?.schedules || [];
                const menuList = menusRes?.data?.menus || [];

                setSchedulesRaw(list);
                setMenus(menuList);
            } catch (error) {
                messageApi.error(
                    error?.response?.data?.message || 'Không thể tải lịch thực đơn',
                );
            } finally {
                setLoading(false);
            }
        },
        [messageApi],
    );

    // Toggle trạng thái enabled/disabled của một lịch
    const handleToggleSchedule = useCallback(
        async (scheduleId) => {
            try {
                await toggleMenuScheduleStatus(scheduleId);
                messageApi.success('Cập nhật trạng thái lịch thực đơn thành công');
                if (currentCanteenId) {
                    fetchSchedules(currentCanteenId);
                }
            } catch (error) {
                messageApi.error(
                    error?.response?.data?.message || 'Không thể cập nhật trạng thái lịch thực đơn',
                );
            }
        },
        [currentCanteenId, fetchSchedules, messageApi],
    );

    // Tạo lịch mới cho một ô (ngày + ca) cụ thể
    const handleCreateScheduleForCell = useCallback(
        async ({ menuId, date, slotKey }) => {
            if (!currentCanteenId) {
                messageApi.error('Thiếu thông tin căng tin');
                return false;
            }

            if (!menuId || !date || !slotKey) {
                messageApi.error('Vui lòng chọn đầy đủ thông tin thực đơn');
                return false;
            }

            const baseDate = dayjs(date);
            if (!baseDate.isValid()) {
                messageApi.error('Ngày áp dụng không hợp lệ');
                return false;
            }

            const today = dayjs().startOf('day');
            const maxDate = today.add(7, 'day').endOf('day');

            if (baseDate.isBefore(today)) {
                messageApi.error('Chỉ được áp dụng lịch từ ngày hôm nay trở đi');
                return false;
            }

            if (baseDate.isAfter(maxDate)) {
                messageApi.error('Chỉ được áp dụng lịch tối đa trong 7 ngày tới');
                return false;
            }

            let startHour = 7;
            let endHour = 9;

            if (slotKey === 'noon') {
                startHour = 9;
                endHour = 13;
            } else if (slotKey === 'afternoon') {
                startHour = 13;
                endHour = 18;
            }
            const now = dayjs();

            const startDateTime = baseDate
                .hour(startHour)
                .minute(0)
                .second(0)
                .millisecond(0);

            const endDateTime = baseDate
                .hour(endHour)
                .minute(0)
                .second(0)
                .millisecond(0);

            if (endDateTime.isBefore(now)) {
                // Comment: Không cho tạo lịch hoàn toàn trong quá khứ (ca đã kết thúc)
                messageApi.error('Không thể tạo lịch trong khoảng thời gian đã kết thúc');
                return false;
            }

            const startAt = startDateTime.toISOString();
            const endAt = endDateTime.toISOString();

            try {
                await createMenuSchedule({
                    menuId,
                    canteenId: currentCanteenId,
                    startAt,
                    endAt,
                });

                messageApi.success('Tạo lịch áp dụng thực đơn thành công');
                await fetchSchedules(currentCanteenId);
                return true;
            } catch (error) {
                messageApi.error(
                    error?.response?.data?.message
                    || 'Không thể tạo lịch áp dụng cho thực đơn',
                );
                return false;
            }
        },
        [currentCanteenId, fetchSchedules, messageApi],
    );

    // Cập nhật lịch áp dụng (chỉ thay đổi ngày/ca)
    const handleUpdateSchedule = useCallback(
        async ({ scheduleId, date, slotKey }) => {
            if (!scheduleId || !date || !slotKey) {
                messageApi.error('Thiếu thông tin để cập nhật lịch');
                return false;
            }

            const baseDate = dayjs(date);
            if (!baseDate.isValid()) {
                messageApi.error('Ngày áp dụng không hợp lệ');
                return false;
            }

            const today = dayjs().startOf('day');
            const maxDate = today.add(7, 'day').endOf('day');

            if (baseDate.isBefore(today)) {
                messageApi.error('Chỉ được áp dụng lịch từ ngày hôm nay trở đi');
                return false;
            }

            if (baseDate.isAfter(maxDate)) {
                messageApi.error('Chỉ được áp dụng lịch tối đa trong 7 ngày tới');
                return false;
            }

            let startHour = 7;
            let endHour = 9;

            if (slotKey === 'noon') {
                startHour = 9;
                endHour = 13;
            } else if (slotKey === 'afternoon') {
                startHour = 13;
                endHour = 18;
            }
            const now = dayjs();

            const startDateTime = baseDate
                .hour(startHour)
                .minute(0)
                .second(0)
                .millisecond(0);

            if (startDateTime.isBefore(now)) {
                // Comment: Không cho chỉnh sửa lịch về thời điểm trong quá khứ
                messageApi.error('Không thể chỉnh sửa ngày về quá khứ');
                return false;
            }

            const endDateTime = baseDate
                .hour(endHour)
                .minute(0)
                .second(0)
                .millisecond(0);

            const startAt = startDateTime.toISOString();
            const endAt = endDateTime.toISOString();

            try {
                await updateMenuSchedule(scheduleId, { startAt, endAt });
                messageApi.success('Cập nhật lịch thực đơn thành công');
                if (currentCanteenId) {
                    await fetchSchedules(currentCanteenId);
                }
                return true;
            } catch (error) {
                messageApi.error(
                    error?.response?.data?.message || 'Không thể cập nhật lịch thực đơn',
                );
                return false;
            }
        },
        [currentCanteenId, fetchSchedules, messageApi],
    );

    // Nhân bản lịch sang ngày/ca khác
    const handleDuplicateSchedule = useCallback(
        async ({ scheduleId, date, slotKey }) => {
            if (!scheduleId || !date || !slotKey) {
                messageApi.error('Thiếu thông tin để nhân bản lịch');
                return false;
            }

            const baseDate = dayjs(date);
            if (!baseDate.isValid()) {
                messageApi.error('Ngày áp dụng không hợp lệ');
                return false;
            }

            const today = dayjs().startOf('day');
            const maxDate = today.add(7, 'day').endOf('day');

            if (baseDate.isBefore(today)) {
                messageApi.error('Chỉ được áp dụng lịch từ ngày hôm nay trở đi');
                return false;
            }

            if (baseDate.isAfter(maxDate)) {
                messageApi.error('Chỉ được áp dụng lịch tối đa trong 7 ngày tới');
                return false;
            }

            let startHour = 7;
            let endHour = 9;

            if (slotKey === 'noon') {
                startHour = 9;
                endHour = 13;
            } else if (slotKey === 'afternoon') {
                startHour = 13;
                endHour = 18;
            }

            const now = dayjs();

            const startDateTime = baseDate
                .hour(startHour)
                .minute(0)
                .second(0)
                .millisecond(0);

            if (startDateTime.isBefore(now)) {
                // Comment: Không cho nhân bản lịch về thời điểm trong quá khứ
                messageApi.error('Không thể nhân bản lịch về thời điểm trong quá khứ');
                return false;
            }

            const endDateTime = baseDate
                .hour(endHour)
                .minute(0)
                .second(0)
                .millisecond(0);

            const startAt = startDateTime.toISOString();
            const endAt = endDateTime.toISOString();

            try {
                await duplicateMenuSchedule(scheduleId, { startAt, endAt });
                messageApi.success('Nhân bản lịch thực đơn thành công');
                if (currentCanteenId) {
                    await fetchSchedules(currentCanteenId);
                }
                return true;
            } catch (error) {
                messageApi.error(
                    error?.response?.data?.message || 'Không thể nhân bản lịch thực đơn',
                );
                return false;
            }
        },
        [currentCanteenId, fetchSchedules, messageApi],
    );

    // Xóa một lịch áp dụng thực đơn
    const handleDeleteSchedule = useCallback(
        async (scheduleId) => {
            if (!scheduleId) {
                messageApi.error('Thiếu thông tin lịch cần xóa');
                return;
            }

            try {
                await deleteMenuSchedule(scheduleId);
                messageApi.success('Xóa lịch thực đơn thành công');
                if (currentCanteenId) {
                    await fetchSchedules(currentCanteenId);
                }
            } catch (error) {
                messageApi.error(
                    error?.response?.data?.message || 'Không thể xóa lịch thực đơn',
                );
            }
        },
        [currentCanteenId, fetchSchedules, messageApi],
    );

    const goPrevWeek = useCallback(() => {
        setCurrentWeek((prev) => prev.subtract(7, 'day'));
    }, []);

    const goNextWeek = useCallback(() => {
        setCurrentWeek((prev) => prev.add(7, 'day'));
    }, []);

    const goToday = useCallback(() => {
        setCurrentWeek(dayjs().startOf('week'));
    }, []);

    // Xem chi tiết thực đơn theo id
    const handleViewMenuDetail = useCallback(
        async (menuId) => {
            if (!menuId) return null;

            try {
                const response = await getMenuById(menuId);
                const menu = response?.data?.menu || response?.data;
                return menu || null;
            } catch (error) {
                // Comment: Thông báo lỗi khi không lấy được chi tiết thực đơn
                messageApi.error(
                    error?.response?.data?.message || 'Không thể tải chi tiết thực đơn',
                );
                return null;
            }
        },
        [messageApi],
    );

    return {
        contextHolder,
        loading,
        weekDates,
        weekLabel,
        slots: MENU_SLOTS,
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
    };
};
