import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { formatNumber } from '../utils/format';

const CreateSettlementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { title: initialTitle, amount: initialAmount } = location.state || {};

  const [title, setTitle] = useState(initialTitle || '');
  const [amount, setAmount] = useState(() => {
    // 이미 저장된 총액이 있으면 그것을 사용
    const savedAmount = localStorage.getItem('fixedTotalAmount');
    if (savedAmount) {
      return savedAmount;
    }
    // 없으면 초기값 사용
    return initialAmount || '';
  });
  const amountInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount === '0') return; // 0 또는 빈 값이면 진행 불가
    localStorage.setItem('fixedTotalAmount', amount);
    navigate('/create/participants', {
      state: {
        title,
        amount,
      },
    });
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  const handleAmountFocus = () => {
    if (!amount) {
      setAmount('0');
      // 다음 렌더링 사이클에서 선택을 수행하기 위해 setTimeout 사용
      setTimeout(() => {
        amountInputRef.current.select();
      }, 0);
    }
  };

  const handleBack = () => {
    // 모든 임시 데이터 초기화
    localStorage.removeItem('deductionItems');
    localStorage.removeItem('fixedTotalAmount');
    localStorage.removeItem('calculatedResult');
    navigate('/');
  };

  // 금액이 0 또는 빈 값이면 다음 버튼 비활성화
  const isNextDisabled = !amount || amount === '0';

  return (
    <div
      className="flex flex-col bg-[#F8F7F4] sm:min-h-screen sm:p-4"
      style={{ fontFamily: 'ONE-Mobile-Title, sans-serif' }}
    >
      <form onSubmit={handleSubmit}>
        <header className="mb-6 flex items-center justify-between">
          <FontAwesomeIcon
            onClick={handleBack}
            icon={faChevronLeft}
            className="h-6 w-6 cursor-pointer p-2 text-black active:text-blue-500 lg:hover:text-blue-500"
          />
          <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-gray-800">
            새 정산 만들기
          </h1>
          <button
            type="submit"
            className={`text-[#4DB8A9] active:bg-transparent active:text-[#399e8a] ${isNextDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
            disabled={isNextDisabled}
          >
            다음
          </button>
        </header>

        <div className="flex flex-col items-center">
          <div className="flex w-full flex-col gap-6 rounded-xl bg-white p-6 shadow">
            <div className="flex flex-col items-start gap-2">
              <span className="font-['ONE_Mobile'] text-lg font-bold text-[#202020]">
                어디에 돈을 쓰셨나요?
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[#202020] bg-[#F8F7F4] px-4 py-3 font-['SF_Pro'] text-base text-[#202020] placeholder:text-[#7C7C7C] focus:outline-none"
                placeholder="예: 중국집, 고깃집 ..."
                required
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="font-['ONE_Mobile'] text-lg font-bold text-[#D3D3D3]">
                총 얼마를 사용하셨나요?
              </span>
              <div className="relative flex w-full items-center">
                <span className="absolute left-4 font-['SF_Pro'] text-base text-[#D3D3D3]">
                  ₩
                </span>
                <input
                  ref={amountInputRef}
                  type="text"
                  value={formatNumber(amount)}
                  onChange={handleAmountChange}
                  onFocus={handleAmountFocus}
                  className="w-full rounded-lg border border-[#D3D3D3] bg-[#F8F7F4] py-3 pl-10 pr-4 text-right font-['SF_Pro'] text-base text-[#202020] placeholder:text-[#7C7C7C] focus:outline-none"
                  placeholder="금액을 입력하세요"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateSettlementPage;
