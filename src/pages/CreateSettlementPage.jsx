import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { formatNumber } from '../utils/format';

// 헤더 컴포넌트 분리
const PageHeader = ({ onBack, title, isNextDisabled }) => (
  <header
    className="mb-6 flex items-center justify-between"
    style={{ fontFamily: 'ONE-Mobile-Title, sans-serif' }}
  >
    <FontAwesomeIcon
      onClick={onBack}
      icon={faChevronLeft}
      className="h-6 w-6 cursor-pointer p-2 text-black active:text-blue-500 lg:hover:text-blue-500"
    />
    <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-gray-800">
      {title}
    </h1>
    <button
      type="submit"
      className={`text-[#4DB8A9] active:bg-[#4DB8A9] active:text-white ${isNextDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
      disabled={isNextDisabled}
    >
      다음
    </button>
  </header>
);

const CreateSettlementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    settlements = [],
    title: initialTitle,
    amount: initialAmount,
    participants: prevParticipants,
  } = location.state || {};

  const isNth = settlements.length > 0;
  const nthLabel = isNth
    ? `${settlements.length + 1}차 정산 만들기`
    : '새 정산 만들기';

  const [title, setTitle] = useState(isNth ? '' : initialTitle || '');
  const [amount, setAmount] = useState(() => {
    if (isNth) return '';
    const savedAmount = localStorage.getItem('fixedTotalAmount');
    if (savedAmount) return savedAmount;
    return initialAmount || '';
  });
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const amountInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const lastFocusedInputRef = useRef(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      lastFocusedInputRef.current = titleInputRef.current;
    }
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!amount || amount === '0') return;
      localStorage.setItem('fixedTotalAmount', amount);
      navigate('/create/participants', {
        state: {
          settlements,
          title,
          amount,
          participants: prevParticipants,
        },
      });
    },
    [amount, navigate, settlements, title, prevParticipants]
  );

  const handleAmountChange = useCallback((e) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  }, []);

  const handleAmountFocus = useCallback(() => {
    if (!amount) {
      setAmount('0');
      setTimeout(() => {
        amountInputRef.current.select();
      }, 0);
    } else {
      setTimeout(() => {
        amountInputRef.current.select();
      }, 0);
    }
    lastFocusedInputRef.current = amountInputRef.current;
  }, [amount]);

  const handleBack = useCallback(() => {
    if (isNth) {
      navigate('/create/result', { state: { settlements } });
    } else {
      localStorage.removeItem('deductionItems');
      localStorage.removeItem('fixedTotalAmount');
      localStorage.removeItem('calculatedResult');
      navigate('/');
    }
  }, [isNth, navigate, settlements]);

  const isNextDisabled = !amount || amount === '0';

  return (
    <div className="flex flex-col bg-[#F8F7F4] sm:min-h-screen sm:p-4">
      <form onSubmit={handleSubmit}>
        <PageHeader
          onBack={handleBack}
          title={nthLabel}
          isNextDisabled={isNextDisabled}
        />
        <div className="flex flex-col items-center">
          <div
            className="flex w-full flex-col gap-6 rounded-xl bg-white p-6 shadow"
            onBlur={(e) => {
              if (
                !e.currentTarget.contains(e.relatedTarget) &&
                lastFocusedInputRef.current
              ) {
                setTimeout(() => {
                  if (document.activeElement !== lastFocusedInputRef.current) {
                    lastFocusedInputRef.current.focus();
                  }
                }, 0);
              }
            }}
          >
            <div className="flex flex-col items-start gap-2">
              <span
                className={`text-lg font-bold ${isTitleFocused ? 'text-[#202020]' : 'text-[#D3D3D3]'}`}
              >
                어디에 돈을 쓰셨나요?
              </span>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => {
                  setIsTitleFocused(true);
                  if (titleInputRef.current) {
                    titleInputRef.current.select();
                    lastFocusedInputRef.current = titleInputRef.current;
                  }
                }}
                onBlur={() => setIsTitleFocused(false)}
                className={`w-full rounded-lg border border-[#D3D3D3] bg-[#F8F7F4] px-4 py-3 text-base focus:border-[#4DB8A9] focus:outline-none focus:ring-[#4DB8A9] ${isTitleFocused ? 'text-[#202020] placeholder:text-[#7C7C7C]' : 'text-[#D3D3D3] placeholder:text-[#D3D3D3]'}`}
                placeholder="예: 중국집, 고깃집 ..."
                required
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <span
                className={`text-lg font-bold ${isAmountFocused ? 'text-[#202020]' : 'text-[#D3D3D3]'}`}
              >
                총 얼마를 사용하셨나요?
              </span>
              <div className="relative flex w-full items-center">
                <span
                  className={`absolute left-4 text-base ${isAmountFocused ? 'text-[#202020]' : 'text-[#D3D3D3]'}`}
                >
                  ₩
                </span>
                <input
                  ref={amountInputRef}
                  type="text"
                  value={formatNumber(amount)}
                  onChange={handleAmountChange}
                  onFocus={() => {
                    handleAmountFocus();
                    setIsAmountFocused(true);
                  }}
                  onBlur={() => setIsAmountFocused(false)}
                  className={`w-full rounded-lg border border-[#D3D3D3] bg-[#F8F7F4] py-3 pl-10 pr-4 text-right font-['SF_Pro'] text-base focus:border-[#4DB8A9] focus:outline-none focus:ring-[#4DB8A9] ${isAmountFocused ? 'text-[#202020] placeholder:text-[#7C7C7C]' : 'text-[#D3D3D3] placeholder:text-[#D3D3D3]'}`}
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
