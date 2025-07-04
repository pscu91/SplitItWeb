import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faXmark,
  faSearch,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { formatNumber } from '../utils/format';

const PARTICIPANTS_KEY = 'flowParticipants';
const RECENT_MEMBERS_KEY = 'recentMembers';

const getRecentMembers = () => {
  const stored = localStorage.getItem(RECENT_MEMBERS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

const saveRecentMember = (name) => {
  if (!name || !name.trim()) return;
  let members = getRecentMembers();
  members = [name, ...members.filter((m) => m !== name)];
  localStorage.setItem(
    RECENT_MEMBERS_KEY,
    JSON.stringify(members.slice(0, 20))
  );
};

// NameTag 컴포넌트 분리
const NameTag = React.memo(
  ({
    name,
    isOwner,
    isEditing,
    onEdit,
    onEditChange,
    onEditBlur,
    onRemove,
  }) => (
    <div
      className={`flex min-w-max items-center rounded-full border text-sm shadow-sm transition-all duration-100 ${
        isOwner
          ? 'border-gray-200 bg-gray-100 px-4 py-3 text-gray-400'
          : 'cursor-pointer border-[#202020] bg-white pl-4 text-[#202020] hover:bg-[#FF9EAB]/10'
      }`}
      style={{ fontFamily: 'ONE-Mobile-Title, sans-serif' }}
    >
      {isEditing ? (
        <input
          value={name}
          onChange={onEditChange}
          onBlur={onEditBlur}
          className="w-16 bg-transparent text-[15px] outline-none"
          maxLength={8}
          autoFocus
        />
      ) : (
        <span onClick={onEdit}>{name}</span>
      )}
      {!isOwner && (
        <button
          onClick={onRemove}
          className="mt-1 pl-2 pr-4 text-gray-400 hover:text-red-500"
          tabIndex={-1}
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-auto" />
        </button>
      )}
    </div>
  )
);

// 상단 헤더 컴포넌트 분리
const PageHeader = ({ onBack, onNext, hasOtherParticipants }) => (
  <div className="mb-6 flex items-center justify-between font-['ONE-Mobile-Title']">
    <FontAwesomeIcon
      onClick={onBack}
      icon={faChevronLeft}
      className="h-6 w-6 cursor-pointer p-2 text-black active:text-blue-500 lg:hover:text-blue-500"
    />
    <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-gray-800">
      참여자 선택
    </h1>
    <button
      type="submit"
      form="participants-form"
      className={`text-[#4DB8A9] ${!hasOtherParticipants ? 'cursor-not-allowed opacity-40' : ''}`}
      disabled={!hasOtherParticipants}
      onClick={onNext}
    >
      다음
    </button>
  </div>
);

const CreateParticipantsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    settlements = [],
    title,
    amount,
    participants: initialParticipants,
    deductionItems,
  } = location.state || {};

  const [participants, setParticipants] = useState(
    initialParticipants || [{ name: '정산자', paid: false }]
  );
  const [lastAddedIndex, setLastAddedIndex] = useState(null);
  const [recentMembers, setRecentMembers] = useState(getRecentMembers());
  const [search, setSearch] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const inputRefs = useRef([]);
  const searchInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    setRecentMembers(getRecentMembers());
  }, []);

  useEffect(() => {
    if (lastAddedIndex !== null && inputRefs.current[lastAddedIndex]) {
      inputRefs.current[lastAddedIndex].focus();
      setLastAddedIndex(null);
    }
  }, [participants, lastAddedIndex]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      navigate('/create/deduction', {
        state: {
          settlements,
          title,
          amount,
          participants,
          deductionItems,
        },
      });
    },
    [navigate, settlements, title, amount, participants, deductionItems]
  );

  const addParticipant = useCallback(
    (name = '') => {
      if (!name.trim()) return false;
      if (participants.some((p) => p.name === name)) return false;
      setParticipants([...participants, { name, paid: false }]);
      saveRecentMember(name);
      setRecentMembers(getRecentMembers());
      return true;
    },
    [participants]
  );

  const updateParticipant = useCallback(
    (index, value) => {
      const newParticipants = [...participants];
      newParticipants[index] = value;
      setParticipants(newParticipants);
      if (value.name && value.name.trim()) {
        saveRecentMember(value.name);
        setRecentMembers(getRecentMembers());
      }
    },
    [participants]
  );

  const removeParticipant = useCallback(
    (index) => {
      if (index === 0) return;
      setParticipants(participants.filter((_, i) => i !== index));
      if (editingIndex === index) setEditingIndex(null);
    },
    [participants, editingIndex]
  );

  const handleBack = useCallback(() => {
    navigate('/create', {
      state: {
        title,
        participants,
      },
    });
  }, [navigate, title, participants]);

  const filteredRecent = search
    ? recentMembers.filter((m) => m.includes(search))
    : recentMembers;

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddFromSearch();
      }
    },
    [search, participants]
  );

  const handleAddFromSearch = useCallback(() => {
    const value = search.trim();
    if (!value) return;
    if (participants.some((p) => p.name === value)) return;
    const added = addParticipant(value);
    if (added) {
      setTimeout(() => {
        setSearch('');
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    }
  }, [search, participants, addParticipant]);

  const handleEdit = useCallback((index) => {
    if (index === 0) return;
    setEditingIndex(index);
  }, []);
  const handleEditChange = useCallback(
    (index, e) => {
      updateParticipant(index, {
        ...participants[index],
        name: e.target.value,
      });
    },
    [participants, updateParticipant]
  );
  const handleEditBlur = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const hasOtherParticipants = participants.length > 1;

  // 멤버 리스트, 최근 멤버 등은 기존 구조 유지(가독성 위주 정리)

  return (
    <div
      className="bg-[#F8F7F4] sm:min-h-screen sm:p-4"
      style={{ fontFamily: 'ONE-Mobile, sans-serif' }}
    >
      <PageHeader
        onBack={handleBack}
        onNext={handleSubmit}
        hasOtherParticipants={hasOtherParticipants}
      />
      {/* 현재 함께한 멤버: 횡스크롤 영역 */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[#202020]">함께한 멤버</h2>
          <span className="text-[#7C7C7C]">|</span>
          <span className="text-xs text-[#202020]">
            {participants.length}명
          </span>
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-2">
          {[participants[0], ...participants.slice(1).slice().reverse()].map(
            (participant, index) => {
              const realIndex =
                participant === participants[0]
                  ? 0
                  : participants.lastIndexOf(participant);
              return (
                <NameTag
                  key={realIndex}
                  name={participant.name}
                  isOwner={realIndex === 0}
                  isEditing={editingIndex === realIndex}
                  onEdit={() => handleEdit(realIndex)}
                  onEditChange={(e) => handleEditChange(realIndex, e)}
                  onEditBlur={handleEditBlur}
                  onRemove={() => removeParticipant(realIndex)}
                />
              );
            }
          )}
        </div>
      </div>
      {/* 기존에 추가했던 멤버: 리스트형 */}
      <div className="mb-4 rounded-xl border-2 border-gray-600 bg-gray-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[15px] text-gray-600">함께했던 멤버 목록</span>
        </div>
        <div className="mb-4 flex items-center gap-x-2">
          <div className="relative w-full">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={() => {
                if (
                  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent
                  )
                ) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              placeholder="이름 검색 또는 엔터로 추가"
              className="h-full w-full rounded-lg border px-4 py-4 text-sm focus:border-[#4DB8A9] focus:outline-none focus:ring-0 focus:ring-[#4DB8A9]"
              style={{ minWidth: 120 }}
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAddFromSearch}
            className={`border-1 flex h-full w-auto items-center justify-center border-gray-600 bg-[#4DB8A9] text-white transition ${search.trim() === '' ? 'cursor-not-allowed opacity-40' : 'focus:bg-[#3ca393]'}`}
            aria-label="추가"
            disabled={search.trim() === ''}
          >
            <span className="text-lg font-bold">+</span>
          </button>
        </div>
        <div className="flex max-h-80 min-h-80 scroll-m-2 flex-col gap-2 overflow-scroll">
          {filteredRecent.length === 0 && search.trim() !== '' ? (
            <div className="">
              <span className="text-sm text-gray-500">
                Enter 또는 + 버튼으로 '
                <span className="font-bold">{search}</span>' 추가하기
              </span>
            </div>
          ) : (
            (() => {
              const ownerName = participants[0]?.name;
              const added = filteredRecent
                .filter(
                  (name) =>
                    name !== ownerName &&
                    participants.some((p, i) => i !== 0 && p.name === name)
                )
                .sort((a, b) => a.localeCompare(b, 'ko'));
              const notAdded = filteredRecent
                .filter(
                  (name) =>
                    name !== ownerName &&
                    !participants.some((p) => p.name === name)
                )
                .sort((a, b) => a.localeCompare(b, 'ko'));
              return [...added, ...notAdded].map((name) => {
                const isAdded = participants.some((p) => p.name === name);
                const isOwner = ownerName === name;
                const handleClick = () => {
                  if (isOwner) return;
                  if (isAdded) {
                    setParticipants(
                      participants.filter((p, i) => i === 0 || p.name !== name)
                    );
                  } else {
                    addParticipant(name);
                  }
                };
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={handleClick}
                    className={`border-1 flex w-full cursor-pointer items-center justify-between rounded-lg border-gray-600 px-4 py-3 shadow-sm transition ${isAdded ? 'bg-[#4DB8A9] text-white active:bg-[#4DB8A9]' : 'border-[#E5E4E0] bg-white text-[#202020] sm:hover:bg-[#4DB8A9]/60'} `}
                    style={{ fontFamily: 'ONE-Mobile-Title, sans-serif' }}
                    disabled={isOwner}
                  >
                    <span
                      className={`text-[16px] ${isAdded ? 'text-white' : 'text-[#202020]'}`}
                    >
                      {name}
                    </span>
                    <FontAwesomeIcon
                      icon={faCheck}
                      className={`text-lg ${isAdded ? 'text-white' : 'text-gray-200'}`}
                    />
                  </button>
                );
              });
            })()
          )}
        </div>
      </div>
      {/* 참여자 입력 폼(숨김, 추가 버튼 클릭 시에만 사용) */}
      <form id="participants-form" onSubmit={handleSubmit} className="hidden">
        {/* 기존 참여자 입력 폼은 숨김 처리 */}
      </form>
    </div>
  );
};

export default CreateParticipantsPage;
