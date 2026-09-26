import ts from 'typescript';
/** Read literal catalogue fields without importing/evaluating provider code. */
export function literalFields(source:string):Record<string,unknown>{
 const file=ts.createSourceFile('provider.ts',source,ts.ScriptTarget.Latest,true);
 const declaration=file.statements.filter(ts.isVariableStatement).flatMap(s=>[...s.declarationList.declarations]).find(d=>d.initializer&&ts.isObjectLiteralExpression(d.initializer));
 if(!declaration?.initializer)throw Error('missing_literal_record');
 function read(node:ts.Node):unknown{
  if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))return node.text;
  if(ts.isNumericLiteral(node))return Number(node.text);
  if(node.kind===ts.SyntaxKind.TrueKeyword)return true;
  if(node.kind===ts.SyntaxKind.FalseKeyword)return false;
  if(node.kind===ts.SyntaxKind.NullKeyword)return null;
  if(ts.isArrayLiteralExpression(node))return node.elements.map(read);
  if(ts.isObjectLiteralExpression(node)){const out:Record<string,unknown>={};for(const p of node.properties){if(!ts.isPropertyAssignment(p))continue;const key=ts.isIdentifier(p.name)||ts.isStringLiteral(p.name)||ts.isNumericLiteral(p.name)?p.name.text:null;if(key===null||['__proto__','constructor','prototype'].includes(key))continue;const value=read(p.initializer);if(value!==undefined)out[key]=value;}return out;}
  return undefined; // Identifiers, calls, getters, spreads and expressions are never executed.
 }
 return read(declaration.initializer) as Record<string,unknown>;
}
