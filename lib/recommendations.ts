/**
 * Plain-language guidance for automatically detected rules.
 * Use axe's actual element-level failure summaries as the source of truth;
 * these templates only help the user understand a likely next action.
 * No AI-generated recommendation is represented as a verified fix.
 */
const guidance: Record<string, string> = {
  'color-contrast': 'Adjust the text or background color until the required contrast ratio is met. Check the affected component in its normal, hover, focus, and disabled states.',
  'image-alt': 'Add an appropriate text alternative for informative images. For decorative images, use an empty alt attribute. Review the image in its surrounding context.',
  'label': 'Give every form field a visible label associated with its input, or an equivalent accessible name when a visible label is not appropriate.',
  'button-name': 'Give the button a descriptive accessible name. For icon-only buttons, add a suitable aria-label or visually hidden text.',
  'link-name': 'Give each link text or an accessible label that explains its destination or action. Avoid unnamed image-only links.',
  'html-has-lang': 'Set a valid language on the document’s html element, such as lang="en" for English content.',
  'document-title': 'Add a concise, descriptive title element in the document head.',
  'heading-order': 'Review the heading hierarchy and use heading levels that reflect the actual page structure.',
  'aria-valid-attr': 'Remove unsupported ARIA attributes or replace them with attributes valid for this element.',
  'aria-valid-attr-value': 'Correct the invalid ARIA value according to the attribute’s allowed values.',
  'aria-required-attr': 'Add the required ARIA properties for this role, or use an appropriate native HTML element instead.',
  'aria-roles': 'Use a valid ARIA role that matches the element’s behavior. Prefer native semantic HTML wherever possible.',
  'region': 'Place major page content in appropriate landmarks, such as main, nav, header or footer.',
  'landmark-one-main': 'Include exactly one main landmark for the primary page content.',
  'meta-viewport': 'Allow users to zoom and scale the page by removing restrictive viewport settings.',
};

export function recommendationForRule(id: string): string {
  return guidance[id] ?? 'Review each affected element and the specific failure details below. Follow the linked rule documentation, then rerun the scan after implementing a fix.';
}
