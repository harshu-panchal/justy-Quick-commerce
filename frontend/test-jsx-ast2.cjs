const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/modules/user/Checkout.tsx', 'utf8');
const sourceFile = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function getLine(pos) {
    return ts.getLineAndCharacterOfPosition(sourceFile, pos).line + 1;
}

let lastUnclosed = null;

function visit(node) {
    if (ts.isJsxExpression(node)) {
         if (!node.expression && node.getText().length > 2) {
             console.log("Possible unclosed JSX expression at line", getLine(node.pos), ":", node.getText().substring(0, 20));
         }
         // An unclosed JsxExpression might absorb the rest of the file
         if (node.end >= sourceFile.text.length - 10 && ts.isJsxElement(node.parent)) {
              console.log("JSX Expression hits end of file! Started at line", getLine(node.pos));
              console.log("Parent tag is <" + node.parent.openingElement.tagName.getText() + "> at line", getLine(node.parent.openingElement.pos));
         }
    }
    
    // Watch for unclosed tags
    if (ts.isJsxElement(node)) {
        if (node.closingElement.end >= sourceFile.text.length - 10 || node.closingElement.tagName.getText() !== node.openingElement.tagName.getText()) {
             console.log("Unclosed/Mismatched Element <" + node.openingElement.tagName.getText() + "> at line", getLine(node.openingElement.pos));
        }
    }

    ts.forEachChild(node, visit);
}

visit(sourceFile);
