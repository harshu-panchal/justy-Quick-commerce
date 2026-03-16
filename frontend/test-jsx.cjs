const fs = require('fs');
const c = fs.readFileSync('src/modules/user/Checkout.tsx', 'utf8');

// Remove everything inside strings and comments to avoid matching tags within them
let codeWithoutComments = c.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
let codeWithoutStrings = codeWithoutComments.replace(/(["'`])(?:(?=(\\?))\2[\s\S])*?\1/g, '""');

let stack = [];
const tagRegex = /<\/?([a-zA-Z0-9_\.]+)[^>]*?(\/?)>/g;
let match;
while ((match = tagRegex.exec(codeWithoutStrings)) !== null) {
  const isClosing = match[0].startsWith('</');
  const isSelfClosing = match[2] === '/';
  const tagName = match[1];

  if (isSelfClosing) continue;

  // very naive, but handles standard JSX mostly
  if (isClosing) {
    if (stack.length === 0) {
      // console.log(`Extra closing tag </${tagName}> at index ${match.index}`);
    } else {
      const top = stack.pop();
      if (top.name !== tagName) {
        const getLineNum = (index) => codeWithoutStrings.slice(0, index).split('\n').length;
        console.log(`Mismatched tag!`);
        console.log(`Opening tag was <${top.name}> at line ${getLineNum(top.index)}`);
        console.log(`Closing tag </${tagName}> is at line ${getLineNum(match.index)}`);
        process.exit(1);
      }
    }
  } else {
    stack.push({ name: tagName, index: match.index });
  }
}

if (stack.length > 0) {
  console.log("Unclosed tags remaining in stack:");
  stack.slice(-5).forEach(t => {
      const getLineNum = (index) => codeWithoutStrings.slice(0, index).split('\n').length;
      console.log(`<${t.name}> at line ${getLineNum(t.index)}`);
  })
} else {
  console.log("All tags matched perfectly!");
}
