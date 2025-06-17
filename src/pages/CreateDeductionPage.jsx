import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../utils/format';
import DeductionModal from '../components/DeductionModal';

const CreateDeductionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { title, participants } = location.state || {};
  const amount = parseInt(localStorage.getItem('fixedTotalAmount')) || 0;

  // participants가 없으면 홈으로 이동 (뒤로가기 등 비정상 진입 방지)
  React.useEffect(() => {
    if (!participants || !Array.isArray(participants)) {
      navigate('/');
    }
  }, [participants, navigate]);

  const [deductionItems, setDeductionItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 컴포넌트가 마운트될 때 로컬 스토리지에서 deductionItems 불러오기
  useEffect(() => {
    const storedItems =
      JSON.parse(localStorage.getItem('deductionItems')) || [];
    setDeductionItems(storedItems);
  }, []);

  const addDeductionItem = (item) => {
    const updatedItems = [...deductionItems, item];
    setDeductionItems(updatedItems);
    localStorage.setItem('deductionItems', JSON.stringify(updatedItems)); // 로컬 스토리지에 저장
    setIsModalOpen(false);
  };

  const removeDeductionItem = (index) => {
    const updatedItems = deductionItems.filter((_, i) => i !== index);
    setDeductionItems(updatedItems);
    localStorage.setItem('deductionItems', JSON.stringify(updatedItems)); // 로컬 스토리지에 저장
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!participants || !Array.isArray(participants)) return;

    // Create a new array for participants with their specific deduction items
    const participantsWithDeductions = participants.map(
      (participant, participantIndex) => {
        const specificDeductionItems = deductionItems
          .filter((item) => item.selectedParticipants[participantIndex])
          .map((item) => ({ name: item.name, amount: item.amount })); // Store name and amount

        return {
          ...participant,
          // The 'amount: -1' flag is no longer needed in this new logic as finalAmount will be calculated directly
          // The old deductionItems array for display in CreateResultPage will now be filtered based on 'deductionsExemptFrom'
          deductionsExemptFrom: specificDeductionItems, // New property for calculation logic
          deductionItems: specificDeductionItems.map((d) => d.name), // For display in CreateResultPage
        };
      }
    );

    navigate('/create/result', {
      state: {
        title,
        amount, // 고정된 총액 전달
        participants: participantsWithDeductions, // Pass the updated participants
        deductionItems, // Still pass all deduction items for global context if needed in CreateResultPage
      },
    });
  };

  // participants가 없으면 렌더링하지 않음
  if (!participants || !Array.isArray(participants)) return null;

  return (
    <div
      className="flex flex-col bg-[#F8F7F4] sm:min-h-screen sm:p-4"
      style={{ fontFamily: 'ONE-Mobile, sans-serif' }}
    >
      <header className="mb-6 flex items-center justify-between font-['ONE-Mobile-Title']">
        <FontAwesomeIcon
          onClick={() =>
            navigate('/create/participants', {
              state: { title, amount, participants, deductionItems },
            })
          }
          icon={faChevronLeft}
          className="h-6 w-6 cursor-pointer p-2 text-black active:text-blue-500 lg:hover:text-blue-500"
        />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-gray-800">
          따로 정산
        </h1>
        <button onClick={handleSubmit} className="text-[#4DB8A9]">
          다음
        </button>
      </header>

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

        {deductionItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-[#7C7C7C]">
            <span className="text-[15px]">
              우측 상단의 '항목 추가' 버튼을 탭하여
            </span>
            <span className="text-[15px]">제외 항목과 멤버를 추가하세요.</span>
          </div>
        )}

        {deductionItems.length > 0 && (
          <div className="flex flex-col gap-3">
            {deductionItems.map((item, index) => (
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
                      onClick={() => removeDeductionItem(index)}
                      className="h-5 w-5 cursor-pointer text-gray-400 hover:text-red-500"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs text-[#7C7C7C]">
                    계산 제외할 사람
                  </span>
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
        )}
      </div>

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
