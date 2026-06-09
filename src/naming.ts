// Pure, dependency-free name conversion shared by the generator and the example
// app. Kept byte-for-byte compatible with v1 so component names are stable
// across the major bump — do not "improve" these, names are part of the API.

export function toPascalCase(string: string): string {
  return string
    .split('/')
    .map((snake) =>
      snake
        .split('_')
        .map((substr) => substr.charAt(0).toUpperCase() + substr.slice(1))
        .join('')
    )
    .join('/');
}

export function convertNumbersToWords(input: string): string {
  const numericalWords: Record<string, string> = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
  };

  const tensWords: Record<string, string> = {
    '10': 'Ten',
    '11': 'Eleven',
    '12': 'Twelve',
    '13': 'Thirteen',
    '14': 'Fourteen',
    '15': 'Fifteen',
    '16': 'Sixteen',
    '17': 'Seventeen',
    '18': 'Eighteen',
    '19': 'Nineteen',
  };

  const tensMultipleWords: Record<string, string> = {
    '2': 'Twenty',
    '3': 'Thirty',
    '4': 'Forty',
    '5': 'Fifty',
    '6': 'Sixty',
    '7': 'Seventy',
    '8': 'Eighty',
    '9': 'Ninety',
  };

  function convertThreeDigitNumberToWords(num: number): string {
    // A bare "0" must not vanish, or e.g. `speed_0_2x` and `speed_2x` would
    // collapse to the same component name (`SpeedTwox`) and clash.
    if (num === 0) return numericalWords['0'];

    let result = '';

    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;

    if (hundreds > 0) {
      result += numericalWords[hundreds.toString()] + 'Hundred';
    }

    if (remainder > 0) {
      if (remainder < 10) {
        result += numericalWords[remainder.toString()];
      } else if (remainder < 20) {
        result += tensWords[remainder.toString()];
      } else {
        const tens = Math.floor(remainder / 10);
        const ones = remainder % 10;

        result += tensMultipleWords[tens.toString()];

        if (ones > 0) {
          result += '' + numericalWords[ones.toString()];
        }
      }
    }

    return result;
  }

  return input.replace(/\d+/g, (match) =>
    convertThreeDigitNumberToWords(parseInt(match, 10))
  );
}

/** Material Symbols icon name (snake_case) -> exported PascalCase component name. */
export function toComponentName(iconName: string): string {
  return toPascalCase(convertNumbersToWords(iconName)).replace(
    /[^A-Za-z0-9]/g,
    ''
  );
}
