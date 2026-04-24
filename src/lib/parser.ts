/**
 * Recursive Descent Parser
 * Grammar:
 *   Program        -> StatementList
 *   StatementList  -> Statement StatementList | ε
 *   Statement      -> Declaration | Assignment
 *   Declaration    -> "int" Identifier "=" Expression ";"
 *   Assignment     -> Identifier "=" Expression ";"
 *   Expression     -> Term (( "+" | "-" ) Term)*
 *   Term           -> Factor (( "*" | "/" ) Factor)*
 *   Factor         -> Identifier | Number | "(" Expression ")"
 *
 * Consumes tokens produced by the existing lexer (src/lib/lexer.ts).
 * Does NOT modify the lexer.
 */

import type { Token } from "./lexer";
import type { ASTNode, ParseResult } from "./parserTypes";

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    // Ignore lexer error tokens for parsing purposes
    this.tokens = tokens.filter((t) => !t.isError);
  }

  private peek(offset = 0): Token | null {
    return this.tokens[this.pos + offset] ?? null;
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private currentLine(): number | string {
    return this.peek()?.line ?? "EOF";
  }

  private expectLexeme(lexeme: string): Token {
    const t = this.peek();
    if (!t || t.lexeme !== lexeme) {
      throw new Error(
        `Syntax Error: Expected '${lexeme}' at line ${this.currentLine()}` +
          (t ? ` but found '${t.lexeme}'` : " but reached end of input")
      );
    }
    return this.consume();
  }

  private expectType(type: string, label?: string): Token {
    const t = this.peek();
    if (!t || t.type !== type) {
      throw new Error(
        `Syntax Error: Expected ${label ?? type} at line ${this.currentLine()}` +
          (t ? ` but found '${t.lexeme}'` : " but reached end of input")
      );
    }
    return this.consume();
  }

  parseProgram(): ASTNode {
    const statements: ASTNode[] = [];
    while (this.peek()) {
      statements.push(this.parseStatement());
    }
    return { type: "Program", children: statements };
  }

  parseStatement(): ASTNode {
    const t = this.peek();
    if (!t) {
      throw new Error(`Syntax Error: Unexpected end of input at line ${this.currentLine()}`);
    }

    // Declaration: "int" Identifier "=" Expression ";"
    if (t.type === "KEYWORD" && t.lexeme === "int") {
      this.consume();
      const id = this.expectType("IDENTIFIER", "identifier");
      this.expectLexeme("=");
      const expr = this.parseExpression();
      this.expectLexeme(";");
      return {
        type: "Declaration",
        value: "int",
        children: [
          { type: "Identifier", value: id.lexeme },
          { type: "Expression", children: [expr] },
        ],
      };
    }

    // Assignment: Identifier "=" Expression ";"
    if (t.type === "IDENTIFIER") {
      const id = this.consume();
      this.expectLexeme("=");
      const expr = this.parseExpression();
      this.expectLexeme(";");
      return {
        type: "Assignment",
        children: [
          { type: "Identifier", value: id.lexeme },
          { type: "Expression", children: [expr] },
        ],
      };
    }

    throw new Error(
      `Syntax Error: Unexpected token '${t.lexeme}' at line ${t.line}`
    );
  }

  parseExpression(): ASTNode {
    let left = this.parseTerm();
    while (this.peek() && (this.peek()!.lexeme === "+" || this.peek()!.lexeme === "-")) {
      const op = this.consume();
      const right = this.parseTerm();
      left = {
        type: "BinaryOp",
        value: op.lexeme,
        children: [left, right],
      };
    }
    return left;
  }

  parseTerm(): ASTNode {
    let left = this.parseFactor();
    while (this.peek() && (this.peek()!.lexeme === "*" || this.peek()!.lexeme === "/")) {
      const op = this.consume();
      const right = this.parseFactor();
      left = {
        type: "BinaryOp",
        value: op.lexeme,
        children: [left, right],
      };
    }
    return left;
  }

  parseFactor(): ASTNode {
    const t = this.peek();
    if (!t) {
      throw new Error(`Syntax Error: Expected expression at line ${this.currentLine()}`);
    }

    if (t.lexeme === "(") {
      this.consume();
      const expr = this.parseExpression();
      this.expectLexeme(")");
      return expr;
    }

    if (t.type === "IDENTIFIER") {
      this.consume();
      return { type: "Identifier", value: t.lexeme };
    }

    if (t.type === "INT_LITERAL" || t.type === "FLOAT_LITERAL") {
      this.consume();
      return { type: "Number", value: t.lexeme };
    }

    throw new Error(
      `Syntax Error: Unexpected token '${t.lexeme}' at line ${t.line}`
    );
  }
}

export function runParser(tokens: Token[]): ParseResult {
  try {
    const parser = new Parser(tokens);
    const ast = parser.parseProgram();
    return { ast, error: null };
  } catch (e) {
    return { ast: null, error: e instanceof Error ? e.message : String(e) };
  }
}
