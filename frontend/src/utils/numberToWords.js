export const numberToWords = (num) => {
  if (num === 0) return "Rs. Zero";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const numString = Number(num).toFixed(2);

  const parts = numString.split(".");
  const integerPart = parseInt(parts[0], 10);
  const paisePart = parts[1] ? parseInt(parts[1].substring(0, 2), 10) : 0;

  const convertLessThanOneThousand = (n) => {
    if (n === 0) return "";
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + " ";
    }
    return str.trim();
  };

  const convert = (n) => {
    if (n === 0) return "";
    let str = "";
    
    // Crores (1,00,00,000)
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    // Lakhs (1,00,000)
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    // Thousands (1,000)
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    // Hundreds
    if (n > 0) {
      str += convertLessThanOneThousand(n);
    }
    return str.trim();
  };

  let result = convert(integerPart);
  if (!result) result = "Zero";
  
  result = "Rs. " + result;

  if (paisePart > 0) {
    result += " and " + convertLessThanOneThousand(paisePart) + " Paise";
  }

  return result.trim();
};
