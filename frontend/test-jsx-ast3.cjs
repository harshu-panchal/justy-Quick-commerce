const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/modules/user/Checkout.tsx', 'utf8');
const sourceFile = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function getLine(pos) {
    return ts.getLineAndCharacterOfPosition(sourceFile, pos).line + 1;
}

function visit(node, depth) {
    if (ts.isJsxElement(node)) {
        const opening = node.openingElement.tagName.getText();
        const startLine = getLine(node.openingElement.pos);
        const endLine = getLine(node.closingElement.pos);
        
        // If the closing element is placed at the very end of the file
        if (node.closingElement.end >= sourceFile.text.length - 20) {
            console.log(`Tag <${opening}> starting at line ${startLine} is closed at EOF (line ${endLine})`);
        }
        
        ts.forEachChild(node, child => visit(child, depth + 1));
    } else {
        ts.forEachChild(node, child => visit(child, depth));
    }
}

visit(sourceFile, 0);
