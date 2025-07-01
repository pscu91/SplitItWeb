import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { getSettlements } from '../utils/storage';
import guide01 from '/assets/guide01.png';
import guide02 from '/assets/guide02.png';

// 도움말 모달 컴포넌트 분리
const GuideModal = ({ show, onClose }) => {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F7F450]"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-[100vw] max-w-3xl overflow-y-auto rounded-xl bg-[#F8F7F4]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#4DB8A9] p-2 text-lg font-bold text-[#fff] active:bg-[#399e8a]"
          onClick={onClose}
        >
          <span aria-label="닫기">×</span>
        </button>
        <div className="mt-6 flex flex-col items-center">
          <p className="my-2 text-xl">채원이는 정산이 필요해!</p>
          <img src={guide01} alt="가이드1" className="w-full rounded-lg" />
          <img src={guide02} alt="가이드2" className="w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState([]);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    localStorage.removeItem('flowParticipants');
    const loadSettlements = () => setSettlements(getSettlements());
    loadSettlements();
    window.addEventListener('focus', loadSettlements);
    return () => window.removeEventListener('focus', loadSettlements);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showGuide ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showGuide]);

  // 도움말 모달 열기/닫기 핸들러
  const handleOpenGuide = useCallback(() => setShowGuide(true), []);
  const handleCloseGuide = useCallback(() => setShowGuide(false), []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isSettlementComplete = (settlement) => {
    const amountPerPerson = Math.floor(
      settlement.amount / settlement.participants.length
    );
    const totalPaidAmount = settlement.participants.reduce(
      (sum, participant) => {
        if (participant.paid) {
          return sum + amountPerPerson;
        }
        return sum;
      },
      0
    );
    const remainingAmount =
      settlement.amount - amountPerPerson - totalPaidAmount;
    return remainingAmount === 0;
  };

  return (
    <div
      className="flex flex-col items-center justify-center bg-[#F8F7F4] sm:min-h-screen sm:p-4 sm:pb-32"
      style={{ fontFamily: 'ONE-Mobile-Title, sans-serif' }}
    >
      {/* 상단 일러스트와 타이틀 */}
      <div className="mb-8 mt-10 flex w-full flex-col items-center">
        <img
          src={import.meta.env.BASE_URL + 'assets/icons/logo.svg'}
          alt="app title"
          className="mb-4"
        />
        <h1 className="mb-8 text-[21px] font-bold text-[#111111]">
          더 쉽고 편한 정산
        </h1>
        <img
          src={import.meta.env.BASE_URL + 'assets/icons/home_illustration.svg'}
          alt="정산 일러스트"
          className="mb-4"
        />
      </div>

      <div className="flex w-full max-w-md items-center justify-center space-x-4">
        <button
          className="flex h-20 w-fit items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-12 py-3 text-lg font-semibold text-white shadow-[0px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-2 active:bg-gray-100 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
          onClick={() => alert('준비중인 기능입니다.')}
        >
          <img
            src={import.meta.env.BASE_URL + 'assets/icons/icon_user.svg'}
            alt="user icon"
          />
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('deductionItems');
            localStorage.removeItem('fixedTotalAmount');
            localStorage.removeItem('calculatedResult');
            navigate('/create');
          }}
          className="active:bg-[rgb(57,158,138) flex h-20 w-fit items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#4DB8A9] px-12 py-3 text-lg font-semibold text-white shadow-[0px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-2 active:bg-[#399e8a] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
        >
          <img
            src={import.meta.env.BASE_URL + 'assets/icons/icon_start.svg'}
            alt="start"
          />
        </button>
      </div>

      {/* 하단 도움말 버튼 */}
      <button
        className="mt-16 rounded-none border-0 border-b-4 border-[#4db8aa] bg-transparent p-0 text-base font-bold shadow-none"
        onClick={handleOpenGuide}
      >
        <p>어떤 때에 사용하나요?</p>
      </button>

      {/* 도움말 모달 */}
      <GuideModal show={showGuide} onClose={handleCloseGuide} />
    </div>
  );
};

export default HomePage;
