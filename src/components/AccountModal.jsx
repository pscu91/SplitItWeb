import React, { useState, useEffect, useRef } from 'react';

const AccountModal = ({ show, onClose, onSave, initialAccountInfo }) => {
  const [currentAccountInfo, setCurrentAccountInfo] =
    useState(initialAccountInfo);
  const inputRef = useRef(null);
  const modalContentRef = useRef(null);

  useEffect(() => {
    setCurrentAccountInfo(initialAccountInfo);
  }, [initialAccountInfo]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto'; // 컴포넌트 언마운트 시 초기화
    };
  }, [show]);

  if (!show) {
    return null;
  }

  const handleSave = () => {
    localStorage.setItem('accountInfo', currentAccountInfo); // 계좌 정보 저장
    onSave(currentAccountInfo);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (
      modalContentRef.current &&
      !modalContentRef.current.contains(e.target)
    ) {
      onClose();
    }
  };

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
          계좌 정보 수정
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            }
          }}
          className="mb-4 w-full rounded border border-gray-300 p-2 text-gray-800 focus:border-[#4db8a9] focus:outline-none focus:ring-[#4db8a9]"
          placeholder="계좌 정보를 입력하세요"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-gray-700 active:bg-gray-200 active:text-gray-700"
          >
            취소
          </button>
          <button
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
