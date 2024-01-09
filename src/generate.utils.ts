import fs from 'fs';
import path from 'path';

export function readFilesRecursively(
  folderPath: string,
  fileExtension: string
): string[] {
  const files: string[] = [];

  const readDir = (currentPath: string): void => {
    const items = fs.readdirSync(currentPath);

    items.forEach((item) => {
      const fullPath = path.join(currentPath, item);
      const stats = fs.statSync(fullPath);

      if (stats.isFile() && path.extname(item) === fileExtension) {
        files.push(fullPath);
      }
    });
  };

  readDir(folderPath);

  return files;
}

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const result: T[][] = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }

  return result;
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
    let result = '';

    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;

    if (hundreds > 0) {
      result += numericalWords[hundreds.toString()] + 'Hundred';

      if (remainder > 0) {
        result += '';
      }
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
