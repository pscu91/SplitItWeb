import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCopy } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../utils/format';
import {
  saveSettlement,
  getAccountInfo,
  setAccountInfo,
} from '../utils/storage';
import html2canvas from 'html2canvas';
import AccountModal from '../components/AccountModal';

const CreateResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 여러 차수의 정산 결과를 배열로 받음
  const {
    settlements = [],
    title,
    participants,
    deductionItems,
  } = location.state || {};

  // settlements가 없으면(최초 진입) 기존 단일 차수 데이터로 초기화
  const initialSettlements =
    settlements.length > 0
      ? settlements
      : title && participants && deductionItems
        ? [
            {
              title,
              participants,
              deductionItems,
              amount: parseInt(localStorage.getItem('fixedTotalAmount')) || 0,
            },
          ]
        : [];

  const [allSettlements, setAllSettlements] =
    React.useState(initialSettlements);
  const [accountInfo, setAccountInfo] = useState(getAccountInfo());
  const [showAccountModal, setShowAccountModal] = useState(false);
  const receiptRef = useRef(null);

  // 차수별 정산 결과 계산 함수
  const calculateAmounts = (settlement) => {
    const { participants, deductionItems, amount } = settlement;
    if (!participants || !deductionItems) return [];
    const numParticipants = participants.length;
    let result = participants.map((p) => ({ ...p, finalAmount: 0 }));
    deductionItems.forEach((deductionItem) => {
      const nonExemptParticipantsForThisItem = participants.filter(
        (p) =>
          !(
            p.deductionsExemptFrom &&
            p.deductionsExemptFrom.some(
              (d) =>
                d.name === deductionItem.name &&
                d.amount === deductionItem.amount
            )
          )
      );
      if (nonExemptParticipantsForThisItem.length > 0) {
        const sharePerNonExempt =
          deductionItem.amount / nonExemptParticipantsForThisItem.length;
        result = result.map((p) => {
          if (
            nonExemptParticipantsForThisItem.some((np) => np.name === p.name)
          ) {
            return { ...p, finalAmount: p.finalAmount + sharePerNonExempt };
          }
          return p;
        });
      }
    });
    const totalDeductionAmounts = deductionItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    let commonAmountToSplit = amount - totalDeductionAmounts;
    if (commonAmountToSplit < 0) {
      commonAmountToSplit = 0;
    }
    const baseCostPerPerson =
      numParticipants > 0 ? commonAmountToSplit / numParticipants : 0;
    result = result.map((p) => ({
      ...p,
      finalAmount: p.finalAmount + baseCostPerPerson,
    }));
    let sumOfCalculatedAmounts = result.reduce(
      (sum, p) => sum + p.finalAmount,
      0
    );
    let difference = amount - Math.round(sumOfCalculatedAmounts);
    for (let i = 0; i < Math.abs(difference); i++) {
      if (difference > 0) {
        result[i].finalAmount += 1;
      } else if (difference < 0) {
        result[i].finalAmount -= 1;
      }
    }
    result = result.map((p) => ({
      ...p,
      finalAmount: Math.max(0, Math.round(p.finalAmount)),
    }));
    return result;
  };

  // 차수 추가 버튼 클릭 시
  const handleAddNextSettlement = () => {
    const lastParticipants =
      allSettlements[allSettlements.length - 1]?.participants || [];
    navigate('/create', {
      state: {
        settlements: allSettlements,
        participants: lastParticipants,
      },
    });
  };

  // 계좌 복사, 계좌 수정 등 기존 함수 유지
  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountInfo).then(() => {
      alert('계좌번호가 복사되었습니다.');
    });
  };
  const handleEditAccountInfo = () => {
    setShowAccountModal(true);
  };
  const handleSaveAccountInfo = (newInfo) => {
    setAccountInfo(newInfo);
    setShowAccountModal(false);
  };
  const handleCloseAccountModal = () => {
    setShowAccountModal(false);
  };

  // 영수증 공유 함수 복원
  const handleShareReceipt = async () => {
    if (!receiptRef.current) {
      alert('영수증을 찾을 수 없습니다.');
      return;
    }
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const isDesktop = !isMobile;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 4,
        useCORS: true,
      });
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const filename = `splitit_receipt_${year}${month}${day}.png`;

      const image = canvas.toDataURL('image/png');
      console.log('canvas.toDataURL:', image.slice(0, 50));

      if (!image || image === 'data:,') {
        alert('이미지 생성에 실패했습니다. 새로고침 후 다시 시도해 주세요.');
        return;
      }

      if (isDesktop) {
        const link = document.createElement('a');
        link.href = image;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (navigator.share) {
        const imageBlob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
        const imageFile = new File([imageBlob], filename, {
          type: 'image/png',
        });
        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          try {
            await navigator.share({
              files: [imageFile],
              title: 'Split it! 정산 영수증',
              text: 'Split it! 앱에서 정산된 영수증입니다.',
            });
          } catch (error) {
            if (error.name !== 'AbortError') {
              alert('영수증 공유에 실패했습니다. 이미지를 저장합니다.');
              const image = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.href = image;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
        } else {
          const image = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = image;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      alert('영수증 이미지 생성에 실패했습니다.');
      console.error('html2canvas error:', error);
    }
  };

  // 오늘 날짜
  const today = new Date();
  const issuedDate = `${today.getFullYear()}년 ${String(
    today.getMonth() + 1
  ).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`;

  // 차수명 생성 함수
  const nthLabel = (n) => `${n + 1}차`;

  // 차수별 색상/아이콘 (간단 예시)
  const roundColors = [
    'bg-[#FF9EAB]', // 1차
    'bg-[#B6E388]', // 2차
    'bg-[#A5C9FF]', // 3차
    'bg-[#FFD966]', // 4차
  ];

  // 참여자별로 차수별 제외 항목을 정리
  const getParticipantExcludes = (name) => {
    return allSettlements
      .map((settlement, idx) => {
        const p = settlement.participants.find((p) => p.name === name);
        if (
          !p ||
          !p.deductionsExemptFrom ||
          p.deductionsExemptFrom.length === 0
        )
          return null;
        // 항목명(여러개) 리스트
        const items = p.deductionsExemptFrom.map((d) => d.name).join(', ');
        return { round: idx + 1, items };
      })
      .filter(Boolean);
  };

  // 참여자별 최종 금액 합산 (정산자 오차 보정 포함)
  const getParticipantTotal = (name) => {
    // 1. 각 차수별로 참여자별 금액 계산
    const perRound = allSettlements.map((settlement) => {
      const calculated = calculateAmounts(settlement);
      const found = calculated.find((p) => p.name === name);
      return found ? found.finalAmount : 0;
    });
    // 2. 전체 합계
    let total = perRound.reduce((a, b) => a + b, 0);
    // 3. 오차 보정: 전체 참여자 합계가 함께한 곳 합계보다 1~5원 초과 시, 정산자(첫 번째 참여자)가 손해를 보도록 조정
    if (name === allNames[0]) {
      const totalSum = allNames.reduce(
        (sum, n) => sum + getParticipantTotalRaw(n),
        0
      );
      const placeSum = allSettlements.reduce((sum, s) => sum + s.amount, 0);
      const diff = totalSum - placeSum;
      if (diff > 0 && diff <= 5) {
        total -= diff;
      }
    }
    return total;
  };
  // 참여자별 오차 보정 없는 합계(내부용)
  const getParticipantTotalRaw = (name) => {
    return allSettlements.reduce((sum, settlement) => {
      const calculated = calculateAmounts(settlement);
      const found = calculated.find((p) => p.name === name);
      return sum + (found ? found.finalAmount : 0);
    }, 0);
  };

  // 모든 참여자 이름 집합
  const allNames = Array.from(
    new Set(allSettlements.flatMap((s) => s.participants.map((p) => p.name)))
  );

  return (
    <div className="flex flex-col bg-[#F8F7F4] sm:min-h-screen sm:p-4">
      {/* 헤더: 닫기 버튼, 중앙 타이틀 */}
      <div
        className="relative mb-6 flex h-12 items-center justify-end"
        style={{ fontFamily: 'ONE-Mobile-Title, sans-serif' }}
      >
        <span className="absolute left-1/2 -translate-x-1/2 text-[21px] font-bold text-[#202020]">
          정산 결과
        </span>
        <button
          onClick={() => navigate('/')}
          className="flex h-10 w-10 items-center justify-center text-[#202020] active:bg-red-500"
        >
          <FontAwesomeIcon icon={faXmark} className="h-6 w-6" />
        </button>
      </div>
      {/* 헤더: 로고, 발급일 */}
      <div
        className="mx-auto w-full max-w-[330px] rounded-lg border border-[#7C7C7C] bg-white px-4 pb-4 pt-6 font-elice-digital-coding shadow"
        ref={receiptRef}
      >
        <div className="mb-4 flex flex-col items-center">
          <img
            className="mb-1 h-10 w-auto"
            src={import.meta.env.BASE_URL + 'assets/icons/logo_black.png'}
            alt="logo"
          />
          <span className="text-xs text-[#7C7C7C]">발급일: {issuedDate}</span>
        </div>
        {/* 함께한 곳 */}
        <div className="flex flex-col items-start border-b border-dashed border-[#AFAFAF] pb-2">
          <span className="mb-2 text-[13px] text-[#202020]">함께한 곳</span>
          <div className="flex w-full flex-col justify-between gap-1">
            {allSettlements.map((settlement, idx) => (
              <div
                key={idx}
                className="mx-1 flex items-center gap-2 text-[13px]"
              >
                <span
                  className={`inline-block h-3 w-3 rounded-full ${roundColors[idx % roundColors.length]}`}
                ></span>
                <span>{settlement.title}</span>
                <span className="ml-auto flex items-end gap-1 text-xs text-[#202020]">
                  <span className="mb-0.5 text-[10px]">₩</span>
                  {formatCurrency(settlement.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* 참여자별 금액/제외항목 */}
        <div className="flex flex-col divide-y divide-dashed divide-[#AFAFAF]">
          {allNames.map((name, idx) => (
            <div key={name} className="flex flex-col py-3">
              <div className="mx-1 flex items-center justify-between">
                <span className="text-[15px] text-[#202020]">{name}</span>
                <span className="flex items-end gap-1 text-[16px] font-bold text-[#202020]">
                  <span className="pb-1 text-[12px]">₩</span>
                  {formatCurrency(getParticipantTotal(name))}
                </span>
              </div>
              {/* 제외 항목 */}
              {getParticipantExcludes(name).length > 0 && (
                <div className="ml-1 mt-1 flex flex-col gap-0.5">
                  <span className="text-left text-[11px] text-[#7C7C7C] opacity-80">
                    제외 항목
                  </span>
                  <ul className="ml-4 list-disc text-left text-[11px] text-[#7C7C7C]">
                    {getParticipantExcludes(name).map((ex, i) => (
                      <li key={i}>
                        {ex.round}차 [{ex.items}]
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* 하단 카피라이트 */}
        <div className="mt-2 flex w-full flex-col items-center text-[8px] tracking-[-.05em] text-[#7C7C7C]">
          <p>Created by Split it! WEB</p>
          <p>
            Copyright 2025. Whipping cream on citron tea. All right reserved.
          </p>
        </div>
        {/* 계좌번호 */}
        <div
          className="mt-4 flex cursor-pointer items-center justify-between rounded-lg bg-[#F8F7F4] px-2 py-3 text-[#7C7C7C] transition-colors hover:text-[#4DB8A9]"
          onClick={handleCopyAccount}
        >
          <p className="h-fit text-[10px]">{accountInfo}</p>
          <FontAwesomeIcon icon={faCopy} className="h-auto w-3" />
        </div>
      </div>
      {/* 하단 버튼/카피라이트 */}
      <div className="mx-auto mt-6 flex w-full max-w-[330px] flex-col gap-4">
        <button
          onClick={handleShareReceipt}
          className="h-12 w-full rounded-2xl border border-[#202020] bg-[#4DB8A9] text-base font-bold text-white shadow shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-2 active:bg-[#3ca393] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
        >
          영수증 공유하기
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleAddNextSettlement}
            className="flex-1 rounded-lg border border-[#202020] bg-white py-2 text-base font-bold text-[#202020] shadow shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-2 active:bg-[#4DB8A9] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
          >
            + {allSettlements.length + 1}차 추가
          </button>
          <button
            onClick={handleEditAccountInfo}
            className="flex-1 rounded-lg border border-[#202020] bg-[#343434] py-2 text-base font-bold text-[#F1F1F1] shadow shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] transition hover:bg-[#222] active:translate-y-2 active:bg-gray-900 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
          >
            계좌 정보 수정
          </button>
        </div>
      </div>
      {showAccountModal && (
        <AccountModal
          show={showAccountModal}
          onClose={handleCloseAccountModal}
          onSave={handleSaveAccountInfo}
          initialAccountInfo={accountInfo}
        />
      )}
    </div>
  );
};

export default CreateResultPage;
