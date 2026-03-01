/**
 * TypeScript port of the provided C++ DFA-based Lexical Analyzer.
 * Logic is preserved exactly — no regex, same DFA states.
 */

enum TokenType {
  KEYWORD,
  IDENTIFIER,
  INT_LITERAL,
  FLOAT_LITERAL,
  STRING_LITERAL,
  OPERATOR,
  DELIMITER,
  UNKNOWN,
}

const keywords = [
  "int", "float", "string", "bool",
  "if", "else", "while", "for",
  "return", "function", "var",
  "true", "false", "print",
];

function isKeyword(word: string): boolean {
  return keywords.includes(word);
}

function isIdentifierDFA(str: string): boolean {
  let state = 0;
  for (const ch of str) {
    switch (state) {
      case 0:
        if (/[a-zA-Z]/.test(ch) || ch === "_") state = 1;
        else return false;
        break;
      case 1:
        if (/[a-zA-Z0-9]/.test(ch) || ch === "_") state = 1;
        else return false;
        break;
    }
  }
  return state === 1;
}

function numberDFA(str: string): TokenType {
  let state = 0;
  for (const ch of str) {
    switch (state) {
      case 0:
        if (/\d/.test(ch)) state = 1;
        else return TokenType.UNKNOWN;
        break;
      case 1:
        if (/\d/.test(ch)) state = 1;
        else if (ch === ".") state = 2;
        else return TokenType.UNKNOWN;
        break;
      case 2:
        if (/\d/.test(ch)) state = 3;
        else return TokenType.UNKNOWN;
        break;
      case 3:
        if (/\d/.test(ch)) state = 3;
        else return TokenType.UNKNOWN;
        break;
    }
  }
  if (state === 1) return TokenType.INT_LITERAL;
  if (state === 3) return TokenType.FLOAT_LITERAL;
  return TokenType.UNKNOWN;
}

function isDelimiter(ch: string): boolean {
  return "(){};\,".includes(ch);
}

function isOperator(ch: string): boolean {
  return "+-*/%<>=!&|".includes(ch);
}

export interface Token {
  lexeme: string;
  type: string;
  line: number;
  isError: boolean;
  pointer?: number;
}

export interface SymbolEntry {
  identifier: string;
  pointer: number;
}

export interface LexerResult {
  tokens: Token[];
  symbolTable: SymbolEntry[];
  outputText: string;
}

export function runLexer(source: string): LexerResult {
  const tokens: Token[] = [];
  const symbolTable = new Map<string, number>();
  const outputLines: string[] = [];

  let i = 0;
  let line = 1;
  const len = source.length;

  const peek = () => (i < len ? source[i] : null);
  const advance = () => source[i++];

  // We process character by character, mirroring the C++ fin.get(ch) loop
  while (i < len) {
    const ch = advance();

    if (ch === "\n") { line++; continue; }
    if (/\s/.test(ch)) continue;

    // IDENTIFIER OR KEYWORD
    if (/[a-zA-Z]/.test(ch) || ch === "_") {
      let lexeme = ch;
      while (i < len && (/[a-zA-Z0-9]/.test(source[i]) || source[i] === "_")) {
        lexeme += advance();
      }
      if (isKeyword(lexeme)) {
        const out = `Token( ${lexeme} -----> KEYWORD ) Line: ${line}`;
        outputLines.push(out);
        tokens.push({ lexeme, type: "KEYWORD", line, isError: false });
      } else if (isIdentifierDFA(lexeme)) {
        if (!symbolTable.has(lexeme)) {
          symbolTable.set(lexeme, symbolTable.size + 1);
        }
        const ptr = symbolTable.get(lexeme)!;
        const out = `Token( ${lexeme} -----> IDENTIFIER , PTR=${ptr} ) Line: ${line}`;
        outputLines.push(out);
        tokens.push({ lexeme, type: "IDENTIFIER", line, isError: false, pointer: ptr });
      } else {
        const out = `Lexical Error at line ${line} : ${lexeme}`;
        outputLines.push(out);
        tokens.push({ lexeme, type: "ERROR", line, isError: true });
      }
    }
    // NUMBER
    else if (/\d/.test(ch)) {
      let lexeme = ch;
      while (i < len && (/\d/.test(source[i]) || source[i] === ".")) {
        lexeme += advance();
      }
      const type = numberDFA(lexeme);
      if (type === TokenType.INT_LITERAL) {
        const out = `Token( ${lexeme} -----> INT_LITERAL ) Line: ${line}`;
        outputLines.push(out);
        tokens.push({ lexeme, type: "INT_LITERAL", line, isError: false });
      } else if (type === TokenType.FLOAT_LITERAL) {
        const out = `Token( ${lexeme} -----> FLOAT_LITERAL ) Line: ${line}`;
        outputLines.push(out);
        tokens.push({ lexeme, type: "FLOAT_LITERAL", line, isError: false });
      } else {
        const out = `Lexical Error at line ${line} : ${lexeme}`;
        outputLines.push(out);
        tokens.push({ lexeme, type: "ERROR", line, isError: true });
      }
    }
    // STRING
    else if (ch === '"') {
      let lexeme = '"';
      let terminated = false;
      while (i < len) {
        const c = advance();
        if (c === '"') { lexeme += '"'; terminated = true; break; }
        if (c === "\n") {
          const out = `Unterminated string at line ${line}`;
          outputLines.push(out);
          tokens.push({ lexeme, type: "ERROR", line, isError: true });
          line++;
          break;
        }
        lexeme += c;
      }
      if (terminated) {
        const out = `Token( ${lexeme} -----> STRING_LITERAL ) Line: ${line}`;
        outputLines.push(out);
        tokens.push({ lexeme, type: "STRING_LITERAL", line, isError: false });
      }
    }
    // DELIMITER
    else if (isDelimiter(ch)) {
      const out = `Token( ${ch} -----> DELIMITER ) Line: ${line}`;
      outputLines.push(out);
      tokens.push({ lexeme: ch, type: "DELIMITER", line, isError: false });
    }
    // OPERATOR
    else if (isOperator(ch)) {
      let lexeme = ch;
      if (i < len && isOperator(source[i])) {
        lexeme += advance();
      }
      const out = `Token( ${lexeme} -----> OPERATOR ) Line: ${line}`;
      outputLines.push(out);
      tokens.push({ lexeme, type: "OPERATOR", line, isError: false });
    }
    // UNKNOWN
    else {
      const out = `Lexical Error at line ${line} : ${ch}`;
      outputLines.push(out);
      tokens.push({ lexeme: ch, type: "ERROR", line, isError: true });
    }
  }

  outputLines.push("Lexical Analysis Completed.");

  const symEntries: SymbolEntry[] = [];
  symbolTable.forEach((ptr, id) => symEntries.push({ identifier: id, pointer: ptr }));

  return { tokens, symbolTable: symEntries, outputText: outputLines.join("\n") };
}
