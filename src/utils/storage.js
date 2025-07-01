// 로컬스토리지 키 상수
const SETTLEMENTS_KEY = 'settlements';
const ACCOUNT_INFO_KEY = 'accountInfo';

// 정산 내역 저장
export const saveSettlement = (settlement) => {
  const settlements = getSettlements();
  const newSettlement = {
    ...settlement,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  settlements.unshift(newSettlement);
  localStorage.setItem(SETTLEMENTS_KEY, JSON.stringify(settlements));
  return newSettlement;
};

// 정산 내역 전체 조회
export const getSettlements = () => {
  try {
    const settlements = localStorage.getItem(SETTLEMENTS_KEY);
    return settlements ? JSON.parse(settlements) : [];
  } catch {
    return [];
  }
};

// 단일 정산 내역 조회
export const getSettlementById = (id) => {
  const settlements = getSettlements();
  return settlements.find((settlement) => settlement.id === id) || null;
};

// 정산 내역 수정
export const updateSettlement = (updatedSettlement) => {
  const settlements = getSettlements();
  const index = settlements.findIndex((s) => s.id === updatedSettlement.id);
  if (index !== -1) {
    settlements[index] = updatedSettlement;
    localStorage.setItem(SETTLEMENTS_KEY, JSON.stringify(settlements));
    return true;
  }
  return false;
};

// 정산 내역 삭제
export const deleteSettlement = (id) => {
  const settlements = getSettlements();
  const updatedSettlements = settlements.filter((s) => s.id !== id);
  localStorage.setItem(SETTLEMENTS_KEY, JSON.stringify(updatedSettlements));
};

// 계좌 정보 저장 및 불러오기
export const getAccountInfo = () => {
  return localStorage.getItem(ACCOUNT_INFO_KEY) || '계좌 정보를 등록하세요.';
};

export const setAccountInfo = (info) => {
  localStorage.setItem(ACCOUNT_INFO_KEY, info);
};
