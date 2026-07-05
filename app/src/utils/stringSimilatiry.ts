export function findMatch<T>(values: T[], getString: (value: T) => string, search: string) {
	let bestMatch: T | undefined;
	let bestMatchScore = 0;

	for (const value of values) {
		const valueString = getString(value);
		const score = stringSimilarity(valueString, search, false);
		if (score > bestMatchScore) {
			bestMatchScore = score;
			bestMatch = value;
		}
	}

	return bestMatch;
}

export function findMatches<T>(values: T[], getString: (value: T) => string, search: string[]) {
	const matches = new Map<string, T>();

	for (const searchValue of search) {
		let bestMatch: T | undefined;
		let bestMatchScore = 0;

		for (const value of values) {
			const valueString = getString(value);
			const score = stringSimilarity(valueString, searchValue, false);
			if (score > bestMatchScore) {
				bestMatchScore = score;
				bestMatch = value;
			}
		}

		if (bestMatch) {
			matches.set(searchValue, bestMatch)
		}
	}

	return matches;
}

const SUBSTRING_LENGHT = 2;

/**
 * Calculate similarity between two strings
 * @param {string} str1 First string to match
 * @param {string} str2 Second string to match
 * @param {boolean} [caseSensitive=false] Optional. Whether you want to consider case in string matching. Default false;
 * @returns Number between 0 and 1, with 0 being a low match score.
 */
export function stringSimilarity(str1: string, str2: string, caseSensitive: boolean = false) {
	str1 = str1.replaceAll(" ", "");
	str2 = str2.replaceAll(" ", "");

	if (!caseSensitive) {
		str1 = str1.toLowerCase();
		str2 = str2.toLowerCase();
	}

	if (str1.length < SUBSTRING_LENGHT || str2.length < SUBSTRING_LENGHT)
		return 0;

	const map = calculateSubstringMap(str1);

	let match = 0;
	for (let j = 0; j < str2.length - (SUBSTRING_LENGHT - 1); j++) {
		const substr2 = str2.substring(j, j + SUBSTRING_LENGHT);
		const count = map.has(substr2) ? map.get(substr2)! : 0;
		if (count > 0) {
			map.set(substr2, count - 1);
			match++;
		}
	}

	return (match * 2) / (str1.length + str2.length - ((SUBSTRING_LENGHT - 1) * 2));
};

const substringMapCache = new Map<string, Map<string, number>>();

function calculateSubstringMap(str1: string, caseSensitive: boolean = false) {
	str1 = str1.replaceAll(" ", "");

	if (!caseSensitive) {
		str1 = str1.toLowerCase();
	}

	if (str1.length < SUBSTRING_LENGHT)
		return new Map<string, number>();

	if (substringMapCache.has(str1))
		return new Map(substringMapCache.get(str1)!)

	const map = new Map<string, number>();
	for (let i = 0; i < str1.length - (SUBSTRING_LENGHT - 1); i++) {
		const substr1 = str1.substring(i, i + SUBSTRING_LENGHT);
		map.set(substr1, map.has(substr1) ? map.get(substr1)! + 1 : 1);
	}
	return map;
}
