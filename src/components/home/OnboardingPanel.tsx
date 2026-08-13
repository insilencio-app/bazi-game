import React from 'react';

interface OnboardingPanelProps {
  onStart: () => void;
  onSkip?: () => void;
}

export const OnboardingPanel: React.FC<OnboardingPanelProps> = ({ onStart, onSkip }) => {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-4 mb-4">
        <img src="/bazi_logo.jpg" alt="輕鬆學八字標誌" className="h-16 w-16 rounded-lg object-cover border" />
        <div>
          <h1 className="text-2xl font-bold">歡迎使用 輕鬆學八字</h1>
          <p className="text-sm text-gray-600">適合對象：好奇的初學者 • 約 8 分鐘完成第0課</p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">第0課目標</h2>
        <ul className="list-disc list-inside text-gray-700 mt-2">
          <li>辨認四柱（年 / 月 / 日 / 時）並找到日元（日主）</li>
          <li>以範例示範判讀順序與思考步驟</li>
          <li>完成兩題檢核題以確認理解</li>
        </ul>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <strong>教學取向：</strong> 以教育為主，示範不同傳統詮釋之差異，非診斷或預測工具。
      </div>

      <div className="flex gap-3">
        <button
          onClick={onStart}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          開始第 0 課 — 約 8 分鐘
        </button>
        <button onClick={onSkip} className="px-4 py-2 border rounded-lg">暫不開始</button>
      </div>
    </div>
  );
};

export default OnboardingPanel;
