export default function DraftControls({
  mode,
  hasDraftData,
  draftChanges,
  savingDraft,
  publishing,
  cancelingDraft,
  onSwitchMode,
  onEnterEditMode,
  onSaveDraft,
  onCancelDraft,
  onPublish,
}) {
  const canSwitchToDraft = mode === "draft" || hasDraftData;

  return (
    <div className="draft-controls">
      <div className="draft-controls-status-wrap">
        <div className="draft-controls-mode-switch">
          <button
            type="button"
            className={`draft-mode-btn ${mode === "published" ? "active" : ""}`}
            onClick={() => onSwitchMode("published")}
          >
            Đã phát hành
          </button>
          <button
            type="button"
            className={`draft-mode-btn ${mode === "draft" ? "active" : ""}`}
            onClick={() => onSwitchMode("draft")}
            disabled={!canSwitchToDraft}
            title={!canSwitchToDraft ? "Chưa có bản nháp, bấm Chỉnh sửa để tạo mới" : ""}
          >
            Bản nháp
          </button>
        </div>

        {mode === "draft" && draftChanges && (
          <span className="draft-controls-status">
            <span className="draft-controls-dot">●</span>
            Có thay đổi chưa lưu
          </span>
        )}
      </div>

      <div className="draft-controls-actions">
        {mode === "published" ? (
          <button
            type="button"
            className="btn-solid"
            onClick={onEnterEditMode}
          >
            Chỉnh sửa
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-soft btn-save"
              onClick={onSaveDraft}
              disabled={!draftChanges || savingDraft}
            >
              Lưu nháp
            </button>
            <button
              type="button"
              className="btn-soft btn-cancel"
              onClick={onCancelDraft}
              disabled={cancelingDraft}
            >
              Hủy nháp
            </button>
            <button
              type="button"
              className="btn-solid btn-publish"
              onClick={onPublish}
              disabled={publishing}
            >
              Phát hành lịch tuần
            </button>
          </>
        )}
      </div>
    </div>
  );
}
