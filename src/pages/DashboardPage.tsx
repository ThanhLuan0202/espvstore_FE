import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Typography, DatePicker, Tag, Avatar, List, Grid, Space } from 'antd';
import {
  DollarOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  InboxOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import dayjs from 'dayjs';
import { getDashboardReport } from '../services/report';
import type { DashboardReport } from '../services/report';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// Cấu hình các preset thời gian
const rangePresets: { label: string; value: [dayjs.Dayjs, dayjs.Dayjs] }[] = [
  { label: 'Hôm nay', value: [dayjs(), dayjs()] },
  { label: 'Hôm qua', value: [dayjs().add(-1, 'd'), dayjs().add(-1, 'd')] },
  { label: '7 ngày qua', value: [dayjs().add(-7, 'd'), dayjs()] },
  { label: '30 ngày qua', value: [dayjs().add(-30, 'd'), dayjs()] },
  { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
];

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint();
  const isMobile = screens.xs;

  // Date range state (mặc định 30 ngày)
  const [dates, setDates] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().add(-30, 'd'),
    dayjs()
  ]);

  // Kiểm tra quyền (chỉ ADMIN/MANAGER mới xem lợi nhuận)
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stateStr = localStorage.getItem('auth-storage');
    if (stateStr) {
      try {
        const state = JSON.parse(stateStr);
        const user = state?.state?.user;
        if (user && (user.role === 'ADMIN' || user.role === 'OWNER')) {
          setIsAdmin(true);
        }
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const startDate = dates[0].format('YYYY-MM-DD');
        const endDate = dates[1].format('YYYY-MM-DD');
        const res = await getDashboardReport(startDate, endDate);
        setData(res);
      } catch (error) {
        console.error('Lỗi khi tải dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [dates]);

  const onRangeChange = (ds: any) => {
    if (ds) {
      setDates([ds[0], ds[1]]);
    }
  };

  const cardStyle = "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl border-none overflow-hidden hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300";

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] gap-4">
        <div>
          <Title level={isMobile ? 4 : 3} className="!mb-1 text-gray-800">{!isAdmin ? 'Doanh Thu Cá Nhân' : 'Bảng điều khiển (Dashboard)'}</Title>
          <Text type="secondary" className="text-xs sm:text-sm">{!isAdmin ? 'Theo dõi hiệu suất bán hàng của riêng bạn' : 'Cái nhìn tổng quan về tình hình kinh doanh của bạn'}</Text>
        </div>
        <div className="w-full sm:w-auto">
          {isMobile ? (
            <Space direction="vertical" className="w-full">
              <DatePicker 
                className="w-full rounded-lg" 
                size="large" 
                value={dates[0]} 
                onChange={(d) => d && setDates([d, dates[1]])} 
                placeholder="Từ ngày"
                allowClear={false}
              />
              <DatePicker 
                className="w-full rounded-lg" 
                size="large" 
                value={dates[1]} 
                onChange={(d) => d && setDates([dates[0], d])} 
                placeholder="Đến ngày"
                allowClear={false}
              />
            </Space>
          ) : (
            <RangePicker
              presets={rangePresets}
              value={dates}
              onChange={onRangeChange}
              size="large"
              className="rounded-lg w-full sm:w-auto"
              allowClear={false}
            />
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={isAdmin ? 6 : 8}>
          <Card bordered={false} className={`${cardStyle} bg-gradient-to-br from-green-50 to-emerald-50`} styles={{ body: { padding: isMobile ? '16px' : '24px' } }}>
            <Statistic
              title={<span className="text-gray-600 font-medium">Doanh thu bán hàng</span>}
              value={data?.summary.totalRevenue || 0}
              precision={0}
              valueStyle={{ color: '#059669', fontWeight: 'bold', fontSize: isMobile ? '24px' : '28px' }}
              prefix={<div className="p-2 bg-green-100 rounded-lg mr-2"><DollarOutlined /></div>}
              suffix="đ"
              loading={loading}
            />
          </Card>
        </Col>

        {isAdmin && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className={`${cardStyle} bg-gradient-to-br from-blue-50 to-cyan-50`} styles={{ body: { padding: isMobile ? '16px' : '24px' } }}>
                <Statistic
                  title={<span className="text-gray-600 font-medium">Lợi nhuận gộp</span>}
                  value={data?.summary.grossProfit ?? data?.summary.profit ?? 0}
                  precision={0}
                  valueStyle={{ color: '#2563eb', fontWeight: 'bold', fontSize: isMobile ? '24px' : '28px' }}
                  prefix={<div className="p-2 bg-blue-100 rounded-lg mr-2"><DollarOutlined /></div>}
                  suffix="đ"
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className={`${cardStyle} bg-gradient-to-br from-indigo-50 to-violet-50`} styles={{ body: { padding: isMobile ? '16px' : '24px' } }}>
                <Statistic
                  title={<span className="text-gray-600 font-medium">Lợi nhuận ròng</span>}
                  value={data?.summary.netProfit ?? 0}
                  precision={0}
                  valueStyle={{ color: '#4f46e5', fontWeight: 'bold', fontSize: isMobile ? '24px' : '28px' }}
                  prefix={<div className="p-2 bg-indigo-100 rounded-lg mr-2"><DollarOutlined /></div>}
                  suffix="đ"
                  loading={loading}
                />
              </Card>
            </Col>
          </>
        )}

        <Col xs={24} sm={12} lg={isAdmin ? 6 : 8}>
          <Card bordered={false} className={`${cardStyle} bg-gradient-to-br from-purple-50 to-fuchsia-50`} styles={{ body: { padding: isMobile ? '16px' : '24px' } }}>
            <Statistic
              title={<span className="text-gray-600 font-medium">Tổng hóa đơn</span>}
              value={data?.summary.totalOrders || 0}
              valueStyle={{ color: '#7c3aed', fontWeight: 'bold', fontSize: isMobile ? '24px' : '28px' }}
              prefix={<div className="p-2 bg-purple-100 rounded-lg mr-2"><AppstoreOutlined /></div>}
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={isAdmin ? 6 : 8}>
          <Card bordered={false} className={`${cardStyle} bg-gradient-to-br from-orange-50 to-amber-50`} styles={{ body: { padding: isMobile ? '16px' : '24px' } }}>
            <Statistic
              title={<span className="text-gray-600 font-medium">Sản phẩm đã bán</span>}
              value={data?.summary.totalItemsSold || 0}
              valueStyle={{ color: '#ea580c', fontWeight: 'bold', fontSize: isMobile ? '24px' : '28px' }}
              prefix={<div className="p-2 bg-orange-100 rounded-lg mr-2"><ShoppingOutlined /></div>}
              loading={loading}
            />
          </Card>
        </Col>

        {isAdmin && (
          <Col xs={24} sm={12} lg={isAdmin ? 6 : 8}>
            <Card bordered={false} className={`${cardStyle} bg-gradient-to-br from-yellow-50 to-orange-50`} styles={{ body: { padding: isMobile ? '16px' : '24px' } }}>
              <Statistic
                title={<span className="text-gray-600 font-medium">Tổng tồn kho</span>}
                value={data?.summary.totalStockQuantity || 0}
                valueStyle={{ color: '#d97706', fontWeight: 'bold', fontSize: isMobile ? '24px' : '28px' }}
                prefix={<div className="p-2 bg-yellow-100 rounded-lg mr-2"><InboxOutlined /></div>}
                loading={loading}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Charts and Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} className={`${cardStyle} h-full`} title={<span className="font-bold text-lg text-gray-700">Biểu đồ doanh thu</span>} styles={{ body: { padding: isMobile ? '16px 8px' : '24px' } }}>
            {data && data.revenueChart && data.revenueChart.length > 0 ? (
              <div className="h-[300px] sm:h-[350px] w-full mt-4 -ml-4 sm:ml-0">
                <ResponsiveContainer width="100%" height="100%">
                  {data.revenueChart.length === 1 ? (
                    <BarChart data={data.revenueChart} margin={{ top: 10, right: isMobile ? 10 : 30, left: isMobile ? -20 : 0, bottom: 0 }}>
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10} 
                        tickFormatter={(val) => isMobile ? dayjs(val).format('DD/MM') : val}
                      />
                      <YAxis
                        width={isMobile ? 50 : 80}
                        tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                          if (value === 0) return '0';
                          if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                          if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
                          return value;
                        }}
                      />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <RechartsTooltip
                        formatter={(value: any, name: any) => {
                          let label = name;
                          if (name === 'revenue') label = 'Doanh thu';
                          if (name === 'grossProfit') label = 'LN gộp';
                          if (name === 'netProfit') label = 'LN ròng';
                          return [`${Number(value).toLocaleString('vi-VN')} đ`, label];
                        }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: isMobile ? '12px' : '14px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={isMobile ? 60 : 36}
                        wrapperStyle={isMobile ? { fontSize: '11px', lineHeight: '20px' } : {}}
                        formatter={(value) => {
                          if (value === 'revenue') return 'Doanh thu';
                          if (value === 'grossProfit') return 'LN gộp';
                          if (value === 'netProfit') return 'LN ròng';
                          return value;
                        }}
                      />
                      <Bar dataKey="revenue" name="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      {isAdmin && <Bar dataKey="grossProfit" name="grossProfit" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />}
                      {isAdmin && <Bar dataKey="netProfit" name="netProfit" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />}
                    </BarChart>
                  ) : (
                    <AreaChart data={data.revenueChart} margin={{ top: 10, right: isMobile ? 10 : 30, left: isMobile ? -20 : 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10} 
                        minTickGap={isMobile ? 30 : 5}
                        tickFormatter={(val) => isMobile ? dayjs(val).format('DD/MM') : val}
                      />
                      <YAxis
                        width={isMobile ? 50 : 80}
                        tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                          if (value === 0) return '0';
                          if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                          if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
                          return value;
                        }}
                      />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <RechartsTooltip
                        formatter={(value: any, name: any) => {
                          let label = name;
                          if (name === 'revenue') label = 'Doanh thu';
                          if (name === 'grossProfit') label = 'LN gộp';
                          if (name === 'netProfit') label = 'LN ròng';
                          return [`${Number(value).toLocaleString('vi-VN')} đ`, label];
                        }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: isMobile ? '12px' : '14px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={isMobile ? 60 : 36}
                        wrapperStyle={isMobile ? { fontSize: '11px', lineHeight: '20px' } : {}}
                        formatter={(value) => {
                          if (value === 'revenue') return 'Doanh thu';
                          if (value === 'grossProfit') return 'LN gộp';
                          if (value === 'netProfit') return 'LN ròng';
                          return value;
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" name="revenue" stroke="#10b981" strokeWidth={isMobile ? 2 : 3} fillOpacity={1} fill="url(#colorRevenue)" />
                      {isAdmin && <Area type="monotone" dataKey="grossProfit" name="grossProfit" stroke="#3b82f6" strokeWidth={isMobile ? 2 : 3} fillOpacity={1} fill="url(#colorGross)" />}
                      {isAdmin && <Area type="monotone" dataKey="netProfit" name="netProfit" stroke="#8b5cf6" strokeWidth={isMobile ? 2 : 3} fillOpacity={1} fill="url(#colorNet)" />}
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] sm:h-[350px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl mt-4 text-sm text-center px-4">
                {loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu giao dịch trong khoảng thời gian này'}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <div className="space-y-6 h-full flex flex-col">
            {/* Sales Leaderboard */}
            <Card bordered={false} className={`${cardStyle} flex-1`} title={
              <div className="flex items-center text-gray-700">
                <TrophyOutlined className="text-yellow-500 mr-2 text-xl" />
                <span className="font-bold text-lg">Thống Kê Người Bán</span>
              </div>
            }>
              <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={data?.salesPerformances || []}
                locale={{ emptyText: 'Chưa có dữ liệu bán hàng' }}
                renderItem={(item, index) => (
                  <List.Item className="border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : '#e5e7eb', color: index < 3 ? 'white' : '#4b5563' }}
                          size="large"
                        >
                          {index + 1}
                        </Avatar>
                      }
                      title={<span className="font-semibold text-gray-800">{item.staffName}</span>}
                      description={<span className="text-xs text-gray-500">{item.totalOrders} đơn hàng | Đã bán {item.totalItemsSold || 0} sản phẩm</span>}
                    />
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">{item.totalRevenue.toLocaleString('vi-VN')} đ</div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            {/* Top Products */}
            <Card bordered={false} className={`${cardStyle} flex-1`} title={<span className="font-bold text-lg text-gray-700">SP Bán Chạy</span>}>
              <Table
                loading={loading}
                dataSource={data?.topSellingProducts || []}
                pagination={false}
                size="small"
                rowKey="sku"
                locale={{ emptyText: 'Chưa có dữ liệu' }}
                columns={[
                  {
                    title: 'Sản phẩm',
                    dataIndex: 'productName',
                    key: 'productName',
                    render: (text, record) => (
                      <div>
                        <div className="font-medium text-gray-800 line-clamp-1" title={text}>{text}</div>
                        <div className="text-xs text-gray-500">{record.sku}</div>
                      </div>
                    )
                  },
                  {
                    title: 'Đã Bán',
                    dataIndex: 'quantitySold',
                    key: 'quantitySold',
                    width: 70,
                    align: 'center',
                    render: (val) => <Tag color="blue" className="mr-0 font-bold">{val}</Tag>
                  },
                ]}
              />
            </Card>
          </div>
        </Col>
      </Row>

      {/* Sales Leaderboard Chart */}
      {isAdmin && (
        <Row gutter={[16, 16]} className="mt-6">
          <Col xs={24}>
            <Card bordered={false} className={`${cardStyle} h-full`} title={<span className="font-bold text-lg text-gray-700">Biểu đồ doanh thu theo người bán</span>} styles={{ body: { padding: isMobile ? '16px 8px' : '24px' } }}>
              {data && data.salesPerformances && data.salesPerformances.length > 0 ? (
                <div className="h-[300px] sm:h-[350px] w-full mt-4 -ml-4 sm:ml-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.salesPerformances} margin={{ top: 10, right: isMobile ? 10 : 30, left: isMobile ? -20 : 0, bottom: 0 }}>
                      <XAxis 
                        dataKey="staffName" 
                        tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10}
                      />
                      <YAxis
                        width={isMobile ? 50 : 80}
                        tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                          if (value === 0) return '0';
                          if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                          if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
                          return value;
                        }}
                      />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <RechartsTooltip
                        formatter={(value: any, name: any) => {
                          let label = name === 'totalRevenue' ? 'Doanh thu' : (name === 'totalOrders' ? 'Đơn hàng' : name);
                          return [`${Number(value).toLocaleString('vi-VN')} ${name === 'totalRevenue' ? 'đ' : ''}`, label];
                        }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: isMobile ? '12px' : '14px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={isMobile ? 60 : 36}
                        formatter={(value) => value === 'totalRevenue' ? 'Doanh thu' : value}
                      />
                      <Bar dataKey="totalRevenue" name="totalRevenue" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] sm:h-[350px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl mt-4 text-sm text-center px-4">
                  {loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu'}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DashboardPage;
