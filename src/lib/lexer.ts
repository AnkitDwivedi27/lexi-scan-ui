// ==========================
// FULL LEXER FROM SCRATCH
// No Regex, No includes()
// Manual DFA + Manual Scanning
// ==========================

export enum TokenType {
  KEYWORD = "KEYWORD",
  IDENTIFIER = "IDENTIFIER",
  INT_LITERAL = "INT_LITERAL",
  FLOAT_LITERAL = "FLOAT_LITERAL",
  STRING_LITERAL = "STRING_LITERAL",
  OPERATOR = "OPERATOR",
  DELIMITER = "DELIMITER",
  ERROR = "ERROR",
}

export interface Token {
  lexeme: string;
  type: TokenType | string;
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

// ==========================
// CHARACTER CLASSIFIERS
// ==========================

function isLetter(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isDigit(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 48 && code <= 57;
}

function isUnderscore(ch: string): boolean {
  return ch === "_";
}

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

function isDelimiter(ch: string): boolean {
  return (
    ch === "(" || ch === ")" || ch === "{" || ch === "}" ||
    ch === ";" || ch === "," || ch === "[" || ch === "]"
  );
}

function isOperator(ch: string): boolean {
  return (
    ch === "+" || ch === "-" || ch === "*" || ch === "/" ||
    ch === "%" || ch === "=" || ch === "<" || ch === ">" ||
    ch === "!" || ch === "&" || ch === "|"
  );
}

// ==========================
// KEYWORD CHECK
// ==========================

const keywords: string[] = [
  "int", "float", "string", "bool",
  "if", "else", "while", "for",
  "return", "function", "var",
  "true", "false", "print",
];

function isKeyword(word: string): boolean {
  for (let i = 0; i < keywords.length; i++) {
    if (keywords[i] === word) return true;
  }
  return false;
}

// ==========================
// IDENTIFIER DFA
// ==========================

function isIdentifierDFA(str: string): boolean {
  let state = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    switch (state) {
      case 0:
        if (isLetter(ch) || isUnderscore(ch)) state = 1;
        else return false;
        break;
      case 1:
        if (isLetter(ch) || isDigit(ch) || isUnderscore(ch)) state = 1;
        else return false;
        break;
    }
  }
  return state === 1;
}

// ==========================
// NUMBER DFA
// ==========================

function numberDFA(str: string): TokenType {
  let state = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    switch (state) {
      case 0:
        if (isDigit(ch)) state = 1;
        else return TokenType.ERROR;
        break;
      case 1:
        if (isDigit(ch)) state = 1;
        else if (ch === ".") state = 2;
        else return TokenType.ERROR;
        break;
      case 2:
        if (isDigit(ch)) state = 3;
        else return TokenType.ERROR;
        break;
      case 3:
        if (isDigit(ch)) state = 3;
        else return TokenType.ERROR;
        break;
    }
  }
  if (state === 1) return TokenType.INT_LITERAL;
  if (state === 3) return TokenType.FLOAT_LITERAL;
  return TokenType.ERROR;
}

// ==========================
// SYMBOL TABLE
// ==========================

class SymbolTable {
  private table: SymbolEntry[];

  constructor() {
    this.table = [];
  }

  public add(identifier: string): number {
    for (let i = 0; i < this.table.length; i++) {
      if (this.table[i].identifier === identifier) {
        return this.table[i].pointer;
      }
    }
    const ptr = this.table.length + 1;
    this.table.push({ identifier, pointer: ptr });
    return ptr;
  }

  public getEntries(): SymbolEntry[] {
    return this.table;
  }
}

// ==========================
// MAIN LEXER
// ==========================

