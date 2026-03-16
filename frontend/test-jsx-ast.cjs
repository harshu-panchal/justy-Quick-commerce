const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/modules/user/Checkout.tsx', 'utf8');
const sourceFile = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function getLine(pos) {
    const res = ts.getLineAndCharacterOfPosition(sourceFile, pos);
    return res.line + 1;
}

function visit(node) {
    if (ts.isJsxElement(node)) {
        const opening = node.openingElement.tagName.getText();
        const closing = node.closingElement.tagName.getText();
        if (opening !== closing) {
            console.log(`Mismatched JSX tags at lines ${getLine(node.openingElement.pos)} and ${getLine(node.closingElement.pos)}: <${opening}> vs </${closing}>`);
        }
    }
    ts.forEachChild(node, visit);
}

visit(sourceFile);
