import React, { useState, useEffect } from 'react';

const DeductionModal = ({ onClose, onAdd, participants, totalAmount }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState(
    participants.map(() => false)
  );

  const formatNumberWithCommas = (num) => {
    if (num === '' || isNaN(num)) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const isAddButtonDisabled =
    name.trim() === '' ||
    amount === '' ||
    isNaN(parseInt(amount)) ||
    parseInt(amount) === 0 ||
    (totalAmount !== undefined && parseInt(amount) > totalAmount);

  const handleAdd = () => {
    const item = {
      name,
      amount: parseInt(amount) || 0,
      selectedParticipants,
    };
    onAdd(item);
    setName('');
    setAmount('');
    setSelectedParticipants(participants.map(() => false));
  };

  const handleParticipantSelect = (index) => {
    const newSelection = [...selectedParticipants];
    newSelection[index] = !newSelection[index];
    setSelectedParticipants(newSelection);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-4/5 rounded-2xl border border-[#202020] bg-[#F8F7F4] p-0 shadow-lg sm:w-[380px]">
        {/* 상단 타이틀/닫기 */}
        <div className="relative mb-4 flex items-center justify-between px-4 pb-2 pt-6 font-['ONE-Mobile-Title']">
          <span className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-gray-800">
            제외 항목
          </span>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-base font-bold transition-colors active:bg-transparent active:text-red-400"
          >
            취소
          </button>
          <button
            onClick={handleAdd}
            disabled={isAddButtonDisabled}
            className={`rounded px-2 py-1 text-base font-bold transition ${isAddButtonDisabled ? 'cursor-not-allowed text-gray-400' : 'text-[#4DB8A9]'}`}
          >
            추가
          </button>
        </div>
        {/* 입력 영역 */}
        <div className="flex h-fit max-h-[70vh] flex-col gap-4 overflow-scroll px-6 pb-6">
          {/* 항목 이름 */}
          <div className="flex flex-col items-start gap-1">
            <span className="pl-2 font-['ONE-Mobile-Title'] text-base font-bold text-[#202020]">
              어떤 항목인가요?
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 술값 등"
              className="!important w-full rounded-lg border border-[#D3D3D3] bg-white px-4 py-3 text-base text-[#202020] placeholder:text-[#7C7C7C] focus:border-[#4db8a9] focus:outline-none focus:ring-[#4db8a9]"
              maxLength={20}
            />
          </div>
          {/* 금액 입력 */}
          <div className="flex flex-col items-start gap-1">
            <span className="pl-2 font-['ONE-Mobile-Title'] text-base font-bold text-[#202020]">
              해당 항목은 총 얼마였나요?
            </span>
            <div className="relative flex w-full items-center">
              <span className="absolute left-4 text-base text-[#7C7C7C]">
                ₩
              </span>
              <input
                type="text"
                value={formatNumberWithCommas(amount)}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/,/g, '');
                  setAmount(rawValue === '' ? '' : parseInt(rawValue));
                }}
                placeholder="여기에 금액을 입력..."
                className="!important w-full rounded-lg border border-[#D3D3D3] bg-white py-3 pl-10 pr-4 text-right font-['SF_Pro'] text-base text-[#202020] placeholder:text-[#7C7C7C] focus:border-[#4db8a9] focus:outline-none focus:ring-[#4db8a9]"
                min={0}
              />
            </div>
          </div>
          {/* 참여자 선택 */}
          <div className="flex w-full flex-col items-start gap-2">
            <span className="pl-2 text-base font-bold text-[#202020]">
              제외할 멤버를 선택하세요
            </span>
            <div className="flex w-full flex-col gap-1 rounded-lg bg-gray-200 p-2">
              {participants.map((participant, index) => {
                const selected = selectedParticipants[index];
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleParticipantSelect(index)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 font-['ONE-Mobile-Title'] text-[16px] shadow-sm transition ${selected ? 'border-[#202020] bg-[#4DB8A9] text-white' : 'border-[#E5E4E0] bg-white text-[#202020]'}`}
                  >
                    <span
                      className={`text-[16px] ${selected ? 'text-white' : 'text-[#202020]'}`}
                    >
                      {participant.name}
                    </span>
                    {selected ? (
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="h-5 w-5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeductionModal;
