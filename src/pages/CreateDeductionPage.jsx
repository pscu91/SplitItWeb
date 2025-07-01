import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../utils/format';
import DeductionModal from '../components/DeductionModal';

// 헤더 컴포넌트 분리
const PageHeader = ({ onBack, onNext }) => (
  <header className="mb-6 flex items-center justify-between font-['ONE-Mobile-Title']">
    <FontAwesomeIcon
      onClick={onBack}
      icon={faChevronLeft}
      className="h-6 w-6 cursor-pointer p-2 text-black active:text-blue-500 lg:hover:text-blue-500"
    />
    <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-gray-800">
      따로 정산
    </h1>
    <button onClick={onNext} className="text-[#4DB8A9]">
      다음
    </button>
  </header>
);

// 제외항목 리스트 컴포넌트 분리
const DeductionList = ({ items, participants, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-[#7C7C7C]">
        <span className="text-[15px]">
          우측 상단의 '항목 추가' 버튼을 탭하여
        </span>
        <span className="text-[15px]">제외 항목과 멤버를 추가하세요.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-lg border border-[#D3D3D3] bg-[#F8F7F4] px-4 py-3"
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-base text-[#202020]">{item.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-base text-[#202020]">
                {formatCurrency(item.amount)}원
              </span>
              <FontAwesomeIcon
                icon={faXmark}
                onClick={() => onRemove(index)}
                className="h-5 w-5 cursor-pointer text-gray-400 hover:text-red-500"
              />
            </div>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="text-xs text-[#7C7C7C]">계산 제외할 사람</span>
            <div className="flex flex-wrap gap-1">
              {item.selectedParticipants && participants
                ? item.selectedParticipants
                    .map((selected, i) =>
                      selected && participants[i] ? (
                        <span
                          key={i}
                          className="rounded-full bg-[#7C7C7C] px-2 py-0.5 text-xs text-white"
                        >
                          {participants[i].name}
                        </span>
                      ) : null
                    )
                    .filter(Boolean)
                : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CreateDeductionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    settlements = [],
    title,
    amount,
    participants,
  } = location.state || {};

  useEffect(() => {
    if (!participants || !Array.isArray(participants)) {
      navigate('/');
    }
  }, [participants, navigate]);

  const [deductionItems, setDeductionItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setDeductionItems([]);
  }, [title, amount, participants]);

  const addDeductionItem = useCallback(
    (item) => {
      const updatedItems = [...deductionItems, item];
      setDeductionItems(updatedItems);
      localStorage.setItem('deductionItems', JSON.stringify(updatedItems));
      setIsModalOpen(false);
    },
    [deductionItems]
  );

  const removeDeductionItem = useCallback(
    (index) => {
      const updatedItems = deductionItems.filter((_, i) => i !== index);
      setDeductionItems(updatedItems);
      localStorage.setItem('deductionItems', JSON.stringify(updatedItems));
    },
    [deductionItems]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!participants || !Array.isArray(participants)) return;
      const participantsWithDeductions = participants.map(
        (participant, participantIndex) => {
          const specificDeductionItems = deductionItems
            .filter((item) => item.selectedParticipants[participantIndex])
            .map((item) => ({ name: item.name, amount: item.amount }));
          return {
            ...participant,
            deductionsExemptFrom: specificDeductionItems,
            deductionItems: specificDeductionItems.map((d) => d.name),
          };
        }
      );
      const newSettlement = {
        title,
        amount,
        participants: participantsWithDeductions,
        deductionItems,
      };
      navigate('/create/result', {
        state: {
          settlements: [...settlements, newSettlement],
        },
      });
    },
    [participants, deductionItems, title, amount, settlements, navigate]
  );

  const handleBack = useCallback(() => {
    navigate('/create/participants', {
      state: { title, amount, participants, deductionItems },
    });
  }, [navigate, title, amount, participants, deductionItems]);

  if (!participants || !Array.isArray(participants)) return null;

  return (
    <div
      className="flex flex-col bg-[#F8F7F4] sm:min-h-screen sm:p-4"
      style={{ fontFamily: 'ONE-Mobile, sans-serif' }}
    >
      <form onSubmit={handleSubmit}>
        <PageHeader onBack={handleBack} onNext={handleSubmit} />
        <div className="mx-auto flex w-full flex-col rounded-xl bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[21px] text-[#202020]">제외 항목</span>
              <span className="text-[15px] text-[#7C7C7C]">
                | {deductionItems.length}건
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg border border-[#202020] bg-[#4DB8A9] px-5 py-1 text-xs font-bold text-white shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:bg-[#3ca393] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] lg:hover:bg-[#3ca393]"
            >
              항목 추가
            </button>
          </div>
          <DeductionList
            items={deductionItems}
            participants={participants}
            onRemove={removeDeductionItem}
          />
        </div>
      </form>
      {isModalOpen && (
        <DeductionModal
          onClose={() => setIsModalOpen(false)}
          onAdd={addDeductionItem}
          participants={participants}
          totalAmount={amount}
        />
      )}
    </div>
  );
};

export default CreateDeductionPage;
