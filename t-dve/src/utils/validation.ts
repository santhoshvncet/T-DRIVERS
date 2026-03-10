import constants from "../lib/constants";

type ValidatorResult = true | string;

const validation = {
    validateMobile: (mobile: string) => {
    // allow only 10 numbers
        const regex = new RegExp(/^[0-9]{10}$/)
        if (regex.test(mobile) == false) {
          return "Enter valid mobile number";
        }
         if (/^[0-5]/.test(mobile)) {
      return "Enter valid mobile number";
    }
        return 
      },
    isValidateMobileNo: (mobile: string) => {
        return /^[0-9]{10}$/.test(mobile) && mobile.length === 10;
      },



//maximum 
validateName: (val?: string) => (val?: string): true | string => {
  if (!val?.trim()) return `${val} is required`;
  const v = val.trim();
  if (v.length < 1) return "Minimum 3 characters";
  if (v.length > 30) return "Maximum 30 characters";
  if (/\d/.test(v)) return "Numbers are not allowed";
  // allow letters from any language, spaces, apostrophes, hyphens and dots
  if (!/^[A-Za-z\s.'-]+$/.test(v)) {
    return "Only English letters, spaces, apostrophes, hyphens, and dots are allowed";
  }
  return true;
},  

validateGuardianName: (val?: string): true | string => {
  if (!val?.trim()) return "Guardian name is required";
  const v = val.trim();

  if (v.length < 4) return "Guardian name must be at least 4 characters";
  if (v.length > 40) return "Guardian name cannot exceed 40 characters";

  if (/\d/.test(v)) return "Numbers are not allowed in guardian name";

  if (!/^[A-Za-z\s.'-]+$/.test(v)) {
    return "Only English letters, spaces, apostrophes, hyphens and dots are allowed";
  }

  return true;
},

validateRelationship: (val?: string): true | string => {
  if (!val?.trim()) return "Relationship is required";
  const v = val.trim();

  // minimum length
  if (v.length < 3) return "Relationship must be at least 3 characters";
  if (v.length > 30) return "Relationship cannot exceed 30 characters";

  // no digits
  if (/\d/.test(v)) return "Numbers are not allowed in relationship";

  // only letters and spaces (plus optional hyphen or apostrophe for names like "Step-mother")
  if (!/^[A-Za-z\s'-]+$/.test(v)) {
    return "Only letters, spaces, hyphens, and apostrophes are allowed";
  }

  return true;
},



// full  name validation
// validateFullName: (val?: string): true | string => {
//   if (!val?.trim()) return "Full name is required";
//   const v = val.trim();
//   // overall length limits
//   if (v.length < 3) return "Full name must be at least 3 characters";
//   if (v.length > 60) return "Full name can be at most 60 characters";

//   // no digits
//   if (/\d/.test(v)) return "Numbers are not allowed in name";

//   // allowed characters: letters, spaces, apostrophes, hyphens, dots
//   if (!/^[A-Za-z\s.'-]+$/.test(v)) {
//     return "Only English letters, spaces, apostrophes, hyphens and dots are allowed";
//   }

//   // ensure at least two name parts (first + last) — each part should be >= 2 chars
// // ensure at least two name parts (first + last/initial)
// const parts = v.split(/\s+/).filter(Boolean);
// if (parts.length < 2) return "Please enter your full name (first and last name)";

// for (const p of parts) {

//   if (!/^[A-Z]/.test(p)) {
//       return "Each name must start with a capital letter";
//     }
//   // Allow single-letter initials (like "V") but otherwise require 2+
//   if (p.length < 2 && !/^[A-Za-z]$/.test(p)) {
//     return "Each part of the name must be at least 2 characters or a valid initial";
//   }
// }

//   return true;
// },
validateFullName: (val?: string): true | string => {
  if (!val?.trim()) return "Full name is required";

  const v = val.trim();

  // overall length limits
  if (v.length < 3) return "Full name must be at least 3 characters";
  if (v.length > 60) return "Full name can be at most 60 characters";

  // no digits
  if (/\d/.test(v)) return "Numbers are not allowed in name";

  // allowed characters: letters, spaces, apostrophes, hyphens, dots
  if (!/^[A-Za-z\s.'-]+$/.test(v)) {
    return "Only English letters, spaces, apostrophes, hyphens and dots are allowed";
  }

  // split name parts
  const parts = v.split(/\s+/).filter(Boolean);

  // must have at least first + one more name
  // if (parts.length < 2) {
  //   return "Please enter your full name (first and last name)";
  // }

  // ✅ only first name must start with capital letter
  const firstName = parts[0];
  if (!/^[A-Z]/.test(firstName)) {
    return "First name must start with a capital letter";
  }

  // ✅ no restriction on remaining parts (2nd, 3rd names)
  return true;
},

validateAge: (val?: string): true | string => {
  if (!val) return "Age is required";

  const age = Number(val);

  if (!Number.isInteger(age)) return "Age must be a whole number";

  if (age < 18 || age > 60) {
    return "Age must be between 18 and 60";
  }

  return true;
},


validateDob: (val?: string): true | string => {
  if (!val) return "Date of birth is required";

  // 1) Format: YYYY-MM-DD (4-digit year)
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dobRegex.test(val)) {
    return "Enter proper date of birth (YYYY-MM-DD)";
  }

  // 2) Valid calendar date
  const selected = new Date(val);
  if (isNaN(selected.getTime())) return "Invalid date";

  // normalize today's date (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 3) No today or future dates
  if (selected >= today) return "Date of birth cannot be today or a future date";

  // 4) Not in the current year
  if (selected.getFullYear() === today.getFullYear()) return "Date of birth cannot be in the current year";

  // 5) Must be within last 100 years
  const minYearAllowed = today.getFullYear() - 100;
  if (selected.getFullYear() < minYearAllowed) {
    return "Date of birth must be within the last 100 years";
  }
  //keeping age limit 
    const minAgeDate = new Date(
    today.getFullYear() - 15,
    today.getMonth(),
    today.getDate()
  );
  if (selected > minAgeDate) {
    return "You must be at least 15 years old";
  }


  return true;
},


validateEmail: (val?: string): true | string => {
  if (!val?.trim()) return "Email is required";
  const v = val.trim();

  // ✅ NEW: Max length check (25–30 chars)
  const MAX_LEN = 50; // change to 25 if required
  if (v.length > MAX_LEN) {
    return `Email must be at most ${MAX_LEN} characters`;
  }

  // 1) Only ASCII characters allowed
  if (!/^[\x00-\x7F]+$/.test(v)) {
    return "Enter Valid Email";
  }

  // 2) Basic structure checks (local@domain.tld)
  const fullRegex =
    /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,62}[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+$/;

  if (!fullRegex.test(v)) {
    return "Enter a valid email address";
  }

  const [localPart, domainPart] = v.split("@");

  // 3) No consecutive dots
  if (localPart.includes("..") || domainPart.includes("..")) {
    return "Email cannot contain consecutive dots";
  }

  // 4) Local part should not be only digits
  if (/^\d+$/.test(localPart)) {
    return "Email cannot be only numbers";
  }

  // 5) Local part must contain at least one letter
  if (!/[A-Za-z]/.test(localPart)) {
    return "Email must contain at least one letter before the @";
  }

  return true;
},



validateAddress: (val?: string): true | string => {
  if (!val?.trim()) return "Address is required";
  const v = val.trim();

  // Length check
  if (v.length < 5) return "Enter a valid address (min 5 characters)";
  if (v.length > 100) return "Maximum 200 characters allowed for address";

  // ✅ Allow only English letters, numbers, spaces, and , . - / '
  const addressRegex = /^[A-Za-z0-9\s.,'\/-]+$/;
  if (!addressRegex.test(v)) {
    return "Only English letters, numbers, spaces, and , . - / ' are allowed";
  }

  // ❌ Block if it's only numbers
  if (/^\d+$/.test(v)) {
    return "Address cannot be only numbers";
  }

  return true;
},

 validateTenthMarks: (val?: string): true | string => {
    if (!val?.trim()) return "10th Marks are required";
    const num = Number(val);
    if (Number.isNaN(num)) return "Only numbers allowed";
    if (num < 100 || num > 625) return "10th Marks must be between 100 and 625";
    return true;
  },

  validateSeconndPUMarks: (val?: string): true | string => {
    if (!val?.trim()) return "2nd PU Marks are required";
    const num = Number(val);
    if (Number.isNaN(num)) return "Only numbers allowed";
    if (num < 100 || num > 625) return "2nd Marks must be between 100 and 625";
    return true;
  },

validateRanking: (val?: string | number): true | string => {
  const s = val === undefined || val === null ? "" : String(val);
  if (!s.trim()) return "Rank is required";
  const num = Number(s);
  if (Number.isNaN(num)) return "Only numbers allowed";
  if (!Number.isInteger(num)) return "Rank must be a whole number";
  if (num <= 0) return "Rank must be greater than 0";
  if (num > 600000) return "Rank must be less than or equal to 600000";
  return true;
},


// validation.ts (or your util obj)
validateCheckInDate:
  (maxMonths = 6) =>
  (val?: string): true | string => {
    if (!val) return "Check-in date is required";

    // parse date reliably (val is expected in YYYY-MM-DD)
    const selectedDate = new Date(val);
    if (isNaN(selectedDate.getTime())) return "Invalid date";

    // normalize to midnight local time for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // no past dates
    if (selectedDate < today) {
      return "Check-in date cannot be in the past";
    }

    // compute max allowed date by adding months
    const maxDate = new Date();
    maxDate.setHours(0, 0, 0, 0);

    // Adding months carefully: handle month overflow
    const targetMonth = maxDate.getMonth() + maxMonths;
    maxDate.setMonth(targetMonth);

    // If adding months caused day rollover (e.g., Jan 31 + 1 month -> Mar 3),
    // normalize by setting date to min(original day, last day of month)
    // (Above setMonth handles most cases; this note is informational)

    if (selectedDate > maxDate) {
      return `Check-in date cannot be later than ${maxMonths} months from today`;
    }

    return true;
  },

  validateLoanAmount: (val?: string): true | string => {
  if (!val?.trim()) return "Loan amount is required";
  const v = val.replace(/,/g, "").trim(); // remove commas if user types 1,00,000

  const num = Number(v);
  if (Number.isNaN(num)) return "Enter a valid number";

  // Range check: 50,000 – 10,00,000
  if (num < 50000) return "Minimum loan amount is ₹50,000";
  if (num > 1000000) return "Maximum loan amount is ₹10,00,000";

  return true;
},




}

export default validation