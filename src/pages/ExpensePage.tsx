import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, DatePicker, Select, Tag, message, Popconfirm, Card, Grid, List } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getExpenses, createExpense, deleteExpense } from '../services/expense';
import type { Expense, CreateExpenseRequest } from '../services/expense';

const { Option } = Select;

const ExpensePage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form] = Form.useForm();

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = screens.xs || (screens.sm && !screens.md);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const handleViewDetail = (expense: Expense) => {
    setSelectedExpense(expense);
    setDetailModalVisible(true);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      message.error('Lỗi tải danh sách Thu / Chi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      message.success('Xoá thành công');
      fetchExpenses();
    } catch (error) {
      message.error('Lỗi khi xoá');
    }
  };

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: CreateExpenseRequest = {
        title: values.title,
        amount: values.amount,
        type: values.type,
        category: values.category,
        transactionDate: values.transactionDate ? values.transactionDate.toISOString() : new Date().toISOString(),
        note: values.note,
      };
      await createExpense(payload);
      message.success('Thêm thành công');
      setIsModalVisible(false);
      form.resetFields();
      fetchExpenses();
    } catch (error: any) {
      message.error(error?.response?.data || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (cat: string) => {
    const map: Record<string, string> = {
      'SALARY': 'Tiền lương',
      'UTILITY': 'Điện / Nước',
      'SUPPLY': 'Vật tư',
      'MAINTENANCE': 'Bảo trì',
      'OTHER_EXPENSE': 'Chi phí khác',
      'OTHER_INCOME': 'Thu nhập khác'
    };
    return map[cat] || cat;
  };

  const columns = [
    {
      title: 'Tên khoản Thu/Chi',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        type === 'INCOME' 
          ? <Tag color="green">THU</Tag>
          : <Tag color="red">CHI</Tag>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => getCategoryName(cat),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number, record: Expense) => (
        <span className={`font-bold ${record.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
          {record.type === 'INCOME' ? '+' : '-'}{val.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Ngày thực hiện',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Người tạo',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Expense) => (
        <Popconfirm
          title="Bạn chắc chắn muốn xoá?"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // Tính tổng kết
  const totalExpense = expenses.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="flex gap-6 mb-6">
        <Card className="flex-1 shadow-sm border-l-4 border-red-500 max-w-sm" styles={{ body: { padding: '12px sm:24px' } }}>
          <div className="text-gray-500 mb-1">Tổng Chi</div>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{totalExpense.toLocaleString('vi-VN')} đ</div>
        </Card>
      </div>

      <Card 
        styles={{ body: { padding: '12px sm:24px' } }}
        title={
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2">
            <span className="text-base sm:text-lg">Sổ Quỹ Chi Phí</span>
          </div>
        }
        className="shadow-sm"
        extra={null}
      >
        <div className="flex justify-end mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Thêm khoản Chi
          </Button>
        </div>

        {isMobile ? (
          <List
            dataSource={expenses}
            loading={loading}
            pagination={{ pageSize: 10, size: 'small', align: 'center' }}
            renderItem={(item) => (
              <Card 
                size="small" 
                className="mb-3 shadow-sm rounded-lg border-gray-200" 
                styles={{ body: { padding: '12px' } }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 line-clamp-2">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{getCategoryName(item.category)}</div>
                  </div>
                  <Tag color={item.type === 'INCOME' ? 'green' : 'red'}>{item.type === 'INCOME' ? 'THU' : 'CHI'}</Tag>
                </div>
                <div className="text-sm mt-2">
                  <span className={`font-bold ${item.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'INCOME' ? '+' : '-'}{item.amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{new Date(item.transactionDate).toLocaleDateString('vi-VN')}</span>
                  <Button type="default" size="small" onClick={() => handleViewDetail(item)}>Chi tiết</Button>
                </div>
              </Card>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table 
              columns={columns} 
              dataSource={expenses} 
              rowKey="id" 
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </div>
        )}
      </Card>

      <Modal
        title="Thêm khoản Chi"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ type: 1, category: 4 }}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Đóng tiền điện tháng 9" />
          </Form.Item>
          
          <Space className="w-full">
            <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
              <Select className="w-32" disabled>
                <Option value={1}>CHI</Option>
              </Select>
            </Form.Item>

            <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
              <Select className="w-48">
                <Option value={0}>Tiền lương</Option>
                <Option value={1}>Điện / Nước</Option>
                <Option value={2}>Vật tư</Option>
                <Option value={3}>Bảo trì</Option>
                <Option value={4}>Chi phí khác</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value: string | undefined) => Number(value?.replace(/\$\s?|(,*)/g, '')) || 0}
              min={1}
            />
          </Form.Item>

          <Form.Item name="transactionDate" label="Ngày giao dịch">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Huỷ</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Lưu lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal for Mobile */}
      <Modal
        title="Chi tiết Phiếu Thu/Chi"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        {selectedExpense && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg m-0 text-gray-800">{selectedExpense.title}</h3>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-600">Loại giao dịch:</span>
                <Tag color={selectedExpense.type === 'INCOME' ? 'green' : 'red'}>{selectedExpense.type === 'INCOME' ? 'Phiếu Thu' : 'Phiếu Chi'}</Tag>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Danh mục:</span>
                <span className="font-semibold">{getCategoryName(selectedExpense.category)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền:</span>
                <span className={`font-bold text-lg ${selectedExpense.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedExpense.type === 'INCOME' ? '+' : '-'}{selectedExpense.amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày thực hiện:</span>
                <span className="font-semibold">{new Date(selectedExpense.transactionDate).toLocaleDateString('vi-VN')}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Người tạo:</span>
                <span className="font-semibold text-blue-600">{selectedExpense.userName}</span>
              </div>

              {selectedExpense.note && (
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="text-gray-600 mb-1">Ghi chú:</div>
                  <div className="text-sm bg-white p-2 rounded border border-gray-100">{selectedExpense.note}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Popconfirm 
                title="Xóa phiếu thu/chi này?" 
                onConfirm={() => {
                  handleDelete(selectedExpense.id);
                  setDetailModalVisible(false);
                }}
              >
                <Button danger className="w-full" icon={<DeleteOutlined />}>Xóa giao dịch</Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExpensePage;
