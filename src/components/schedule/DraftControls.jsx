export default function DraftControls({
  draftChanges,
  savingDraft,
  publishing,
  onSaveDraft,
  onPublish,
}) {
  return (
    <div className="draft-controls">
      <div className="draft-controls-status-wrap">
        <span className="draft-controls-title">Weekly Schedule</span>
        {draftChanges && (
          <span className="draft-controls-status">
            <span className="draft-controls-dot">●</span>
            Có thay đổi chưa lưu
          </span>
        )}
      </div>

      <div className="draft-controls-actions">
        <button
          type="button"
          className="btn-soft"
          onClick={onSaveDraft}
          disabled={!draftChanges || savingDraft}
        >
          Save Draft
        </button>
        <button
          type="button"
          className="btn-solid"
          onClick={onPublish}
          disabled={publishing}
        >
          Publish Weekly Schedule
        </button>
      </div>
    </div>
  );
}
