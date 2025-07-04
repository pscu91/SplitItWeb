import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatNumber } from '../utils/format';
import {
  getSettlementById,
  updateSettlement,
  deleteSettlement,
} from '../utils/storage';

// 상단 헤더 컴포넌트 분리
const PageHeader = ({ isEditing, onBack, onEdit, onSave }) => (
  <header className="mb-6 flex items-center justify-between">
    <FontAwesomeIcon
      onClick={onBack}
      icon={faChevronLeft}
      className="h-5 w-5 cursor-pointer p-4 hover:text-blue-500"
    />
    <h1 className="text-2xl font-bold text-gray-800">정산 상세</h1>
    {isEditing ? (
      <button onClick={onSave} className="text-blue-500">
        저장
      </button>
    ) : (
      <div className="flex space-x-2">
        <button onClick={onEdit} className="bg-transparent text-blue-500">
          수정
        </button>
      </div>
    )}
  </header>
);

// 참여자 리스트 컴포넌트 분리
const ParticipantList = ({
  participants,
  isEditing,
  amountPerPerson,
  onChange,
  onPaidChange,
  onRemove,
  onAdd,
}) => (
  <div>
    <div className="mb-2 flex items-center justify-between pl-2">
      <label className="text-left text-sm font-bold text-gray-700">
        참여자
      </label>
      {isEditing && (
        <button
          onClick={onAdd}
          className="mr-2 rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
        >
          인원 추가
        </button>
      )}
    </div>
    <div className="rounded-lg bg-white p-4 shadow">
      {participants.map((participant, index) => (
        <div
          key={index}
          className="flex items-center justify-between border-b px-2 py-3 last:border-0"
        >
          <div className="flex-1 text-left">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={participant.name}
                  onChange={(e) => onChange(index, 'name', e.target.value)}
                  className={`w-20 rounded-lg px-3 py-2 ${index === 0 ? 'border-0 bg-gray-100 text-gray-400' : 'border'}`}
                  disabled={index === 0}
                  placeholder="이름"
                />
              </div>
            ) : (
              <p className="font-medium">{participant.name}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="font-medium">{formatCurrency(amountPerPerson)}</p>
            {index !== 0 && !isEditing ? (
              <div className="flex items-center">
                <label className="text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={participant.paid}
                    onChange={(e) => onPaidChange(index, e.target.checked)}
                    className="h-5 w-5 rounded-md text-blue-500"
                  />
                </label>
              </div>
            ) : (
              index !== 0 && (
                <button
                  onClick={() => onRemove(index)}
                  className="px-0 text-red-400 hover:text-red-600"
                >
                  <FontAwesomeIcon icon={faXmark} className="h-auto w-3" />
                </button>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SettlementDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('0');
  const [participants, setParticipants] = useState([]);
  const [amountPerPerson, setAmountPerPerson] = useState(0);
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const amountInputRef = useRef(null);

  useEffect(() => {
    const settlement = getSettlementById(id);
    if (settlement) {
      setTitle(settlement.title);
      setAmount(settlement.amount.toString());
      setParticipants(settlement.participants);
      const totalAmount = parseInt(settlement.amount);
      const perPerson = Math.floor(
        totalAmount / settlement.participants.length
      );
      setAmountPerPerson(perPerson);
    } else {
      navigate('/');
    }
  }, [id, navigate]);

  useEffect(() => {
    const paidAmount = participants.reduce((sum, participant) => {
      if (participant.paid) {
        return sum + amountPerPerson;
      }
      return sum;
    }, 0);
    setTotalPaidAmount(paidAmount);
    const totalAmount = parseInt(amount);
    const remaining = totalAmount - amountPerPerson - paidAmount;
    setRemainingAmount(remaining);
  }, [participants, amountPerPerson, amount]);

  const handleSave = useCallback(() => {
    const numericAmount = parseInt(amount);
    if (numericAmount === 0) {
      alert('총 금액은 0원일 수 없습니다.');
      return;
    }
    const hasEmptyName = participants.some(
      (participant) => participant.name.trim() === ''
    );
    if (hasEmptyName) {
      alert('이름이 입력되지 않았습니다.');
      return;
    }
    const updatedSettlement = {
      id,
      title,
      amount: numericAmount,
      participants,
      createdAt: new Date().toISOString(),
    };
    updateSettlement(updatedSettlement);
    setIsEditing(false);
  }, [amount, id, participants, title]);

  const handleParticipantChange = useCallback(
    (index, field, value) => {
      const newParticipants = [...participants];
      newParticipants[index] = {
        ...newParticipants[index],
        [field]: value,
      };
      setParticipants(newParticipants);
    },
    [participants]
  );

  const handleAddParticipant = useCallback(() => {
    const newParticipant = { name: '', paid: false };
    setParticipants([...participants, newParticipant]);
    const totalAmount = parseInt(amount) || 0;
    const perPerson = Math.floor(totalAmount / (participants.length + 1));
    setAmountPerPerson(perPerson);
  }, [participants, amount]);

  const handleRemoveParticipant = useCallback(
    (index) => {
      if (index === 0) return;
      const newParticipants = participants.filter((_, i) => i !== index);
      setParticipants(newParticipants);
      const totalAmount = parseInt(amount) || 0;
      const perPerson = Math.floor(totalAmount / newParticipants.length);
      setAmountPerPerson(perPerson);
    },
    [participants, amount]
  );

  const handleAmountChange = useCallback(
    (e) => {
      const value = e.target.value.replace(/,/g, '');
      if (value === '' || /^\d+$/.test(value)) {
        setAmount(value || '0');
        const totalAmount = parseInt(value) || 0;
        const perPerson = Math.floor(totalAmount / participants.length);
        setAmountPerPerson(perPerson);
      }
    },
    [participants]
  );

  const handleAmountFocus = useCallback(() => {
    if (!amount) {
      setAmount('0');
      setTimeout(() => {
        amountInputRef.current.select();
      }, 0);
    }
  }, [amount]);

  const handlePaidChange = useCallback(
    (index, checked) => {
      handleParticipantChange(index, 'paid', checked);
      const numericAmount = parseInt(amount);
      if (numericAmount !== 0) {
        const updatedSettlement = {
          id,
          title,
          amount: numericAmount,
          participants: participants.map((p, i) =>
            i === index ? { ...p, paid: checked } : p
          ),
          createdAt: new Date().toISOString(),
        };
        updateSettlement(updatedSettlement);
      }
    },
    [amount, handleParticipantChange, id, participants, title]
  );

  const handleBack = useCallback(() => {
    if (isEditing) {
      navigate(0);
      setIsEditing(false);
    } else {
      navigate('/');
    }
  }, [isEditing, navigate]);

  const handleDelete = useCallback(() => {
    const confirmDelete = window.confirm('정산 내역을 삭제하시겠습니까?');
    if (confirmDelete) {
      deleteSettlement(id);
      navigate('/');
    }
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <PageHeader
        isEditing={isEditing}
        onBack={handleBack}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
      />
      <div className="space-y-6">
        {/* 정산 정보 */}
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              정산 제목
            </label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            ) : (
              <p className="text-lg">{title}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              총 금액
            </label>
            {isEditing ? (
              <div className="relative">
                <input
                  ref={amountInputRef}
                  type="text"
                  value={formatNumber(amount)}
                  onChange={handleAmountChange}
                  onFocus={handleAmountFocus}
                  className="w-full rounded-lg border px-3 py-2 pr-8 text-right"
                  placeholder="금액을 입력하세요"
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  원
                </span>
              </div>
            ) : (
              <p className="text-lg">{formatCurrency(amount)}</p>
            )}
          </div>
          <div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="overflow-hidden transition-all duration-300 ease-in-out">
                {remainingAmount !== 0 && (
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      받아야 할 금액
                    </span>
                    <span className="font-medium text-red-500">
                      - {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">받은 금액</span>
                <span className="font-medium text-blue-500">
                  {formatCurrency(totalPaidAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* 참여자 목록 */}
        <ParticipantList
          participants={participants}
          isEditing={isEditing}
          amountPerPerson={amountPerPerson}
          onChange={handleParticipantChange}
          onPaidChange={handlePaidChange}
          onRemove={handleRemoveParticipant}
          onAdd={handleAddParticipant}
        />
        {!isEditing ? (
          <button
            onClick={handleDelete}
            className="mt-4 w-full rounded px-3 py-1 text-red-500 active:bg-red-500 active:text-white"
          >
            삭제
          </button>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default SettlementDetailPage;
