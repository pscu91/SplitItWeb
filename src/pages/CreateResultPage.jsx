import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCopy } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../utils/format';
import { saveSettlement } from '../utils/storage';
import html2canvas from 'html2canvas';
import AccountModal from '../components/AccountModal';

const CreateResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { title, participants, deductionItems } = location.state || {};

  // 총액은 항상 localStorage에서만 읽음
  const fixedTotalAmount =
    parseInt(localStorage.getItem('fixedTotalAmount')) || 0;

  // 계산된 결과를 저장할 상태
  const [calculatedParticipants, setCalculatedParticipants] = React.useState(
    () => {
      const savedResult = localStorage.getItem('calculatedResult');
      if (savedResult) {
        return JSON.parse(savedResult);
      }
      return null;
    }
  );

  const [accountInfo, setAccountInfo] = useState(
    'XX은행 000-0000-000000 홍길동'
  );
  const [showAccountModal, setShowAccountModal] = useState(false);

  const receiptRef = useRef(null);

  const calculateAmounts = () => {
    if (calculatedParticipants) {
      return calculatedParticipants;
    }

    const numParticipants = participants.length;

    // 1. 각 참여자의 최종 금액을 0으로 초기화합니다.
    let result = participants.map((p) => ({ ...p, finalAmount: 0 }));

    // 2. 각 제외 항목의 비용을 해당 항목에서 면제되지 않은 참여자들에게 분배합니다.
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

    // 3. 모든 제외 항목의 총합을 계산합니다.
    const totalDeductionAmounts = deductionItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // 4. 전체 총액에서 모든 제외 항목의 총합을 뺀 "나머지 공통 금액"을 계산합니다.
    let commonAmountToSplit = fixedTotalAmount - totalDeductionAmounts;

    // 공통 금액이 음수가 되는 경우 (제외 항목의 합이 총액보다 큰 경우)를 처리합니다.
    // 이 경우, 기본 분배 금액은 0으로 하고, 초과된 제외 항목 금액은 해당 항목에서 제외되지 않은 사람들이 부담합니다.
    if (commonAmountToSplit < 0) {
      commonAmountToSplit = 0;
      // 이 시나리오는 입력 데이터의 논리적 불일치를 나타낼 수 있으므로,
      // 실제 애플리케이션에서는 사용자에게 경고를 주거나 총액 재설정을 유도할 수 있습니다.
    }

    // 5. 이 "나머지 공통 금액"을 모든 참여자에게 공평하게 분배합니다.
    const baseCostPerPerson =
      numParticipants > 0 ? commonAmountToSplit / numParticipants : 0;

    result = result.map((p) => ({
      ...p,
      finalAmount: p.finalAmount + baseCostPerPerson,
    }));

    // 6. 최종적으로 반올림 오차를 보정하여 합이 fixedTotalAmount와 일치하도록 조정합니다.
    let sumOfCalculatedAmounts = result.reduce(
      (sum, p) => sum + p.finalAmount,
      0
    );
    let difference = fixedTotalAmount - Math.round(sumOfCalculatedAmounts);

    for (let i = 0; i < Math.abs(difference); i++) {
      if (difference > 0) {
        result[i].finalAmount += 1;
      } else if (difference < 0) {
        result[i].finalAmount -= 1;
      }
    }

    // 최종 금액을 정수로 반올림하고 음수가 되지 않도록 보장합니다.
    result = result.map((p) => ({
      ...p,
      finalAmount: Math.max(0, Math.round(p.finalAmount)),
    }));

    localStorage.setItem('calculatedResult', JSON.stringify(result));
    setCalculatedParticipants(result);
    return result;
  };

  const updatedParticipants = calculateAmounts();

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

  const handleShareReceipt = async () => {
    if (!receiptRef.current) {
      alert('영수증을 찾을 수 없습니다.');
      return;
    }

    // User Agent를 기반으로 모바일 장치 여부 확인
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

      // 데스크탑 브라우저일 경우 항상 이미지를 다운로드합니다.
      // 그렇지 않으면 Web Share API가 지원되는 경우 공유를 시도하고, 아니면 다운로드로 대체합니다.
      if (isDesktop) {
        console.log('데스크탑 브라우저 감지, 이미지 다운로드로 대체합니다.');
        const image = canvas.toDataURL('image/png');
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
            console.log('Receipt shared successfully');
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log('Share cancelled by user');
            } else {
              console.error('Web Share API를 통한 영수증 공유 오류:', error);
              alert('영수증 공유에 실패했습니다. 이미지를 저장합니다.');
              // Web Share API 실패 시 다운로드로 대체
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
          // Web Share API가 파일을 공유할 수 없는 경우 다운로드로 대체
          console.log(
            'Web Share API cannot share this file, falling back to download.'
          );
          const image = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = image;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // Web Share API 자체가 지원되지 않을 경우 다운로드로 대체 (모바일이 아니거나 아주 오래된 브라우저)
        console.log('Web Share API not supported, falling back to download.');
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('영수증 이미지 생성 오류:', error);
      alert('영수증 이미지 생성에 실패했습니다.');
    }
  };

  // 오늘 날짜
  const today = new Date();
  const issuedDate = `${today.getFullYear()}년 ${String(
    today.getMonth() + 1
  ).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`;

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

      {/* 영수증 영역 */}
      <div
        ref={receiptRef}
        className="mx-auto flex w-full max-w-[330px] flex-col gap-2 rounded-lg border border-[#7C7C7C] bg-white px-4 pb-4 pt-8 font-elice-digital-coding shadow"
      >
        {/* 로고/발급일 */}
        <div className="mb-2 flex flex-col items-center gap-1">
          <img
            className="h-12 w-auto"
            src={import.meta.env.BASE_URL + 'assets/icons/logo_black.png'}
            alt="black logo"
          />
          <span className="text-xs text-[#7C7C7C]">발급일: {issuedDate}</span>
        </div>
        {/* 정산 내역 */}
        <div className="flex flex-col items-start gap-2 border-b border-dashed border-[#AFAFAF] px-1 pb-4">
          <span className="text-[12px] text-[#7C7C7C]">함께한 곳</span>
          <div className="flex w-full justify-between">
            <span className="text-[14px] text-[#202020]">{title}</span>
            <span className="flex items-end gap-1 text-[12px] text-[#202020]">
              <span className="mb-1 text-[8px]">₩</span>
              {formatCurrency(fixedTotalAmount)}
            </span>
          </div>
        </div>
        {/* 참여자 리스트 */}
        <div className="flex flex-col divide-y divide-dashed divide-[#AFAFAF]">
          {updatedParticipants.map((participant, index) => (
            <div key={index} className="flex items-center justify-between py-3">
              <div className="min-w-0 px-1">
                <span className="block text-left text-[#202020]">
                  {participant.name}
                </span>
                {participant.deductionItems.length > 0 && (
                  <div className="ml-1 mt-1 flex flex-col gap-1">
                    <span className="text-left text-[10px] text-[#7C7C7C] opacity-80">
                      제외 항목
                    </span>
                    <div className="ml-1 flex flex-wrap gap-1">
                      {participant.deductionItems.map((item, i) => (
                        <span
                          key={i}
                          className="rounded border border-[#E5E4E0] bg-[#F8F7F4] px-2 py-0.5 text-[10px] text-[#7C7C7C]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="min-w-[80px] text-right">
                <span className="flex items-end gap-1 text-[18px] text-[#202020]">
                  <span className="pb-1 text-[12px]">₩</span>
                  {formatCurrency(participant.finalAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* 계좌번호 */}
        <div
          onClick={handleCopyAccount}
          className="flex cursor-pointer items-center justify-between rounded-lg bg-[#F8F7F4] px-2 py-3 text-[#7C7C7C] transition-colors hover:text-[#4DB8A9]"
        >
          <p className="h-fit text-[10px]">{accountInfo}</p>
          <FontAwesomeIcon icon={faCopy} className="h-auto w-3" />
        </div>
        <div className="mt-2 flex w-full flex-col text-[8px] tracking-[-.05em] text-[#7C7C7C]">
          <p>Created by Split it! WEB</p>
          <p>
            Copyright 2025. Whipping cream on citron tea. All right reserved.
          </p>
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
            onClick={() => alert('차수 추가 기능은 준비 중입니다.')}
            className="flex-1 rounded-lg border border-[#202020] bg-white py-2 text-base font-bold text-[#202020] shadow shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] transition active:translate-y-2 active:bg-[#4DB8A9] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
          >
            + 2차 추가
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
