import { useEffect, useMemo, useState } from "react";
import { Card, Descriptions, Modal, Tag, Button, Space, Form, Input, message } from "antd";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayjs from "dayjs";

import "@/styles/staff-fullcalendar.css";
import { useAuthStore } from "@/store/useAuthStore";
import { getStaffShifts } from "@/services/staff.mock.service";
import { isUpcomingShift, isShiftOngoing } from "@/utils/staffShiftUtils";
import { useShiftRequestStore } from "@/store/useShiftRequestStore";
import { DEMO_STAFF_ID } from "@/utils/staffMockData";

function toCalendarEvent(shift) {
  return {
    id: shift.id,
    title: shift.title,
    start: shift.start,
    end: shift.end,
    extendedProps: {
      location: shift.location,
      status: shift.status,
    },
  };
}

function getEventStatus(shiftStatus, start) {
  const now = dayjs();
  const isToday = start ? dayjs(start).isSame(now, "day") : false;

  if (["late", "absent", "missed"].includes(shiftStatus)) {
    return { key: "danger", label: "Vắng/Trễ" };
  }
  if (isToday) {
    return { key: "primary", label: "Hôm nay" };
  }
  if (start && now.isBefore(dayjs(start))) {
    return { key: "success", label: "Sắp tới" };
  }
  return { key: "muted", label: "Mặc định" };
}

export default function WorkSchedulePage() {
  const { user } = useAuthStore();
  const staffId = user?.id ?? DEMO_STAFF_ID;

  const [form] = Form.useForm();
  const { requests, createShiftChangeRequest } = useShiftRequestStore();

  const [shifts, setShifts] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getStaffShifts(staffId);
      if (!cancelled) {
        setShifts(data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffId]);

  const loading = shifts === null;
  const events = useMemo(() => (shifts ?? []).map(toCalendarEvent), [shifts]);

  const statusTag = (shift) => {
    if (!shift) return null;
    if (isShiftOngoing(shift)) return <Tag color="processing">Đang diễn ra</Tag>;
    if (isUpcomingShift(shift)) return <Tag color="warning">Sắp tới</Tag>;
    return <Tag color="default">Đã qua</Tag>;
  };

  const pendingRequest = useMemo(() => {
    if (!selectedShift) return null;
    return (
      requests.find((r) => r.shiftId === selectedShift.id && r.status === "Pending") ?? null
    );
  }, [requests, selectedShift]);

  const canRequestChange = Boolean(selectedShift && isUpcomingShift(selectedShift) && !pendingRequest);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Lịch làm việc" className="surface-card" loading={loading}>
        <FullCalendar
          plugins={[timeGridPlugin]}
          initialView="timeGridWeek"
          locale="vi"
          height={640}
          nowIndicator
          eventOverlap={false}
          eventDisplay="block"
          expandRows={false}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="18:00:00"
          slotDuration="05:30:00"
          slotLabelContent={(arg) => {
            const hhmm = dayjs(arg.date).format("HH:mm");
            if (hhmm === "08:00") return { html: "<span style='font-weight: 700; color: var(--text); padding: 0 8px;'>Ca sáng</span>" };
            if (hhmm === "13:30") return { html: "<span style='font-weight: 700; color: var(--text); padding: 0 8px;'>Ca chiều</span>" };
            return { html: "" };
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          editable={false}
          eventStartEditable={false}
          eventDurationEditable={false}
          droppable={false}
          selectable={false}
          events={events}
          eventContent={(arg) => {
            const start = arg.event.start;
            const end = arg.event.end;
            const title = arg.event.title || "—";
            const location = arg.event.extendedProps?.location || "—";
            const shiftStatus = arg.event.extendedProps?.status;
            const status = getEventStatus(shiftStatus, start);
            const timeText = start && end ? `${dayjs(start).format("HH:mm")} - ${dayjs(end).format("HH:mm")}` : "—";

            return (
              <div className={`ulfc-event uls-${status.key}`}>
                <div className="ulfc-line" />
                <div className="ulfc-info">
                  <div className="ulfc-name" title={title}>{title}</div>
                  <div className="ulfc-location" title={location}>{location}</div>
                  <div className="ulfc-pill">{timeText}</div>
                </div>
              </div>
            );
          }}
          eventClick={(info) => {
            const shift = (shifts ?? []).find((s) => s.id === info.event.id) ?? null;
            setSelectedShift(shift);
            form.resetFields();
            setOpenDetails(true);
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <span>Chi tiết ca</span>
            {statusTag(selectedShift)}
          </Space>
        }
        open={openDetails}
        onCancel={() => {
          setOpenDetails(false);
          form.resetFields();
        }}
        footer={
          <Space>
            <Button onClick={() => setOpenDetails(false)}>Đóng</Button>
            <Button type="primary" disabled={!canRequestChange} onClick={async () => {
              try {
                const values = await form.validateFields();
                createShiftChangeRequest({ shiftId: selectedShift?.id, reason: values.reason });
                message.success("Đã gửi yêu cầu đổi ca (mock) - Pending");
              } catch {
                // validation error
              }
            }}>
              Request Change Shift
            </Button>
          </Space>
        }
        destroyOnHidden
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Ca">{selectedShift?.title || "—"}</Descriptions.Item>
          <Descriptions.Item label="Ngày">{selectedShift ? dayjs(selectedShift.start).format("DD/MM/YYYY") : "—"}</Descriptions.Item>
          <Descriptions.Item label="Địa điểm">{selectedShift?.location || "—"}</Descriptions.Item>
          <Descriptions.Item label="Bắt đầu">
            {selectedShift ? dayjs(selectedShift.start).format("DD/MM/YYYY HH:mm") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Kết thúc">
            {selectedShift ? dayjs(selectedShift.end).format("DD/MM/YYYY HH:mm") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">{statusTag(selectedShift) || "—"}</Descriptions.Item>
        </Descriptions>

        {pendingRequest && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
            Request Status: <b>Pending</b>
          </div>
        )}

        {selectedShift && isUpcomingShift(selectedShift) && !pendingRequest && (
          <div style={{ marginTop: 12 }}>
            <Form form={form} layout="vertical">
              <Form.Item
                name="reason"
                label="Reason"
                rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
              >
                <Input.TextArea
                  placeholder="Ví dụ: bận việc cá nhân…"
                  autoSize={{ minRows: 4, maxRows: 8 }}
                />
              </Form.Item>
            </Form>
          </div>
        )}

        <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 12 }}>
          Mock data • Click vào event để xem chi tiết.
        </div>
      </Modal>
    </div>
  );
}
