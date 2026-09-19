/** Project the gathered material through an explicit purpose and page context. */
export function composeLensPrompt(labels, { intent = 'connect', lens = '', impact = '', page = '' } = {}) {
  const material = labels.join(' and ');
  const instructions = {
    connect: `Find a specific relationship between ${material}; describe how each ingredient changes the other`,
    compare: `Compare ${material}; name one meaningful difference and one shared constraint`,
    apply: `Use ${material} together in one concrete next step; name the result and how to check it`,
  };
  const context = lens
    ? ` Through the ${lens} lens${page ? ` on ${page}` : ''}, focus on ${(impact || lens).replace(/[-_]+/g, ' ')}`
    : '';
  return `${instructions[intent] || instructions.connect}.${context} Keep the gathered expressions as evidence`;
}
