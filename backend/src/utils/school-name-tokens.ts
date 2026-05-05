/**
 * Tokens that show up in nearly every school name and would produce false
 * positives if used to identify a specific tenant's brand. Stripped before
 * any token-based matching against user-supplied text.
 */
const SCHOOL_NAME_STOPWORDS = new Set([
  'school', 'schools', 'escola', 'escolas',
  'colegio', 'colégio', 'college', 'institute', 'instituto',
  'the', 'a', 'an', 'do', 'da', 'de', 'dos', 'das', 'of',
]);

/**
 * Distinctive lowercase tokens from a tenant's schoolName. Used wherever
 * we need to detect that an arbitrary string mentions or is prefixed by
 * the operator's brand (e.g. sibling-school detection, CSV import grade
 * normalization).
 *
 * Returns alphanumeric tokens of length ≥ 2 that aren't generic
 * "school/college" stopwords. Order is preserved; duplicates removed.
 */
export function getSchoolNameTokens(schoolName: string): string[] {
  return Array.from(new Set(
    (schoolName ?? '')
      .toLowerCase()
      .split(/[\s\-_/.,]+/)
      .filter(token =>
        token.length >= 2 &&
        !SCHOOL_NAME_STOPWORDS.has(token) &&
        /^[\p{L}\p{N}]+$/u.test(token),
      ),
  ));
}
