const SETTLEMENTS_KEY = 'settlements';

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

export const getSettlements = () => {
  const settlements = localStorage.getItem(SETTLEMENTS_KEY);
  return settlements ? JSON.parse(settlements) : [];
};

export const getSettlementById = (id) => {
  const settlements = getSettlements();
  return settlements.find((settlement) => settlement.id === id);
};

export const updateSettlement = (updatedSettlement) => {
  const settlements = getSettlements();
  const index = settlements.findIndex(
    (settlement) => settlement.id === updatedSettlement.id
  );
  if (index !== -1) {
    settlements[index] = updatedSettlement;
    localStorage.setItem(SETTLEMENTS_KEY, JSON.stringify(settlements));
  }
};

export const deleteSettlement = (id) => {
  const settlements = JSON.parse(localStorage.getItem(SETTLEMENTS_KEY)) || [];
  const updatedSettlements = settlements.filter(
    (settlement) => settlement.id !== id
  );
  localStorage.setItem(SETTLEMENTS_KEY, JSON.stringify(updatedSettlements));
};
