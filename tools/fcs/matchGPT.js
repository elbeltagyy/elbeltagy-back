function isValidDate(value) {
  // Regex for each format
  const fullDateTimeRegex = /^[A-Za-z]{3}\s[A-Za-z]{3}\s\d{1,2}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT[+-]\d{4}\s\(.+\)$/;
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/; // e.g., 2025-06-14
  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/; // e.g., 2025-06-14T03:00:00Z

  // Check if value matches one of the formats
  if (
    fullDateTimeRegex.test(value) ||
    isoDateRegex.test(value) ||
    isoDateTimeRegex.test(value)
  ) {
    const date = new Date(value);
    // Ensure the parsed date is valid
    return !isNaN(date.getTime())
  }
  return false;
}

const makeDayRange = (value) => {
  const date = new Date(value)

  return {
    $gte: new Date(date.setHours(0, 0, 0, 0)),
    $lt: new Date(date.setHours(24, 0, 0, 0)),
  };

}

const startOfDay = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
};

const endOfDay = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
};




const handelValueAndOperator = (value, type = null) => { //i use Type for watches in VIews (videoStatistics)
  let operator = null
  let isSkip = false
  const SKIP_VALUES = ['', null, undefined, 'null', 'undefined', 'All', 'all']; //'empty', 'emptyArray', '',


  if (String(value).includes("_split_")) {
    [operator, value] = value.split("_split_")
  } else if (String(value).startsWith('!=')) {
    operator = "!=";
    value = value.slice(2); // remove the '!=' from start
  } else if (String(value).startsWith('=!')) {
    operator = "=!";
    value = value.slice(2);
  } else if (String(value).startsWith('!')) {
    operator = "!";
    value = value.slice(1);
  } else if (String(value).startsWith('=')) {
    operator = "=";
    value = value.slice(1);
  }
  if (SKIP_VALUES.includes(value)) isSkip = true;
  if (value === '' && (operator === 'isEmpty' || operator === 'isNotEmpty')) isSkip = false;

  if (type) {
    if (type === 'number') {
      value = Number(value)
    }
  }

  return [value, operator, isSkip]
}

const handelMatch = (match, key, preVal, type) => {
  const [value, operator, isSkip] = handelValueAndOperator(preVal, type)
  if (isSkip) return match;

  if (type === 'array') {
    const existing = match[key] || {};

    if (['!=', '=!', '!'].includes(operator)) {
      const nin = existing.$nin || [];
      match[key] = { $nin: [...nin, value] };
    } else {
      const _in = existing.$in || [];
      match[key] = { $in: [..._in, value] };
    }

    return match;
  }

  switch (operator) {
    case 'size':
      match[key] = { $size: value };
      break;
    case 'contains':
      match[key] = { $regex: value, $options: 'i' };
      break;
    case 'doesNotContain':
      match[key] = { $not: { $regex: value, $options: 'i' } };
      break;
    case '=':
    case 'is':
    case 'equal':
    case 'equals':

      const isValid = isValidDate(value)
      if (isValid) {
        match[key] = makeDayRange(value)
      } else {

        if (value === false || value === 'false') {
          match.$or = [
            { [key]: { $exists: false } },
            { [key]: value }
          ]
        } else {
          match[key] = value
        }
      }
      break;
    case 'startsWith':
      match[key] = { $regex: '^' + value, $options: 'i' };
      break;
    case 'endsWith':
      match[key] = { $regex: value + '$', $options: 'i' };
      break;
    case 'isEmpty':
      match[key] = { $exists: false };
      break;
    case 'isNotEmpty':
      match[key] = { $exists: true };
      break;

    case '>':
      match[key] = { $gt: Number(value) };
      break;
    case '>=':
      match[key] = { $gte: Number(value) };
      break;
    case '<':
      match[key] = { $lt: Number(value) };
      break;
    case '<=':
      match[key] = { $lte: Number(value) };
      break;

    case '!=':
    case '!':
    case '=!':
    case 'not':
    case 'Not':
    case 'isNot':
    case 'doesNotEqual':
      const isValidD = isValidDate(value)
      if (value === '[]') {
        match[key] = { $ne: [] };
        break;
      }
      if (isValidD) {
        match[key] = {
          $not: makeDayRange(value)
        };
      } else {
        match[key] = { $ne: value };
      }
      break;
    case 'after':
      match[key] = { $gt: endOfDay(new Date(value)) };
      break;
    case 'onOrAfter':
      match[key] = { $gte: startOfDay(new Date(value)) };
      break;
    case 'before':
      match[key] = { $lt: startOfDay(new Date(value)) };
      break;
    case 'onOrBefore':
      match[key] = { $lte: endOfDay(new Date(value)) };
      break;
    default:
      match[key] = value
      break;
  }
  return match
}

const handelAll = (match, key, value, type) => {
  if (Array.isArray(value) || String(value)?.includes(',')) {
    if (!Array.isArray(value) && String(value)?.includes(',')) {
      value = value?.split(',') // Strings became Array
    }

    //if Array
    value.forEach((val) => {
      match = handelMatch(match, key, val, 'array', type)
    })
    return match
  }

  //if Single
  match = handelMatch(match, key, value, type)
  return match
}


const parseFilters = (filters) => {
  let match = {};

  for (const filter of filters) {
    const { key, value, $filter, type } = filter;
    if ($filter) {
      match = { ...match, ...$filter }
      continue
    }
    if (!value) continue;
    const SKIP_VALUES = [null, undefined, 'null', 'undefined', 'All', 'all'];
    const returnEmpty = ['empty', 'emptyArray']

    if (SKIP_VALUES.includes(value)) continue;
    if (returnEmpty.includes(value)) {
      match[key] = { $in: [] }
      continue
    };

    match = handelAll(match, key, value, type)
  }

  return match;
};

module.exports = parseFilters