import { useEffect, useMemo, useState } from "react";
import { Card, Empty, Pagination, Spin, Table } from "antd";

const getPathValue = (obj, path) => {
  if (Array.isArray(path)) {
    return path.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  }
  if (typeof path === "string" && path.length > 0) {
    return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  }
  return undefined;
};

const isRenderableValue = (value) => {
  if (value === 0 || value === false) return true;
  return value !== null && value !== undefined && value !== "";
};

export default function ResponsiveDataTable({
  columns = [],
  dataSource = [],
  rowKey = "id",
  loading = false,
  pagination,
  mobileFields,
  className,
  ...restProps
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const onChange = (event) => setIsMobile(event.matches);

    onChange(media);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const mobileColumns = useMemo(() => {
    return (Array.isArray(columns) ? columns : []).filter((col) => {
      if (!col) return false;
      if (col.hideInMobile) return false;
      if (Array.isArray(col.responsive) && !col.responsive.includes("xs")) return false;
      return true;
    });
  }, [columns]);

  const mobileColumnsOrdered = useMemo(() => {
    if (!Array.isArray(mobileFields) || mobileFields.length === 0) {
      return mobileColumns;
    }

    const stringifyDataIndex = (dataIndex) => {
      if (Array.isArray(dataIndex)) return dataIndex.join(".");
      return typeof dataIndex === "string" ? dataIndex : "";
    };

    const indexMap = new Map();
    mobileColumns.forEach((col, idx) => {
      const key = col?.key || stringifyDataIndex(col?.dataIndex) || String(idx);
      indexMap.set(String(key), col);
    });

    const ordered = [];
    mobileFields.forEach((fieldKey) => {
      const hit = indexMap.get(String(fieldKey));
      if (hit && !ordered.includes(hit)) {
        ordered.push(hit);
      }
    });

    mobileColumns.forEach((col) => {
      if (!ordered.includes(col)) {
        ordered.push(col);
      }
    });

    return ordered;
  }, [mobileColumns, mobileFields]);

  const data = Array.isArray(dataSource) ? dataSource : [];

  if (!isMobile) {
    return (
      <Table
        columns={columns}
        dataSource={data}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        className={className}
        {...restProps}
      />
    );
  }

  const emptyNode = (
    <div className="rdt-mobile-empty">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" />
    </div>
  );

  return (
    <div className="rdt-mobile-wrap">
      {loading ? (
        <div className="rdt-mobile-loading">
          <Spin />
        </div>
      ) : data.length === 0 ? (
        emptyNode
      ) : (
        <div className="rdt-mobile-list">
          {data.map((record, rowIndex) => {
            const key =
              typeof rowKey === "function"
                ? rowKey(record)
                : record?.[rowKey] || record?._id || rowIndex;

            return (
              <Card key={key} className="rdt-mobile-card" size="small">
                <div className="rdt-mobile-fields">
                  {mobileColumnsOrdered.map((col, colIndex) => {
                    const rawValue = getPathValue(record, col?.dataIndex);
                    const value =
                      typeof col?.render === "function"
                        ? col.render(rawValue, record, rowIndex)
                        : rawValue;

                    if (!isRenderableValue(value)) return null;

                    const label =
                      typeof col?.title === "string" || typeof col?.title === "number"
                        ? String(col.title)
                        : col?.key || `Trường ${colIndex + 1}`;

                    return (
                      <div className="rdt-mobile-field" key={`${key}-${label}-${colIndex}`}>
                        <div className="rdt-mobile-label">{label}</div>
                        <div className="rdt-mobile-value">{value}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {pagination && pagination !== false && !loading && data.length > 0 ? (
        <div className="rdt-mobile-pagination">
          <Pagination
            current={pagination.current || 1}
            pageSize={pagination.pageSize || 10}
            total={pagination.total || data.length}
            showSizeChanger={Boolean(pagination.showSizeChanger)}
            size="small"
            onChange={(page, pageSize) => pagination.onChange?.(page, pageSize)}
          />
        </div>
      ) : null}
    </div>
  );
}
