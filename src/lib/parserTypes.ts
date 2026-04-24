export type ASTNode = {
  type: string;
  value?: string;
  children?: ASTNode[];
};

export type ParseResult = {
  ast: ASTNode | null;
  error: string | null;
};
