/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Download, 
  Printer, 
  Database,
  Calculator,
  LayoutDashboard
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  TooltipProps
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
type ChangeReason = '설계변경' | '물가변동' | '기타 계약변경' | '클레임' | '공법변경';

interface CostItem {
  id: string;
  category: string;
  originalAmount: number;
  revisedAmount: number;
  reason: ChangeReason;
}

const REASONS: ChangeReason[] = ['설계변경', '물가변동', '기타 계약변경', '클레임', '공법변경'];

const DEFAULT_CATEGORIES = [
  '토공사', '기초공사', '철근콘크리트공사', '철골공사',
  '조적공사', '방수공사', '창호공사', '기계설비', '전기설비', '소방공사'
];

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function App() {
  const [items, setItems] = useState<CostItem[]>([]);
  const [projectName, setProjectName] = useState('신규 프로젝트 공사비 분석');

  // Load sample data
  const loadSampleData = () => {
    const sampleData: CostItem[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
      id: crypto.randomUUID(),
      category: cat,
      originalAmount: Math.floor(Math.random() * 500 + 500) * 1000000,
      revisedAmount: Math.floor(Math.random() * 600 + 500) * 1000000,
      reason: REASONS[Math.floor(Math.random() * REASONS.length)]
    }));
    setItems(sampleData);
  };

  // CRUD Operations
  const addItem = () => {
    const newItem: CostItem = {
      id: crypto.randomUUID(),
      category: '신규 공종',
      originalAmount: 0,
      revisedAmount: 0,
      reason: '설계변경'
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof CostItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Calculations
  const calculations = useMemo(() => {
    const totalOriginal = items.reduce((sum, item) => sum + item.originalAmount, 0);
    const totalRevised = items.reduce((sum, item) => sum + item.revisedAmount, 0);
    const totalDiff = totalRevised - totalOriginal;
    const totalRate = totalOriginal === 0 ? 0 : (totalDiff / totalOriginal) * 100;

    const reasonStats = REASONS.map(reason => {
      const amount = items
        .filter(item => item.reason === reason)
        .reduce((sum, item) => sum + (item.revisedAmount - item.originalAmount), 0);
      return { name: reason, value: Math.abs(amount), rawValue: amount };
    }).filter(s => s.value > 0);

    const highAlerts = items.filter(item => {
      const rate = item.originalAmount === 0 ? 0 : (Math.abs(item.revisedAmount - item.originalAmount) / item.originalAmount) * 100;
      return rate >= 10;
    });

    return { totalOriginal, totalRevised, totalDiff, totalRate, reasonStats, highAlerts };
  }, [items]);

  // Format Helpers
  const formatWon = (val: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
  };

  const formatSimpleWon = (val: number) => {
    if (Math.abs(val) >= 100000000) return `${(val / 100000000).toFixed(2)} 억`;
    if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(0)} 만`;
    return val.toLocaleString();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-semibold mb-1">
            <LayoutDashboard size={18} />
            <span className="text-sm uppercase tracking-wider">BM 분석 도구</span>
          </div>
          <input 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none focus:ring-0 w-full p-0 text-slate-800"
            placeholder="프로젝트 제목을 입력하세요"
          />
        </div>
        <div className="flex gap-2 no-print">
          <button 
            onClick={loadSampleData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Database size={16} />
            예시 데이터
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all shadow-md active:scale-95 text-sm font-medium"
          >
            <Printer size={16} />
            인쇄하기
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '당초 총 공사비', value: calculations.totalOriginal, color: 'text-slate-600', icon: Calculator },
          { label: '변경 후 공사비', value: calculations.totalRevised, color: 'text-slate-900', icon: TrendingUp },
          { 
            label: '총 증감액', 
            value: calculations.totalDiff, 
            color: calculations.totalDiff >= 0 ? 'text-red-600' : 'text-blue-600',
            sub: `${calculations.totalRate.toFixed(2)}%`,
            icon: calculations.totalDiff >= 0 ? TrendingUp : TrendingDown 
          },
          { label: '분석 항목 수', value: items.length, isNum: true, color: 'text-slate-500', icon: Database }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
              <h3 className={cn("text-xl font-bold font-mono", stat.color)}>
                {stat.isNum ? stat.value : formatSimpleWon(stat.value)}
              </h3>
              {stat.sub && (
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1", 
                  calculations.totalDiff >= 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')}>
                  {stat.sub}
                </span>
              )}
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <stat.icon size={20} className="text-slate-400" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content: Table & Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Table Section */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Database size={18} className="text-blue-500" />
                공종별 공사비 상세 내역
              </h2>
              <button 
                onClick={addItem}
                className="no-print p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-lg active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold text-left">
                    <th className="px-4 py-3 border-b border-slate-100">공종명</th>
                    <th className="px-4 py-3 border-b border-slate-100 text-right">당초 금액 (원)</th>
                    <th className="px-4 py-3 border-b border-slate-100 text-right">변경 금액 (원)</th>
                    <th className="px-4 py-3 border-b border-slate-100 text-right">증감액 (원)</th>
                    <th className="px-4 py-3 border-b border-slate-100 text-center">변경 사유</th>
                    <th className="px-4 py-3 border-b border-slate-100 text-center no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const diff = item.revisedAmount - item.originalAmount;
                      const rate = item.originalAmount === 0 ? 0 : (diff / item.originalAmount) * 100;
                      return (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -20 }}
                          key={item.id} 
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="p-2 min-w-[140px]">
                            <input 
                              value={item.category}
                              onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                              className="w-full bg-transparent p-2 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded border-none font-medium text-slate-800"
                            />
                          </td>
                          <td className="p-2 min-w-[140px]">
                            <input 
                              type="number"
                              value={item.originalAmount}
                              onChange={(e) => updateItem(item.id, 'originalAmount', Number(e.target.value))}
                              className="w-full bg-transparent p-2 text-right font-mono focus:bg-white focus:ring-2 focus:ring-blue-100 rounded border-none text-slate-600"
                            />
                          </td>
                          <td className="p-2 min-w-[140px]">
                            <input 
                              type="number"
                              value={item.revisedAmount}
                              onChange={(e) => updateItem(item.id, 'revisedAmount', Number(e.target.value))}
                              className="w-full bg-transparent p-2 text-right font-mono focus:bg-white focus:ring-2 focus:ring-blue-100 rounded border-none text-slate-800 font-semibold"
                            />
                          </td>
                          <td className="px-4 py-2 text-right min-w-[120px]">
                            <div className="flex flex-col items-end">
                              <span className={cn("font-mono font-bold whitespace-nowrap", 
                                diff > 0 ? 'text-red-500' : diff < 0 ? 'text-blue-500' : 'text-slate-400')}>
                                {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                              </span>
                              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                                Math.abs(rate) >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                                {rate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="p-2 min-w-[140px]">
                            <select 
                              value={item.reason}
                              onChange={(e) => updateItem(item.id, 'reason', e.target.value)}
                              className="w-full bg-transparent p-2 text-center text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 rounded border-none text-slate-600 cursor-pointer appearance-none md:appearance-auto"
                            >
                              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                          <td className="p-2 text-center no-print">
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                        내역이 없습니다. 행을 추가하거나 예시 데이터를 불러오세요.
                      </td>
                    </tr>
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                    <tr>
                      <td className="px-4 py-4 text-slate-600">합계 (Total)</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-600">{calculations.totalOriginal.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-900">{calculations.totalRevised.toLocaleString()}</td>
                      <td colSpan={3} className="px-4 py-4 text-left">
                        <div className="flex items-center gap-3">
                          <span className={cn("font-mono text-lg px-3 py-1 rounded-lg", 
                            calculations.totalDiff >= 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")}>
                            {calculations.totalDiff > 0 ? '▲' : '▼'} {Math.abs(calculations.totalDiff).toLocaleString()}
                          </span>
                          <span className="text-slate-400 font-normal">({calculations.totalRate.toFixed(2)}%)</span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Analysis Comments */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4 print-break-inside-avoid">
            <h3 className="font-bold text-blue-800 flex items-center gap-2">
              <TrendingUp size={18} />
              자동 분석 요약
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-900 leading-relaxed">
              <div className="space-y-2">
                <p>
                  본 프로젝트의 총 공사비는 당초 <span className="font-bold">{formatWon(calculations.totalOriginal)}</span>에서 
                  변경 후 <span className="font-bold font-mono text-blue-700 underline decoration-blue-200 underline-offset-4">{formatWon(calculations.totalRevised)}</span>(으)로 
                  총 <span className="font-bold">{formatWon(Math.abs(calculations.totalDiff))}</span> ({calculations.totalRate.toFixed(2)}%) {calculations.totalDiff >= 0 ? '증가' : '감소'}하였습니다.
                </p>
                {calculations.reasonStats.length > 0 && (
                  <p>
                    주요 변동 사유로는 <span className="font-bold underline text-blue-700">{calculations.reasonStats[0]?.name}</span> 항목이 가장 큰 영향을 주었습니다.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {calculations.highAlerts.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="flex items-center gap-2 font-bold text-amber-700">
                      <AlertTriangle size={16} />
                      비정상 증감 주의 항목 ({calculations.highAlerts.length}건)
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-amber-800">
                      {calculations.highAlerts.slice(0, 3).map(a => (
                        <li key={a.id}>{a.category} ({((Math.abs(a.revisedAmount - a.originalAmount) / a.originalAmount) * 100).toFixed(1)}% 변동)</li>
                      ))}
                      {calculations.highAlerts.length > 3 && <li>외 {calculations.highAlerts.length - 3}건...</li>}
                    </ul>
                  </div>
                ) : (
                  <p className="text-emerald-700 flex items-center gap-2 font-medium">
                    <TrendingDown size={16} />
                    모든 공종에서 변동폭이 10% 이내로 안정적으로 관리되고 있습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Analysis Sidebar */}
        <div className="space-y-8">
          {/* Bar Chart */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print-break-inside-avoid">
            <div className="flex items-center gap-2 mb-6 font-bold text-slate-800">
              <BarChart3 size={18} className="text-blue-500" />
              공종별 공사비 비교
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={items.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 40, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(val: number) => formatSimpleWon(val)}
                  />
                  <Legend verticalAlign="top" iconType="circle" />
                  <Bar dataKey="originalAmount" name="당초" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="revisedAmount" name="변경" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Pie Chart */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print-break-inside-avoid">
            <div className="flex items-center gap-2 mb-6 font-bold text-slate-800">
              <PieChartIcon size={18} className="text-purple-500" />
              변경 사유별 증감 비중
            </div>
            {calculations.reasonStats.length > 0 ? (
              <div className="h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={calculations.reasonStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {calculations.reasonStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => formatSimpleWon(val)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-4">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Delta</span>
                  <span className="text-lg font-bold font-mono text-slate-800">{formatSimpleWon(calculations.totalDiff)}</span>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm italic">
                데이터가 부족합니다.
              </div>
            )}
          </section>

          {/* Top 5 Highlight */}
          {items.length > 0 && (
            <section className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 text-white space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400">증감액 상위 공종</h3>
              </div>
              <div className="space-y-3">
                {[...items]
                  .sort((a, b) => Math.abs(b.revisedAmount - b.originalAmount) - Math.abs(a.revisedAmount - a.originalAmount))
                  .slice(0, 5)
                  .map((item, idx) => {
                    const diff = item.revisedAmount - item.originalAmount;
                    const p = Math.max(0, Math.min(100, (Math.abs(diff) / items.reduce((max, i) => Math.max(max, Math.abs(i.revisedAmount - i.originalAmount)), 0)) * 100));
                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">{idx + 1}. {item.category}</span>
                          <span className={cn("font-bold", diff > 0 ? 'text-red-400' : 'text-blue-400')}>
                            {formatSimpleWon(diff)}
                          </span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${p}%` }}
                            className={cn("h-full rounded-full", diff > 0 ? "bg-red-500" : "bg-blue-500")}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center py-12 text-slate-400 text-sm font-medium no-print">
        <p>© 2026 건설 원가 변동 모니터링 시스템 | Smart Cost Analytics</p>
      </footer>
    </div>
  );
}
