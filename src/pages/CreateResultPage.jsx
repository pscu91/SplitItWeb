import React, { useState, useRef, useMemo, useCallback } from 'react';
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

// ===== 유틸 함수 분리 =====
const calculateAmounts = (settlement) => {
  const { participants, deductionItems, amount } = settlement;
  if (!participants || !deductionItems) return [];
  const numParticipants = participants.length;
  let result = participants.map((p) => ({ ...p, finalAmount: 0 }));
  deductionItems.forEach((deductionItem) => {
    const nonExempt = participants.filter(
      (p) =>
        !(
          p.deductionsExemptFrom &&
          p.deductionsExemptFrom.some(
            (d) =>
              d.name === deductionItem.name && d.amount === deductionItem.amount
          )
        )
    );
    if (nonExempt.length > 0) {
      const share = deductionItem.amount / nonExempt.length;
      result = result.map((p) =>
        nonExempt.some((np) => np.name === p.name)
          ? { ...p, finalAmount: p.finalAmount + share }
          : p
      );
    }
  });
  const totalDeduction = deductionItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  let commonAmount = amount - totalDeduction;
  if (commonAmount < 0) commonAmount = 0;
  const baseCost = numParticipants > 0 ? commonAmount / numParticipants : 0;
  result = result.map((p) => ({ ...p, finalAmount: p.finalAmount + baseCost }));
  let sumAmounts = result.reduce((sum, p) => sum + p.finalAmount, 0);
  let diff = amount - Math.round(sumAmounts);
  for (let i = 0; i < Math.abs(diff); i++) {
    if (diff > 0) result[i].finalAmount += 1;
    else if (diff < 0) result[i].finalAmount -= 1;
  }
  return result.map((p) => ({
    ...p,
    finalAmount: Math.max(0, Math.round(p.finalAmount)),
  }));
};

const getParticipantExcludes = (allSettlements, name) =>
  allSettlements
    .map((settlement, idx) => {
      const p = settlement.participants.find((p) => p.name === name);
      if (!p) return { round: idx + 1, items: '불참' };
      if (!p.deductionsExemptFrom || p.deductionsExemptFrom.length === 0)
        return null;
      const items = p.deductionsExemptFrom.map((d) => d.name).join(', ');
      return { round: idx + 1, items };
    })
    .filter(Boolean);

const getParticipantTotal = (allSettlements, allNames, name) => {
  const perRound = allSettlements.map((settlement) => {
    const calculated = calculateAmounts(settlement);
    const found = calculated.find((p) => p.name === name);
    return found ? found.finalAmount : 0;
  });
  let total = perRound.reduce((a, b) => a + b, 0);
  if (name === allNames[0]) {
    const totalSum = allNames.reduce(
      (sum, n) => sum + getParticipantTotalRaw(allSettlements, n),
      0
    );
    const placeSum = allSettlements.reduce((sum, s) => sum + s.amount, 0);
    const diff = totalSum - placeSum;
    if (diff > 0 && diff <= 5) total -= diff;
  }
  return total;
};
const getParticipantTotalRaw = (allSettlements, name) =>
  allSettlements.reduce((sum, settlement) => {
    const calculated = calculateAmounts(settlement);
    const found = calculated.find((p) => p.name === name);
    return sum + (found ? found.finalAmount : 0);
  }, 0);

// ===== 소규모 컴포넌트 분리 =====
const AccountInfoBox = ({ accountInfo, isSharing, onCopy }) => (
  <div
    className={`mt-4 flex cursor-pointer items-center rounded-lg bg-[#F8F7F4] px-2 py-3 text-[#7C7C7C] transition-colors hover:text-[#4DB8A9] ${!isSharing ? 'justify-between' : 'justify-center'}`}
    onClick={onCopy}
  >
    <p className="h-fit w-fit text-center text-[10px]">{accountInfo}</p>
    {!isSharing && <FontAwesomeIcon icon={faCopy} className="h-auto w-3" />}
  </div>
);

