// 숫자 3자리마다 콤마
export const formatNumber = (number) => {
  if (number === '' || number === null || number === undefined || isNaN(number))
    return '';
  return new Intl.NumberFormat('ko-KR').format(Number(number));
};

// 통화 포맷 (기본: ₩)
export const formatCurrency = (number) => {
  if (number === '' || number === null || number === undefined || isNaN(number))
    return '';
  return `${formatNumber(number)}`;
};

// 3자리 콤마 (문자열 입력도 허용)
export const formatNumberWithCommas = (num) => {
  if (num === '' || num === null || num === undefined || isNaN(num)) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