export function runLexer(source: string): LexerResult {
  const tokens: Token[] = [];
  const outputLines: string[] = [];
  const symbolTable = new SymbolTable();

  let i = 0;
  let line = 1;

  function currentChar(): string {
    if (i >= source.length) return "\0";
    return source[i];
  }

  function advance(): string {
    const ch = source[i];
    i++;
    return ch;
  }

  while (i < source.length) {
    const ch = advance();

    if (ch === "\n") { line++; continue; }
    if (isWhitespace(ch)) continue;

    // IDENTIFIER / KEYWORD
    if (isLetter(ch) || isUnderscore(ch)) {
      let lexeme = ch;
      while (
        isLetter(currentChar()) ||
        isDigit(currentChar()) ||
        isUnderscore(currentChar())
      ) {
        lexeme += advance();
      }

      if (isKeyword(lexeme)) {
        tokens.push({ lexeme, type: TokenType.KEYWORD, line, isError: false });
        outputLines.push(`Token( ${lexeme} -----> KEYWORD ) Line: ${line}`);
      } else if (isIdentifierDFA(lexeme)) {
        const ptr = symbolTable.add(lexeme);
        tokens.push({ lexeme, type: TokenType.IDENTIFIER, line, isError: false, pointer: ptr });
        outputLines.push(`Token( ${lexeme} -----> IDENTIFIER , PTR=${ptr} ) Line: ${line}`);
      } else {
        tokens.push({ lexeme, type: TokenType.ERROR, line, isError: true });
        outputLines.push(`Lexical Error at line ${line} : ${lexeme}`);
      }
    }
    // NUMBER
    else if (isDigit(ch)) {
      let lexeme = ch;
      while (isDigit(currentChar()) || currentChar() === ".") {
        lexeme += advance();
      }
      const type = numberDFA(lexeme);
      if (type === TokenType.INT_LITERAL) {
        tokens.push({ lexeme, type, line, isError: false });
        outputLines.push(`Token( ${lexeme} -----> INT_LITERAL ) Line: ${line}`);
      } else if (type === TokenType.FLOAT_LITERAL) {
        tokens.push({ lexeme, type, line, isError: false });
        outputLines.push(`Token( ${lexeme} -----> FLOAT_LITERAL ) Line: ${line}`);
      } else {
        tokens.push({ lexeme, type: TokenType.ERROR, line, isError: true });
        outputLines.push(`Lexical Error at line ${line} : ${lexeme}`);
      }
    }
    // STRING
    else if (ch === '"') {
      let lexeme = '"';
      let terminated = false;

      while (i < source.length) {
        const c = advance();
        if (c === '"') { lexeme += '"'; terminated = true; break; }
        if (c === "\n") {
          tokens.push({ lexeme, type: TokenType.ERROR, line, isError: true });
          outputLines.push(`Unterminated string at line ${line}`);
          line++;
          break;
        }
        lexeme += c;
      }

      if (terminated) {
        tokens.push({ lexeme, type: TokenType.STRING_LITERAL, line, isError: false });
        outputLines.push(`Token( ${lexeme} -----> STRING_LITERAL ) Line: ${line}`);
      }
    }
    // DELIMITER
    else if (isDelimiter(ch)) {
      tokens.push({ lexeme: ch, type: TokenType.DELIMITER, line, isError: false });
      outputLines.push(`Token( ${ch} -----> DELIMITER ) Line: ${line}`);
    }
    // OPERATOR
    else if (isOperator(ch)) {
      let lexeme = ch;
      const next = currentChar();
      if (
        (ch === "=" && next === "=") ||
        (ch === "!" && next === "=") ||
        (ch === "<" && next === "=") ||
        (ch === ">" && next === "=") ||
        (ch === "&" && next === "&") ||
        (ch === "|" && next === "|")
      ) {
        lexeme += advance();
      }
      tokens.push({ lexeme, type: TokenType.OPERATOR, line, isError: false });
      outputLines.push(`Token( ${lexeme} -----> OPERATOR ) Line: ${line}`);
    }
    // UNKNOWN
    else {
      tokens.push({ lexeme: ch, type: TokenType.ERROR, line, isError: true });
      outputLines.push(`Lexical Error at line ${line} : ${ch}`);
    }
  }

  outputLines.push("Lexical Analysis Completed.");

  return {
    tokens,
    symbolTable: symbolTable.getEntries(),
    outputText: outputLines.join("\n"),
  };
}