const ParticipantBreakdown = ({
  allNames,
  allSettlements,
  getParticipantTotal,
  getParticipantExcludes,
  formatCurrency,
}) => (
  <div className="flex flex-col divide-y divide-dashed divide-[#AFAFAF]">
    {allNames.map((name) => (
      <div key={name} className="flex flex-col py-3">
        <div className="mx-1 flex items-center justify-between">
          <span className="text-[15px] text-[#202020]">{name}</span>
          <span className="flex items-end gap-1 text-[16px] font-bold text-[#202020]">
            <span className="pb-1 text-[12px]">₩</span>
            {formatCurrency(
              getParticipantTotal(allSettlements, allNames, name)
            )}
          </span>
        </div>
        {/* 제외 항목 */}
        {getParticipantExcludes(allSettlements, name).length > 0 && (
          <div className="ml-1 mt-1 flex flex-col gap-0.5">
            <span className="text-left text-[11px] text-[#7C7C7C] opacity-80">
              제외 항목
            </span>
            <ul className="ml-4 list-disc text-left text-[11px] text-[#7C7C7C]">
              {getParticipantExcludes(allSettlements, name).map((ex, i) => (
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
);

// ===== 메인 컴포넌트 =====
const CreateResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    settlements = [],
    title,
    participants,
    deductionItems,
  } = location.state || {};

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

  const [allSettlements, setAllSettlements] = useState(initialSettlements);
  const [accountInfo, setAccountInfoState] = useState(getAccountInfo());
  const [showAccountModal, setShowAccountModal] = useState(false);
  const receiptRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  // 모든 참여자 이름 집합 (useMemo로 최적화)
  const allNames = useMemo(
    () =>
      Array.from(
        new Set(
          allSettlements.flatMap((s) => s.participants.map((p) => p.name))
        )
      ),
    [allSettlements]
  );

  // 계좌 정보 등록 여부
  const isAccountRegistered =
    accountInfo &&
    accountInfo.trim() !== '' &&
    accountInfo !== '계좌 정보를 등록하세요.';

  // 핸들러 함수 useCallback 최적화
  const handleAddNextSettlement = useCallback(() => {
    const lastParticipants =
      allSettlements[allSettlements.length - 1]?.participants || [];
    navigate('/create', {
      state: {
        settlements: allSettlements,
        participants: lastParticipants,
      },
    });
  }, [allSettlements, navigate]);

  const handleCopyAccount = useCallback(() => {
    navigator.clipboard.writeText(accountInfo).then(() => {
      alert('계좌번호가 복사되었습니다.');
    });
  }, [accountInfo]);

  const handleEditAccountInfo = useCallback(() => {
    setShowAccountModal(true);
  }, []);

  const handleSaveAccountInfo = useCallback((newInfo) => {
    setAccountInfo(newInfo);
    setAccountInfoState(newInfo);
    setShowAccountModal(false);
  }, []);

  const handleCloseAccountModal = useCallback(() => {
    setShowAccountModal(false);
  }, []);

  // 영수증 공유
  const handleShareReceipt = useCallback(async () => {
    if (!receiptRef.current) {
      alert('영수증을 찾을 수 없습니다.');
      return;
    }
    setIsSharing(true);
    await new Promise((r) => setTimeout(r, 10));
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
    } finally {
      setIsSharing(false);
    }
  }, [receiptRef, accountInfo]);

  // 오늘 날짜
  const today = new Date();
  const issuedDate = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`;

  // 차수별 색상
  const roundColors = [
    'bg-[#FF9EAB]',
    'bg-[#B6E388]',
    'bg-[#A5C9FF]',
    'bg-[#FFD966]',
  ];

  return (
    <div className="flex flex-col bg-[#F8F7F4] sm:min-h-screen sm:p-4">
      {/* 헤더 */}
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
      {/* 영수증 본문 */}
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
                className="mx-1 flex items-center gap-1 text-[13px]"
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${roundColors[idx % roundColors.length]}`}
                ></span>
                <span>{settlement.title}</span>
                <span className="ml-auto flex gap-1 text-xs text-[#202020]">
                  <span className="mb-0.5 text-[10px]">₩</span>
                  {formatCurrency(settlement.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* 참여자별 breakdown */}
        <ParticipantBreakdown
          allNames={allNames}
          allSettlements={allSettlements}
          getParticipantTotal={getParticipantTotal}
          getParticipantExcludes={getParticipantExcludes}
          formatCurrency={formatCurrency}
        />
        {/* 하단 카피라이트 */}
        <div className="mt-2 flex w-full flex-col items-center text-[8px] tracking-[-.05em] text-[#7C7C7C]">
          <p>Created by Split it! WEB</p>
          <p>
            Copyright 2025. Whipping cream on citron tea. All right reserved.
          </p>
        </div>
        {/* 계좌번호 */}
        {isAccountRegistered && (
          <AccountInfoBox
            accountInfo={accountInfo}
            isSharing={isSharing}
            onCopy={handleCopyAccount}
          />
        )}
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
            {isAccountRegistered ? '계좌 정보 수정' : '계좌 정보 등록'}
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
