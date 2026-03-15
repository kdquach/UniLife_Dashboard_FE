import { useMemo } from 'react';
import {
  Alert,
  Card,
  Col,
  Descriptions,
  Empty,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import GIcon from '@/components/GIcon';
import {
  getRecipeQuantityInStandardUnit,
  resolveStandardUnitCost,
} from '@/utils/ingredientCost.util';

const { Text } = Typography;

// Modal xem chi tiết công thức món ăn ở mức tổng hợp
export default function RecipeDetailModal({
  open,
  onClose,
  product,
  recipeItems,
  ingredients,
}) {
  const ingredientMapById = useMemo(() => {
    const source = Array.isArray(ingredients) ? ingredients : [];

    return source.reduce((acc, item) => {
      if (item?._id) {
        acc[String(item._id)] = item;
      }

      return acc;
    }, {});
  }, [ingredients]);

  const recipeSummary = useMemo(() => {
    const source = Array.isArray(recipeItems) ? recipeItems : [];

    const rows = source.map((item) => {
      const ingredient = ingredientMapById[String(item.ingredientId)] || null;
      const stock = Number(ingredient?.stock || 0);
      const threshold = Number(ingredient?.lowStockThreshold || 0);
      const quantityPerPortion = Number(item.quantity || 0);
      const standardUnit = ingredient?.standardUnit || item.unit;
      const quantityPerPortionInStandardUnit = getRecipeQuantityInStandardUnit(
        item,
        ingredient
      );
      const stockInStandardUnit = getRecipeQuantityInStandardUnit(
        {
          quantity: stock,
          unit: ingredient?.unit,
        },
        ingredient
      );

      const unitCost = resolveStandardUnitCost(ingredient);
      const costPerPortion = quantityPerPortionInStandardUnit * unitCost;
      const maxPortionsByIngredient =
        quantityPerPortionInStandardUnit > 0
          ? Math.floor(stockInStandardUnit / quantityPerPortionInStandardUnit)
          : 0;

      return {
        key: String(item.ingredientId),
        ingredientId: String(item.ingredientId),
        ingredientName: item.ingredientName,
        unit: item.unit,
        quantityPerPortion,
        quantityPerPortionInStandardUnit,
        standardUnit,
        stock,
        threshold,
        unitCost,
        costPerPortion,
        maxPortionsByIngredient,
        stockStatus: stock <= threshold ? 'low' : 'normal',
      };
    });

    const totalCostPerPortion = rows.reduce(
      (sum, row) => sum + row.costPerPortion,
      0
    );

    const validPortionLimits = rows
      .map((row) => row.maxPortionsByIngredient)
      .filter((value) => Number.isFinite(value));

    const maxSellablePortions =
      validPortionLimits.length > 0 ? Math.min(...validPortionLimits) : 0;

    const missingCostCount = rows.filter((row) => row.unitCost <= 0).length;

    return {
      rows,
      totalCostPerPortion,
      maxSellablePortions,
      missingCostCount,
    };
  }, [ingredientMapById, recipeItems]);

  const sellingPrice = Number(product?.price || 0);
  const estimatedProfit = sellingPrice - recipeSummary.totalCostPerPortion;

  const deductionColumns = [
    {
      title: 'Nguyên liệu',
      dataIndex: 'ingredientName',
      key: 'ingredientName',
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Trừ kho mỗi phần bán',
      key: 'deduction',
      align: 'center',
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Tag color="processing">
            -{Number(record.quantityPerPortion).toLocaleString('vi-VN')}{' '}
            {record.unit}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ~
            {Number(record.quantityPerPortionInStandardUnit).toLocaleString(
              'vi-VN'
            )}{' '}
            {record.standardUnit}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Tồn kho hiện tại',
      key: 'stock',
      align: 'center',
      render: (_, record) => (
        <Tag color={record.stockStatus === 'low' ? 'error' : 'success'}>
          {Number(record.stock).toLocaleString('vi-VN')} {record.unit}
        </Tag>
      ),
    },
    {
      title: 'Số phần tối đa theo nguyên liệu',
      dataIndex: 'maxPortionsByIngredient',
      key: 'maxPortionsByIngredient',
      align: 'center',
      render: (value) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Chi phí / phần theo nguyên liệu',
      dataIndex: 'costPerPortion',
      key: 'costPerPortion',
      align: 'right',
      render: (value, record) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Text strong>{Number(value || 0).toLocaleString('vi-VN')} đ</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {Number(record.unitCost || 0).toLocaleString('vi-VN')} đ/
            {record.standardUnit}
          </Text>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="Xem chi tiết công thức món ăn"
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      destroyOnHidden
    >
      {!product ? (
        <Empty description="Chưa chọn món để xem chi tiết công thức" />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions bordered size="middle" column={2}>
            <Descriptions.Item label="Tên món ăn" span={1}>
              <Text strong>{product.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Danh mục món" span={1}>
              {product.categoryId?.name || 'Không xác định'}
            </Descriptions.Item>
            <Descriptions.Item label="Giá bán" span={1}>
              <Tag color="blue">{sellingPrice.toLocaleString('vi-VN')} đ</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng số nguyên liệu" span={1}>
              <Tag>{recipeSummary.rows.length} nguyên liệu</Tag>
            </Descriptions.Item>
          </Descriptions>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Tổng chi phí nguyên liệu / phần"
                  value={recipeSummary.totalCostPerPortion}
                  precision={0}
                  suffix="đ"
                  formatter={(value) =>
                    Number(value || 0).toLocaleString('vi-VN')
                  }
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Lợi nhuận ước tính / phần"
                  value={estimatedProfit}
                  precision={0}
                  suffix="đ"
                  valueStyle={{
                    color: estimatedProfit >= 0 ? '#389e0d' : '#cf1322',
                  }}
                  formatter={(value) =>
                    Number(value || 0).toLocaleString('vi-VN')
                  }
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Số phần bán tối đa theo tồn kho"
                  value={recipeSummary.maxSellablePortions}
                  suffix="phần"
                  formatter={(value) =>
                    Number(value || 0).toLocaleString('vi-VN')
                  }
                />
              </Card>
            </Col>
          </Row>

          {recipeSummary.missingCostCount > 0 ? (
            <Alert
              type="warning"
              showIcon
              message="Thiếu dữ liệu giá vốn nguyên liệu"
              description={`Có ${recipeSummary.missingCostCount} nguyên liệu chưa có Chi phí/đơn vị chuẩn, hệ thống đang tạm tính bằng 0 cho các nguyên liệu này.`}
            />
          ) : null}

          <Card
            title={
              <Space>
                <GIcon name="inventory_2" />
                <span>Thông tin trừ kho khi bán 1 phần</span>
              </Space>
            }
          >
            <Table
              columns={deductionColumns}
              dataSource={recipeSummary.rows}
              pagination={false}
              locale={{
                emptyText: <Empty description="Món này chưa có công thức" />,
              }}
              scroll={{ x: 980 }}
            />
          </Card>
        </Space>
      )}
    </Modal>
  );
}
