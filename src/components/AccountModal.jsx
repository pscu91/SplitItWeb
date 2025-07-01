import React, { useState, useEffect, useRef, useCallback } from 'react';
import { setAccountInfo } from '../utils/storage';

const AccountModal = ({ show, onClose, onSave, initialAccountInfo }) => {
  const [currentAccountInfo, setCurrentAccountInfo] = useState(
    initialAccountInfo || ''
  );
  const inputRef = useRef(null);
  const modalContentRef = useRef(null);

  // 모달 열릴 때 입력 포커스 및 body 스크롤 제어
  useEffect(() => {
    setCurrentAccountInfo(initialAccountInfo || '');
  }, [initialAccountInfo]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [show]);

  if (!show) return null;

  // 저장 핸들러
  const handleSave = useCallback(() => {
    if (!currentAccountInfo.trim()) {
      alert('계좌 정보를 입력해 주세요.');
      return;
    }
    setAccountInfo(currentAccountInfo.trim());
    onSave(currentAccountInfo.trim());
    onClose();
  }, [currentAccountInfo, onSave, onClose]);

  // ESC 키로 닫기, Enter로 저장
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        handleSave();
      }
    },
    [handleSave, onClose]
  );

  // 오버레이 클릭 시 닫기
  const handleOverlayClick = useCallback(
    (e) => {
      if (
        modalContentRef.current &&
        !modalContentRef.current.contains(e.target)
      ) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalContentRef}
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
      >
        <h2
          className="mb-4 text-xl font-bold"
          style={{ fontFamily: 'ONE-Mobile-Title, sans-serif' }}
        >
          계좌 정보 {initialAccountInfo ? '수정' : '등록'}
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          새로운 계좌 정보를 입력해주세요.
          <br />
          (ex: XX은행 000-0000-000000 홍길동)
        </p>
        <input
          ref={inputRef}
          type="text"
          value={currentAccountInfo}
          onChange={(e) => setCurrentAccountInfo(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-4 w-full rounded border border-gray-300 p-2 text-gray-800 focus:border-[#4db8a9] focus:outline-none focus:ring-[#4db8a9]"
          placeholder="계좌 정보를 입력하세요"
        />
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-gray-700 active:bg-gray-200 active:text-gray-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-[#4DB8A9] px-4 py-2 text-white active:bg-[#3ca393]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
